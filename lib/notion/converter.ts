import { MdBlock } from "notion-to-md/build/types";
import * as cheerio from 'cheerio';
import { BookmarkBlockObjectResponse, CalloutBlockObjectResponse, CodeBlockObjectResponse, ImageBlockObjectResponse, MentionRichTextItemResponse, RichTextItemResponse } from "@notionhq/client/build/src/api-endpoints";
import { notionRichTextToMarkdown } from "notion-rich-text-to-markdown";
import { Format, getImageUrl } from "../image";

const INDENT: string = "    ";
const TABLE_OF_CONTENTS_SYNTAX = {
    start: {
        before: "[TOC]",
        after: "<div class=\"toc\">",
    },
    end: {
        before: "[/TOC]",
        after: "</div>",
    }
}

export const setTableOfContents = (blockList: MdBlock[]): MdBlock[] => {

    const headingList: Array<{ text: string, level: number }> = [];

    blockList.forEach((block) => {

        if (block.type === "heading_1") {

            headingList.push({
                text: block.parent.replace(/^#+\s*/, ''),
                level: 1,
            });
        }

        if (block.type === "heading_2") {

            headingList.push({
                text: block.parent.replace(/^#+\s*/, ''),
                level: 2,
            });
        }

        if (block.type === "heading_3") {

            headingList.push({
                text: block.parent.replace(/^#+\s*/, ''),
                level: 3,
            });
        }
    });

    blockList.forEach((block) => {

        if (block.type === "table_of_contents") {

            block.parent = headingList.map(
                ({ text, level }) => `${INDENT.repeat(level - 1)}- [${text}](#${encodeURIComponent(text.toLowerCase().replace(/\s+/g, '-'))})`
            ).join('\n');
            block.parent = `${TABLE_OF_CONTENTS_SYNTAX.start.before}\n${block.parent}\n\n${TABLE_OF_CONTENTS_SYNTAX.end.before}`;
        }
    });

    return blockList;
};

export const replaceTableOfContents = (html: string): string => {

    return html
        .replace(TABLE_OF_CONTENTS_SYNTAX.start.before, TABLE_OF_CONTENTS_SYNTAX.start.after)
        .replace(TABLE_OF_CONTENTS_SYNTAX.end.before, TABLE_OF_CONTENTS_SYNTAX.end.after);
};

export const setToggle = (markdown: string): string => {

    return markdown
        .replace(/<details>\s*<summary>(.*?)<\/summary>/g, ':::details $1')
        .replace(/<\/details>/g, ':::');
};

export const setLazyLoading = (html: string): string => {

    const $ = cheerio.load(html);
    $('img').attr('loading', 'lazy');

    return $.html();
};

export const setCallout = (block: CalloutBlockObjectResponse): string => {

    const isCaution = block.callout.color === "red_background";
    const body = block.callout.rich_text.map((text: RichTextItemResponse) => notionRichTextToMarkdown(text)).join("<br>");

    return `:::message ${isCaution ? "alert" : ""}\n${body}\n:::`;
};

export const setBookmark = (block: BookmarkBlockObjectResponse): string => {

    if (block.bookmark.url.includes("x.com") || block.bookmark.url.includes("twitter.com")) {

        return `@[tweet](${block.bookmark.url})`;
    }

    if (block.bookmark.url.includes("youtube.com")) {

        return `@[youtube](${block.bookmark.url})`;
    }

    return `@[card](${block.bookmark.url})`;
};

export const setImage = async (block: ImageBlockObjectResponse, pageId: string): Promise<string> => {

    let text = "";
    
    const caption = block.image.caption.map((item) => item.plain_text).join('');

    if (block.image.type === 'external') {

        text = `![${caption ?? ""}](${block.image.external.url})`;
    }

    if (block.image.type === 'file') {

        const imageId = block.id;

        const image = await fetch(block.image.file.url).then(response => response.arrayBuffer()).catch(() => null);
        const url = image != null
            ? (await getImageUrl(`${pageId}/${imageId}`, image, Format.avif)) ?? block.image.file.url
            : block.image.file.url;

        text = `![${caption ?? ""}](${url})`;
    }

    if (caption) {
        text += `\n*${caption}*`;
    }

    return text;
};

export const setCode = (block: CodeBlockObjectResponse): string => {

    const language = block.code.language === 'plain text' ? 'text' : block.code.language;
    const fileName = block.code.caption.map((item) => item.plain_text).join('');
    const codeString = block.code.rich_text.map((item) => item.plain_text).join('');

    if (language === 'diff') {

        return `\`\`\`${language} ${fileName || 'text'}\n${codeString}\n\`\`\``;
    }

    return `\`\`\`${language}${fileName != null ? `:${fileName}` : ''}\n${codeString}\n\`\`\``;
};

export const setMention = (block: MentionRichTextItemResponse): string | boolean => {

    if ("page" in block.mention) {

        return `@[card](${process.env.HOST}/post/${block.mention.page.id})`;
    }

    if ("link_preview" in block.mention) {

        return `@[card](${block.mention.link_preview.url})`;
    }

    if ("link_mention" in block.mention) {

        return `@[card](${(block.mention.link_mention as { href: string }).href})`;
    }

    return false;
};