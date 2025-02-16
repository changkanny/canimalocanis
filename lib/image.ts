import { put, list, ListBlobResult, ListBlobResultBlob } from "@vercel/blob";
import sharp from "sharp";

const cache: { blobList: Array<ListBlobResultBlob> | null } = { blobList: null };

export enum Format {

    jpeg = "jpeg",
    avif = "avif",
}

/**
 *  Vercel Blob に保存している画像の URL を取得する
 * 
 *  @param {string} name 名前
 *  @param {string} image 画像
 *  @param {Format} format フォーマット
 *  @returns {Promise<string | null>} URL
 */
export async function getImageUrl(name: string, image: ArrayBuffer, format: Format): Promise<string | null> {

    const imageName = `${name}.${format}`;
    let imageUrl: string | null = await get(imageName);

    if (imageUrl == null) {

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
    let quality = format === Format.avif ? 50 : 80;

    while (output.length / 1024 / 1024 > maxSizeMB && quality > 5) {

        if (format === Format.avif) {

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

    const blobList = cache.blobList ?? [];

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

            console.error(`[GET BLOB] Error occurred while listing: ${name}`);
            console.error(error);
            return null;
        }

        cache.blobList = blobList;
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

        if (cache.blobList != null) {

            cache.blobList.push({
                url: result.url,
                downloadUrl: result.downloadUrl,
                pathname: result.pathname,
                size: image.length,
                uploadedAt: new Date(),
            });
        }

        console.log(`[SAVE BLOB] Success: ${name}`);
        return result.url;
    } catch (error) {

        console.error(`[SAVE BLOB] Error occurred while putting: ${name}`);
        console.error(error);
        return null;
    }
};