import { getClap, incrementClap } from '@/lib/notion/common';
import { NextRequest } from 'next/server';

export async function GET(req: NextRequest) {

    const pageId = req.nextUrl.searchParams.get("id");

    if (pageId == null) {
        
        return new Response("Page id is required.", { status: 400 });
    }

    return new Response(JSON.stringify({ count: await getClap({ pageId }) }), { status: 200 });
}

export async function POST(req: NextRequest) {

    const pageId = req.nextUrl.searchParams.get("id");

    if (pageId == null) {
        
        return new Response("Page id is required.", { status: 400 });
    }

    return new Response(JSON.stringify({ count: await incrementClap({ pageId }) }), { status: 200 });
}