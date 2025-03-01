import PostHeader from "@/component/post_header";
import { getBody, getAllPost } from "@/lib/notion/common";
import { notFound } from "next/navigation";
import './page.css';
import { Metadata } from "next";
import { PostBody } from "@/component/post_body";
import { ClapButton } from "@/component/clap_button";

export const dynamicParams = false;

interface PostPageProps {
    params: Promise<{id: string;}>;
}

export async function generateMetadata({ params }: PostPageProps): Promise<Metadata> {

    const postId = (await params).id;
    const post = await getBody(postId);
    const title = `${post?.title} | Canimalocanis`;
    const thumbnail = post?.thumbnail?.url || `${process.env.HOST}/default-og.png`;

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
            <main>
                <PostHeader post={post} />
                <PostBody blockList={post.blockList} />
                <ClapButton pageId={post.id} />
            </main>
        </div>
    );
};

export const generateStaticParams = async () => {

    return (await getAllPost()).map((post) => ({
        id: post.id,
    }));
};