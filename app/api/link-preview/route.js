import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { url } = await request.json();
    if (!url) return NextResponse.json({ error: 'URL required' }, { status: 400 });

    const targetUrl = url.startsWith('http') ? url : `https://${url}`;
    const domain = new URL(targetUrl).hostname.replace('www.', '');

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000); // 4 sec timeout

      const res = await fetch(targetUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      const html = await res.text();

      const getMeta = (property) => {
        const match =
          html.match(new RegExp(`<meta[^>]*property=["']${property}["'][^>]*content=["']([^"']+)["']`, 'i')) ||
          html.match(new RegExp(`<meta[^>]*content=["']([^"']+)["'][^>]*property=["']${property}["']`, 'i')) ||
          html.match(new RegExp(`<meta[^>]*name=["']${property}["'][^>]*content=["']([^"']+)["']`, 'i'));
        return match ? match[1] : null;
      };

      const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);

      const title = getMeta('og:title') || (titleMatch ? titleMatch[1] : domain);
      const description = getMeta('og:description') || getMeta('description') || `Visit ${domain}`;
      const image = getMeta('og:image') || getMeta('twitter:image') || '';

      return NextResponse.json({
        url: targetUrl,
        title: title.trim(),
        description: description.trim(),
        image: image,
      });
    } catch (fetchErr) {
      // Fallback if website blocks fetch
      return NextResponse.json({
        url: targetUrl,
        title: domain.toUpperCase(),
        description: `Explore ${domain}`,
        image: '',
      });
    }
  } catch (err) {
    return NextResponse.json({ error: 'Failed to fetch preview' }, { status: 500 });
  }
}