import { JSX } from "react";
import styles from './numbered_list.module.css';
import { CustomizedNumberedListBlock } from "@/lib/interface/block";
import React from "react";
import { toElement } from "../body";

export function NumberedList( { block }: { block: CustomizedNumberedListBlock } ): JSX.Element {

    return (
        <ol className={styles.ol}>
            {block.numbered_list.items.map((item) => (
                <React.Fragment key={item.content.id}>
                    {toElement({ block: item })}
                </React.Fragment>
            ))}
        </ol>
    );
}