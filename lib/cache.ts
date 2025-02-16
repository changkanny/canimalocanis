import fs from 'fs';
import path from 'path';

const CACHE_DIR = path.join(process.cwd(), ".next/cache/content");

export enum CacheType {

    Post = "post.json",
    Tag = "tag.json",
    Blob = "blob.json",
}

export function getCache<T>(type: CacheType): T | null {

    try {

        const cachePath = path.join(CACHE_DIR, type);
        if (!fs.existsSync(cachePath)) {

            return null;
        }

        const cache = fs.readFileSync(cachePath, "utf-8");
        return JSON.parse(cache);

    } catch (error) {

        console.error(`[GET CACHE] Error: ${type}`);
        console.error(error);
        return null;
    }
};

export function saveCache<T>(type: CacheType, data: T): void {

    try {

        if (!fs.existsSync(CACHE_DIR)) {
        
            fs.mkdirSync(CACHE_DIR, { recursive: true });
        }
    
        const cachePath = path.join(CACHE_DIR, type);
        fs.writeFileSync(cachePath, JSON.stringify(data));
        
    } catch (error) {

        console.error(`[SAVE CACHE] Error: ${type}`);
        console.error(error);
    }
}; 
