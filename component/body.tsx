import { Block } from "@/lib/interface/block";
import { JSX } from "react";
import { Paragraph } from "./block/paragraph";
import styles from './body.module.css';
import { Heading1 } from "./block/heading_1";
import { Heading2 } from "./block/heading_2";
import { Heading3 } from "./block/heading_3";
import { Code } from "./block/code";
import { BulletedListItem } from "./block/bulleted_list_item";
import React from "react";
import { NumberedListItem } from "./block/numbered_list_item";
import { BulletedList } from "./block/bulleted_list";
import { NumberedList } from "./block/numbered_list";
import { Toggle } from "./block/toggle";
import { TableOfContents } from "./block/table_of_contents";
import { Table } from "./block/table";
import { Quote } from "./block/quote";
import { Callout } from "./block/callout";
import { Image } from "./block/image";

interface BodyProps {
    
    blockList: Array<Block>;
}

export function Body({ blockList }: BodyProps): JSX.Element {

    return (
        <div className={styles.body}>
            {blockList.map((block) => (
                <div key={block.content.id}>
                    {toElement({ block })}
                </div>
            ))}
        </div>
    );
}

export function toElement( { block }: { block: Block } ): JSX.Element {

    let element: JSX.Element = <></>;
    let shouldIndentChild = true;

    switch (block.content.type) {

        case 'paragraph':
            element = <Paragraph block={block.content} />;
            break;

        case 'heading_1':
            element = <Heading1 block={block.content} />;
            break;

        case 'heading_2':
            element = <Heading2 block={block.content} />;
            break;

        case 'heading_3':
            element = <Heading3 block={block.content} />;
            break;

        case 'code':
            element = <Code block={block.content} />;
            break;

        case 'customized_bulleted_list':
            element = <BulletedList block={block.content} />;
            break;

        case 'bulleted_list_item':
            element = <BulletedListItem block={block.content} />;
            shouldIndentChild = false;
            break;

        case 'customized_numbered_list':
            element = <NumberedList block={block.content} />;
            break;

        case 'numbered_list_item':
            element = <NumberedListItem block={block.content} />;
            shouldIndentChild = false;
            break;

        case 'toggle':
            element = <Toggle block={block.content} children={block.children} />;
            block.children = [];
            break;

        case 'customized_table_of_contents':
            element = <TableOfContents block={block.content} />;
            break;

        case 'customized_table':
            element = <Table block={block.content} />;
            break;

        case 'quote':
            element = <Quote block={block.content} />;
            break;

        case 'callout':
            element = <Callout block={block.content} />;
            break;

        case 'image':
            element = <Image block={block.content} />;

        default:
            break;
    }

    return (
        <>
            {element}
            {
                block.children.length > 0 &&
                <div className={shouldIndentChild ? styles.indent : ""}>
                    {block.children.map((child) => (
                        <div key={`${child.content.id}`}>
                            {toElement({ block: child })}
                        </div>
                    ))}
                </div>
            }
        </>
    );
};