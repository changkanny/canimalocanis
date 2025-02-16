import PostHeader from "@/component/post_header";
import { getBody, getAllPost } from "@/lib/notion";
import { notFound } from "next/navigation";
import Script from "next/script";
import 'zenn-content-css';
import './page.css';
import { Metadata } from "next";

export const revalidate = 3600;
export const dynamicParams = false;

interface PostPageProps {
    params: Promise<{id: string;}>;
}

export async function generateMetadata({ params }: PostPageProps): Promise<Metadata> {

    const postId = (await params).id;
    const post = await getBody(postId);
    const title = `${post?.title} | Canimalocanis`;
    const thumbnail = post?.thumbnail || `${process.env.HOST}/default-og.png`;

    return {
        title: title,
        openGraph: {
            title: title,
            siteName: 'Canimalocanis',
            type: 'article',
            locale: 'ja_JP',
            images: {
                url: thumbnail,
                width: 1200,
                height: 630,
            }
        },
        twitter: {
            card: 'summary_large_image',
            title: title,
            site: 'Canimalocanis',
            images: {
                url: thumbnail,
                width: 1200,
                height: 630,
            }
        },
    };
}

export default async function PostPage({ params }: PostPageProps) {

    const postId = (await params).id;
    const post = await getBody(postId);

    if (post == null) {
    
        notFound();
    }

    return (
        <div>
            <Script src="https://embed.zenn.studio/js/listen-embed-event.js" strategy="beforeInteractive" />
            <main>
                <div>
                    <PostHeader post={post} />
                </div>
                <div className="znc" dangerouslySetInnerHTML={{ __html: post.body }} />
            </main>
        </div>
    );
};

export const generateStaticParams = async () => {

    return (await getAllPost()).map((post) => ({
        id: post.id,
    }));
};