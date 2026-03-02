# Operation Palantir

Real-time prediction market intelligence terminal. Aggregates feed signals (news/X/Telegram/OSINT), events by category, and top movers via the Glint API.

## Setup

1. Install dependencies: `npm install`
2. Copy `.env.example` to `.env.local` and add your Glint API Bearer token:
   ```
   NEXT_PUBLIC_GLINT_BEARER=your_token_here
   ```
3. Run dev: `npm run dev`
4. Open [http://localhost:3000](http://localhost:3000)

## Scripts

- `npm run dev` — Start dev server
- `npm run build` — Production build
- `npm run start` — Start production server
- `npm run test` — Run contract tests
- `npm run lint` — Run ESLint

## Pages

- **/feed** — Live feed with type filters (All, OSINT, News, Tweet, Telegram), virtualized list, detail drawer
- **/grid** — Multi-column grid view (2–4 columns) with independent source types
- **/events** — Events by category (Politics, Crypto, Finance, etc.)
- **/movers** — Top movers (auto-refresh every 60s)
- **/terminal** — Vision Terminal with 3D globe, tension gauge, aircraft filters
- **/markets** — Markets browser (links to Events)
- **/settings** — API config

## Keyboard Shortcuts (Feed page)

- `?` — Show/hide shortcut help
- `j` — Next item (open detail)
- `k` — Previous item (open detail)
