import type { LikeTotals } from '../types';
import { supabase } from './supabase';

type AllTimeLikesRow = {
  likes_received: number | string | null;
  likes_sent: number | string | null;
  recent_received: number | string | null;
  first_seen_at: string | null;
};

/** Postgres `bigint` arrives over PostgREST as a string. */
function toCount(value: number | string | null | undefined): number {
  const parsed = typeof value === 'string' ? Number.parseInt(value, 10) : value;
  return typeof parsed === 'number' && Number.isFinite(parsed) ? parsed : 0;
}

export const EMPTY_LIKE_TOTALS: LikeTotals = {
  likesReceived: 0,
  likesSent: 0,
  recentReceived: 0,
  firstSeenAt: null,
};

/**
 * Lifetime nudge tallies for one listener.
 *
 * These come from `like_totals`, not the `likes` table — `likes` rows are swept
 * every 15 minutes along with presence, so they can only answer "right now".
 */
export async function fetchAllTimeLikes(hashedId: string): Promise<LikeTotals> {
  const { data, error } = await supabase.rpc('all_time_likes', {
    p_spotify_id: hashedId,
  });

  if (error) {
    throw error;
  }

  const row = (Array.isArray(data) ? data[0] : data) as AllTimeLikesRow | undefined;
  if (!row) {
    return EMPTY_LIKE_TOTALS;
  }

  return {
    likesReceived: toCount(row.likes_received),
    likesSent: toCount(row.likes_sent),
    recentReceived: toCount(row.recent_received),
    firstSeenAt: row.first_seen_at,
  };
}
