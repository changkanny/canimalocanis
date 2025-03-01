import { Tag } from "./tag";
import { Block } from "./block";

export interface Post {

    id: string,
    title: string,
    tagList: Array<Tag>,
    isPublished: boolean,
    publishedAt: Date,
    updatedAt?: Date | null,
    thumbnail?: Thumbnail | null,
    clapCount: number,
}

export interface Thumbnail {

    name: string,
    url: string,
}

export interface PostBody extends Post {

    blockList: Array<Block>;
}