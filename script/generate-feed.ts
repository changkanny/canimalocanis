import { postLink } from "@/lib/helper";
import { getAllPost } from "@/lib/notion/common";
import { Feed } from "feed";
import fs from "fs";
import path from "path";

const PUBLIC_DIR = path.join(process.cwd(), "public");

const HOST: string = "https://canimalocanis.com";
const SITE_OG_IMAGE: string = `${HOST}/og.png`;
const DEFAULT_THUMBNAIL: string = `${HOST}/default.png`;
const FAVICON: string = `${HOST}/favicon.ico`;

async function generateFeed() {

    const postList = await getAllPost();
    const latestPostDate = postList.length > 0 ? new Date(postList[0].publishedAt) : undefined;

    const feed = new Feed({
        title: "Canimalocanis",
        id: HOST,
        link: HOST,
        language: "ja",
        copyright: "Canimalocanis",
        image: SITE_OG_IMAGE,
        favicon: FAVICON,
        updated: latestPostDate,
        description: "",
    });

    postList.forEach((post) => {
        feed.addItem({
            title: post.title,
            id: `${HOST}${postLink(post.id)}`,
            link: `${HOST}${postLink(post.id)}`,
            date: new Date(post.publishedAt),
            image: post.thumbnail ?? DEFAULT_THUMBNAIL,
        });
    });

    fs.writeFileSync(path.join(PUBLIC_DIR, "feed.xml"), feed.rss2());
}

generateFeed();