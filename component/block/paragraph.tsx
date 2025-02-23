import { ParagraphBlockObjectResponse } from "@notionhq/client/build/src/api-endpoints";
import { JSX } from "react";
import { RichText } from "./rich_text";

export function Paragraph( { block }: { block: ParagraphBlockObjectResponse } ): JSX.Element {

    return (
        <p>
            <RichText id={block.id} blockList={block.paragraph.rich_text} />
        </p>
    );
}