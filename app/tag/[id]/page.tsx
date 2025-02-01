import { getAllPost, getAllTag, getPostByTag } from "@/lib/notion";
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

interface TagPageProps {
    params: Promise<{id: string;}>;
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export async function generateMetadata(
    { params, searchParams }: TagPageProps,
    parent: ResolvingMetadata
): Promise<Metadata> {

    // ページ
    const page = parseInt((await searchParams).page as string, 10) || 1;
    // タグ ID
    const tagId = (await params).id;

    // タグ名
    const tagName = (await getAllTag()).find((tag) => tag.id == tagId)?.name;

    return {
        title: page === 1
            ? `${tagName}`
            : `${tagName}（ページ ${page}）`,
    }
}

export default async function TagPage({ params, searchParams }: TagPageProps) {

    // ページ
    const page = parseInt((await searchParams).page as string, 10) || 1;
    // タグ ID
    const tagId = (await params).id;

    // 記事
    const postList: Array<Post> | null = await getPostByTag((await params).id);

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
                {showingPostList.length > 0 && (
                    <>
                        {showingPostList.map((post) => {

                            post.tagList.forEach((tag) => {
                                tag.isHighlighted = tag.id == tagId;
                            });

                            return (
                                <div key={post.id} className="mb-4">
                                    <PostItem post={post}/>
                                </div>
                            );
                        })}
                        <PageNation currentPage={page} totalPages={totalPage} />
                    </>
                )}
                {showingPostList.length === 0 && (
                    <div className="text-center my-5">
                        <span>このタグがついている記事はありません</span>
                    </div>
                )}
                {tagList.length > 0 && (
                    <div className="mt-5">
                        {tagList.map((tag) => {

                            tag.isHighlighted = tag.id === tagId;
                            
                            return (
                                <TagChip key={tag.id} tag={tag} />
                            );
                        })}
                    </div>
                )}
            </main>
            <Footer />
        </div>
    );
}

export const generateStaticParams = async () => {

    // タグ
    const tagList = await getAllTag();

    // タグごとのページ数
    const tagPageList = await Promise.all(tagList.map(async (tag) => {

        const postList = await getPostByTag(tag.id);

        if (postList == null) {

            return null;
        }

        const totalPages = Math.ceil(postList.length / CommonConstant.POSTS_PER_PAGE);

        return {
            id: tag.id,
            totalPage: totalPages,
        };
    }));

    return tagPageList
        .filter((tagPage) => tagPage !== null)
        .flatMap((tagPage) => {

            return [...Array(tagPage.totalPage).keys()].map((page) => ({
                id: tagPage.id,
                page: (page + 1).toString(),
            }));
        }
    );
};
