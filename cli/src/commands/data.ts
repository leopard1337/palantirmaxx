import {
  fetchAll,
  fetchCrypto,
  fetchTrends,
  fetchISS,
  fetchPolymarket,
  fetchGlintEvents,
  fetchFeed,
  type AgentData,
} from '../data/fetcher.js';

export async function runDataCommand(opts: {
  json?: boolean;
  intel?: boolean;
  markets?: boolean;
  feed?: boolean;
}) {
  const json = opts.json ?? !process.stdout.isTTY;

  if (opts.intel) {
    const [crypto, trends, iss] = await Promise.all([
      fetchCrypto(),
      fetchTrends(),
      fetchISS(),
    ]);
    const data = { crypto, trends, iss, fetchedAt: new Date().toISOString() };
    console.log(json ? JSON.stringify(data, null, 2) : formatIntel(data));
    return;
  }

  if (opts.markets) {
    const [polymarket, glint] = await Promise.all([
      fetchPolymarket(50),
      fetchGlintEvents('all'),
    ]);
    const data = { polymarket, glint, fetchedAt: new Date().toISOString() };
    console.log(json ? JSON.stringify(data, null, 2) : formatMarkets(data));
    return;
  }

  if (opts.feed) {
    const feed = await fetchFeed(1, 50);
    const data = { items: feed?.items ?? [], total: feed?.total ?? 0, fetchedAt: new Date().toISOString() };
    console.log(json ? JSON.stringify(data, null, 2) : formatFeed(data));
    return;
  }

  const data = await fetchAll();
  console.log(json ? JSON.stringify(data, null, 2) : formatAll(data));
}

function formatIntel(data: { crypto: unknown[]; trends: unknown[]; iss: unknown }): string {
  let out = '\n📊 Quantis Intel\n\n';
  if (Array.isArray(data.crypto) && data.crypto.length > 0) {
    out += 'Crypto: ' + (data.crypto as { symbol?: string; price?: number }[]).map((c) => `${c.symbol}: $${(c.price ?? 0).toLocaleString()}`).join(', ') + '\n\n';
  }
  if (Array.isArray(data.trends) && data.trends.length > 0) {
    out += 'Trends (top 5):\n';
    for (const t of (data.trends as { title?: string }[]).slice(0, 5)) {
      out += `  • ${t.title ?? ''}\n`;
    }
    out += '\n';
  }
  if (data.iss && typeof data.iss === 'object' && 'lat' in data.iss) {
    const iss = data.iss as { lat: number; lng: number; people?: number };
    out += `ISS: ${iss.lat.toFixed(2)}°, ${iss.lng.toFixed(2)}° | ${iss.people ?? '?'} in space\n\n`;
  }
  return out;
}

function formatMarkets(data: { polymarket: unknown[]; glint: unknown[] }): string {
  let out = '\n📈 Quantis Markets\n\n';
  out += `Polymarket: ${data.polymarket.length} events\n`;
  out += `Glint: ${data.glint.length} events\n\n`;
  return out;
}

function formatFeed(data: { items: unknown[]; total: number }): string {
  let out = `\n📰 Quantis Feed (${data.items.length} items, ${data.total} total)\n\n`;
  for (const f of (data.items as { tweet?: { body?: string }; news?: { body?: string }; telegram?: { text?: string } }[]).slice(0, 5)) {
    const body = (f.tweet?.body ?? f.news?.body ?? f.telegram?.text ?? '').slice(0, 80);
    out += `  • ${body}${body.length >= 80 ? '…' : ''}\n`;
  }
  return out + '\n';
}

function formatAll(data: AgentData): string {
  let out = '\n📊 Quantis Data (full dump for agents)\n\n';
  out += `Intel: crypto ${data.intel.crypto.length}, stablecoins ${data.intel.stablecoins.length}, trends ${data.intel.trends.length}`;
  if (data.intel.iss) out += `, ISS @ ${data.intel.iss.lat.toFixed(1)}°`;
  out += '\n';
  out += `Markets: Polymarket ${data.markets.polymarket.length}, Glint ${data.markets.glint.length}\n`;
  out += `Feed: ${data.feed.length} items\n`;
  out += `Disasters: GDACS ${(data.intel.gdacs?.features?.length ?? 0)}, Weather ${(data.intel.weather?.features?.length ?? 0)}, USGS ${(data.intel.usgs?.features?.length ?? 0)}\n`;
  out += `Flights: ${data.intel.flights?.length ?? 0}\n`;
  out += `\nRun with -j for full JSON. Fetched at ${data.fetchedAt}\n`;
  return out;
}
