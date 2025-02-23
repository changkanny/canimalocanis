import { QuoteBlockObjectResponse } from "@notionhq/client/build/src/api-endpoints";
import { RichText } from "./rich_text";
import { JSX } from "react";
import styles from './quote.module.css';
import { BxsQuoteLeft } from "../icon";

export function Quote( { block }: { block: QuoteBlockObjectResponse } ): JSX.Element {

    return (
        <blockquote className={styles.blockquote}>
            <div className={styles.iconContainer}>
                <BxsQuoteLeft className={styles.icon} />
            </div>
            <div>
                <RichText id={block.id} blockList={block.quote.rich_text} />
            </div>
        </blockquote>
    );
}