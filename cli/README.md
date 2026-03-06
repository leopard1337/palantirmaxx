# Quantis CLI

Data layer between human, agent, and profits. **Quantis provides data only** – agents consume it; Quantis does not execute trades.

## How to run

### Option A: From cloned repo (developers)

```bash
# 1. Clone the repo
git clone https://github.com/leopard1337/palantirmaxx.git && cd palantirmaxx

# 2. Install deps and build CLI
cd cli && npm install && npm run build

# 3. Run (Quantis app must be running, or set QUANTIS_API_URL)
node dist/index.js data -j
# or from repo root:
npm run cli data -j
```

### Option B: npx (after publishing to npm)

```bash
npx quantis-cli data -j
```

To publish: remove `"private": true` from `cli/package.json`, then `npm publish` from `cli/`.

### Option C: Global install (after publishing)

```bash
npm install -g quantis-cli
quantis data -j
```

## API URL

The CLI fetches from **https://quantis.gg** by default. Override if needed:

- **Production (default)**: `https://quantis.gg` – works out of the box for anyone.
- **Local dev**: `export QUANTIS_API_URL=http://localhost:3000` when running `npm run dev` locally.

## Commands

```bash
quantis data              # Full data dump (JSON when piped)
quantis data -j           # Full JSON
quantis data --intel      # Intel only
quantis data --markets    # Markets only
quantis data --feed       # Feed only
quantis trade             # Stub (Quantis is data-only)
```

### Data Output (for agents)

- **`quantis data -j`** – Full JSON: intel (crypto, stablecoins, trends, ISS, FRED, treasury, BLS, oil, GDACS, weather, USGS, flights), markets (Polymarket + Glint), feed
- **`quantis data --intel -j`** – Intel subset
- **`quantis data --markets -j`** – Markets subset
- **`quantis data --feed -j`** – Feed subset
- When stdout is not a TTY (e.g. piping), output is JSON by default

## Architecture

- **data** – Fetches from `/api/intel/*` (crypto, trends, ISS, Polymarket, FRED, treasury, disasters, flights, etc.) and `/api/quantis/*` (feed, Glint events)
- **trade** – Stub; Quantis is data-only; agents handle execution
