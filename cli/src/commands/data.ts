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

function formatHuman(data: unknown, mode: 'all' | 'intel' | 'markets' | 'feed'): string {
  switch (mode) {
    case 'intel':
      return formatIntel(data as { crypto: unknown[]; trends: unknown[]; iss: unknown });
    case 'markets':
      return formatMarkets(data as { polymarket: unknown[]; events: unknown[] });
    case 'feed':
      return formatFeed(data as { items: unknown[]; total: number });
    case 'all':
      return formatAll(data as AgentData);
    default:
      return String(data);
  }
}

function output(
  jsonData: unknown,
  humanData: unknown,
  json: boolean,
  pretty: boolean,
  mode: 'all' | 'intel' | 'markets' | 'feed',
): void {
  if (json) {
    const str = pretty ? JSON.stringify(jsonData, null, 2) : JSON.stringify(jsonData);
    console.log(str);
  } else {
    console.log(formatHuman(humanData, mode));
  }
}

export async function runDataCommand(opts: {
  json?: boolean;
  pretty?: boolean;
  intel?: boolean;
  markets?: boolean;
  feed?: boolean;
}) {
  const json = opts.json ?? !process.stdout.isTTY;
  const pretty = opts.pretty ?? false;

  try {
    if (opts.intel) {
      const [crypto, trends, iss] = await Promise.all([
        fetchCrypto(),
        fetchTrends(),
        fetchISS(),
      ]);
      const data = { crypto, trends, iss, fetched_at: new Date().toISOString() };
      output(data, data, json, pretty, 'intel');
      return;
    }

    if (opts.markets) {
      const [polymarket, events] = await Promise.all([
        fetchPolymarket(50),
        fetchGlintEvents('all'),
      ]);
      const data = { polymarket, events, fetched_at: new Date().toISOString() };
      output(data, data, json, pretty, 'markets');
      return;
    }

    if (opts.feed) {
      const feed = await fetchFeed(1, 50);
      const data = {
        items: feed?.items ?? [],
        total: feed?.total ?? 0,
        fetched_at: new Date().toISOString(),
      };
      output(data, data, json, pretty, 'feed');
      return;
    }

    const data = await fetchAll();
    const agentData = toAgentSchema(data);
    output(agentData, data, json, pretty, 'all');
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    const out = json ? JSON.stringify({ error: msg }) : `Error: ${msg}\n`;
    console.log(out);
    process.exitCode = 1;
  }
}

/** Normalize for agents: snake_case, drop empty, consistent shape. No vendor names in output. */
function toAgentSchema(data: AgentData): Record<string, unknown> {
  return {
    intel: {
      crypto: data.intel.crypto,
      stablecoins: data.intel.stablecoins,
      trends: data.intel.trends,
      iss: data.intel.iss,
      fred: data.intel.fred?.data ?? [],
      treasury: data.intel.treasury?.data ?? [],
      bls: data.intel.bls,
      oil: data.intel.oil,
      gdacs: data.intel.gdacs?.features ?? [],
      weather: data.intel.weather?.features ?? [],
      usgs: data.intel.usgs?.features ?? [],
      flights: data.intel.flights ?? [],
    },
    markets: {
      polymarket: data.markets.polymarket,
      events: data.markets.glint,
    },
    feed: data.feed,
    fetched_at: data.fetchedAt,
  };
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

function formatMarkets(data: { polymarket: unknown[]; events: unknown[] }): string {
  let out = '\n📈 Quantis Markets\n\n';
  out += `Polymarket: ${data.polymarket.length} events\n`;
  out += `Events: ${data.events.length} markets\n\n`;
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
  out += `Markets: Polymarket ${data.markets.polymarket.length}, events ${data.markets.glint.length}\n`;
  out += `Feed: ${data.feed.length} items\n`;
  out += `Disasters: GDACS ${(data.intel.gdacs?.features?.length ?? 0)}, Weather ${(data.intel.weather?.features?.length ?? 0)}, USGS ${(data.intel.usgs?.features?.length ?? 0)}\n`;
  out += `Flights: ${data.intel.flights?.length ?? 0}\n`;
  out += `\nRun with -j for full JSON. Fetched at ${data.fetchedAt}\n`;
  return out;
}
