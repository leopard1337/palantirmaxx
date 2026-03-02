export const ACCENT = '#00ffa3';

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
