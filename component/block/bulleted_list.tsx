import { JSX } from "react";
import styles from './bulleted_list.module.css';
import { CustomizedBulletedListBlock } from "@/lib/interface/block";
import React from "react";
import { toElement } from "../post_body";

export function BulletedList( { block }: { block: CustomizedBulletedListBlock } ): JSX.Element {

    return (
        <ul className={styles.ul}>
            {block.bulleted_list.items.map((item) => (
                <React.Fragment key={item.content.id}>
                    {toElement({ block: item })}
                </React.Fragment>
            ))}
        </ul>
    );
}