import { getAllPost, getAllTag } from "@/lib/notion";
import { Post } from "@/interface/post";
import Header from "@/component/header";
import PostItem from "@/component/post_item";
import PageNation from "@/component/page_nation";
import { CommonConstant } from "@/constant/common";
import { Tag } from "@/interface/tag";
import TagChip from "@/component/tag_chip";
import Footer from "@/component/footer";
import { notFound } from "next/navigation";
import { Metadata } from "next";

// 1 時間ごとに再生成する
export const revalidate = 3600;

interface HomePageProps {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export async function generateMetadata(
    { searchParams }: HomePageProps,
): Promise<Metadata> {

    // 現在のページ
    const page = parseInt((await searchParams).page as string, 10) || 1;

    // タイトル
    const title = page === 1 ? 'Canimalocanis' : `ページ ${page} | Canimalocanis`;

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

export default async function HomePage({ searchParams }: HomePageProps) {

    // ページ
    const page = parseInt((await searchParams).page as string, 10) || 1;

    // 記事
    const postList: Array<Post> | null = await getAllPost();

    if (postList === null) {

        notFound();
    }

    // 合計ページ
    const totalPage: number = Math.max(1, Math.ceil(postList.length / CommonConstant.POSTS_PER_PAGE));

    if (page < 1 || page > totalPage) {
        
        notFound();
    }

    // 表示する記事
    const showingPostList: Array<Post> = postList.slice(
        (page - 1) * CommonConstant.POSTS_PER_PAGE,
        ((page - 1) * CommonConstant.POSTS_PER_PAGE) + CommonConstant.POSTS_PER_PAGE
    );

    // タグ
    const tagList: Array<Tag> = await getAllTag();

    return (
        <div>
            <Header />
            <main>
                {showingPostList.map((post) => (
                    <div key={post.id} className="mb-4">
                        <PostItem post={post}/>
                    </div>
                ))}
                <PageNation currentPage={page} totalPages={totalPage} />
                {tagList.length > 0 && (
                    <div className="mt-5">
                        {tagList.map((tag) => (
                            <TagChip key={tag.id} tag={tag} />
                        ))}
                    </div>
                )}
            </main>
            <Footer />
        </div>
    );
}

export const generateStaticParams = async () => {

    // 記事
    const postList = await getAllPost();

    // 合計ページ
    const totalPage: number = Math.max(1, Math.ceil(postList.length / CommonConstant.POSTS_PER_PAGE));

    return Array.from({ length: totalPage }, (_, i) => ({ page: (i + 1).toString() }));
};
