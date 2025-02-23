import { JSX } from "react";
import { RichText } from "./rich_text";
import styles from './heading_3.module.css';
import { Heading3BlockObjectResponse } from "@notionhq/client/build/src/api-endpoints";

export function Heading3( { block }: { block: Heading3BlockObjectResponse} ): JSX.Element {

    return (
        <h3 className={styles.h3} id={block.id}>
            <RichText id={block.id} blockList={block.heading_3.rich_text} />
        </h3>
    );
}