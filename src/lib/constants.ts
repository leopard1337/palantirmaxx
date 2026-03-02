export const ACCENT = '#00ffa3';

/** Feed card spacing - used by VirtualizedFeedList, Grid, FeedListSkeleton */
export const FEED_CARD_GAP = 12; // px

export const CAT_COLORS: Record<string, string> = {
  AWACS: '#ff6b6b',
  Drone: '#ffa94d',
  Presidential: '#ffd43b',
  Fighter: '#ff4757',
  Bomber: '#e74c3c',
  Tanker: '#69db7c',
  Transport: '#4dabf7',
  Command: '#da77f2',
  Other: '#868e96',
};

export const SOURCE_STYLES: Record<string, { text: string; dot: string }> = {
  tweet: { text: 'text-sky-400', dot: 'bg-sky-400' },
  news: { text: 'text-[#229ed9]', dot: 'bg-[#229ed9]' },
  telegram: { text: 'text-violet-400', dot: 'bg-violet-400' },
};

export const SOURCE_DOT: Record<string, string> = {
  tweet: 'bg-sky-400',
  news: 'bg-[#229ed9]',
  telegram: 'bg-violet-400',
};

export const SEVERITY_OPTIONS = [
  { value: 'critical', label: 'Critical', color: 'text-red-500 bg-red-500/10 border-red-500/20' },
  { value: 'high', label: 'High', color: 'text-red-400 bg-red-400/10 border-red-400/20' },
  { value: 'medium', label: 'Medium', color: 'text-amber-400 bg-amber-400/10 border-amber-400/20' },
  { value: 'low', label: 'Low', color: 'text-zinc-400 bg-zinc-400/10 border-zinc-400/20' },
] as const;

export const CATEGORY_OPTIONS = [
  'Politics', 'Crypto', 'Finance', 'Geopolitics', 'Earnings',
  'Tech', 'Culture', 'World', 'Economy', 'Climate', 'Elections', 'Mention',
] as const;

export interface TopicOption {
  slug: string;
  label: string;
  description: string;
  keywords: string[];
}

export const TOPIC_OPTIONS: TopicOption[] = [
  {
    slug: 'iran-regime',
    label: 'Iran Regime Change',
    description: 'Leadership succession, internal power struggles, protests, and external pressure that could shift Iran\'s governing system.',
    keywords: ['iran-regime', 'iran'],
  },
  {
    slug: 'ukraine-war',
    label: 'Ukraine War',
    description: 'Frontline developments, ceasefire/peace negotiations, aid packages, sanctions, and NATO/EU policy shifts affecting the conflict.',
    keywords: ['ukraine-war', 'ukraine'],
  },
  {
    slug: 'fed-powell',
    label: 'Fed & Powell',
    description: 'US Federal Reserve rate decisions, inflation/jobs data, Powell speeches, and market reactions across stocks, bonds, and USD.',
    keywords: ['fed-powell', 'fed', 'powell', 'federal-reserve'],
  },
  {
    slug: 'bitcoin-crypto',
    label: 'Bitcoin & Crypto',
    description: 'Crypto price moves, ETF flows, on-chain trends, regulation, major exchange/news events, and broader digital-asset market sentiment.',
    keywords: ['bitcoin-crypto', 'bitcoin', 'crypto'],
  },
  {
    slug: 'greenland-deal',
    label: 'Greenland Deal',
    description: 'US\u2013Denmark/Greenland diplomacy, resource and security interests in the Arctic, and proposals or disputes over governance and trade.',
    keywords: ['greenland-deal', 'greenland'],
  },
  {
    slug: 'super-bowl',
    label: 'Super Bowl LX',
    description: 'NFL season and playoff outcomes, betting lines, injuries, matchups, and predictions leading into Super Bowl LX.',
    keywords: ['super-bowl', 'superbowl', 'nfl'],
  },
  {
    slug: 'trump-tariffs',
    label: 'Trump Tariffs',
    description: 'US tariff announcements, trade negotiations, court challenges, retaliatory measures, and impacts on inflation, supply chains, and markets.',
    keywords: ['trump-tariffs', 'tariffs', 'trump-tariff'],
  },
  {
    slug: '2028-election',
    label: '2028 Election',
    description: 'US presidential race: candidate moves, primaries, polling, fundraising, debates, and major legal or procedural election developments.',
    keywords: ['2028-election', 'election', '2028'],
  },
  {
    slug: 'elon-musk',
    label: 'Elon Musk',
    description: 'Updates involving Musk\'s companies (Tesla/SpaceX/X), major product or policy announcements, controversies, and market/business implications.',
    keywords: ['elon-musk', 'musk', 'tesla', 'spacex'],
  },
  {
    slug: 'ai-big-tech',
    label: 'AI & Big Tech',
    description: 'Model releases, AI regulation, chip supply and capex, antitrust actions, and market competition among major tech firms.',
    keywords: ['ai-big-tech', 'ai', 'big-tech', 'artificial-intelligence'],
  },
  {
    slug: 'venezuela',
    label: 'Venezuela Crisis',
    description: 'Political stability, humanitarian conditions, migration, oil sector changes, sanctions policy, and regional/international responses.',
    keywords: ['venezuela', 'venezuela-crisis'],
  },
  {
    slug: 'gov-shutdown',
    label: 'Gov Shutdown',
    description: 'US budget negotiations, continuing resolutions, debt-ceiling deadlines, agency impacts, and political bargaining in Congress/White House.',
    keywords: ['gov-shutdown', 'government-shutdown', 'shutdown'],
  },
];
