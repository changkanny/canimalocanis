import Footer from "@/component/footer";
import Header from "@/component/header";
import PostHeader from "@/component/post_header";
import { getBody, getAllPost } from "@/lib/notion";
import { notFound } from "next/navigation";
import Script from "next/script";
import 'zenn-content-css';
import './page.css';
import { Metadata } from "next";

// 1 時間ごとに再生成する
export const revalidate = 3600;

interface PostProps {
    params: Promise<{id: string;}>;
}

export async function generateMetadata(
    { params }: PostProps,
): Promise<Metadata> {

    // 記事 ID
    const postId = (await params).id;

    // 記事名
    const postTitle = (await getBody(postId))?.title;

    return {
        title: postTitle,
    };
}

export default async function Post({ params }: PostProps) {

    // 記事 ID
    const postId = (await params).id;

    // 記事の本文を取得する
    const post = await getBody(postId);

    if (post == null) {
    
        notFound();
    }

    return (
        <div className="container">
            <Script src="https://embed.zenn.studio/js/listen-embed-event.js" strategy="beforeInteractive" />
            <Header />
            <main>
                <div>
                    <PostHeader post={post} />
                </div>
                <div className="znc" dangerouslySetInnerHTML={{ __html: post.body }} />
            </main>
            <Footer />
        </div>
    );
};

export const generateStaticParams = async () => {

    // 記事
    const postList = await getAllPost();

    return postList.map((post) => ({
        id: post.id,
    }));
};