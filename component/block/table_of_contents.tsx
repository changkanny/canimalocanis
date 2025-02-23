import { CustomizedTableOfContentsBlock } from "@/lib/interface/block";
import { JSX } from "react";
import styles from './table_of_contents.module.css';

export function TableOfContents( { block }: { block: CustomizedTableOfContentsBlock } ): JSX.Element {

    return (
        <div className={styles.tableOfContents}>
            <div className={styles.title}>
                もくじ
            </div>
            <div className={styles.content}>
                {block.table_of_contents.items.map((item) => (
                    <div key={item.id} className={`${styles.item} ${item.level === 2 ? styles.h2 : ""} ${item.level === 3 ? styles.h3 : ""}`}>
                        <a href={`#${item.id}`}>
                            {item.plain_text}
                        </a>
                    </div>
                ))}
            </div>
        </div>
    )
};