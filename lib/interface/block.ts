import { BlockObjectResponse, RichTextItemResponse } from "@notionhq/client/build/src/api-endpoints";

export interface Block {

    content:
        BlockObjectResponse |
        CustomizedBulletedListBlock |
        CustomizedNumberedListBlock |
        CustomizedTableOfContentsBlock |
        CustomizedTableBlock |
        CustomizedTableCellBlock;
    children: Array<Block>;
}

abstract class CustomizedBlock {

    abstract id: string;
    abstract type:
        "customized_bulleted_list" |
        "customized_numbered_list" |
        "customized_table_of_contents" |
        "customized_table" |
        "customized_table_cell";
    has_children: boolean = false;
}

export interface CustomizedBulletedListBlock extends CustomizedBlock {

    type: "customized_bulleted_list";
    bulleted_list: {
        items: Array<Block>;
    };
}

export interface CustomizedNumberedListBlock extends CustomizedBlock {

    type: "customized_numbered_list";
    numbered_list: {
        items: Array<Block>;
    };
}

export interface CustomizedTableOfContentsBlock extends CustomizedBlock {

    type: "customized_table_of_contents";
    table_of_contents: {
        items: Array<{
            id: string,
            plain_text: string,
            level: number,
        }>
    },
}

export interface CustomizedTableBlock extends CustomizedBlock {

    type: "customized_table";
    table: {
        head?: Array<CustomizedTableCellBlock>,
        body: Array<Array<CustomizedTableCellBlock>>,
        has_row_header: boolean,
    }
}

export interface CustomizedTableCellBlock extends CustomizedBlock {

    type: "customized_table_cell";
    table_cell: {
        rich_text: Array<RichTextItemResponse>,
    }
}