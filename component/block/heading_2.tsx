import { JSX } from "react";
import { RichText } from "./rich_text";
import styles from './heading_2.module.css';
import { Heading2BlockObjectResponse } from "@notionhq/client/build/src/api-endpoints";

export function Heading2( { block }: { block: Heading2BlockObjectResponse} ): JSX.Element {

    return (
        <h2 className={styles.h2} id={block.id}>
            <RichText id={block.id} blockList={block.heading_2.rich_text} />
        </h2>
    );
}