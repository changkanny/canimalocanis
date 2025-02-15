import { Post, PostBody } from "@/interface/post";
import { Tag } from "@/interface/tag";
import { Client } from "@notionhq/client";
import { GetPageResponse, RichTextItemResponse } from "@notionhq/client/build/src/api-endpoints";
import { NotionToMarkdown } from "notion-to-md";
import zennMarkdownHtml from 'zenn-markdown-html';
import { notionRichTextToMarkdown } from "notion-rich-text-to-markdown";
import * as cheerio from 'cheerio';
import { Format, getImageUrl } from "@/lib/image";
import { format, parseISO } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';

const JAPAN_TIMEZONE: string = "Asia/Tokyo";
const DATE_FORMAT: string = "yyyy-MM-dd";

const notion = new Client({
    auth: process.env.NOTION_TOKEN,
});

const cache: { postList: Array<Post> | null, tagList: Array<Tag> | null } = { postList: null, tagList: null };

/**
 * 記事をすべて取得する
 * 
 * 公開されているもののみを取得します。
 * 
 * @returns {Promise<Array<Post>>} 記事のリスト
 */
export async function getAllPost(): Promise<Array<Post>> {

    if (cache.postList != null) {
        
        console.log("Uses cached posts.");
        return cache.postList;
    }

    const response = await notion.databases.query({
        database_id: process.env.NOTION_DATABASE_ID as string,
        filter: {
            // 公開されている
            property: "isPublished",
            checkbox: {
                equals: true,
            },
        },
        sorts: [
            // 公開日時が近い順
            {
                property: "publishedAt",
                direction: "descending",
            },
        ],
    });

    const postList: Array<Post> = (await Promise.all(
        response.results
        .filter((result): result is GetPageResponse => 'properties' in result)
        .map((result) => toPostFromGetPageResponse(result))
    )).filter((post): post is Post =>
        post !== null &&
        post.isPublished &&
        format(post.publishedAt, DATE_FORMAT) <= format(new Date(), DATE_FORMAT)
    );

    cache.postList = postList;
    return postList;
};

/**
 * タグをすべて取得する
 * 
 * @returns {Promise<Array<Tag>>} タグのリスト
 */
export async function getAllTag(): Promise<Array<Tag>> {

    if (cache.tagList != null) {

        console.log("Uses cached tags.");
        return cache.tagList;
    }
    
    const schema = await notion.databases.retrieve({
        database_id: process.env.NOTION_DATABASE_ID as string,
    });
    const property = schema.properties.tag;

    const tagList: Array<Tag> = [];
    if (property != null && property.type == "multi_select") {

        for (const tag of property.multi_select.options) {

            tagList.push(
                {
                    id: tag.id,
                    name: tag.name,
                    color: tag.color,
                    isHighlighted: false,
                }
            );
        }
    }

    cache.tagList = tagList;
    return tagList;
}

/**
 *  タグに紐づく記事を取得する
 * 
 *  @param {string} tagId タグ ID
 *  @returns {Promise<Array<Post> | null>} 記事のリスト（指定されたタグ ID が存在しないときは null）
 */
export async function getPostByTag(tagId: string): Promise<Array<Post> | null> {

    if (!(await getAllTag()).some((tag) => tag.id === tagId)) {

        return null;
    }

    return (await getAllPost()).filter((post) => post.tagList.some((tag) => tag.id === tagId));
}

/**
 * 本文を取得する
 * 
 * @param {string} pageId ページ ID
 * @returns {Promise<string>} ページの HTML
 */
export async function getBody(pageId: string): Promise<PostBody | null> {

    // 指定されたページ ID の情報を取得する
    const response = await notion.pages.retrieve({ page_id: pageId });
    const post = await toPostFromGetPageResponse(response);

    // 公開されていないときや、記事が見つからなかったときは、処理を中断する
    if (post === null) {

        return null;
    }
    
    // ページをマークダウン形式で取得する
    const n2m = getN2M(pageId);
    let markdown = n2m.toMarkdownString(await n2m.pageToMarkdown(pageId)).parent;

    // トグルを Zenn 記法に変換する
    // * NotionToMarkdown#setCustomTransformer ではうまくいかないので、ごり押しする
    markdown = markdown
        .replace(/<details>\s*<summary>(.*?)<\/summary>/g, ':::details $1')
        .replace(/<\/details>/g, ':::');

    // マークダウンを HTML に変換する
    const html = zennMarkdownHtml(markdown, {
        embedOrigin: "https://embed.zenn.studio", // これを指定しないと埋め込み要素が表示されないよ！
    });

    // img タグに loading="lazy" を追加する
    const $ = cheerio.load(html);
    $('img').attr('loading', 'lazy');

    // 本文を返却する
    return {
        ...post,
        body: $.html(),
    };
};

/**
 * GetPageResponse から Post に変換する
 * 
 * @param {GetPageResponse} response GetPageResponse
 * @returns {Promise<Post | null>} Post
 */
async function toPostFromGetPageResponse(response: GetPageResponse): Promise<Post | null> {

    // 公開フラグ
    // @ts-expect-error Have a nice day!
    const isPublished: boolean = response.properties.isPublished.checkbox ?? false;

    // 公開日時
    // @ts-expect-error Have a nice day!
    const publishedAtString: string | null = response.properties.publishedAt.date.start;
    const publishedAt: Date | null = publishedAtString != null
        ? toZonedTime(parseISO(publishedAtString), JAPAN_TIMEZONE)
        : null;

    // 公開されていないときは、null を返却する
    if (publishedAt == null) {

        return null;
    }

    /// ID
    const id: string = response.id;

    // タイトル
    // @ts-expect-error Have a nice day!
    const title: string | null = response.properties.title.title[0]?.plain_text ?? null;

    // タイトルがないときは、null を返却する
    if (title == null) {

        return null;
    }

    // タグ
    const tagList: Array<Tag> = [];
    // @ts-expect-error Have a nice day!
    for (const tag of response.properties.tag.multi_select) {

        tagList.push(
            {
                id: tag.id,
                name: tag.name,
                color: tag.color,
                isHighlighted: false,
            }
        );
    }

    // 更新日時
    // @ts-expect-error Have a nice day!
    const updatedAtString: string | null = response.last_edited_time;
    let updatedAt: Date | null = updatedAtString != null
        ? toZonedTime(parseISO(updatedAtString), JAPAN_TIMEZONE)
        : null;

    // 更新日が公開日より過去のときは、更新日を指定しない
    if (
        updatedAt != null &&
        format(updatedAt, DATE_FORMAT) <= format(publishedAt, DATE_FORMAT)
    ) {

        updatedAt = null;
    }

    // サムネイル
    // @ts-expect-error Have a nice day!
    const imageName: string | null = response.properties.thumbnail.files[0]?.name.split('.').slice(0, -1).join('.') ?? null;
    // @ts-expect-error Have a nice day!
    const s3Url: string | null = response.properties.thumbnail.files[0]?.file.url ?? null;

    if (imageName == null || s3Url == null) {

        return {
            id: id,
            title: title,
            tagList: tagList,
            publishedAt: publishedAt,
            updatedAt: updatedAt,
            isPublished: isPublished,
        };
    }

    const image = await fetch(s3Url).then(response => response.arrayBuffer()).catch(() => null);

    return {
        id: id,
        title: title,
        tagList: tagList,
        publishedAt: publishedAt,
        updatedAt: updatedAt,
        isPublished: isPublished,
        thumbnail: image != null
        ? (await getImageUrl(`${id}/${imageName}`, image, Format.jpeg)) ?? s3Url
        : s3Url,
    };
}

/**
 *  NotionToMarkdown インスタンスを取得する
 * 
 *  @param {string} pageId ページ ID
 *  @returns {NotionToMarkdown} NotionToMarkdown インスタンス
 */
function getN2M(pageId: string): NotionToMarkdown {

    // NotionToMarkdown インスタンス
    const n2m = new NotionToMarkdown({ notionClient: notion });

    // コールアウトを Zenn 記法に変換する
    n2m.setCustomTransformer("callout", async (block) => {

        if (!("callout" in block)) {   

            return false;
        }

        // 背景をレッドに設定しているときは、警告とする
        const isCaution = block.callout.color === "red_background";

        // 本文
        const body = block.callout.rich_text.map((text: RichTextItemResponse) => notionRichTextToMarkdown(text)).join("<br>");

        return `:::message ${isCaution ? "alert" : ""}\n${body}\n:::`;
    });

    // ブックマークを Zenn 記法に変換する
    n2m.setCustomTransformer("bookmark", async (block) => {

        if (!("bookmark" in block)) {

            return false
        }

        if (block.bookmark.url.includes("x.com") || block.bookmark.url.includes("twitter.com")) {

            return `@[tweet](${block.bookmark.url})`;
        }

        if (block.bookmark.url.includes("youtube.com")) {

            return `@[youtube](${block.bookmark.url})`;
        }

        return `@[card](${block.bookmark.url})`;
    });

    // 画像を Zenn 記法に変換する
    n2m.setCustomTransformer("image", async (block) => {

        if (!("image" in block)) {

            return false;
        }

        let text = "";

        const caption = block.image.caption.map((item) => item.plain_text).join('');

        if (block.image.type === 'external') {

            text = `![${caption ?? ""}](${block.image.external.url})`;
        }

        if (block.image.type === 'file') {

            const imageId = block.id;

            const image = await fetch(block.image.file.url).then(response => response.arrayBuffer()).catch(() => null);
            const url = image != null
                ? (await getImageUrl(`${pageId}/${imageId}`, image, Format.avif)) ?? block.image.file.url
                : block.image.file.url;

            text = `![${caption ?? ""}](${url})`;
        }

        if (caption) {
            text += `\n*${caption}*`;
        }

        return text;
    });

    // コードを Zenn 記法に変換する
    n2m.setCustomTransformer('code', (block) => {

        if (!('code' in block)) {

            return false;
        }

        // 言語
        const language = block.code.language === 'plain text' ? 'text' : block.code.language;

        // ファイル名
        const fileName = block.code.caption.map((item) => item.plain_text).join('');

        // コード
        const codeString = block.code.rich_text.map((item) => item.plain_text).join('');
    
        // diff のときは、キャプションを言語として指定する
        if (language === 'diff') {

            return `\`\`\`${language} ${fileName || 'text'}\n${codeString}\n\`\`\``;
        }
    
        return `\`\`\`${language}${fileName != null ? `:${fileName}` : ''}\n${codeString}\n\`\`\``;
    });

    n2m.setCustomTransformer("paragraph", (block) => {

        if (!('paragraph' in block)) {

            return false;
        }

        // パラグラフの最初の要素
        const first = block.paragraph.rich_text[0];

        if (first == null) {

            return false;
        }

        if ("mention" in first && "page" in first.mention) {

            return `@[card](${process.env.HOST}/post/${first.mention.page.id})`;
        }

        if ("mention" in first && "link_preview" in first.mention) {

            return `@[card](${first.mention.link_preview.url})`;
        }

        if ("mention" in first && "link_mention" in first.mention) {

            // @ts-expect-error Have a nice day!
            return `@[card](${first.mention.link_mention.href})`;
        }

        return false;
    });

    return n2m;
}
