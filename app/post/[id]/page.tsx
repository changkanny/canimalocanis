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

    if (post == null) {
    
        notFound();
    }

    // タイトル
    const title = `${post.title} | Canimalocanis`;
    // サムネイルの URL
    const thumbnail = post.thumbnail || `${process.env.HOST}/default-og.png`;

    // 画像を 1200 x 630 に切り取る
    const ogImage = new ImageResponse(
        <img src={thumbnail} style={{
            objectFit: 'cover',
            width: '1200px',
            height: '630px'
        }} />,
        {
            width: 1200,
            height: 630,
        }
    );

    return {
        title: title,
        openGraph: {
            title: title,
            siteName: 'Canimalocanis',
            type: 'article',
            locale: 'ja_JP',
            images: {
                url: ogImage.url,
                width: 1200,
                height: 630,
            },
        },
        twitter: {
            card: 'summary_large_image',
            title: title,
            site: 'Canimalocanis',
            images: {
                url: ogImage.url,
                width: 1200,
                height: 630,
            },
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