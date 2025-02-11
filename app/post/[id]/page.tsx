import Footer from "@/component/footer";
import Header from "@/component/header";
import PostHeader from "@/component/post_header";
import { getBody, getAllPost } from "@/lib/notion";
import { notFound } from "next/navigation";
import Script from "next/script";
import 'zenn-content-css';
import './page.css';
import { Metadata } from "next";
import { ImageResponse } from '@vercel/og';

// 1 時間ごとに再生成する
export const revalidate = 3600;

interface PostPageProps {
    params: Promise<{id: string;}>;
}

export async function generateMetadata(
    { params }: PostPageProps,
): Promise<Metadata> {

    // 記事 ID
    const postId = (await params).id;
    // 記事
    const post = await getBody(postId);
    // タイトル
    const title = `${post?.title} | Canimalocanis`;

    return {
        title: title,
        openGraph: {
            title: title,
            siteName: 'Canimalocanis',
            type: 'article',
            locale: 'ja_JP',
        },
        twitter: {
            card: 'summary_large_image',
            title: title,
            site: 'Canimalocanis',
        },
    };
}

export default async function PostPage({ params }: PostPageProps) {

    // 記事 ID
    const postId = (await params).id;

    // 記事の本文を取得する
    const post = await getBody(postId);

    if (post == null) {
    
        notFound();
    }

    return (
        <div>
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