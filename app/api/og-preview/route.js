import { NextResponse } from 'next/server';

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  let url = searchParams.get('url');

  if (!url) {
    return NextResponse.json({ error: 'URL is required' }, { status: 400 });
  }

  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    url = 'https://' + url;
  }

  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
      },
    });

    const html = await res.text();

    const getMetaTag = (attr, value) => {
      const match =
        html.match(new RegExp(`<meta[^>]*${attr}=["']${value}["'][^>]*content=["']([^"']*)["']`, 'i')) ||
        html.match(new RegExp(`<meta[^>]*content=["']([^"']*)["'][^>]*${attr}=["']${value}["']`, 'i'));
      return match ? match[1] : null;
    };

    const titleMatch = html.match(/<title[^>]*>([^<]*)<\/title>/i);

    const title =
      getMetaTag('property', 'og:title') ||
      getMetaTag('name', 'twitter:title') ||
      (titleMatch ? titleMatch[1] : url);

    const description =
      getMetaTag('property', 'og:description') ||
      getMetaTag('name', 'description') ||
      getMetaTag('name', 'twitter:description') ||
      '';

    const image =
      getMetaTag('property', 'og:image') ||
      getMetaTag('name', 'twitter:image') ||
      '';

    return NextResponse.json({
      title: title.trim(),
      description: description.trim(),
      image: image,
      url: url,
    });
  } catch (error) {
    return NextResponse.json({
      title: url,
      description: '',
      image: '',
      url: url,
    });
  }
}