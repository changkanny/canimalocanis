import { ImageBlockObjectResponse } from "@notionhq/client/build/src/api-endpoints";
import { JSX } from "react";
import styles from './image.module.css';

export function Image( { block }: { block: ImageBlockObjectResponse } ): JSX.Element {

    let url: string;
    let caption: string;

    if (block.image.type == "file") {

        url = block.image.file.url;
        caption = block.image.caption.map((item) => item.plain_text).join("");
    } else {
        
        url = block.image.external.url;
        caption = block.image.caption.map((item) => item.plain_text).join("");
    }

    return (
        <div className={styles.container}>
            <img className={styles.image} src={url} alt={caption ?? ""} />
            {caption.length > 0 && <div className={styles.caption}>{caption}</div>}
        </div>
    );
}