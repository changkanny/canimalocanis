import { PostBody } from "@/component/post_body";
import { getBodyBySlug } from "@/lib/notion/common";
import { notFound } from "next/navigation";
import styles from './page.module.css';
import { format } from "date-fns";

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