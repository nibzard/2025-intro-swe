import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  LayoutAnimation,
  Platform,
  UIManager,
} from 'react-native';
import { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

if (Platform.OS === 'android') {
  UIManager.setLayoutAnimationEnabledExperimental?.(true);
}

type Props = {
  session: Session;
  chatId: string;
  otherUserId: string;      // ✅ added (fixes your TS error)
  otherUserName: string;
};

type Message = {
  id: string;
  sender_id: string;
  content: string;
  created_at: string;
};

export default function ChatScreen({ session, chatId, otherUserId, otherUserName }: Props) {
  const myId = session.user.id;

  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);

  const listRef = useRef<FlatList>(null);

  useEffect(() => {
    loadMessages();

    const channel = supabase
      .channel(`chat-${chatId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `chat_id=eq.${chatId}` },
        (payload) => {
          LayoutAnimation.easeInEaseOut();
          setMessages((prev) => [...prev, payload.new as Message]);
          setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 30);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chatId]);

  const loadMessages = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('messages')
      .select('id, sender_id, content, created_at')
      .eq('chat_id', chatId)
      .order('created_at', { ascending: true });

    if (!error) setMessages((data || []) as Message[]);
    setLoading(false);
    setTimeout(() => listRef.current?.scrollToEnd({ animated: false }), 50);
  };

  const send = async (content: string) => {
    const msg = content.trim();
    if (!msg) return;

    setText('');

    const { error } = await supabase.from('messages').insert({
      chat_id: chatId,
      sender_id: myId,
      content: msg,
    });

    if (error) {
      // fallback restore
      setText(msg);
      console.log('send error:', error.message);
    }
  };

  const sendIcebreaker = () => {
    // ✅ otherUserId is available now (for later “shared songs” logic)
    // For now: safe simple icebreaker.
    const samples = [
      '🎵 Oboje slušate Radiohead – koja ti je najdraža?',
      '🎶 Vidim da imamo sličan glazbeni ukus 😄 Što slušaš ovih dana?',
      '🔥 Naš match je ozbiljan – koja ti je zadnja pjesma na repeat?',
    ];
    void send(samples[Math.floor(Math.random() * samples.length)]);
  };

  const renderItem = ({ item }: { item: Message }) => {
    const mine = item.sender_id === myId;
    return (
      <View style={[styles.bubble, mine ? styles.mine : styles.other]}>
        <Text style={styles.msg}>{item.content}</Text>
        <Text style={styles.time}>
          {new Date(item.created_at).toLocaleTimeString().slice(0, 5)}
        </Text>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color="#1DB954" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.header}>💬 {otherUserName}</Text>

      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={(i) => i.id}
        renderItem={renderItem}
        contentContainerStyle={{ padding: 12, paddingBottom: 20 }}
      />

      <TouchableOpacity style={styles.iceBtn} onPress={sendIcebreaker}>
        <Text style={styles.iceText}>🎵 Pošalji icebreaker</Text>
      </TouchableOpacity>

      <View style={styles.row}>
        <TextInput
          style={styles.input}
          value={text}
          onChangeText={setText}
          placeholder="Upiši poruku…"
          placeholderTextColor="#777"
        />
        <TouchableOpacity style={styles.send} onPress={() => send(text)}>
          <Text style={{ color: '#fff', fontWeight: '900' }}>➤</Text>
        </TouchableOpacity>
      </View>

      {/* just to avoid unused var warnings in some configs */}
      <Text style={{ height: 0, width: 0, opacity: 0 }}>{otherUserId}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212' },
  header: { color: '#fff', fontSize: 18, fontWeight: '900', padding: 14 },

  loading: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  bubble: {
    maxWidth: '78%',
    padding: 10,
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#2b2b2b',
  },
  mine: { alignSelf: 'flex-end', backgroundColor: '#1DB954' },
  other: { alignSelf: 'flex-start', backgroundColor: '#1E1E1E' },
  msg: { color: '#fff', fontWeight: '700' },
  time: { color: '#eee', marginTop: 6, fontSize: 11, opacity: 0.9 },

  iceBtn: {
    backgroundColor: '#333',
    marginHorizontal: 12,
    padding: 10,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 8,
  },
  iceText: { color: '#1DB954', fontWeight: '900' },

  row: {
    flexDirection: 'row',
    padding: 10,
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: '#2b2b2b',
    backgroundColor: '#1E1E1E',
  },
  input: {
    flex: 1,
    backgroundColor: '#151515',
    borderRadius: 12,
    padding: 12,
    color: '#fff',
    borderWidth: 1,
    borderColor: '#2b2b2b',
  },
  send: {
    width: 48,
    height: 44,
    backgroundColor: '#1DB954',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
