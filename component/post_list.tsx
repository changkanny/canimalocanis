import { Post } from "@/lib/interface/post";
import PostItem from "@/component/post_item";
import PageNation, { PageNationProps } from "@/component/page_nation";
import { Tag } from "@/lib/interface/tag";
import TagChip from "@/component/tag_chip";

interface PostListProps {
    pageNation: PageNationProps;
    postList: Array<Post>;
    tagList: Array<Tag>;
}

export default function PostList ({ pageNation, postList, tagList }: PostListProps) {

    return (
        <div>
            {postList.map((post) => (
                <div key={post.id} className="mb-4">
                    <PostItem post={post} />
                </div>
            ))}
            <PageNation index={pageNation.index} totalPage={pageNation.totalPage} previousLink={pageNation.previousLink} nextLink={pageNation.nextLink} />
            {tagList.length > 0 && (
                <div className="mt-5">
                    {tagList.map((tag) => (
                        <TagChip key={tag.id} tag={tag} />
                    ))}
                </div>
            )}
        </div>
    );
};