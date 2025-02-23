import { ToggleBlockObjectResponse } from "@notionhq/client/build/src/api-endpoints";
import { JSX } from "react";
import { RichText } from "./rich_text";
import { Block } from "@/lib/interface/block";
import React from "react";
import { toElement } from "../post_body";
import styles from './toggle.module.css';

export function Toggle( { block, children }: { block: ToggleBlockObjectResponse, children: Array<Block> } ): JSX.Element {

    return (
        <details className={styles.details}>
            <summary className={styles.summary}>
                <RichText id={block.id} blockList={block.toggle.rich_text} />
            </summary>
            <div className={styles.detailsContent}>
                {children.map((item) => (
                    <React.Fragment key={item.content.id}>
                        {toElement({ block: item })}
                    </React.Fragment>
                ))}
            </div>
        </details>
    );
}