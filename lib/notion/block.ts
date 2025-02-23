import { BlockObjectResponse } from "@notionhq/client/build/src/api-endpoints";
import { Format, getStoredImageUrl } from "../image";
import { Block, CustomizedTableCellBlock } from "../interface/block";
import { notion } from "./common";

/**
 *  ブロックを取得する
 * 
 *  pageId で指定されたページのブロックを取得します。
 *  ブロックに子ブロックがあるときは、再帰的に取得します。
 *  通常、blockId を指定する必要はありません。
 * 
 *  @param {string} pageId ページ ID
 *  @param {string} blockId ブロック ID
 *  @returns {Promise<Array<Block>>} ブロック
 */
export async function getBlockList({ pageId, blockId }: { pageId: string, blockId?: string }): Promise<Array<Block>> {

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
            const originalUrl = block.content.image.file.url;

            block.content.image.file.url = (
                await getStoredImageUrl(`${pageId}/${imageId}`, originalUrl, Format.Avif)
            ) ?? originalUrl;
        }
    }

    return blockList;
};