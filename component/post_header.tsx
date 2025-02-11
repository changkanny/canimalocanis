import { Post } from "@/interface/post";
import TagChip from "./tag_chip";
import { format } from "date-fns";
import styles from "./post_header.module.css";

export default function PostHeader(
    { post }: { post: Post }
) {

    return (
        <div className="mb-4">
            <div
                className={styles.thumbnail}
                style={{ backgroundImage: `url(${post.thumbnail ?? "/default.png"})` }}
            ></div>
            <div className="mb-1">
                <span className={`${styles.title}`}>{post.title}</span>
            </div>
            {post.tagList.length > 0 && (
                <div className="mt-1 mb-1">
                    {post.tagList.map((tag) => (
                        <TagChip key={tag.id} tag={tag} />
                    ))}
                </div>
            )}
            <p className="text-muted">
                <span>{format(new Date(post.publishedAt), "yyyy/M/d")}</span>
                {post.updatedAt && (
                    <span>（{format(new Date(post.updatedAt), "yyyy/M/d")} に更新）</span>
                )}
            </p>
        </div>
    );
}