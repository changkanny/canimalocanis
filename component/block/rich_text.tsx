import { JSX } from "react";
import styles from './rich_text.module.css';
import { RichTextItemResponse } from "@notionhq/client/build/src/api-endpoints";

type TextColor = "default" | "gray" | "brown" | "orange" | "yellow" | "green" | "blue" | "purple" | "pink" | "red" | "gray_background" | "brown_background" | "orange_background" | "yellow_background" | "green_background" | "blue_background" | "purple_background" | "pink_background" | "red_background";

export function RichText({ id, blockList }: { id: string, blockList: Array<RichTextItemResponse> }): JSX.Element {

    return (
        <>
            {blockList.map((item, index) => (
                <RichTextElement key={`${id}-${index}`} id={`${id}-${index}`} block={item} />
            ))}
        </>
    );
}

const RichTextElement = ({ id, block }: { id: string, block: RichTextItemResponse }): JSX.Element => {

    if (block.type === "text") {

        const line = block.plain_text.split("\n");
        let element = <span key={id} className={getColorClassName(block.annotations.color)}>{
            line.map((item, index) => (
                <span key={`${id}-${index}`}>{item}{index < line.length - 1 && <br />}</span>
            ))
        }</span>;

        if (block.annotations.bold) {

            element = <strong>{element}</strong>;
        }

        if (block.annotations.italic) {

            element = <em>{element}</em>;
        }

        if (block.annotations.strikethrough) {

            element = <s>{element}</s>;
        }

        if (block.annotations.underline) {

            element = <u>{element}</u>;
        }

        if (block.annotations.code) {

            element = <code className={styles.code}>{element}</code>;
        }

        if (block.href) {

            element = <a className={styles.link} href={block.href} target="_blank" rel="noopener noreferrer">{element}</a>;
        }

        return element;
    }

    if (block.type === "mention") {

        // @ts-expect-error link_mention is not defined in Notion Client.
        const title = block.mention.link_mention?.title;
        const link = block.href;

        if (title && link) {
        
            return <a className={styles.link} href={link} target="_blank" rel="noopener noreferrer">{title}</a>;
        }
    }

    return <></>;
};

const getColorClassName = (color: TextColor): string => {

    switch (color) {

        case "gray":
            return styles.gray;
        case "brown":
            return styles.brown;
        case "orange":
            return styles.orange;
        case "yellow":
            return styles.yellow;
        case "green":
            return styles.green;
        case "blue":
            return styles.blue;
        case "purple":
            return styles.purple;
        case "pink":
            return styles.pink;
        case "red":
            return styles.red;
        case "gray_background":
            return styles.bgGray;
        case "brown_background":
            return styles.bgBrown;
        case "orange_background":
            return styles.bgOrange;
        case "yellow_background":
            return styles.bgYellow;
        case "green_background":
            return styles.bgGreen;
        case "blue_background":
            return styles.bgBlue;
        case "purple_background":
            return styles.bgPurple;
        case "pink_background":
            return styles.bgPink;
        case "red_background":
            return styles.bgRed;
        default:
            return "";
    }
};