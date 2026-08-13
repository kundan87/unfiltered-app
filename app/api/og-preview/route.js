import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    let targetUrl = searchParams.get('url');

    if (!targetUrl) {
      return NextResponse.json({ error: 'URL parameter is missing' }, { status: 400 });
    }

    if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
      targetUrl = 'https://' + targetUrl;
    }

    const res = await fetch(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
      },
    });

    const html = await res.text();

    const getMeta = (prop) => {
      const match =
        html.match(new RegExp(`<meta[^>]*property=["']${prop}["'][^>]*content=["']([^"']*)["']`, 'i')) ||
        html.match(new RegExp(`<meta[^>]*content=["']([^"']*)["'][^>]*property=["']${prop}["']`, 'i')) ||
        html.match(new RegExp(`<meta[^>]*name=["']${prop}["'][^>]*content=["']([^"']*)["']`, 'i'));
      return match ? match[1] : null;
    };

    const titleMatch = html.match(/<title[^>]*>([^<]*)<\/title>/i);

    const title = getMeta('og:title') || getMeta('twitter:title') || (titleMatch ? titleMatch[1] : targetUrl);
    const description = getMeta('og:description') || getMeta('description') || '';
    const image = getMeta('og:image') || getMeta('twitter:image') || '';

    return NextResponse.json({
      title: title ? title.trim() : targetUrl,
      description: description ? description.trim() : '',
      image: image || '',
      url: targetUrl,
    });
  } catch (error) {
    return NextResponse.json({
      title: '',
      description: '',
      image: '',
      url: '',
    });
  }
}