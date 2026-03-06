# Intelligence Integration

All new data sources integrated into Operation Quantis. No API keys required for the listed endpoints.

**Alternative APIs (no WorldMonitor dependency):**
- **Energy**: OilPrice API demo (`/api/intel/oilprice`) — Brent, WTI, natural gas, gasoline, gold. 20 req/hr.
- **Economic**: BLS (`/api/intel/bls`) for Unemployment (LNS14000000), CPI (CUSR0000SA0). Treasury Fiscal Data (`/api/intel/treasury`) for 10Y (Treasury Notes), Fed proxy (Treasury Bills), 10Y-2Y spread. No keys.
- **Crypto & Stablecoins**: CoinGecko (`/api/intel/coingecko`) as primary.
- **Earthquakes**: USGS (`/api/intel/usgs`, 4.5+ mag, week) as primary.
- **Iran Events**: ReliefWeb (`/api/intel/reliefweb`, country=IRN) as primary.

---

## API Sources

### WorldMonitor (`api.worldmonitor.app`)

| Endpoint | Purpose | Used In |
|----------|---------|---------|
| `/api/market/v1/list-crypto-quotes?ids=` | Crypto prices (BTC, ETH, SOL, etc.) | Crypto widget, Intel page |
| `/api/market/v1/list-stablecoin-markets?coins=` | Stablecoin peg status & prices | Crypto widget, Intel page |
| `/api/economic/v1/get-fred-series?series_id=&limit=120` | FRED economic series | Economic widget, Intel page |
| `/api/economic/v1/get-energy-prices?commodities=` | Energy commodity prices | Energy widget, Intel page |
| `/api/trade/v1/get-tariff-trends?reporting_country=840&partner_country=156&years=10` | US–China tariff trends | Trade widget, Intel page |
| `/api/trade/v1/get-trade-flows?reporting_country=840&partner_country=156&years=10` | US–China trade flows | Trade widget, Intel page |
| `/api/trade/v1/get-trade-barriers?countries=&limit=50` | Trade barriers | Trade widget |
| `/api/trade/v1/get-trade-restrictions?countries=&limit=50` | Trade restrictions | Trade widget |
| `/api/intelligence/v1/get-pizzint-status?include_gdelt=true` | DEFCON / Pizzint status | Conflict widget, Intel page |
| `/api/conflict/v1/list-iran-events?_v=8` | Iran-specific events | Conflict widget, Intel page |
| `/api/bootstrap` | Earthquake data (and other bootstrap signals) | Disasters widget, Intel page |

**FRED series integrated:** `UNRATE` (Unemployment), `T10Y2Y` (10Y-2Y spread), `VIXCLS` (VIX), `DGS10` (10Y Treasury), `FEDFUNDS` (Fed Funds), `CPIAUCSL` (CPI).

### External APIs

| API | URL | Purpose |
|-----|-----|---------|
| **Weather.gov** | `https://api.weather.gov/alerts/active` | Active weather alerts (GeoJSON) |
| **GDACS** | `https://www.gdacs.org/gdacsapi/api/events/geteventlist/MAP` | Disaster events (GeoJSON FeatureCollection) |
| **USA Spending** | `https://api.usaspending.gov/api/v2/search/spending_by_award/` | Federal spending by award (POST; fetch helper ready) |

---

## New Files

| File | Description |
|------|-------------|
| `src/lib/api/intel.ts` | All intel fetch functions |
| `src/lib/api/intel-types.ts` | TypeScript interfaces for intel responses |
| `src/components/MiniSparkline.tsx` | Compact sparkline for FRED/tariff trends |
| `src/components/widgets/CryptoStablecoinWidget.tsx` | Crypto + stablecoin prices |
| `src/components/widgets/EconomicWidget.tsx` | FRED economic indicators with sparklines |
| `src/components/widgets/TradeWidget.tsx` | Tariffs, flows, barriers, restrictions (tabs) |
| `src/components/widgets/ConflictWidget.tsx` | Pizzint/DEFCON + Iran events |
| `src/components/widgets/DisastersWeatherWidget.tsx` | Earthquakes, GDACS, weather alerts |
| `src/components/widgets/EnergyWidget.tsx` | Energy commodity prices |
| `src/app/intel/page.tsx` | Full Intel Hub page with 5 tabs |

---

## Dashboard Widgets

New widget types (group: **Intel**):

- `intel-crypto` — Crypto & Stablecoins
- `intel-economic` — Economic Indicators (FRED)
- `intel-trade` — Trade Intel
- `intel-conflict` — Conflict Intel (Pizzint, Iran)
- `intel-disasters` — Disasters & Weather
- `intel-energy` — Energy Prices

Add via dashboard "Add Widget" → Intel group.

---

## Navigation

- **Intel** nav item added to TopBar → `/intel`
- Full Intel Hub page with tabs: Markets, Economy, Trade, Conflict, Disasters

---

## Theme

All new UI matches existing theme:

- Background: `#06060a`, Surface: `#0a0a10`
- Accent: `#00ffa3` (mint)
- Borders: `rgba(255,255,255,0.06)` / `0.08`
- Typography: JetBrains Mono, 10–12px for content

---

## Potential APIs to Integrate

APIs that are free, have free tiers, or offer API keys on signup:

### Free / No API Key

| API | URL | Data | Notes |
|-----|-----|------|------|
| **Open Notify** | `http://api.open-notify.org/` | ISS position, astros, pass predictions | No key. No CORS/HTTPS – use Next.js API route as proxy. Great for Globe layer. |
| **Frankfurter** | `https://api.frankfurter.dev/latest` | FX rates (ECB), historical, time series | No key, no rate limit. EUR/USD, 30+ currencies. |
| **Binance Public** | `https://api.binance.com/api/v3/ticker/price` | Crypto prices, 24h stats, klines, depth | Public endpoints, no key. Fallback/alternative to CoinGecko. |
| **ExchangeRate-API (Open)** | `https://open.er-api.com/v6/latest/USD` | Daily FX rates, 165+ currencies | No key, attribution required, ~1 req/day recommended. |

### Free Tier (API Key on Signup)

| API | URL | Data | Free Tier |
|-----|-----|------|-----------|
| **Manifold Markets** | `https://api.manifold.markets` | Prediction markets, trades | 500 req/min, key via account. Complements Glint/Polymarket. |
| **Marketaux** | `marketaux.com` | Financial news, sentiment | ~100 req/day free. |
| **The News API** | `newsapi.org` | News 40K+ sources | Free dev tier. |
| **Oil Price API** | `oilpriceapi.com` | Oil, gas, commodities | 7-day trial 10K req; demo 20 req/hr. |
| **AISStream** | `aisstream.io` | Maritime vessel positions | WebSocket, key via GitHub login. Globe ships layer. |

### Other Ideas

- **SpaceX API** (unofficial): Launches, rockets, starlink – no official key.
- **COVID API** (disease.sh): Global COVID stats – free.
- **REST Countries**: Country metadata, flags – no key.
