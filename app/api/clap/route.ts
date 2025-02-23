import { getPostById, incrementClapCount } from '@/lib/notion/common';
import { NextRequest } from 'next/server';

export async function GET(req: NextRequest) {

    const pageId = req.nextUrl.searchParams.get("id");

    if (pageId == null) {
        
        return new Response("Page id is required.", { status: 400 });
    }

    const post = await getPostById({ pageId });

    if (post == null) {

        return new Response("Post not found.", { status: 400 });
    }

    return new Response(JSON.stringify({ count: post.clapCount }), { status: 200 });
}

export async function POST(req: NextRequest) {

    const pageId = req.nextUrl.searchParams.get("id");

    if (pageId == null) {
        
        return new Response("Page id is required.", { status: 400 });
    }

    const updatedClapCount = await incrementClapCount({ pageId });

    if (updatedClapCount == null) {

        return new Response("Post not found.", { status: 400 });
    }

    return new Response(JSON.stringify({ count: updatedClapCount }), { status: 200 });
}