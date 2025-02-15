import { Constant } from "@/lib/constant";
import { Post } from "@/lib/interface/post";

/**
 *  指定したインデックスの記事のリストを取得する
 * 
 *  @param {number} index インデックス
 *  @param {Array<Post>} postList 記事
 *  @returns {Promise<{ postList: Array<Post>, totalPage: number } | null>} 記事のリストと合計ページ数
 */
export function getPostByIndex(index: number, postList: Array<Post> | null): { postList: Array<Post>, totalPage: number } | null {

    if (postList == null) {

        return null;
    }

    const totalPage: number = Math.max(1, Math.ceil(postList.length / Constant.POSTS_PER_PAGE));

    if (index < 1 || index > totalPage) {

        return null;
    }

    return {
        postList: postList.slice(
            (index - 1) * Constant.POSTS_PER_PAGE,
            ((index - 1) * Constant.POSTS_PER_PAGE) + Constant.POSTS_PER_PAGE
        ),
        totalPage: totalPage,
    };
}

export const pageListLink = (index: number): string => {

    return index == 1 ? '/' : `/page/${index}`;
};

export const tagListLink = (id: string, index: number): string => {

    return index == 1 ? `/tag/${id}` : `/tag/${id}/page/${index}`;
};

export const postLink = (id: string): string => {

    return `/post/${id}`;
};