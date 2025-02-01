import { Tag } from "@/interface/tag";
import styles from "./tag_chip.module.css";

export default function TagChip({ tag }: { tag: Tag }) {

    let tagColorClassName : string;
    switch (tag.color) {

        case "default":
            tagColorClassName = tag.isHighlighted ? styles.highLightGray : styles.lightGray;
            break;
        case "gray":
            tagColorClassName = tag.isHighlighted ? styles.highGray : styles.gray;
            break;
        case "brown":
            tagColorClassName = tag.isHighlighted ? styles.highBrown : styles.brown;
            break;
        case "orange":
            tagColorClassName = tag.isHighlighted ? styles.highOrange : styles.orange;
            break;
        case "yellow":
            tagColorClassName = tag.isHighlighted ? styles.highYellow : styles.yellow;
            break;
        case "green":
            tagColorClassName = tag.isHighlighted ? styles.highGreen : styles.green;
            break;
        case "blue":
            tagColorClassName = tag.isHighlighted ? styles.highBlue : styles.blue;
            break;
        case "purple":
            tagColorClassName = tag.isHighlighted ? styles.highPurple : styles.purple;
            break;
        case "pink":
            tagColorClassName = tag.isHighlighted ? styles.highPink : styles.pink;
            break;
        case "red":
            tagColorClassName = tag.isHighlighted ? styles.highRed : styles.red;
            break;
        default:
            tagColorClassName = tag.isHighlighted ? styles.highLightGray : styles.lightGray;
    }

    return (
        <a href={`/tag/${tag.id}`} className={`${styles.tag} ${tagColorClassName} text-decoration-none`}>
            <span>{tag.name}</span>
        </a>
    );
}