import { BlobNotFoundError, head, put } from "@vercel/blob";
import sharp from "sharp";

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
    let imageUrl: string | null = null;

    try {

        imageUrl = (await head(imageName)).url;

        console.log(`Found on Vercel Blob: ${imageName}`);
    } catch (error) {

        console.log(
            error instanceof BlobNotFoundError
                ? `Not found on Vercel Blob: ${imageName}`
                : `Error occurred while heading: ${error}`
        )
    }

    if (imageUrl == null) {

        try {

            const compressedImage = await compressImage(Buffer.from(image), 1, format);

            imageUrl = (await put(imageName, compressedImage, {
                access: "public",
                addRandomSuffix: false,
            })).url;

            console.log(`Uploaded to Vercel Blob: ${imageName}`);
        } catch (error) {

            console.log(`Error occurred while putting: ${error}`);
        }
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