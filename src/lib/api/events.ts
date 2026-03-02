import { apiRequest } from './client';
import type { EventData } from './types';

const CATEGORIES = [
  'all',
  'politics',
  'crypto',
  'finance',
  'geopolitics',
  'earnings',
  'tech',
  'culture',
  'world',
  'economy',
  'climate',
] as const;

export type EventCategory = (typeof CATEGORIES)[number];

export async function fetchEvents(
  category: EventCategory,
  opts?: { source?: string; sort?: string }
): Promise<EventData[]> {
  const source = opts?.source ?? 'all';
  const sort = opts?.sort ?? 'volume_desc';
  const path = `/api/events/category/${category}`;
  const data = await apiRequest<EventData[]>(path, { source, sort });
  return data;
}

export { CATEGORIES };
