import { getAllPost, getAllTag } from "@/lib/notion/client";
import { MetadataRoute } from "next";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {

  const postList = await getAllPost();
  const tagList = await getAllTag();

  return [
    {
      url: "https://canimalocanis.com",
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