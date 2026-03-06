import { NextRequest, NextResponse } from 'next/server';
import type { TrendItem } from '@/lib/api/intel-types';

function extractTag(html: string, tag: string, ns?: string): string {
  const prefix = ns ? `${ns}:` : '';
  const re = new RegExp(`<${prefix}${tag}[^>]*>([\\s\\S]*?)</${prefix}${tag}>`, 'i');
  const m = html.match(re);
  return m ? m[1].trim().replace(/<[^>]+>/g, '') : '';
}

function extractAll(html: string, tag: string, ns?: string): string[] {
  const prefix = ns ? `${ns}:` : '';
  const re = new RegExp(`<${prefix}${tag}[^>]*>([\\s\\S]*?)</${prefix}${tag}>`, 'gi');
  const out: string[] = [];
  let m;
  while ((m = re.exec(html)) !== null) {
    out.push(m[1].trim().replace(/<[^>]+>/g, ''));
  }
  return out;
}

export async function GET(request: NextRequest) {
  const geo = request.nextUrl.searchParams.get('geo') ?? 'US';

  try {
    const url = `https://trends.google.com/trending/rss?geo=${encodeURIComponent(geo)}`;
    const res = await fetch(url, {
      headers: {
        Accept: 'application/rss+xml, application/xml, text/xml',
        'User-Agent': 'Quantis-Intel/1.0 (https://github.com)',
      },
      next: { revalidate: 60 },
    });
    if (!res.ok) {
      return NextResponse.json({ error: `Trends RSS ${res.status}` }, { status: res.status });
    }
    const xml = await res.text();

    const items: TrendItem[] = [];
    const itemBlocks = xml.split(/<item>/i).slice(1);

    for (const block of itemBlocks) {
      const itemEnd = block.indexOf('</item>');
      const itemXml = itemEnd >= 0 ? block.slice(0, itemEnd) : block;

      const title = extractTag(itemXml, 'title');
      if (!title) continue;

      const traffic = extractTag(itemXml, 'approx_traffic', 'ht') || '';
      const publishedAt = extractTag(itemXml, 'pubDate') || '';
      const picture = extractTag(itemXml, 'picture', 'ht') || undefined;
      const pictureSource = extractTag(itemXml, 'picture_source', 'ht') || undefined;

      const newsTitles = extractAll(itemXml, 'news_item_title', 'ht');
      const newsUrls = extractAll(itemXml, 'news_item_url', 'ht');
      const newsSources = extractAll(itemXml, 'news_item_source', 'ht');

      const articles = newsTitles.map((t, i) => ({
        title: t,
        url: newsUrls[i] ?? '',
        source: newsSources[i] ?? '',
      })).filter((a) => a.url);

      items.push({
        title,
        traffic,
        publishedAt,
        picture: picture || undefined,
        pictureSource: pictureSource || undefined,
        articles: articles.slice(0, 5),
      });
    }

    return NextResponse.json(items);
  } catch (err) {
    console.error('[trends]', err);
    return NextResponse.json({ error: String(err) }, { status: 502 });
  }
}
