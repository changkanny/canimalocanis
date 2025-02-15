import { Tag } from "./tag";

/// 記事
export interface Post {

    /// ID
    id: string,

    /// タイトル
    title: string,

    /// タグ
    tagList: Array<Tag>,

    /// 公開フラグ
    isPublished: boolean,

    /// 公開日
    publishedAt: Date,

    /// 更新日
    updatedAt?: Date | null,

    /// サムネイル
    thumbnail?: string | null,
}

/// 本文
export interface PostBody extends Post {

    /// 本文
    body: string;
}