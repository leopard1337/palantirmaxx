export const WALKTHROUGH_STORAGE_KEY = 'palantir-walkthrough-done';

export const WALKTHROUGH_STEPS = [
  {
    route: '/',
    text: 'Welcome to PALANTIR — your real-time intelligence terminal. Let\'s walk you through the key features.',
    highlight: null as string | null,
  },
  {
    route: '/feed',
    text: 'The Live Feed aggregates signals from all sources: tweets, news wires, and Telegram channels in one unified view.',
    highlight: 'feed-content',
  },
  {
    route: '/feed',
    text: 'Use these source filters to narrow results by type — All, News, Tweet, or Telegram — depending on your focus.',
    highlight: 'feed-type-pills',
  },
  {
    route: '/grid',
    text: 'Grid view offers a cleaner, card-based layout for scanning signals at a glance.',
    highlight: null,
  },
  {
    route: '/events',
    text: 'Browse Polymarket event categories and discover prediction markets across politics, crypto, finance, and more.',
    highlight: null,
  },
  {
    route: '/movers',
    text: 'Track the highest-impact markets by price movement, with severity filters to prioritize critical signals.',
    highlight: null,
  },
  {
    route: '/intel',
    text: 'Monitor crypto & stablecoins, economic indicators (FRED data), disasters & weather alerts, and energy prices.',
    highlight: null,
  },
  {
    route: '/globe',
    text: 'Visualize country mentions, active flights, and conflict zones. Toggle live camera feeds for on-the-ground coverage.',
    highlight: null,
  },
  {
    route: '/markets',
    text: 'Search and browse active market contracts with volume, liquidity, and probability data.',
    highlight: null,
  },
  {
    route: '/',
    text: 'Your dashboard: 5 configurable panels. Add widgets from the catalog to build a layout tailored to your workflow.',
    highlight: null,
  },
];
