import { put, list, ListBlobResult, ListBlobResultBlob } from "@vercel/blob";
import sharp from "sharp";
import { CacheType, getCache, saveCache } from "./cache";

const IS_ON_VERCEL = process.env.VERCEL === "1";

export enum Format {

    Jpeg = "jpeg",
    Avif = "avif",
}

/**
 *  Vercel Blob に保存している画像の URL を取得する
 * 
 *  @param {string} name 名前
 *  @param {string} originalUrl 画像 URL
 *  @param {Format} format フォーマット
 *  @returns {Promise<string | null>} URL
 */
export async function getStoredImageUrl(name: string, originalUrl: string, format: Format): Promise<string | null> {

    const imageName = `${IS_ON_VERCEL ? "prod/" : "dev/"}${name}.${format}`;
    let imageUrl: string | null = await get(imageName);

    if (imageUrl == null) {

        const image = await fetch(originalUrl).then(response => response.arrayBuffer()).catch(() => null);

        if (image == null) {

            return null;
        }

        const compressedImage = await compressImage(Buffer.from(image), 1, format);
        imageUrl = await save(imageName, compressedImage);
    }

    return imageUrl;
}

/**
* 画像を圧縮する
* 
* @param {Buffer} image 画像
* @param {number} maxSizeMB 最大サイズ（MB）
* @param {Format} format フォーマット
* @returns {Promise<Buffer>} 圧縮後の画像
*/
async function compressImage(image: Buffer, maxSizeMB: number, format: Format): Promise<Buffer> {
  
    let output = image;
    let quality = format === Format.Avif ? 50 : 80;

    while (output.length / 1024 / 1024 > maxSizeMB && quality > 5) {

        if (format === Format.Avif) {

            output = await sharp(image)
            .rotate()
            .avif({ quality })
            .toBuffer();
        } else {

            output = await sharp(image)
            .rotate()
            .jpeg({ quality })
            .toBuffer();
        }

        quality -= 5;
    }

    return output;
}

const get = async (name: string): Promise<string | null> => {

    const blobList = getCache<Array<ListBlobResultBlob>>(CacheType.Blob) ?? [];

    if (blobList.length == 0) {

        console.log("[GET BLOB] Cache is not exists. Fetching blob list...");

        try {

            let hasMore = true;
            let cursor;
            
            while (hasMore) {

                const result: ListBlobResult = await list({
                    cursor: cursor,
                });

                blobList.push(...result.blobs);
                hasMore = result.hasMore;
                cursor = result.cursor;
            }
        } catch (error) {

            console.error(`[GET BLOB] Error: ${name}`);
            console.error(error);
            return null;
        }

        saveCache(CacheType.Blob, blobList);
    } else {

        console.log("[GET BLOB] Cache is exits. Using cache...");
    }

    const target = blobList.find((blob) => blob.pathname == name)?.url ?? null;
    console.log(target != null ? `[GET BLOB] Success: ${name}` : `[GET BLOB] Not found: ${name}`);
    return target;
};

const save = async (name: string, image: Buffer): Promise<string | null> => {

    try {

        const result = await put(name, image, {
            access: "public",
            addRandomSuffix: false,
        });

        const cache = getCache<Array<ListBlobResultBlob>>(CacheType.Blob);

        if (cache != null) {

            cache.push({
                url: result.url,
                downloadUrl: result.downloadUrl,
                pathname: result.pathname,
                size: image.length,
                uploadedAt: new Date(),
            });

            saveCache(CacheType.Blob, cache);
        }

        console.log(`[SAVE BLOB] Success: ${name}`);
        return result.url;
    } catch (error) {

        console.error(`[SAVE BLOB] Error: ${name}`);
        console.error(error);
        return null;
    }
};