import { apiRequest } from './client';
import type { MoverEntry } from './types';

export async function fetchMovers(): Promise<MoverEntry[]> {
  return apiRequest<MoverEntry[]>('/api/movers');
}
