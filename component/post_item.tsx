import { Post } from "@/interface/post";
import TagChip from "./tag_chip";
import { format } from "date-fns";
import styles from "./post_item.module.css";

export default function PostItem(
    { post }: { post: Post }
) {

    return (
        <div key={post.id} className="mb-4">
            <div className="mb-1">
                <a href={`/post/${post.id}`} className={`${styles.title}`}>
                    {post.title}
                </a>
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
            </p>
        </div>
    );
}