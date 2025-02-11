import { getBody } from '@/lib/notion';
import { ImageResponse } from 'next/og'
 
export const size = {
  width: 1200,
  height: 630,
}
 
export default async function Image({ params }: { params: { id: string } }) {
  
    // 記事
    const post = await getBody(params.id);
    // サムネイルの URL
    const thumbnail = post?.thumbnail || `${process.env.HOST}/default-og.png`;

    return new ImageResponse(
        <img src={thumbnail} style={{
            objectFit: 'cover',
            width: `${size.width}px`,
            height: `${size.height}px`
        }} />,
        {
            width: size.width,
            height: size.height,
        }
    );
}