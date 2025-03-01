import { Post } from "@/lib/interface/post";
import TagChip from "./tag_chip";
import { format } from "date-fns";
import styles from "./post_item.module.css";
import { postLink } from "@/lib/helper";

export default function PostItem(
    { post }: { post: Post }
) {

    return (
        <div key={post.id} className="mb-4">
            <a href={`${postLink(post.id)}`} className={styles.link}>
                <div
                    className={styles.thumbnail}
                    style={{ backgroundImage: `url(${post.thumbnail?.url ?? "/default.png"})` }}
                ></div>
                <div className="mb-1">
                    <span className={styles.title}>
                        {post.title}
                    </span>
                </div>
            </a>
            {post.tagList.length > 0 && (
                <div className="mt-1 mb-1">
                    {post.tagList.map((tag) => (
                        <TagChip key={tag.id} tag={tag} />
                    ))}
                </div>
            )}
            <p className="text-muted">
                <span>{format(post.publishedAt, "yyyy/M/d")}</span>
            </p>
        </div>
    );
}