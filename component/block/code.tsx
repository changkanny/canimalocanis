import { JSX } from "react";
import styles from './code.module.css';
import { codeToHtml } from 'shiki'
import { CodeBlockObjectResponse } from "@notionhq/client/build/src/api-endpoints";

export async function Code( { block }: { block: CodeBlockObjectResponse} ): Promise<JSX.Element> {

    const code = block.code.rich_text.map((item) => item.plain_text).join("");
    const language = block.code.language;
    const caption = block.code.caption?.map((item) => item.plain_text).join("");

    const html = await codeToHtml(code, {
        lang: language,
        theme: "min-dark"
    });

    return (
        <div className={styles.container}>
            {caption && <div className={styles.caption}>{caption}</div>}
            <div className={styles.code} dangerouslySetInnerHTML={{__html: html}} />
        </div>
    );
}