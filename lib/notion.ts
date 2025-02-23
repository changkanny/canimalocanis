import { Post, PostBody } from "@/lib/interface/post";
import { Tag } from "@/lib/interface/tag";
import { Client } from "@notionhq/client";
import { BlockObjectResponse, GetPageResponse } from "@notionhq/client/build/src/api-endpoints";
import { Format, getImageUrl } from "@/lib/image";
import { format, parseISO } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';
import { CacheType, getCache, saveCache } from "./cache";
import { Block, CustomizedTableCellBlock } from "./interface/block";

const JAPAN_TIMEZONE: string = "Asia/Tokyo";
const DATE_FORMAT: string = "yyyy-MM-dd";

const notion = new Client({
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
        responseList.map((result) => toPostFromGetPageResponse(result))
    )).filter((post): post is Post => post !== null);

    postList = postList.filter((post) =>
        post.isPublished &&
        format(post.publishedAt, DATE_FORMAT) <= format(new Date(), DATE_FORMAT)
    );

    postList = postList.sort((a, b) => b.publishedAt.getTime() - a.publishedAt.getTime());

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

    const blockList = await getBlockList({ pageId });

    return {
        ...post,
        blockList: blockList,
    };
};

const toPostFromGetPageResponse = async (response: GetPageResponse): Promise<Post | null> => {

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

const getBlockList = async ({ pageId, blockId }: { pageId: string, blockId?: string }): Promise<Array<Block>> => {

    let hasMore = true;
    let nextCursor: string | null = null;
    let blockList: Array<Block> = [];

    while (hasMore) {

        const response = await notion.blocks.children.list({
            block_id: blockId ?? pageId,
            start_cursor: nextCursor ?? undefined,
        });

        blockList.push(...response.results
            .filter((result): result is BlockObjectResponse => 'type' in result)
            .map((result) => ({ content: result, children: [] }))
        );
        hasMore = response.has_more;
        nextCursor = response.next_cursor;
    }

    for (const block of blockList) {

        if (block.content.has_children) {

            block.children = await getBlockList({ pageId, blockId: block.content.id });
        }
    }

    blockList = setBulletedList(blockList);
    blockList = setNumberedList(blockList);
    blockList = setTableOfContents(blockList);
    blockList = setTable(blockList);
    blockList = await setImage(blockList, pageId);

    return blockList;
};

const setBulletedList = (blockList: Array<Block>): Array<Block> => {

    const wrappedBlockList: Array<Block> = [];
    let currentList: Array<Block> = [];

    blockList.forEach((block) => {

        if (block.content.type === 'bulleted_list_item') {

            currentList.push(block);
        } else {

            if (currentList.length > 0) {

                wrappedBlockList.push({
                    content: {
                        id: `bulleted-list-${currentList[0].content.id}`,
                        type: 'customized_bulleted_list',
                        bulleted_list: { items: currentList },
                        has_children: false,
                    },
                    children: []
                });
                currentList = [];
            }

            wrappedBlockList.push(block);
        }
    });

    if (currentList.length > 0) {
        wrappedBlockList.push({
            content: {
                id: `bulleted-list-${currentList[0].content.id}`,
                type: 'customized_bulleted_list',
                bulleted_list: { items: currentList },
                has_children: false,
            },
            children: []
        });
    }

    return wrappedBlockList;
};

const setNumberedList = (blockList: Array<Block>): Array<Block> => {

    const wrappedBlockList: Array<Block> = [];
    let currentList: Array<Block> = [];

    blockList.forEach((block) => {

        if (block.content.type === 'numbered_list_item') {

            currentList.push(block);
        } else {

            if (currentList.length > 0) {

                wrappedBlockList.push({
                    content: {
                        id: `numbered-list-${currentList[0].content.id}`,
                        type: 'customized_numbered_list',
                        numbered_list: { items: currentList },
                        has_children: false,
                    },
                    children: []
                });
                currentList = [];
            }

            wrappedBlockList.push(block);
        }
    });

    if (currentList.length > 0) {
        wrappedBlockList.push({
            content: {
                id: `numbered-list-${currentList[0].content.id}`,
                type: 'customized_numbered_list',
                numbered_list: { items: currentList },
                has_children: false,
            },
            children: []
        });
    }

    return wrappedBlockList;
};

const setTableOfContents = (blockList: Array<Block>): Array<Block> => {

    const headingList: Array<{ id: string, plain_text: string, level: number }> = [];

    blockList.forEach((block) => {

        if (block.content.type === "heading_1") {

            headingList.push({
                id: block.content.id,
                plain_text: block.content.heading_1.rich_text.map((item) => item.plain_text).join(""),
                level: 1,
            });
        }

        if (block.content.type === "heading_2") {

            headingList.push({
                id: block.content.id,
                plain_text: block.content.heading_2.rich_text.map((item) => item.plain_text).join(""),
                level: 2,
            });
        }

        if (block.content.type === "heading_3") {

            headingList.push({
                id: block.content.id,
                plain_text: block.content.heading_3.rich_text.map((item) => item.plain_text).join(""),
                level: 3,
            });
        }
    });

    blockList.forEach((block) => {

        if (block.content.type === "table_of_contents") {

            block.content = {
                id: block.content.id,
                type: "customized_table_of_contents",
                table_of_contents: {
                    items: headingList.map(
                        ({ id, plain_text, level }) => ({
                            id: id,
                            plain_text: plain_text,
                            level: level,
                        })
                    )
                },
                has_children: false,
            }
        }
    });

    return blockList;
};

const setTable = (blockList: Array<Block>): Array<Block> => {

    blockList.forEach((block) => {

        if (block.content.type === "table") {

            const header: Array<CustomizedTableCellBlock> = [];
            const body: Array<Array<CustomizedTableCellBlock>> = [];

            if (block.content.table.has_column_header) {

                if (block.children[0].content.type === "table_row") {

                    block.children[0].content.table_row.cells.forEach((cell, columnIndex) => {

                        header.push({
                            id: `${block.content.id}-header-${columnIndex}`,
                            type: "customized_table_cell",
                            table_cell: {
                                rich_text: cell
                            },
                            has_children: false,
                        });
                    });

                    block.children.shift();
                }
            }

            block.children.forEach((row, rowIndex) => {

                if (row.content.type === "table_row") {

                    const cells: Array<CustomizedTableCellBlock> = [];

                    row.content.table_row.cells.forEach((cell, columnIndex) => {

                        cells.push({
                            id: `${block.content.id}-cell-${rowIndex}-${columnIndex}`,
                            type: "customized_table_cell",
                            table_cell: {
                                rich_text: cell
                            },
                            has_children: false,
                        });
                    });

                    body.push(cells);
                }
            });

            block.content = {
                id: block.content.id,
                type: "customized_table",
                table: {
                    head: header,
                    body: body,
                    has_row_header: block.content.table.has_row_header,
                },
                has_children: false,
            };
            block.children = [];
        }
    });

    return blockList;
};

const setImage = async (blockList: Array<Block>, pageId: string): Promise<Array<Block>> => {

    for (const block of blockList) {

        if (block.content.type === "image" && block.content.image.type === "file") {

            const imageId = block.content.id;
            const image = await fetch(block.content.image.file.url).then(response => response.arrayBuffer()).catch(() => null);

            block.content.image.file.url = image != null
                ? (await getImageUrl(`${pageId}/${imageId}`, image, Format.Avif)) ?? block.content.image.file.url
                : block.content.image.file.url;
        }
    }

    return blockList;
};
