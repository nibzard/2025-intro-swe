import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity, Alert, ScrollView, Animated, Easing } from 'react-native';
import { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { getMatchPercent } from '../lib/match';
import { getOrCreateChatId } from '../lib/chat';
import { useNavigation } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';

type Props = {
  session: Session;
  userId: string;
  userName?: string;
  userEmail?: string;
};

type NormTrack = { title: string; artist: string };
type NormGenre = string;

const normalizeTracks = (raw: any[] | null | undefined): NormTrack[] => {
  const arr = Array.isArray(raw) ? raw : [];
  return arr
    .map((t: any) => {
      // manual: {name, artist}
      if (t?.name && t?.artist) return { title: String(t.name), artist: String(t.artist) };

      // spotify: {name, artists:[{name}]}
      const title = t?.name ? String(t.name) : '';
      const artist =
        t?.artist
          ? String(t.artist)
          : t?.artists?.[0]?.name
            ? String(t.artists[0].name)
            : 'Unknown';

      if (!title) return null;
      return { title, artist };
    })
    .filter(Boolean) as NormTrack[];
};

const normalizeGenres = (raw: any): NormGenre[] => {
  const arr = Array.isArray(raw) ? raw : [];
  return arr.map((g) => String(g)).filter(Boolean);
};

const keyTrack = (t: NormTrack) => `${t.title.toLowerCase().trim()}|${t.artist.toLowerCase().trim()}`;

export default function UserProfileScreen({ session, userId, userName, userEmail }: Props) {
  const navigation = useNavigation<any>();
  const myId = session.user.id;

  const [loading, setLoading] = useState(true);
  const [match, setMatch] = useState<number | null>(null);
  const [tracks, setTracks] = useState<NormTrack[]>([]); // other top5

  // WHY YOU MATCH
  const [sharedTracks, setSharedTracks] = useState<NormTrack[]>([]);
  const [sharedGenres, setSharedGenres] = useState<string[]>([]);

  // fade in
  const fade = useRef(new Animated.Value(0)).current;
  const lift = useRef(new Animated.Value(10)).current;

  const titleName = useMemo(
    () => userName || (userEmail ? userEmail.split('@')[0] : 'Korisnik'),
    [userName, userEmail]
  );

  const haptic = async (kind: 'light' | 'medium' | 'heavy' = 'light') => {
    try {
      if (kind === 'heavy') await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      else if (kind === 'medium') await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      else await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}
  };

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fade, { toValue: 1, duration: 260, easing: Easing.out(Easing.quad), useNativeDriver: true }),
      Animated.timing(lift, { toValue: 0, duration: 260, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
    ]).start();
  }, []);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);

        // match
        const m = await getMatchPercent(myId, userId);
        const mNum = typeof m === 'number' ? m : parseInt(String(m ?? '').replace('%', ''), 10);
        const safeMatch = Number.isFinite(mNum) ? mNum : null;
        setMatch(safeMatch);

        // haptic if strong match
        if ((safeMatch ?? 0) >= 80) await haptic('heavy');

        // other profile top tracks
        const { data: otherMp, error: otherErr } = await supabase
          .from('music_profiles')
          .select('top_tracks, top_genres')
          .eq('user_id', userId)
          .maybeSingle();
        if (otherErr) throw otherErr;

        const otherTop = normalizeTracks(otherMp?.top_tracks).slice(0, 5);
        setTracks(otherTop);

        // my profile
        const { data: myMp, error: myErr } = await supabase
          .from('music_profiles')
          .select('top_tracks, top_genres')
          .eq('user_id', myId)
          .maybeSingle();
        if (myErr) throw myErr;

        // compute WHY YOU MATCH
        const myAll = normalizeTracks(myMp?.top_tracks).slice(0, 50);
        const otherAll = normalizeTracks(otherMp?.top_tracks).slice(0, 50);

        const otherSet = new Map<string, NormTrack>();
        for (const t of otherAll) otherSet.set(keyTrack(t), t);

        const shared: NormTrack[] = [];
        for (const t of myAll) {
          const k = keyTrack(t);
          if (otherSet.has(k)) {
            shared.push(otherSet.get(k)!);
            if (shared.length >= 5) break;
          }
        }
        setSharedTracks(shared);

        // fallback genres
        const myGenres = new Set(normalizeGenres(myMp?.top_genres).map((g) => g.toLowerCase().trim()));
        const otherGenres = normalizeGenres(otherMp?.top_genres).map((g) => g.trim());
        const sharedG = otherGenres
          .filter((g) => myGenres.has(g.toLowerCase()))
          .slice(0, 6);
        setSharedGenres(sharedG);

      } catch (e: any) {
        console.log('UserProfile load error:', e?.message || e);
        Alert.alert('Greška', e?.message || 'Ne mogu učitati profil.');
      } finally {
        setLoading(false);
      }
    })();
  }, [myId, userId]);

  const openChat = async () => {
    try {
      await haptic('medium');
      const chatId = await getOrCreateChatId(myId, userId);
      navigation.navigate('Chat', {
        chatId,
        otherUserId: userId,
        otherUserName: titleName,
      });
    } catch (e: any) {
      console.log('openChat error:', e?.message || e);
      Alert.alert('Greška', e?.message || 'Ne mogu otvoriti chat.');
    }
  };

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#1DB954" />
        <Text style={{ color: '#fff', marginTop: 10 }}>Učitavam…</Text>
      </View>
    );
  }

  return (
    <Animated.View style={{ flex: 1, opacity: fade, transform: [{ translateY: lift }] }}>
      <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 30 }}>
        <Text style={styles.title}>👤 {titleName}</Text>

        <View style={styles.card}>
          <Text style={styles.label}>Podudaranje</Text>
          <Text style={styles.bigValue}>{match === null ? '—' : `${match}%`}</Text>
          {match !== null && match >= 80 ? (
            <Text style={styles.premiumHint}>🔥 Premium match</Text>
          ) : null}
        </View>

        {/* WHY YOU MATCH */}
        <View style={styles.card}>
          <Text style={styles.label}>Why you match</Text>

          {sharedTracks.length ? (
            <>
              <Text style={styles.whyTitle}>🎵 Podudarate se jer oboje slušate:</Text>
              {sharedTracks.map((t, i) => (
                <View key={`${t.title}-${t.artist}-${i}`} style={styles.whyRow}>
                  <Text style={styles.whyIndex}>{i + 1}.</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.trackTitle} numberOfLines={1}>{t.title}</Text>
                    <Text style={styles.trackArtist} numberOfLines={1}>{t.artist}</Text>
                  </View>
                </View>
              ))}
            </>
          ) : sharedGenres.length ? (
            <>
              <Text style={styles.whyTitle}>🎧 Podudarate se po žanrovima:</Text>
              <View style={styles.chips}>
                {sharedGenres.map((g) => (
                  <View key={g} style={styles.chip}>
                    <Text style={styles.chipText}>{g}</Text>
                  </View>
                ))}
              </View>
              <Text style={styles.mutedSmall}>Spoji Spotify kod oba korisnika za precizniji “why”.</Text>
            </>
          ) : (
            <Text style={styles.muted}>Nema dovoljno podataka za “why”. Spojite Spotify ili unesite ručno Top pjesme.</Text>
          )}
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>Top 5 pjesama</Text>
          {tracks.length === 0 ? (
            <Text style={styles.muted}>Nema spremljenih pjesama.</Text>
          ) : (
            tracks.map((t, i) => (
              <View key={`${t.title}-${i}`} style={styles.trackRow}>
                <Text style={styles.trackIndex}>{i + 1}.</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.trackTitle} numberOfLines={1}>{t.title}</Text>
                  <Text style={styles.trackArtist} numberOfLines={1}>{t.artist}</Text>
                </View>
              </View>
            ))
          )}
        </View>

        <TouchableOpacity style={styles.chatBtn} onPress={openChat}>
          <Text style={styles.chatBtnText}>💬 Otvori chat</Text>
        </TouchableOpacity>
      </ScrollView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212', padding: 16 },
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#121212' },

  title: { color: '#1DB954', fontSize: 22, fontWeight: '900', textAlign: 'center', marginBottom: 16 },

  card: {
    backgroundColor: '#1E1E1E',
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#2b2b2b',
  },
  label: { color: '#9a9a9a', fontSize: 12, marginBottom: 8 },
  bigValue: { color: '#fff', fontSize: 34, fontWeight: '900' },
  premiumHint: { color: '#00E5FF', fontWeight: '900', marginTop: 6 },

  muted: { color: '#aaa', lineHeight: 18 },
  mutedSmall: { color: '#777', marginTop: 10, fontSize: 12 },

  // tracks list
  trackRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 10,
    backgroundColor: '#151515',
    borderRadius: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#2b2b2b',
  },
  trackIndex: { color: '#1DB954', fontWeight: '900', width: 26 },
  trackTitle: { color: '#fff', fontWeight: '800' },
  trackArtist: { color: '#aaa', marginTop: 2, fontSize: 12 },

  // why you match
  whyTitle: { color: '#fff', fontWeight: '900', marginBottom: 10 },
  whyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 10,
    backgroundColor: '#151515',
    borderRadius: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#2b2b2b',
  },
  whyIndex: { color: '#00E5FF', fontWeight: '900', width: 26 },

  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: '#151515',
    borderWidth: 1,
    borderColor: '#2b2b2b',
  },
  chipText: { color: '#fff', fontWeight: '800', fontSize: 12 },

  chatBtn: { backgroundColor: '#1DB954', paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  chatBtnText: { color: '#fff', fontWeight: '900', fontSize: 16 },
});
 