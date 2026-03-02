# Intel API Reference

Alternative and fallback APIs for each data type in Operation Palantir. Sources are ordered by reliability and ease of use.

---

## Crypto Prices

| Source | URL | Key Required | Notes |
|--------|-----|--------------|-------|
| **CoinGecko** ✓ | `https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,solana&vs_currencies=usd&include_24hr_change=true` | No | **In use.** 10–50 calls/min free. Proxy at `/api/intel/coingecko` |
| WorldMonitor | `https://api.worldmonitor.app/api/market/v1/list-crypto-quotes?ids=` | Maybe | May require API key |
| CoinCap | `https://api.coincap.io/v2/assets?ids=bitcoin,ethereum,solana` | No | 200 req/min free |
| Binance | `https://api.binance.com/api/v3/ticker/price` | No | Spot prices only |
| CryptoCompare | `https://min-api.cryptocompare.com/data/pricemulti?fsyms=BTC,ETH,SOL&tsyms=USD` | No | Free tier available |

---

## Stablecoins

| Source | URL | Key Required | Notes |
|--------|-----|--------------|-------|
| **CoinGecko** ✓ | `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=tether,usd-coin,dai&order=market_cap_desc` | No | **In use.** Proxy at `/api/intel/coingecko` |
| WorldMonitor | `https://api.worldmonitor.app/api/market/v1/list-stablecoin-markets?coins=` | Maybe | Peg status, volume, deviation |
| DeFiLlama | `https://api.llama.fi/overview/stablecoins` | No | TVL + peg data |
| CoinGecko (coins) | `https://api.coingecko.com/api/v3/coins/{id}` | No | Per-coin detail |

---

## Economic Indicators (FRED-style)

| Source | URL | Key Required | Notes |
|--------|-----|--------------|-------|
| WorldMonitor | `https://api.worldmonitor.app/api/economic/v1/get-fred-series?series_id=UNRATE&limit=120` | Maybe | Proxies FRED |
| **FRED** | `https://api.stlouisfed.org/fred/series/observations?series_id=UNRATE&api_key=...` | Yes (free) | https://fred.stlouisfed.org/docs/api/ |
| **BLS** | `https://api.bls.gov/publicAPI/v2/timeseries/data/` | Optional | Unemployment, CPI. v1 no key, v2 needs registration |
| Alpha Vantage | `https://www.alphavantage.co/query?function=REAL_GDP&apikey=...` | Yes (free) | 25 calls/day free tier |
| Yahoo Finance (unofficial) | `https://query1.finance.yahoo.com/v7/finance/quote?symbols=^VIX,^TNX` | No | ^VIX, ^TNX (10Y), ^IRX. No official API |
| Trading Economics | `https://api.tradingeconomics.com/` | Yes | Paid, some free endpoints |

**FRED series IDs:** `UNRATE` (unemployment), `VIXCLS`, `DGS10` (10Y), `FEDFUNDS`, `CPIAUCSL` (CPI), `T10Y2Y` (spread)

---

## Energy / Commodity Prices

| Source | URL | Key Required | Notes |
|--------|-----|--------------|-------|
| WorldMonitor | `https://api.worldmonitor.app/api/economic/v1/get-energy-prices?commodities=` | Maybe | |
| OilPrice API | `https://api.oilpriceapi.com/v1/demo/prices` | No | 20 req/hr. WTI, Brent, natural gas |
| EIA | `https://api.eia.gov/v2/` | Yes (free) | US Energy Information Administration |
| Metals API | `https://metals-api.com/` | Yes (free tier) | Gold, silver, etc. |
| Investing.com (scraping) | — | — | Not recommended (ToS) |
| Yahoo Finance | `^CL` (WTI), `^BZ` (Brent), `NG=F` (nat gas) | No | Via unofficial quote API |

---

## Trade (Tariffs, Flows, Barriers)

| Source | URL | Key Required | Notes |
|--------|-----|--------------|-------|
| WorldMonitor | `.../trade/v1/get-tariff-trends`, `get-trade-flows`, `get-trade-barriers`, `get-trade-restrictions` | Maybe | US–China focus |
| **UN Comtrade** | `https://comtradeplus.un.org/` / Developer Portal | Yes (free) | Imports/exports, HS codes. comtradedeveloper.un.org |
| **WTO** | `https://apiportal.wto.org/` | Varies | Tariffs, trade policy. api.wto.org |
| US ITC DataWeb | `https://dataweb.usitc.gov/` | No | US trade data, bulk download |
| Census Bureau | `https://api.census.gov/data/` | No | US trade stats |
| Trade Map (ITC) | `https://www.trademap.org/` | Registration | Country–product trade |

---

## Conflict / Intelligence (Pizzint, Iran)

| Source | URL | Key Required | Notes |
|--------|-----|--------------|-------|
| WorldMonitor | `.../intelligence/v1/get-pizzint-status`, `.../conflict/v1/list-iran-events` | Maybe | Pizzint/DEFCON, Iran events |
| GDELT | `https://blog.gdeltproject.org/gdelt-doc-2-0-api-debuts/` | Yes | News/events, tension signals |
| ACLED | `https://acleddata.com/` | Yes (free) | Conflict events |
| UCDP | `https://ucdp.uu.se/` | No | Uppsala Conflict Data |
| Reuters / News APIs | Various | Yes | Event/conflict coverage |

---

## Earthquakes

| Source | URL | Key Required | Notes |
|--------|-----|--------------|-------|
| **USGS** ✓ | `https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/4.5_week.geojson` | No | **In use.** Proxy at `/api/intel/usgs` |
| USGS (day) | `.../4.5_day.geojson` | No | Last 24h |
| WorldMonitor bootstrap | `https://api.worldmonitor.app/api/bootstrap` | Maybe | Nested earthquakes |
| EMSC | `https://www.seismicportal.eu/fdsnws/event/1/query` | No | European-Mediterranean |
| IRIS | `https://service.iris.edu/` | No | Seismic data services |

---

## Weather Alerts

| Source | URL | Key Required | Notes |
|--------|-----|--------------|-------|
| **Weather.gov** ✓ | `https://api.weather.gov/alerts/active` | No | **In use.** NWS, US only, GeoJSON |
| Open-Meteo | `https://api.open-meteo.com/v1/` | No | Global weather, no alerts |
| OpenWeatherMap | `https://openweathermap.org/api` | Yes (free) | Alerts on paid plans |
| WeatherAPI.com | `https://www.weatherapi.com/` | Yes (free) | Alerts available |

---

## Disasters (GDACS)

| Source | URL | Key Required | Notes |
|--------|-----|--------------|-------|
| **GDACS** ✓ | `https://www.gdacs.org/gdacsapi/api/events/geteventlist/MAP` | No | **In use.** GeoJSON, floods/eq/cyclones |
| ReliefWeb | `https://api.reliefweb.int/v1/disasters` | No | UN humanitarian |
| NASA FIRM | `https://firms.modaps.eosdis.nasa.gov/` | Yes (free) | Fire/active fire |
| EONET (NASA) | `https://eonet.sci.gsfc.nasa.gov/api/v3/events` | No | Natural events |
| NOAA Storm Events | `https://www.ncdc.noaa.gov/stormevents/` | No | US storms |

---

## USA Spending

| Source | URL | Key Required | Notes |
|--------|-----|--------------|-------|
| **USAspending.gov** ✓ | `https://api.usaspending.gov/api/v2/search/spending_by_award/` | No | **Integrated.** POST with filters |
| USASpending docs | `https://api.usaspending.gov/` | No | Multiple endpoints |
| Grants.gov | `https://www.grants.gov/developers/` | No | Grant opportunities |

---

## Telegram Feed (existing)

| Source | URL | Key Required | Notes |
|--------|-----|--------------|-------|
| WorldMonitor | `https://api.worldmonitor.app/api/telegram-feed?limit=50` | No | Merged with Glint feed |

---

## Quick Reference: Free, No-Key APIs

| Data | Primary | Fallback |
|------|---------|----------|
| Crypto | CoinGecko | CoinCap, Binance |
| Stablecoins | CoinGecko | DeFiLlama |
| Economic | BLS v1 (limited) | FRED (free key), Yahoo ^VIX/^TNX |
| Energy | OilPrice demo (20/hr) | Yahoo ^CL, ^BZ |
| Trade | Census, ITC | UN Comtrade, WTO |
| Earthquakes | USGS | EMSC |
| Weather | Weather.gov | Open-Meteo |
| Disasters | GDACS | EONET, ReliefWeb |
| Spending | USAspending.gov | — |
