import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    const { url } = await req.json();
    if (!url || !url.startsWith('http')) {
      return NextResponse.json({ error: 'Invalid URL' }, { status: 400 });
    }

    const res = await fetch(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36',
      },
    });

    const html = await res.text();

    const getMetaTag = (property) => {
      const match =
        html.match(new RegExp(`<meta[^>]*property=["']${property}["'][^>]*content=["']([^"']+)["']`, 'i')) ||
        html.match(new RegExp(`<meta[^>]*content=["']([^"']+)["'][^>]*property=["']${property}["']`, 'i')) ||
        html.match(new RegExp(`<meta[^>]*name=["']${property}["'][^>]*content=["']([^"']+)["']`, 'i'));
      return match ? match[1] : null;
    };

    const titleMatch = html.match(/<title[^>]*>(.*?)<\/title>/i);

    const title = getMetaTag('og:title') || getMetaTag('twitter:title') || (titleMatch ? titleMatch[1] : url);
    const description = getMetaTag('og:description') || getMetaTag('twitter:description') || getMetaTag('description') || '';
    const image = getMetaTag('og:image') || getMetaTag('twitter:image') || '';

    return NextResponse.json({
      url,
      title: title ? title.trim() : url,
      description: description ? description.trim() : '',
      image: image ? image.trim() : '',
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch preview' }, { status: 500 });
  }
}