import { getAllTag, getPublishedPost } from "@/lib/notion/common";
import { MetadataRoute } from "next";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {

    const postList = await getPublishedPost();
    const tagList = await getAllTag();

    return [
        {
            url: "https://canimalocanis.com",
        },
        {
            url: "https://canimalocanis.com/privacy-policy",
        },
        ...postList.map(post => ({
            url: `https://canimalocanis.com/post/${post.id}`,
            lastModified: post.updatedAt ?? post.publishedAt,
        })),
        ...tagList.map(tag => ({
            url: `https://canimalocanis.com/tag/${tag.id}`,
        })),
    ];
}