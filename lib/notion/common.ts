import { Post, PostBody, Thumbnail } from "@/lib/interface/post";
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

    postList = postList.sort((a, b) => b.publishedAt.getTime() - a.publishedAt.getTime());
    postList = await Promise.all(postList.map((post) => setThumbnail(post)));

    saveCache(CacheType.Post, postList);
    return postList;
};

export async function getPublishedPost(): Promise<Array<Post>> {

    return (await getAllPost()).filter((post) => 
        post.isPublished &&
        format(post.publishedAt, DATE_FORMAT) <= format(new Date(), DATE_FORMAT)
    );
}

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

export async function getPostByTag(tagId: string): Promise<Array<Post> | null> {

    if (!(await getAllTag()).some((tag) => tag.id === tagId)) {

        return null;
    }

    return (await getPublishedPost()).filter((post) => post.tagList.some((tag) => tag.id === tagId));
}

export async function getBodyById( { pageId }: { pageId: string }): Promise<PostBody | null> {

    const post = await getAllPost().then((postList) => postList.find((post) => post.id === pageId));

    if (post == null) {

        return null;
    }

    const blockList = await getBlockList({ pageId });

    return {
        ...post,
        blockList: blockList,
    };
};

export async function getBodyBySlug( { slug }: { slug: string } ): Promise<PostBody | null> {

    const post = await getAllPost().then((postList) => postList.find((post) => post.slug === slug));

    if (post == null) {

        return null;
    }

    return await getBodyById({ pageId: post.id });
}

export async function getClap( { pageId }: { pageId: string } ): Promise<number> {

    const response = await notion.pages.retrieve({ page_id: pageId });
    return toPost(response)?.clap ?? 0;
}

export async function incrementClap( { pageId }: { pageId: string } ): Promise<number> {

    const response = await notion.pages.update({
        page_id: pageId,
        properties: {
            clap: {
                number: (await getClap({ pageId })) + 1,
            }
        }
    });

    return toPost(response)?.clap ?? 0;
}

const toPost = (response: GetPageResponse): Post | null => {

    if ("properties" in response == false) {

        throw new Error("Properties are not found in response.");
    }

    const properties = response.properties;

    if (
        (
            "isPublished" in properties == false
            || "checkbox" in properties.isPublished == false
        )
        || (
            "publishedAt" in properties == false
            || "date" in properties.publishedAt == false
        )
        || (
            "title" in properties == false
            || "title" in properties.title == false
        )
        || (
            "tag" in properties == false
            || "multi_select" in properties.tag == false
        )
        || (
            "updatedAt" in properties == false
            || "date" in properties.updatedAt == false
        )
        || (
            "thumbnail" in properties == false
            || "files" in properties.thumbnail == false
        )
        || (
            "clap" in properties == false
            || "number" in properties.clap == false
        )
        || (
            "slug" in properties == false
            || "rich_text" in properties.slug == false
        )
    ) {

        throw new Error("Necessary properties are not found or set to an invalid type in the database.");
    }

    // 公開フラグ
    const isPublished: boolean = properties.isPublished.checkbox ?? false;

    // 公開日時
    const publishedAtString: string | undefined = properties.publishedAt.date?.start;
    const publishedAt: Date | null = publishedAtString != null
        ? toZonedTime(parseISO(publishedAtString), JAPAN_TIMEZONE)
        : null;

    if (publishedAt == null) {

        return null;
    }

    /// ID
    const id: string = response.id;

    // タイトル
    const title: string | null = properties.title.title[0]?.plain_text ?? null;

    if (title == null) {

        return null;
    }

    // タグ
    const tagList: Array<Tag> = [];
    for (const tag of properties.tag.multi_select ?? []) {

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
    const updatedAtString: string | undefined = properties.updatedAt.date?.start;
    let updatedAt: Date | null = updatedAtString != null
        ? toZonedTime(parseISO(updatedAtString), JAPAN_TIMEZONE)
        : null;

    if (
        updatedAt != null &&
        format(updatedAt, DATE_FORMAT) <= format(publishedAt, DATE_FORMAT)
    ) {

        updatedAt = null;
    }

    // サムネイル
    const thumbnail: Thumbnail | null = 
        properties.thumbnail.files.length > 0 && "file" in properties.thumbnail.files[0]
        ? {
            name: properties.thumbnail.files[0].name.replace(/\.[^/.]+$/, ""),
            url: properties.thumbnail.files[0].file.url,
        }
        : null;


    // 拍手
    const clapCount: number = properties.clap.number ?? 0;

    // スラグ
    const slug: string | null = properties.slug.rich_text[0]?.plain_text ?? null;

    return {
        id: id,
        title: title,
        tagList: tagList,
        publishedAt: publishedAt,
        updatedAt: updatedAt,
        isPublished: isPublished,
        clap: clapCount,
        thumbnail: thumbnail,
        slug: slug,
    };
}

const setThumbnail = async (post: Post): Promise<Post> => {

    if (post.thumbnail == null) {

        return post;
    }

    const storedUrl = await getStoredImageUrl(`${post.id}/${post.thumbnail.name}`, post.thumbnail.url, Format.Jpeg);

    return {
        ...post,
        thumbnail: {
            name: post.thumbnail.name,
            url: storedUrl ?? post.thumbnail.url,
        }
    };
};
