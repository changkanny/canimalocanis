import { Post, PostBody } from "@/lib/interface/post";
import { Tag } from "@/lib/interface/tag";
import { Client } from "@notionhq/client";
import { GetPageResponse } from "@notionhq/client/build/src/api-endpoints";
import { Format, getStoredImageUrl } from "@/lib/image";
import { format, parseISO } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';
import { CacheType, getCache, saveCache } from "../cache";
import { getBlockList } from "./block";

const JAPAN_TIMEZONE: string = "Asia/Tokyo";
const DATE_FORMAT: string = "yyyy-MM-dd";

export const notion = new Client({
    auth: process.env.NOTION_TOKEN,
});

/**
 * 記事をすべて取得する
 * 
 * @returns {Promise<Array<Post>>} 記事のリスト
 */
export async function getAllPost(): Promise<Array<Post>> {

    const cache = getCache<Array<Post>>(CacheType.Post);

    if (cache != null) {

        console.log("[GET ALL POST] Cache is exists. Using cache...");
        return cache;
    }

    console.log("[GET ALL POST] Cache is not exists. Fetching posts...");

    let hasMore = true;
    let nextCursor: string | null = null;
    const responseList: Array<GetPageResponse> = [];

    while (hasMore) {

        const response = await notion.databases.query({
            database_id: process.env.NOTION_DATABASE_ID as string,
            start_cursor: nextCursor ?? undefined,
        });

        responseList.push(...response.results.filter(
            (result): result is GetPageResponse => 'properties' in result
        ));

        hasMore = response.has_more;
        nextCursor = response.next_cursor;
    }

    let postList = (await Promise.all(
        responseList.map((result) => toPost(result))
    )).filter((post): post is Post => post !== null);

    postList = postList.filter((post) =>
        post.isPublished &&
        format(post.publishedAt, DATE_FORMAT) <= format(new Date(), DATE_FORMAT)
    );

    postList = postList.sort((a, b) => b.publishedAt.getTime() - a.publishedAt.getTime());

    postList = await Promise.all(postList.map((post) => setThumbnail(post)));

    saveCache(CacheType.Post, postList);
    return postList;
};

/**
 * タグをすべて取得する
 * 
 * @returns {Promise<Array<Tag>>} タグのリスト
 */
export async function getAllTag(): Promise<Array<Tag>> {

    const cache = getCache<Array<Tag>>(CacheType.Tag);

    if (cache != null) {

        console.log("[GET ALL TAG] Cache is exists. Using cache...");
        return cache;
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
 *  記事を取得する
 * 
 *  @param {string} pageId ページ ID
 *  @returns {Promise<Post | null>} 記事
 */
export async function getPostById( { pageId }: { pageId: string } ): Promise<Post | null> {

    const response = await notion.pages.retrieve({ page_id: pageId });
    const post = toPost(response);

    if (post == null) {

        return null;
    }

    return await setThumbnail(post);
}

/**
 * 本文を取得する
 * 
 * @param {string} pageId ページ ID
 * @returns {Promise<PostBody | null>} 本文
 */
export async function getBody(pageId: string): Promise<PostBody | null> {

    const post = await getPostById({ pageId });

    if (post === null) {

        return null;
    }

    const blockList = await getBlockList({ pageId });

    return {
        ...post,
        blockList: blockList,
    };
};

/**
 *  ぱちぱち数をインクリメントする
 * 
 *  @param {string} pageId ページ ID
 *  @returns {Promise<number | null>} 更新後のぱちぱち数
 */
export async function incrementClapCount( { pageId }: { pageId: string } ): Promise<number | null> {

    const post = await getPostById({ pageId });

    if (!post) {

        return null;
    }

    const response = await notion.pages.update({
        page_id: pageId,
        properties: {
            clap: {
                number: (post.clapCount ?? 0) + 1,
            }
        }
    });

    return toPost(response)?.clapCount ?? null;
}

const toPost = (response: GetPageResponse): Post | null => {

    // 公開フラグ
    // @ts-expect-error If the property is not found, it is false.
    const isPublished: boolean = response.properties.isPublished.checkbox ?? false;

    // 公開日時
    // @ts-expect-error If the property is not found, it is null.
    const publishedAtString: string | null = response.properties.publishedAt.date?.start;
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
    const thumbnail: string | null = response.properties.thumbnail.files[0]?.file.url ?? null;

    // 拍手
    // @ts-expect-error If the property is not found, it is 0.
    const clapCount: number = response.properties.clap.number ?? 0;

    return {
        id: id,
        title: title,
        tagList: tagList,
        publishedAt: publishedAt,
        updatedAt: updatedAt,
        isPublished: isPublished,
        clapCount: clapCount,
        thumbnail: thumbnail,
    };
}

const setThumbnail = async (post: Post): Promise<Post> => {

    const extractFileName = (url: string): string => {

        const match = url.match(/\/([^\/?#]+)\.[^\/?#]+(?:[?#]|$)/);
        return match ? match[1] : '';
    };

    const originalUrl = post.thumbnail;

    if (originalUrl == null) {

        return post;
    }

    const imageName = extractFileName(originalUrl);
    const storedUrl = await getStoredImageUrl(`${post.id}/${imageName}`, originalUrl, Format.Jpeg);

    return {
        ...post,
        thumbnail: storedUrl ?? originalUrl,
    };
};
