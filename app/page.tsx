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
import { Metadata, ResolvingMetadata } from "next";

// 1 時間ごとに再生成する
export const revalidate = CommonConstant.REVALIDATE;

interface HomeProps {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export async function generateMetadata(
    { searchParams }: HomeProps,
    parent: ResolvingMetadata
): Promise<Metadata> {

    // 現在のページ
    const currentPage = parseInt((await searchParams).page as string, 10) || 1;

    return currentPage === 1 ? {} : {
        title: `ページ ${currentPage} | Canimalocanis`,
    }
}

export default async function Home({ searchParams }: HomeProps) {

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
        <div className="container">
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
