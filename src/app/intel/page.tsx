'use client';

import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { getPreference, setPreference } from '@/lib/preferences';
import {
  fetchCryptoQuotes,
  fetchStablecoinMarkets,
  fetchAllFredSeries,
  fetchEnergyPrices,
  fetchBootstrapEarthquakes,
  fetchWeatherAlerts,
  fetchGDACSEvents,
  fetchTrends,
  getFredSeriesUnit,
} from '@/lib/api/intel';
import { MiniSparkline } from '@/components/MiniSparkline';

const TABS = ['Markets', 'Economy', 'Disasters', 'Trends'] as const;
type TabId = (typeof TABS)[number];

export default function IntelPage() {
  const [tab, setTab] = useState<TabId>(() => getPreference('intelTab') ?? 'Markets');

  useEffect(() => {
    setPreference('intelTab', tab);
  }, [tab]);

  const { data: crypto, isLoading: cryptoLoading } = useQuery({
    queryKey: ['intel', 'crypto'],
    queryFn: () => fetchCryptoQuotes(['bitcoin', 'ethereum', 'solana']),
    staleTime: 30_000,
    enabled: tab === 'Markets',
    placeholderData: keepPreviousData,
  });
  const { data: stable, isLoading: stableLoading } = useQuery({
    queryKey: ['intel', 'stablecoins'],
    queryFn: () => fetchStablecoinMarkets(),
    staleTime: 30_000,
    enabled: tab === 'Markets',
    placeholderData: keepPreviousData,
  });
  const { data: fredData, isLoading: fredLoading } = useQuery({
    queryKey: ['intel', 'fred-page'],
    queryFn: () => fetchAllFredSeries(120),
    staleTime: 300_000, // 5 min - economic data is slow-moving
    enabled: tab === 'Economy',
    placeholderData: keepPreviousData,
  });
  const { data: energy, isLoading: energyLoading } = useQuery({
    queryKey: ['intel', 'energy', 'page'],
    queryFn: () => fetchEnergyPrices(),
    staleTime: 60_000,
    enabled: tab === 'Markets',
    placeholderData: keepPreviousData,
  });
  const { data: earthquakes, isLoading: eqLoading } = useQuery({
    queryKey: ['intel', 'earthquakes'],
    queryFn: fetchBootstrapEarthquakes,
    staleTime: 60_000,
    enabled: tab === 'Disasters',
    placeholderData: keepPreviousData,
  });
  const { data: weather, isLoading: weatherLoading } = useQuery({
    queryKey: ['intel', 'weather', 'page'],
    queryFn: fetchWeatherAlerts,
    staleTime: 60_000,
    enabled: tab === 'Disasters',
    placeholderData: keepPreviousData,
  });
  const { data: gdacs, isLoading: gdacsLoading } = useQuery({
    queryKey: ['intel', 'gdacs'],
    queryFn: fetchGDACSEvents,
    staleTime: 60_000,
    enabled: tab === 'Disasters',
    placeholderData: keepPreviousData,
  });
  const trendsQuery = useQuery({
    queryKey: ['intel', 'trends'],
    queryFn: () => fetchTrends('US'),
    staleTime: 60_000,
    enabled: tab === 'Trends',
    placeholderData: keepPreviousData,
  });

  const cryptoList = crypto ?? [];
  const stableList = stable?.stablecoins ?? [];
  const fredList = fredData ?? [];
  const energyList = energy ?? [];
  const eqList = earthquakes ?? [];
  const weatherList = weather ?? [];
  const gdacsList = gdacs ?? [];
  const trendsList = trendsQuery.data ?? [];

  return (
    <div className="flex h-full flex-col">
      <div className="shrink-0 border-b border-white/[0.06] px-5 py-3.5">
        <h1 className="mb-3 text-base md:text-[15px] font-semibold text-zinc-100">
          Intelligence Hub
        </h1>
        <div className="flex flex-wrap gap-1.5">
          {TABS.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`shrink-0 rounded-lg px-3 py-1.5 text-[11px] font-medium transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 ${
                tab === t
                  ? 'bg-accent/15 text-accent border border-accent/30'
                  : 'bg-white/[0.04] text-zinc-400 border border-transparent hover:bg-white/[0.08] hover:text-zinc-200'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {tab === 'Markets' && (
          <div className="grid gap-4 md:grid-cols-2 animate-tab-fade">
            <section className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-4">
              <h2 className="mb-3 text-[12px] font-bold text-zinc-300 uppercase tracking-wider">
                Crypto
              </h2>
              <div className="space-y-2">
                {cryptoList.length === 0 ? (
                  <p className="text-[11px] text-zinc-500">No crypto data</p>
                ) : (
                  cryptoList.map((q) => (
                    <div
                      key={q.id ?? q.symbol}
                      className="flex items-center justify-between rounded-lg bg-white/[0.03] px-3 py-2"
                    >
                      <span className="text-[11px] font-bold text-zinc-400">
                        {(q.symbol ?? q.id ?? '').toUpperCase()}
                      </span>
                      <div className="flex items-center gap-3">
                        <span className="text-[12px] font-mono text-zinc-200">
                          $
                          {(q.price ?? q.priceUsd ?? 0).toLocaleString(undefined, {
                            maximumFractionDigits: 2,
                          })}
                        </span>
                        {(q.change24h ?? 0) !== 0 && (
                          <span
                            className={`text-[10px] font-mono font-bold ${
                              (q.change24h ?? 0) >= 0 ? 'text-accent' : 'text-red-400'
                            }`}
                          >
                            {(q.change24h ?? 0) >= 0 ? '+' : ''}
                            {(q.change24h ?? 0).toFixed(2)}%
                          </span>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>

            <section className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-4">
              <h2 className="mb-3 text-[12px] font-bold text-zinc-300 uppercase tracking-wider">
                Stablecoins
              </h2>
              <div className="space-y-2">
                {stableLoading ? (
                  <div className="space-y-2">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className="h-9 animate-pulse rounded-lg bg-white/[0.04]" />
                    ))}
                  </div>
                ) : stableList.length === 0 ? (
                  <p className="text-[11px] text-zinc-500">No stablecoin data</p>
                ) : (
                  stableList.slice(0, 8).map((s) => (
                    <div
                      key={s.id}
                      className="flex items-center justify-between rounded-lg bg-white/[0.03] px-3 py-2"
                    >
                      <span className="text-[11px] font-bold text-zinc-400">{s.symbol}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-[12px] font-mono text-zinc-200">
                          ${s.price.toFixed(4)}
                        </span>
                        <span
                          className={`text-[9px] font-bold uppercase ${
                            (s.pegStatus ?? '').toLowerCase().includes('peg') ||
                            s.pegStatus === 'normal'
                              ? 'text-accent'
                              : 'text-amber-400'
                          }`}
                        >
                          {s.pegStatus ?? '—'}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>

            <section className="md:col-span-2 rounded-xl border border-white/[0.08] bg-white/[0.02] p-4">
              <h2 className="mb-3 text-[12px] font-bold text-zinc-300 uppercase tracking-wider">
                Energy Prices
              </h2>
              <div className="flex flex-wrap gap-2">
                {energyLoading ? (
                  <div className="flex flex-wrap gap-2">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div key={i} className="h-8 w-24 animate-pulse rounded-lg bg-white/[0.04]" />
                    ))}
                  </div>
                ) : energyList.length === 0 ? (
                  <p className="text-[11px] text-zinc-500">No energy data</p>
                ) : (
                  energyList.map((e, i) => (
                    <div
                      key={e.commodity ?? i}
                      className="rounded-lg bg-white/[0.03] px-3 py-2 text-[11px]"
                    >
                      <span className="text-zinc-400">{e.commodity}</span>
                      <span className="ml-2 font-mono text-zinc-200">
                        ${(e.price ?? 0).toLocaleString()}
                        {e.unit && <span className="text-zinc-500">/{e.unit}</span>}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </section>
          </div>
        )}

        {tab === 'Economy' && (
          <div className="grid gap-4 md:grid-cols-2">
            {fredList.map((s) => {
              const unit = getFredSeriesUnit(s.seriesId);
              const val = s.data.length > 0 ? s.data[s.data.length - 1].value : null;
              const fmt = val != null ? (unit ? `${val.toFixed(2)}${unit}` : val.toFixed(2)) : '—';
              return (
                <section
                  key={s.seriesId}
                  className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-4"
                >
                  <h2 className="mb-3 text-[12px] font-bold text-zinc-300 uppercase tracking-wider">
                    {s.label}
                  </h2>
                  <div className="flex items-end justify-between gap-4">
                    <div>
                      <p className="text-[24px] font-mono font-bold text-zinc-100 tabular-nums">
                        {fmt}
                      </p>
                      <p className="mt-0.5 text-[10px] text-zinc-500">Latest</p>
                    </div>
                    <MiniSparkline
                      data={s.data}
                      width={160}
                      height={56}
                      positive={
                        s.data.length >= 2
                          ? s.data[s.data.length - 1].value >= s.data[0].value
                          : true
                      }
                    />
                  </div>
                </section>
              );
            })}
            {fredLoading && fredList.length === 0 && (
              <div className="col-span-2 grid gap-4 md:grid-cols-2">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-24 animate-pulse rounded-xl bg-white/[0.04]" />
                ))}
              </div>
            )}
            {!fredLoading && fredList.length === 0 && (
              <p className="text-[11px] text-zinc-500 col-span-2">
                No economic data
              </p>
            )}
          </div>
        )}

        {tab === 'Disasters' && (
          <div className="grid gap-4 md:grid-cols-2 animate-tab-fade">
            <section className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-4">
              <h2 className="mb-3 text-[12px] font-bold text-zinc-300 uppercase tracking-wider">
                Earthquakes
              </h2>
              {eqLoading && eqList.length === 0 ? (
                <div className="space-y-2">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="h-9 animate-pulse rounded-lg bg-white/[0.04]" />
                  ))}
                </div>
              ) : eqList.length > 0 ? (
                <div className="space-y-2">
                  {eqList.slice(0, 8).map((e, i) => {
                    const Wrapper = e.sourceUrl?.startsWith('http') ? 'a' : 'div';
                    const linkProps = e.sourceUrl?.startsWith('http')
                      ? { href: e.sourceUrl, target: '_blank' as const, rel: 'noopener noreferrer' }
                      : {};
                    return (
                    <Wrapper
                      key={e.id ?? i}
                      {...linkProps}
                      className="flex items-center justify-between rounded-lg bg-white/[0.03] px-3 py-2 hover:bg-white/[0.05] transition-colors"
                    >
                      <span className="text-[11px] text-zinc-200 truncate pr-2">
                        {e.place ?? 'Unknown'}
                      </span>
                      <span
                        className={`shrink-0 text-[11px] font-bold font-mono ${
                          (e.magnitude ?? 0) >= 6 ? 'text-red-400' : 'text-amber-400'
                        }`}
                      >
                        M{e.magnitude?.toFixed(1) ?? '?'}
                      </span>
                    </Wrapper>
                    );
                  })}
                </div>
              ) : (
                <p className="text-[11px] text-zinc-500">No earthquake data</p>
              )}
            </section>

            <section className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-4">
              <h2 className="mb-3 text-[12px] font-bold text-zinc-300 uppercase tracking-wider">
                Weather Alerts
              </h2>
              {weatherList.length > 0 ? (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {weatherList.slice(0, 8).map((a, i) => (
                    <div
                      key={a.id ?? i}
                      className="rounded-lg bg-white/[0.03] px-3 py-2"
                    >
                      <p className="text-[10px] font-bold text-zinc-400">
                        {(a.properties?.areaDesc ?? 'Alert')}
                      </p>
                      <p className="text-[11px] text-zinc-200 line-clamp-2">
                        {a.properties?.headline ?? a.properties?.event ?? ''}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-[11px] text-zinc-500">No weather alerts</p>
              )}
            </section>

            <section className="md:col-span-2 rounded-xl border border-white/[0.08] bg-white/[0.02] p-4">
              <h2 className="mb-3 text-[12px] font-bold text-zinc-300 uppercase tracking-wider">
                GDACS Disasters
              </h2>
              {gdacsLoading && gdacsList.length === 0 ? (
                <div className="flex flex-wrap gap-2">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div key={i} className="h-14 min-w-[140px] animate-pulse rounded-lg bg-white/[0.04]" />
                  ))}
                </div>
              ) : gdacsList.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {gdacsList.slice(0, 12).map((f, i) => {
                    const url =
                      f.properties?.eventtype && f.properties?.eventid
                        ? `https://www.gdacs.org/report.aspx?eventid=${f.properties.eventid}&episodeid=${f.properties.episodeid ?? ''}&eventtype=${f.properties.eventtype}`
                        : null;
                    const inner = (
                      <>
                        <p className="text-[11px] text-zinc-200 truncate">
                          {f.properties?.name ?? f.properties?.description ?? f.properties?.eventtype ?? 'Event'}
                        </p>
                        <p className="text-[9px] text-zinc-500">
                          {[f.properties?.alertlevel, f.properties?.country].filter(Boolean).join(' · ')}
                        </p>
                      </>
                    );
                    return url ? (
                      <a
                        key={`gdacs-${i}`}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded-lg bg-white/[0.03] px-3 py-2 min-w-[140px] hover:bg-white/[0.05] transition-colors block"
                      >
                        {inner}
                      </a>
                    ) : (
                      <div
                        key={`gdacs-${i}`}
                        className="rounded-lg bg-white/[0.03] px-3 py-2 min-w-[140px] block"
                      >
                        {inner}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-[11px] text-zinc-500">No GDACS events</p>
              )}
            </section>
          </div>
        )}

        {tab === 'Trends' && (
          <div className="grid gap-4 md:grid-cols-2 animate-tab-fade">
            <section className="md:col-span-2 rounded-xl border border-white/[0.08] bg-white/[0.02] p-4">
              <h2 className="mb-3 text-[12px] font-bold text-zinc-300 uppercase tracking-wider">
                Google Trends — US Daily
              </h2>
              {trendsQuery.isLoading && trendsList.length === 0 ? (
                <div className="space-y-2">
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                    <div key={i} className="h-16 animate-pulse rounded-lg bg-white/[0.04]" />
                  ))}
                </div>
              ) : trendsList.length > 0 ? (
                <div className="space-y-3">
                  {trendsList.map((t, i) => (
                    <div
                      key={`${t.title}-${i}`}
                      className="rounded-lg border border-white/[0.06] bg-white/[0.02] overflow-hidden"
                    >
                      <div className="flex items-center gap-3 px-3 py-2.5">
                        <span className="text-[12px] font-bold text-zinc-100">{t.title}</span>
                        {t.traffic && (
                          <span className="text-[10px] font-mono text-zinc-500 bg-white/[0.04] px-1.5 py-0.5 rounded">
                            {t.traffic}
                          </span>
                        )}
                      </div>
                      {t.articles.length > 0 && (
                        <div className="border-t border-white/[0.04] px-3 py-2 space-y-1.5">
                          {t.articles.slice(0, 3).map((a, j) => (
                            <a
                              key={j}
                              href={a.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex flex-col gap-0.5 rounded px-2 py-1.5 hover:bg-white/[0.04] transition-colors"
                            >
                              <span className="text-[11px] text-zinc-200 line-clamp-2">{a.title}</span>
                              <span className="text-[9px] text-zinc-500">{a.source}</span>
                            </a>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-[11px] text-zinc-500">No trends data</p>
              )}
            </section>
          </div>
        )}
      </div>
    </div>
  );
}
