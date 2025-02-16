import { getAllTag, getPostByTag } from "@/lib/notion/client";
import { notFound } from "next/navigation";
import { Metadata } from "next";
import { getPostByIndex, tagListLink } from "@/lib/helper";
import PostList from "@/component/post_list";

export const dynamicParams = false;

interface TagListPageProps {
    params: Promise<{id: string, index: string}>;
}

const index = async (params: Promise<{index: string;}>) => parseInt((await params).index, 10) || 1;

export async function generateMetadata({ params }: TagListPageProps): Promise<Metadata> {

    const tagId = (await params).id;
    const tagName = (await getAllTag()).find((tag) => tag.id == tagId)?.name;
    const title = `${tagName}（ページ ${await index(params)}） | Canimalocanis`;

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

export default async function TagListPage({ params }: TagListPageProps) {

    const tagId = (await params).id;
    const postList = getPostByIndex(await index(params), await getPostByTag(tagId));
    const tagList = await getAllTag();

    tagList.forEach((tag) => {
        tag.isHighlighted = tag.id == tagId;
    });

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
                        previousLink: tagListLink(tagId, await index(params) - 1),
                        nextLink: tagListLink(tagId, await index(params) + 1),
                    }}
                    postList={postList.postList} 
                    tagList={tagList} 
                />
            </main>
        </div>
    );
}

export const generateStaticParams = async () => {

    const tagList = await getAllTag();

    const params = await Promise.all(tagList.map(async (tag) => {

        const totalPage = getPostByIndex(1, await getPostByTag(tag.id))?.totalPage;

        return totalPage
            ? Array.from({ length: totalPage }, (_, i) => ({
                id: tag.id,
                index: (i + 1).toString(),
            }))
            : [];
    }));

    return params.flat();
};
