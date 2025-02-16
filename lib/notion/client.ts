import { Post, PostBody } from "@/lib/interface/post";
import { Tag } from "@/lib/interface/tag";
import { Client } from "@notionhq/client";
import { GetPageResponse } from "@notionhq/client/build/src/api-endpoints";
import { NotionToMarkdown } from "notion-to-md";
import zennMarkdownHtml from 'zenn-markdown-html';
import { Format, getImageUrl } from "@/lib/image";
import { format, parseISO } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';
import { replaceTableOfContents, setBookmark, setCallout, setCode, setImage, setLazyLoading, setMention, setTableOfContents, setToggle } from "./converter";
import { CacheType, getCache, saveCache } from "../cache";

const JAPAN_TIMEZONE: string = "Asia/Tokyo";
const DATE_FORMAT: string = "yyyy-MM-dd";
const IS_DEVELOPMENT: boolean = process.env.NODE_ENV === 'development';

const notion = new Client({
    auth: process.env.NOTION_TOKEN,
});

/**
 * 記事をすべて取得する
 * 
 * @returns {Promise<Array<Post>>} 記事のリスト
 */
export async function getAllPost(): Promise<Array<Post>> {

    if (!IS_DEVELOPMENT) {

        const cache = getCache<Array<Post>>(CacheType.Post);

        if (cache != null) {

            console.log("[GET ALL POST] Cache is exists. Using cache...");
            return cache;
        }
    }

    console.log("[GET ALL POST] Cache is not exists. Fetching posts...");

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

    saveCache(CacheType.Post, postList);
    return postList;
};

/**
 * タグをすべて取得する
 * 
 * @returns {Promise<Array<Tag>>} タグのリスト
 */
export async function getAllTag(): Promise<Array<Tag>> {

    if (!IS_DEVELOPMENT) {

        const cache = getCache<Array<Tag>>(CacheType.Tag);

        if (cache != null) {

            console.log("[GET ALL TAG] Cache is exists. Using cache...");
            return cache;
        }
    }

    console.log("[GET ALL TAG] Cache is not exists. Fetching tags...");
    
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

    saveCache(CacheType.Tag, tagList);
    return tagList;
}

/**
 *  タグに紐づく記事を取得する
 * 
 *  @param {string} tagId タグ ID
 *  @returns {Promise<Array<Post> | null>} 記事のリスト
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

    const response = await notion.pages.retrieve({ page_id: pageId });
    const post = await toPostFromGetPageResponse(response);

    if (post === null) {

        return null;
    }
    
    const n2m = getN2M(pageId);
    let blockList = await n2m.pageToMarkdown(pageId);
    blockList = setTableOfContents(blockList);

    let markdown = n2m.toMarkdownString(blockList).parent;
    markdown = setToggle(markdown);

    let html = zennMarkdownHtml(markdown, {
        embedOrigin: "https://embed.zenn.studio", // これを指定しないと埋め込み要素が表示されないよ！
    });
    html = replaceTableOfContents(html);
    html = setLazyLoading(html);

    return {
        ...post,
        body: html,
    };
};

const toPostFromGetPageResponse = async (response: GetPageResponse): Promise<Post | null> => {

    // 公開フラグ
    // @ts-expect-error If the property is not found, it is false.
    const isPublished: boolean = response.properties.isPublished.checkbox ?? false;

    // 公開日時
    // @ts-expect-error If the property is not found, it is null.
    const publishedAtString: string | null = response.properties.publishedAt.date.start;
    const publishedAt: Date | null = publishedAtString != null
        ? toZonedTime(parseISO(publishedAtString), JAPAN_TIMEZONE)
        : null;

    if (publishedAt == null) {

        return null;
    }

    /// ID
    const id: string = response.id;

    // タイトル
    // @ts-expect-error If the property is not found, it is null.
    const title: string | null = response.properties.title.title[0]?.plain_text ?? null;

    if (title == null) {

        return null;
    }

    // タグ
    const tagList: Array<Tag> = [];
    // @ts-expect-error If the property is not found, it is empty.
    for (const tag of response.properties.tag.multi_select ?? []) {

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
    // @ts-expect-error If the property is not found, it is null.
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
    // @ts-expect-error If the property is not found, it is null.
    const imageName: string | null = response.properties.thumbnail.files[0]?.name.split('.').slice(0, -1).join('.') ?? null;
    // @ts-expect-error If the property is not found, it is null.
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
        ? (await getImageUrl(`${id}/${imageName}`, image, Format.Jpeg)) ?? s3Url
        : s3Url,
    };
}

const getN2M = (pageId: string): NotionToMarkdown => {

    const n2m = new NotionToMarkdown({ notionClient: notion });

    n2m.setCustomTransformer("callout", async (block) => {

        if (!("callout" in block)) {   

            return false;
        }

        return setCallout(block);
    });

    n2m.setCustomTransformer("bookmark", async (block) => {

        if (!("bookmark" in block)) {

            return false
        }

        return setBookmark(block);
    });

    n2m.setCustomTransformer("image", async (block) => {

        if (!("image" in block)) {

            return false;
        }

        return setImage(block, pageId);
    });

    n2m.setCustomTransformer('code', (block) => {

        if (!('code' in block)) {

            return false;
        }

        return setCode(block);
    });

    n2m.setCustomTransformer("paragraph", (block) => {

        if (!("paragraph" in block)) {

            return false;
        }

        const first = block.paragraph?.rich_text[0];

        if (!first || !("mention" in first)) {

            return false;
        }

        return setMention(first);
    });

    return n2m;
}
