// lib/match.ts
import { supabase } from './supabase';

/**
 * user_matches table format:
 * user_a uuid, user_b uuid, match_percent int, updated_at timestamptz
 * (user_a < user_b) unique
 */
export async function getMatchPercent(myId: string, otherId: string): Promise<number | null> {
  const a = myId < otherId ? myId : otherId;
  const b = myId < otherId ? otherId : myId;

  const { data, error } = await supabase
    .from('user_matches')
    .select('match_percent')
    .eq('user_a', a)
    .eq('user_b', b)
    .maybeSingle();

  if (error) {
    console.log('getMatchPercent error:', error.message);
    return null;
  }

  return typeof data?.match_percent === 'number' ? data.match_percent : null;
}
