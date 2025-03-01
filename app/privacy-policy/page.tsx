import { PostBody } from "@/component/post_body";
import { getBodyBySlug } from "@/lib/notion/common";
import { notFound } from "next/navigation";
import styles from './page.module.css';
import { format } from "date-fns";
import { Metadata } from "next";

export async function generateMetadata(): Promise<Metadata> {

    const post = await getBodyBySlug({slug: "privacy-policy"});
    const title = `${post?.title} | Canimalocanis`;

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

export default async function PrivacyPolicyPage() {

    const post = await getBodyBySlug({slug: "privacy-policy"});

    if (post == null) {
    
        notFound();
    }

    return (
        <div>
            <main>
                <div className={styles.header}>
                    <div className={styles.title}>
                        {post.title}
                    </div>
                    <div className={styles.meta}>
                        <p>制定日：{format(post.publishedAt, "yyyy 年 M 月 d 日")}</p>
                        {post.updatedAt && (
                            <p>最終改訂日：{format(post.updatedAt, "yyyy 年 M 月 d 日")}</p>
                        )}
                    </div>
                </div>
                <PostBody blockList={post.blockList} />
            </main>
        </div>
    );
};