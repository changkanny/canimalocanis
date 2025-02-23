import { Tag } from "./tag";
import { Block } from "./block";

export interface Post {

    id: string,
    title: string,
    tagList: Array<Tag>,
    isPublished: boolean,
    publishedAt: Date,
    updatedAt?: Date | null,
    thumbnail?: string | null,
    clapCount: number,
}

export interface PostBody extends Post {

    blockList: Array<Block>;
}