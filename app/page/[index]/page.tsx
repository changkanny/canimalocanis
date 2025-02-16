import { getAllPost, getAllTag, } from "@/lib/notion/client";
import { Tag } from "@/lib/interface/tag";
import { notFound } from "next/navigation";
import { Metadata } from "next";
import PostList from "@/component/post_list";
import { getPostByIndex, pageListLink } from "@/lib/helper";

export const revalidate = 3600;
export const dynamicParams = false;

interface PostListPageProps {
    params: Promise<{index: string}>;
}

const index = async (params: Promise<{index: string;}>) => parseInt((await params).index, 10) || 1;

export async function generateMetadata({ params }: PostListPageProps): Promise<Metadata> {

    const title = `ページ ${await index(params)} | Canimalocanis`;

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

export default async function PostListPage({ params }: PostListPageProps) {

    const postList = getPostByIndex(await index(params), await getAllPost());
    const tagList: Array<Tag> = await getAllTag();

    if (!postList) {

        return notFound();
    }

    return (
        <div>
            <main>
                <PostList 
                    pageNation={{
                        index: await index(params),
                        totalPage: postList.totalPage,
                        previousLink: pageListLink(await index(params) - 1),
                        nextLink: pageListLink(await index(params) + 1),
                    }}
                    postList={postList.postList} 
                    tagList={tagList} 
                />
            </main>
        </div>
    );
}

export const generateStaticParams = async () => {

    const totalPage = getPostByIndex(1, await getAllPost())?.totalPage ?? 1;

    return Array.from({ length: totalPage }, (_, i) => ({ index: (i + 1).toString() }));
};
