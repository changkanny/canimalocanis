import { BulletedListItemBlockObjectResponse } from "@notionhq/client/build/src/api-endpoints";
import { JSX } from "react";
import { RichText } from "./rich_text";
import styles from './bulleted_list_item.module.css';

export function BulletedListItem( { block }: { block: BulletedListItemBlockObjectResponse } ): JSX.Element {

    return (
        <li className={styles.li}>
            <RichText id={block.id} blockList={block.bulleted_list_item.rich_text} />
        </li>
    );
}