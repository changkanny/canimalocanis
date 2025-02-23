import { getAllPost, getAllTag, } from "@/lib/notion";
import { Tag } from "@/lib/interface/tag";
import { notFound } from "next/navigation";
import { Metadata } from "next";
import PostList from "@/component/post_list";
import { pageListLink, getPostByIndex } from "@/lib/helper";

export function generateMetadata(): Metadata {

    return {
        title: `Canimalocanis`,
        openGraph: {
            title: `Canimalocanis`,
            siteName: 'Canimalocanis',
            type: 'website',
            locale: 'ja_JP',
            images: {
                url: `${process.env.HOST}/og.png`,
                width: 1200,
                height: 630,
            },
        },
        twitter: {
            card: 'summary_large_image',
            title: `Canimalocanis`,
            site: 'Canimalocanis',
            images: {
                url: `${process.env.HOST}/og.png`,
                width: 1200,
                height: 630,
            },
        },
    };
}

export default async function HomePage() {

    const postList = getPostByIndex(1, await getAllPost());
    const tagList: Array<Tag> = await getAllTag();

    if (!postList) {

        return notFound();
    }

    return (
        <div>
            <main>
                <PostList 
                    pageNation={{
                        index: 1,
                        totalPage: postList.totalPage,
                        previousLink: null,
                        nextLink: pageListLink(2),
                    }}
                    postList={postList.postList} 
                    tagList={tagList} 
                />
            </main>
        </div>
    );
}
