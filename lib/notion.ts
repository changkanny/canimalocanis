import { Post, PostBody } from "@/interface/post";
import { Tag } from "@/interface/tag";
import { Client } from "@notionhq/client";
import { GetPageResponse, RichTextItemResponse } from "@notionhq/client/build/src/api-endpoints";
import { NotionToMarkdown } from "notion-to-md";
import zennMarkdownHtml from 'zenn-markdown-html';
import { notionRichTextToMarkdown } from "notion-rich-text-to-markdown";
import { put, head, BlobNotFoundError } from '@vercel/blob';
import sharp from 'sharp';
import * as cheerio from 'cheerio';

// Notion クライアント
const notion = new Client({
    auth: process.env.NOTION_TOKEN,
});

/**
 * 記事をすべて取得する
 * 
 * 公開されているもののみを取得します。
 * 
 * @returns {Promise<Array<Post>>} 記事のリスト
 */
export async function getAllPost(): Promise<Array<Post>> {

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

    // 記事
    const postList = response.results
        .filter((result): result is GetPageResponse => 'properties' in result)
        .map((result) => toPostFromGetPageResponse(result))
        .filter((post): post is Post => post !== null);

    // 公開フラグが false のもの、または公開日時が未来のものは除外する
    return postList.filter((post) => post.isPublished && Date.parse(post.publishedAt) <= Date.now());
};

/**
 * タグをすべて取得する
 * 
 * @returns {Promise<Array<Tag>>} タグのリスト
 */
export async function getAllTag(): Promise<Array<Tag>> {
    
    // データベースのスキーマ
    const schema = await notion.databases.retrieve({
        database_id: process.env.NOTION_DATABASE_ID as string,
    });

    // タグのプロパティ
    const property = schema.properties.tag;

    // 返却するタグのリスト
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

    return tagList;
}

/**
 *  タグに紐づく記事を取得する
 * 
 *  @param {string} tagId タグ ID
 *  @returns {Promise<Array<Post> | null>} 記事のリスト（指定されたタグ ID が存在しないときは null）
 */
export async function getPostByTag(tagId: string): Promise<Array<Post> | null> {

    // タグをすべて取得する
    const tagList = await getAllTag();

    // 指定されたタグが存在しないときは、null を返却する
    if (!tagList.some((tag) => tag.id === tagId)) {

        return null;
    }

    // 公開されている記事をすべて取得する
    const postList = await getAllPost();

    // タグが一致する記事を抽出する
    return postList.filter((post) => post.tagList.some((tag) => tag.id === tagId));
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
    const post = toPostFromGetPageResponse(response);

    // 公開されていないときや、記事が見つからなかったときは、処理を中断する
    if (post === null) {

        return null;
    }
    
    // ページをマークダウン形式で取得する
    let markdown = getN2M().toMarkdownString(await getN2M().pageToMarkdown(pageId)).parent;

    // トグルを Zenn 記法に変換する
    // * NotionToMarkdown#setCustomTransformer ではうまくいかない...
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
function toPostFromGetPageResponse(response: GetPageResponse): Post | null {

    // 公開フラグ
    // @ts-expect-error Have a nice day!
    const isPublished: boolean = response.properties.isPublished.checkbox ?? false;

    // 公開日時
    // @ts-expect-error Have a nice day!
    const publishedAt: string | null = response.properties.publishedAt.date.start;

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
    let updatedAt: string | null = response.last_edited_time;

    // 更新日時が公開日時より過去のときは、更新日時を指定しない
    if (updatedAt != null && Date.parse(updatedAt) < Date.parse(publishedAt)) {

        updatedAt = null;
    }

    return {
        id: id,
        title: title,
        tagList: tagList,
        publishedAt: publishedAt,
        updatedAt: updatedAt,
        isPublished: isPublished,
    };
}

/**
 *  NotionToMarkdown インスタンスを取得する
 * 
 *  @returns {NotionToMarkdown} NotionToMarkdown インスタンス
 */
function getN2M(): NotionToMarkdown {

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

            const id = block.id;
            const s3Url = block.image.file.url;

            text = `![${caption ?? ""}](${await getVercelBlobUrl(id, s3Url) ?? s3Url})`;
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

/**
 *  Vercel Blob に保存している画像の URL を取得する
 * 
 *  Vercel Blob に画像がないときは、画像をアップロードして URL を取得します。
 * 
 *  @param {string} id 画像 ID
 *  @param {string} originalImageUrl Notion から取得した画像の URL
 *  @returns {Promise<string | null>} Vercel Blob に保存している画像の URL
 */
async function getVercelBlobUrl(id: string, originalImageUrl: string): Promise<string | null> {

    const imageName = `${id}.jpeg`;
    let imageUrl: string | null = null;

    try {

        imageUrl = (await head(imageName)).url;

        console.log(`Found on Vercel Blob: ${imageName}`);
    } catch (error) {

        console.log(
            error instanceof BlobNotFoundError
                ? `Not found on Vercel Blob: ${imageName}`
                : `Error occurred while heading: ${error}`
        )
    }

    if (imageUrl == null) {

        try {

            const arrayBuffer = await (await fetch(originalImageUrl)).arrayBuffer();
            const compressedBuffer = await compressImage(Buffer.from(arrayBuffer), 0.3);

            imageUrl = (await put(imageName, compressedBuffer, {
                access: "public",
                addRandomSuffix: false,
            })).url;

            console.log(`Uploaded to Vercel Blob: ${imageName}`);
        } catch (error) {

            console.log(`Error Occurred While uploading: ${error}`);
        }
    }

    return imageUrl;
}

/**
 * 画像を圧縮する
 * 
 * @param {Buffer} inputBuffer 画像
 * @param {number} maxSizeMB 最大サイズ（MB）
 * @returns {Promise<Buffer>} 圧縮後の画像
 */
async function compressImage(inputBuffer: Buffer, maxSizeMB: number): Promise<Buffer> {
    
    let outputBuffer = inputBuffer;
    let quality = 80;

    while (outputBuffer.length / 1024 / 1024 > maxSizeMB && quality > 5) {
        outputBuffer = await sharp(inputBuffer)
        .rotate()
        .jpeg({ quality })
        .toBuffer();
        quality -= 5;
    }

    return outputBuffer;
}