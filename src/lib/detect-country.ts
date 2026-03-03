/**
 * Detect country mentions from text (direct name, aliases, or flag emoji).
 * Used when feed items lack explicit country/countries fields.
 */

/** Country name/alias → canonical name for lookup */
const COUNTRY_PATTERNS: { pattern: RegExp; country: string }[] = [
  { pattern: /\biran\b/i, country: 'Iran' },
  { pattern: /\bisrael\b/i, country: 'Israel' },
  { pattern: /\busa\b|\bunited states\b|\bamerica\b|\bamerican\b|\bus\b(?!\w)/i, country: 'United States' },
  { pattern: /\brussia\b|\brussian\b/i, country: 'Russia' },
  { pattern: /\bchina\b|\bchinese\b/i, country: 'China' },
  { pattern: /\bukraine\b|\bukrainian\b/i, country: 'Ukraine' },
  { pattern: /\buk\b|\bunited kingdom\b|\bbritain\b|\bbritish\b/i, country: 'United Kingdom' },
  { pattern: /\bfrance\b|\bfrench\b/i, country: 'France' },
  { pattern: /\bgermany\b|\bgerman\b/i, country: 'Germany' },
  { pattern: /\bturkey\b|\bturkish\b|\btürkiye\b/i, country: 'Turkey' },
  { pattern: /\bindia\b|\bindian\b/i, country: 'India' },
  { pattern: /\bjapan\b|\bjapanese\b/i, country: 'Japan' },
  { pattern: /\bsaudi arabia\b|\bsaudi\b/i, country: 'Saudi Arabia' },
  { pattern: /\biraq\b|\biraqi\b/i, country: 'Iraq' },
  { pattern: /\bsyria\b|\bsyrian\b/i, country: 'Syria' },
  { pattern: /\blebanon\b|\blebanese\b/i, country: 'Lebanon' },
  { pattern: /\bjordan\b/i, country: 'Jordan' },
  { pattern: /\begypt\b|\begyptian\b/i, country: 'Egypt' },
  { pattern: /\bqatar\b|\bqatari\b/i, country: 'Qatar' },
  { pattern: /\bemirates\b|\buae\b|\bdubai\b/i, country: 'United Arab Emirates' },
  { pattern: /\bpakistan\b|\bpakistani\b/i, country: 'Pakistan' },
  { pattern: /\bafghanistan\b|\bafghan\b/i, country: 'Afghanistan' },
  { pattern: /\byemen\b|\byemeni\b/i, country: 'Yemen' },
  { pattern: /\blibya\b|\blibyan\b/i, country: 'Libya' },
  { pattern: /\bvenezuela\b|\bvenezuelan\b/i, country: 'Venezuela' },
  { pattern: /\bbrazil\b|\bbrazilian\b/i, country: 'Brazil' },
  { pattern: /\bmexico\b|\bmexican\b/i, country: 'Mexico' },
  { pattern: /\bcanada\b|\bcanadian\b/i, country: 'Canada' },
  { pattern: /\baustralia\b|\baustralian\b/i, country: 'Australia' },
  { pattern: /\btaiwan\b|\btaiwanese\b/i, country: 'Taiwan' },
  { pattern: /\bpalestine\b|\bpalestinian\b|\bgaza\b|\bwest bank\b/i, country: 'Palestine' },
  { pattern: /\bnorth korea\b|\bnkorea\b|\bdprk\b/i, country: 'North Korea' },
  { pattern: /\bsouth korea\b|\bskorea\b|\bkorean\b(?!\s+north)/i, country: 'South Korea' },
  { pattern: /\bpoland\b|\bpolish\b/i, country: 'Poland' },
  { pattern: /\bitaly\b|\bitalian\b/i, country: 'Italy' },
  { pattern: /\bspain\b|\bspanish\b/i, country: 'Spain' },
  { pattern: /\bnetherlands\b|\bdutch\b/i, country: 'Netherlands' },
  { pattern: /\bgeorgia\b(?!\s+(o'|of)\s+)/i, country: 'Georgia' },
];

/** Flag emoji → country (subset of common flags) */
const FLAG_EMOJI: Record<string, string> = {
  '🇮🇷': 'Iran',
  '🇮🇱': 'Israel',
  '🇺🇸': 'United States',
  '🇷🇺': 'Russia',
  '🇨🇳': 'China',
  '🇺🇦': 'Ukraine',
  '🇬🇧': 'United Kingdom',
  '🇫🇷': 'France',
  '🇩🇪': 'Germany',
  '🇹🇷': 'Turkey',
  '🇮🇳': 'India',
  '🇯🇵': 'Japan',
  '🇸🇦': 'Saudi Arabia',
  '🇮🇶': 'Iraq',
  '🇸🇾': 'Syria',
  '🇱🇧': 'Lebanon',
  '🇯🇴': 'Jordan',
  '🇪🇬': 'Egypt',
  '🇶🇦': 'Qatar',
  '🇵🇰': 'Pakistan',
  '🇦🇫': 'Afghanistan',
  '🇾🇪': 'Yemen',
  '🇱🇾': 'Libya',
  '🇻🇪': 'Venezuela',
  '🇧🇷': 'Brazil',
  '🇲🇽': 'Mexico',
  '🇨🇦': 'Canada',
  '🇦🇺': 'Australia',
  '🇹🇼': 'Taiwan',
  '🇵🇸': 'Palestine',
  '🇰🇵': 'North Korea',
  '🇰🇷': 'South Korea',
  '🇵🇱': 'Poland',
  '🇮🇹': 'Italy',
  '🇪🇸': 'Spain',
  '🇳🇱': 'Netherlands',
};

/** Match flag emoji in text (Unicode regional indicators) */
const FLAG_REGEX = /[\u{1F1E6}-\u{1F1FF}][\u{1F1E6}-\u{1F1FF}]/gu;

export function detectCountriesFromText(text: string): string[] {
  const seen = new Set<string>();
  if (!text) return [];

  for (const { pattern, country } of COUNTRY_PATTERNS) {
    if (pattern.test(text) && !seen.has(country)) seen.add(country);
  }

  const flags = text.match(FLAG_REGEX) ?? [];
  for (const flag of flags) {
    const country = FLAG_EMOJI[flag];
    if (country && !seen.has(country)) seen.add(country);
  }

  return Array.from(seen);
}
