import { getAllTag, getPostByTag } from "@/lib/notion/client";
import { notFound } from "next/navigation";
import { Metadata } from "next";
import { getPostByIndex, tagListLink } from "@/lib/helper";
import PostList from "@/component/post_list";

export const revalidate = 3600;
export const dynamicParams = false;

interface TagPageProps {
    params: Promise<{id: string;}>;
}

export async function generateMetadata({ params }: TagPageProps): Promise<Metadata> {

    const tagId = (await params).id;
    const tagName = (await getAllTag()).find((tag) => tag.id == tagId)?.name;
    const title = `${tagName} | Canimalocanis`;

    return {
        title: title,
        openGraph: {
            title: title,
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
            title: title,
            site: 'Canimalocanis',
            images: {
                url: `${process.env.HOST}/og.png`,
                width: 1200,
                height: 630,
            },
        },
    };
}

export default async function TagPage({ params }: TagPageProps) {

    const tagId = (await params).id;
    const postList = getPostByIndex(1, await getPostByTag(tagId));
    const tagList = await getAllTag();

    if (!postList) {

        return notFound();
    }

    postList.postList.forEach((post) => {
        post.tagList.forEach((tag) => {
            tag.isHighlighted = tag.id == tagId;
        });
    });
    tagList.forEach((tag) => {
        tag.isHighlighted = tag.id == tagId;
    });

    return (
        <div>
            <main>
                <PostList 
                    pageNation={{
                        index: 1,
                        totalPage: postList.totalPage,
                        previousLink: null,
                        nextLink: tagListLink(tagId, 2),
                    }}
                    postList={postList.postList} 
                    tagList={tagList} 
                />
            </main>
        </div>
    );
}

export const generateStaticParams = async () => {

    return (await getAllTag()).map((tag) => ({ id: tag.id }));
};
