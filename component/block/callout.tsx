import { CalloutBlockObjectResponse } from "@notionhq/client/build/src/api-endpoints";
import { JSX } from "react";
import { RichText } from "./rich_text";
import styles from './callout.module.css';
import { IconamoonAttentionCircleFill, IconamoonInformationCircleFill } from "../icon";

export function Callout( { block }: { block: CalloutBlockObjectResponse } ): JSX.Element {

    let calloutTypeClass: string | null = null;
    let icon: JSX.Element | null = null;

    if (block.callout.color === "yellow_background") {

        calloutTypeClass = styles.warning;
        icon = <IconamoonAttentionCircleFill className={styles.icon} />;
    } else if (block.callout.color === "green_background") {

        calloutTypeClass = styles.information;
        icon = <IconamoonInformationCircleFill className={styles.icon} />;
    }

    if (calloutTypeClass && icon) {

        return (
            <aside className={`${styles.callout} ${calloutTypeClass}`}>
                <div className={styles.iconContainer}>
                    {icon}
                </div>
                <div className={styles.content}>
                    <RichText id={block.id} blockList={block.callout.rich_text} />
                </div>
            </aside>
        );
    }

    return <></>;
}