import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    const { url } = await req.json();
    if (!url) return NextResponse.json({ error: 'URL required' }, { status: 400 });

    let targetUrl = url.trim();
    if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
      targetUrl = `https://${targetUrl}`;
    }

    const response = await fetch(targetUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
      next: { revalidate: 3600 }
    });

    const html = await response.text();

    const getMeta = (prop) => {
      const match =
        html.match(new RegExp(`<meta[^>]*property=["']${prop}["'][^>]*content=["']([^"']+)["']`, 'i')) ||
        html.match(new RegExp(`<meta[^>]*name=["']${prop}["'][^>]*content=["']([^"']+)["']`, 'i'));
      return match ? match[1] : null;
    };

    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    const title = getMeta('og:title') || (titleMatch ? titleMatch[1] : targetUrl);
    const description = getMeta('og:description') || getMeta('description') || '';
    const image = getMeta('og:image') || '';

    return NextResponse.json({ title, description, image, url: targetUrl });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to fetch link preview' }, { status: 500 });
  }
}