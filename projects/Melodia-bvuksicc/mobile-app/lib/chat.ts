import { supabase } from './supabase';

export async function getOrCreateChatId(myId: string, otherId: string): Promise<string> {
  const a = myId < otherId ? myId : otherId;
  const b = myId < otherId ? otherId : myId;

  // 1) find existing
  const { data: existing, error: findErr } = await supabase
    .from('chats')
    .select('id')
    .eq('user_a', a)
    .eq('user_b', b)
    .maybeSingle();

  if (findErr) throw findErr;
  if (existing?.id) return existing.id as string;

  // 2) create
  const { data: created, error: insErr } = await supabase
    .from('chats')
    .insert({ user_a: a, user_b: b })
    .select('id')
    .single();

  if (insErr) throw insErr;
  return created.id as string;
}
