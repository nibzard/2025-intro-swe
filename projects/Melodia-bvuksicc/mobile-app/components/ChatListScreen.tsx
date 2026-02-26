import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, ActivityIndicator } from 'react-native';
import { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { useNavigation, useIsFocused } from '@react-navigation/native';

type Props = { session: Session };

type ChatRow = {
  id: string;
  other_user_id: string;
  other_name: string;
  unread: number;
  last_text: string | null;
  last_at: string | null;
};

const timeShort = (iso: string | null) => {
  if (!iso) return '';
  const d = new Date(iso);
  const today = new Date();
  const sameDay = d.toDateString() === today.toDateString();
  if (sameDay) return d.toLocaleTimeString().slice(0, 5);
  return d.toLocaleDateString();
};

export default function ChatListScreen({ session }: Props) {
  const navigation = useNavigation<any>();
  const isFocused = useIsFocused();
  const myId = session.user.id;

  const [loading, setLoading] = useState(true);
  const [chats, setChats] = useState<ChatRow[]>([]);

  const loadChats = async () => {
    setLoading(true);

    // blocked ids
    const { data: blockedRows } = await supabase
      .from('blocked_users')
      .select('blocked_id')
      .eq('blocker_id', myId);

    const blocked = new Set((blockedRows || []).map((x: any) => x.blocked_id));

    const { data, error } = await supabase
      .from('chats')
      .select('id, user_a, user_b')
      .or(`user_a.eq.${myId},user_b.eq.${myId}`);

    if (error) {
      console.log('loadChats error:', error.message);
      setLoading(false);
      return;
    }

    const result: ChatRow[] = [];

    for (const c of data || []) {
      const otherId = c.user_a === myId ? c.user_b : c.user_a;
      if (blocked.has(otherId)) continue;

      const { data: user } = await supabase
        .from('users')
        .select('full_name, email')
        .eq('id', otherId)
        .maybeSingle();

      const { count } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .eq('chat_id', c.id)
        .neq('sender_id', myId)
        .is('read_at', null);

      // last message
      const { data: lastMsg } = await supabase
        .from('messages')
        .select('content, created_at, sender_id')
        .eq('chat_id', c.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      const prefix = lastMsg?.sender_id === myId ? 'Ti: ' : '';
      const lastText = lastMsg?.content ? `${prefix}${lastMsg.content}` : null;

      result.push({
        id: c.id,
        other_user_id: otherId,
        other_name: user?.full_name || user?.email || 'Korisnik',
        unread: count || 0,
        last_text: lastText,
        last_at: lastMsg?.created_at || null,
      });
    }

    // sort: unread first, then latest
    result.sort((a, b) => (b.unread - a.unread) || ((b.last_at || '').localeCompare(a.last_at || '')));

    setChats(result);
    setLoading(false);
  };

  useEffect(() => {
    if (isFocused) loadChats();
  }, [isFocused]);

  useEffect(() => {
    const ch = supabase
      .channel('realtime:chatlist')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, () => {
        if (isFocused) loadChats();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(ch);
    };
  }, [isFocused]);

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color="#1DB954" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>💬 Chatovi</Text>

      <FlatList
        data={chats}
        keyExtractor={(i) => i.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.item}
            onPress={() =>
              navigation.navigate('Chat', {
                chatId: item.id,
                otherUserId: item.other_user_id,
                otherUserName: item.other_name,
              })
            }
          >
            <View style={{ flex: 1 }}>
              <View style={styles.topRow}>
                <Text style={[styles.name, item.unread > 0 && styles.nameUnread]} numberOfLines={1}>
                  {item.other_name}
                </Text>
                <Text style={styles.time}>{timeShort(item.last_at)}</Text>
              </View>

              <Text style={styles.preview} numberOfLines={1}>
                {item.last_text || '—'}
              </Text>
            </View>

            {item.unread > 0 ? (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{item.unread > 99 ? '99+' : item.unread}</Text>
              </View>
            ) : null}
          </TouchableOpacity>
        )}
        ListEmptyComponent={<Text style={{ color: '#888' }}>Nema chatova.</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212', padding: 16 },
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { color: '#1DB954', fontSize: 22, fontWeight: '800', marginBottom: 16 },

  item: {
    backgroundColor: '#1E1E1E',
    padding: 14,
    borderRadius: 12,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: '#2b2b2b',
  },

  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 10 },
  name: { color: '#fff', fontSize: 16, fontWeight: '700', flex: 1 },
  nameUnread: { fontWeight: '900' },
  time: { color: '#888', fontSize: 12 },

  preview: { color: '#aaa', marginTop: 6, fontSize: 12 },

  badge: {
    minWidth: 26,
    height: 22,
    paddingHorizontal: 8,
    borderRadius: 11,
    backgroundColor: '#1DB954',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: { color: '#fff', fontWeight: '900', fontSize: 12 },
});
