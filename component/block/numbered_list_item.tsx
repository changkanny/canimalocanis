import { NumberedListItemBlockObjectResponse } from "@notionhq/client/build/src/api-endpoints";
import { JSX } from "react";
import { RichText } from "./rich_text";
import styles from './numbered_list_item.module.css';

export function NumberedListItem( { block }: { block: NumberedListItemBlockObjectResponse } ): JSX.Element {

    return (
        <li className={styles.li}>
            <RichText id={block.id} blockList={block.numbered_list_item.rich_text} />
        </li>
    );
}