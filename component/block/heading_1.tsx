import { JSX } from "react";
import { RichText } from "./rich_text";
import styles from './heading_1.module.css';
import { Heading1BlockObjectResponse } from "@notionhq/client/build/src/api-endpoints";

export function Heading1( { block }: { block: Heading1BlockObjectResponse} ): JSX.Element {

    return (
        <h1 className={styles.h1} id={block.id}>
            <RichText id={block.id} blockList={block.heading_1.rich_text} />
        </h1>
    );
}