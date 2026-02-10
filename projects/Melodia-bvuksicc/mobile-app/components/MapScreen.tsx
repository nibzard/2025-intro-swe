import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
  Platform,
  Modal,
  Animated,
  Pressable,
  ScrollView,
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { getOrCreateChatId } from '../lib/chat';
import { getMatchPercent } from '../lib/match';
import { useNavigation } from '@react-navigation/native';

type Props = { session: Session };

type MapUser = {
  user_id: string;
  full_name: string;
  email: string;
  latitude: number;
  longitude: number;
  top_tracks: any[];
  spotify_connected: boolean;
  match: number;
};

type ProfileData = {
  userId: string;
  name: string;
  email: string;
  match: number;
  spotify_connected: boolean;
  top5: Array<{ title: string; artist: string }>;
};

const normalizeTopTracks = (raw: any[] | null | undefined) => {
  const arr = Array.isArray(raw) ? raw : [];
  return arr
    .map((t: any) => {
      if (t?.name && t?.artist) return { title: String(t.name), artist: String(t.artist) };
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
    .filter(Boolean) as Array<{ title: string; artist: string }>;
};

const pctColor = (p: number) => {
  if (p >= 80) return '#1DB954';
  if (p >= 50) return '#2dd36f';
  if (p >= 20) return '#f5a623';
  return '#888';
};

export default function MapScreen({ session }: Props) {
  const navigation = useNavigation<any>();
  const myId = session.user.id;

  const [loading, setLoading] = useState(true);
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [users, setUsers] = useState<MapUser[]>([]);

  // Profile modal
  const [profileOpen, setProfileOpen] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [isBlocked, setIsBlocked] = useState(false);

  const slideAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const animateIn = () => {
    slideAnim.setValue(0);
    Animated.timing(slideAnim, { toValue: 1, duration: 220, useNativeDriver: true }).start();
  };

  const animateOut = (cb?: () => void) => {
    Animated.timing(slideAnim, { toValue: 0, duration: 180, useNativeDriver: true }).start(() => cb?.());
  };

  const init = async () => {
    try {
      setLoading(true);

      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Lokacija', 'Trebaš dopustiti lokaciju.');
        setLoading(false);
        return;
      }

      const pos = await Location.getCurrentPositionAsync({});
      const loc = { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
      setLocation(loc);

      // upsert moja lokacija
      const { error: upErr } = await supabase.from('user_locations').upsert(
        {
          user_id: myId,
          latitude: loc.latitude,
          longitude: loc.longitude,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id' }
      );
      if (upErr) console.log('upsert location error:', upErr.message);

      await fetchUsers(loc);
    } catch (e: any) {
      console.log('init map error:', e?.message || e);
      Alert.alert('Greška', e?.message || 'Ne mogu učitati mapu.');
    } finally {
      setLoading(false);
    }
  };

  // Dohvati listu usera koji nisu blokirani (ni u jednom smjeru)
  const getBlockedIds = async (): Promise<Set<string>> => {
    try {
      // korisnici koje sam ja blokirao
      const { data: mine } = await supabase
        .from('blocked_users')
        .select('blocked_id')
        .eq('blocker_id', myId);

      // korisnici koji su blokirali mene
      const { data: theirs } = await supabase
        .from('blocked_users')
        .select('blocker_id')
        .eq('blocked_id', myId);

      const set = new Set<string>();
      (mine || []).forEach((r: any) => r?.blocked_id && set.add(r.blocked_id));
      (theirs || []).forEach((r: any) => r?.blocker_id && set.add(r.blocker_id));
      return set;
    } catch (e) {
      return new Set<string>();
    }
  };

  const fetchUsers = async (locOverride?: { latitude: number; longitude: number }) => {
    try {
      const loc = locOverride || location;
      if (!loc) return;

      const blockedSet = await getBlockedIds();

      const { data: locs, error: locErr } = await supabase
        .from('user_locations')
        .select('user_id, latitude, longitude')
        .neq('user_id', myId);

      if (locErr) throw locErr;

      const enriched: MapUser[] = [];

      for (const r of locs || []) {
        const uid = r.user_id as string;
        if (!uid || blockedSet.has(uid)) continue;

        const { data: userRow } = await supabase
          .from('users')
          .select('id, email, full_name')
          .eq('id', uid)
          .maybeSingle();

        if (!userRow) continue;

        const { data: mp } = await supabase
          .from('music_profiles')
          .select('top_tracks, data_source')
          .eq('user_id', uid)
          .maybeSingle();

        const match = (await getMatchPercent(myId, uid)) ?? 0;

        const topTracks = (mp?.top_tracks || []) as any[];
        const spotifyConnected = mp?.data_source === 'spotify' && topTracks.length > 0;

        enriched.push({
          user_id: uid,
          full_name: userRow.full_name || (userRow.email ? userRow.email.split('@')[0] : 'Korisnik'),
          email: userRow.email || 'unknown@email',
          latitude: Number(r.latitude),
          longitude: Number(r.longitude),
          top_tracks: topTracks,
          spotify_connected: !!spotifyConnected,
          match: typeof match === 'number' ? match : 0,
        });
      }

      setUsers(enriched);
    } catch (e: any) {
      console.log('fetchUsers error:', e?.message || e);
      Alert.alert('Greška', e?.message || 'Ne mogu dohvatiti korisnike.');
    }
  };

  const openProfile = async (u: MapUser) => {
    try {
      setProfileOpen(true);
      setProfileLoading(true);
      setProfile(null);
      setIsBlocked(false);
      animateIn();

      // provjeri blok status (ja->on)
      const { data: blockRow, error: blockErr } = await supabase
        .from('blocked_users')
        .select('blocker_id, blocked_id')
        .eq('blocker_id', myId)
        .eq('blocked_id', u.user_id)
        .maybeSingle();

      if (blockErr) console.log('block check error:', blockErr.message);
      setIsBlocked(!!blockRow);

      const top5 = normalizeTopTracks(u.top_tracks).slice(0, 5);

      setProfile({
        userId: u.user_id,
        name: u.full_name,
        email: u.email,
        match: u.match,
        spotify_connected: u.spotify_connected,
        top5,
      });
    } catch (e: any) {
      console.log('openProfile error:', e?.message || e);
      Alert.alert('Greška', e?.message || 'Ne mogu otvoriti profil.');
      animateOut(() => setProfileOpen(false));
    } finally {
      setProfileLoading(false);
    }
  };

  const closeProfile = () => {
    animateOut(() => {
      setProfileOpen(false);
      setProfile(null);
      setIsBlocked(false);
    });
  };

  const openChat = async () => {
    if (!profile) return;
    try {
      const otherId = profile.userId;
      const otherName = profile.name;

      const chatId = await getOrCreateChatId(myId, otherId);

      const rootNav = navigation.getParent?.() ?? navigation;
      rootNav.navigate('Chat', {
        chatId,
        otherUserId: otherId,
        otherUserName: otherName,
      });

      closeProfile();
    } catch (e: any) {
      console.log('openChat error:', e?.message || e);
      Alert.alert('Greška', e?.message || 'Ne mogu otvoriti chat.');
    }
  };

  const blockUser = async () => {
    if (!profile) return;
    try {
      // ✅ upsert da nema duplicate key
      const { error } = await supabase
        .from('blocked_users')
        .upsert(
          { blocker_id: myId, blocked_id: profile.userId, created_at: new Date().toISOString() },
          { onConflict: 'blocker_id,blocked_id' }
        );

      if (error) throw error;

      setIsBlocked(true);
      Alert.alert('✅ Blokirano', 'Korisnik je blokiran.');
      // makni ga s mape
      setUsers((prev) => prev.filter((u) => u.user_id !== profile.userId));
    } catch (e: any) {
      console.log('blockUser error:', e?.message || e);
      Alert.alert('Greška', e?.message || 'Ne mogu blokirati korisnika (provjeri RLS policy).');
    }
  };

  const unblockUser = async () => {
    if (!profile) return;
    try {
      const { error } = await supabase
        .from('blocked_users')
        .delete()
        .eq('blocker_id', myId)
        .eq('blocked_id', profile.userId);

      if (error) throw error;

      setIsBlocked(false);
      Alert.alert('✅ Odblokirano', 'Korisnik je odblokiran.');
      // osvježi listu
      await fetchUsers();
    } catch (e: any) {
      console.log('unblockUser error:', e?.message || e);
      Alert.alert('Greška', e?.message || 'Ne mogu odblokirati korisnika (provjeri RLS policy).');
    }
  };

  const markerLabel = useMemo(() => {
    return (u: MapUser) => `${u.match}%`;
  }, []);

  if (loading || !location) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#1DB954" />
        <Text style={{ color: '#fff', marginTop: 10 }}>Učitavam mapu…</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
        initialRegion={{
          latitude: location.latitude,
          longitude: location.longitude,
          latitudeDelta: 0.06,
          longitudeDelta: 0.06,
        }}
        showsUserLocation
        showsMyLocationButton
      >
        {users.map((u) => {
          const c = pctColor(u.match);
          return (
            <Marker
              key={u.user_id}
              coordinate={{ latitude: u.latitude, longitude: u.longitude }}
              onPress={() => openProfile(u)}
            >
              <View style={[styles.markerWrap, { borderColor: c }]}>
                <Text style={[styles.markerPct, { color: c }]}>{markerLabel(u)}</Text>
                {u.spotify_connected ? <Text style={styles.markerSpotify}>🎵</Text> : null}
              </View>
            </Marker>
          );
        })}
      </MapView>

      {/* Bottom buttons */}
      <View style={styles.bottomBar}>
        <TouchableOpacity style={styles.btn} onPress={() => fetchUsers()}>
          <Text style={styles.btnText}>🔄 Osvježi korisnike</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.btn} onPress={init}>
          <Text style={styles.btnText}>📍 Ažuriraj lokaciju</Text>
        </TouchableOpacity>
      </View>

      {/* Profile Modal */}
      <Modal visible={profileOpen} transparent animationType="none" onRequestClose={closeProfile}>
        <Pressable style={styles.overlay} onPress={closeProfile} />

        <Animated.View
          style={[
            styles.sheet,
            {
              transform: [
                {
                  translateY: slideAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [420, 0],
                  }),
                },
              ],
            },
          ]}
        >
          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>👤 Profil</Text>
            <TouchableOpacity onPress={closeProfile}>
              <Text style={styles.closeX}>✕</Text>
            </TouchableOpacity>
          </View>

          {profileLoading || !profile ? (
            <View style={{ paddingVertical: 30, alignItems: 'center' }}>
              <ActivityIndicator color="#1DB954" />
              <Text style={{ color: '#bbb', marginTop: 10 }}>Učitavam profil…</Text>
            </View>
          ) : (
            <ScrollView contentContainerStyle={{ paddingBottom: 24 }}>
              <Text style={styles.name}>{profile.name}</Text>
              <Text style={styles.meta}>
                Match: <Text style={styles.metaStrong}>{profile.match}%</Text>
                {profile.spotify_connected ? <Text>  •  🎵 Spotify</Text> : <Text>  •  Manual</Text>}
              </Text>

              <Text style={styles.section}>🎵 Top 5 pjesama</Text>
              {profile.top5.length === 0 ? (
                <Text style={styles.empty}>Nema spremljenih pjesama.</Text>
              ) : (
                profile.top5.map((t, i) => (
                  <View key={`${t.title}-${i}`} style={styles.trackRow}>
                    <Text style={styles.trackIdx}>{i + 1}.</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.trackTitle} numberOfLines={1}>
                        {t.title}
                      </Text>
                      <Text style={styles.trackArtist} numberOfLines={1}>
                        {t.artist}
                      </Text>
                    </View>
                  </View>
                ))
              )}

              <TouchableOpacity style={styles.chatBtn} onPress={openChat} disabled={isBlocked}>
                <Text style={styles.chatBtnText}>{isBlocked ? '🚫 Blokiran (chat onemogućen)' : '💬 Otvori chat'}</Text>
              </TouchableOpacity>

              {!isBlocked ? (
                <TouchableOpacity style={styles.blockBtn} onPress={blockUser}>
                  <Text style={styles.blockBtnText}>⛔ Block</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity style={styles.unblockBtn} onPress={unblockUser}>
                  <Text style={styles.unblockBtnText}>✅ Unblock</Text>
                </TouchableOpacity>
              )}

              <Text style={styles.note}>
                Blokirani korisnici se ne prikazuju na mapi i ne mogu ti slati poruke.
              </Text>
            </ScrollView>
          )}
        </Animated.View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212' },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#121212' },
  map: { flex: 1 },

  bottomBar: {
    flexDirection: 'row',
    gap: 10,
    padding: 10,
    backgroundColor: '#1E1E1E',
    borderTopWidth: 1,
    borderTopColor: '#2b2b2b',
  },
  btn: {
    flex: 1,
    backgroundColor: '#333',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  btnText: { color: '#fff', fontWeight: '800' },

  markerWrap: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#111',
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  markerPct: { fontWeight: '900', fontSize: 14 },
  markerSpotify: { fontSize: 10, marginTop: 2, color: '#fff' },

  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  sheet: {
    position: 'absolute',
    left: 10,
    right: 10,
    bottom: 10,
    backgroundColor: '#1E1E1E',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#2b2b2b',
    padding: 14,
    maxHeight: '75%',
  },
  sheetHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sheetTitle: { color: '#1DB954', fontWeight: '900', fontSize: 16 },
  closeX: { color: '#fff', fontSize: 20, fontWeight: '900' },

  name: { color: '#fff', fontSize: 20, fontWeight: '900', marginTop: 10 },
  meta: { color: '#bbb', marginTop: 6 },
  metaStrong: { color: '#fff', fontWeight: '900' },

  section: { color: '#fff', fontWeight: '900', marginTop: 14, marginBottom: 10 },
  empty: { color: '#888' },

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
  trackIdx: { color: '#1DB954', fontWeight: '900', width: 26 },
  trackTitle: { color: '#fff', fontWeight: '800' },
  trackArtist: { color: '#aaa', marginTop: 2, fontSize: 12 },

  chatBtn: {
    marginTop: 12,
    backgroundColor: '#1DB954',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  chatBtnText: { color: '#fff', fontWeight: '900', fontSize: 16 },

  blockBtn: {
    marginTop: 10,
    backgroundColor: '#FF6B6B',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  blockBtnText: { color: '#fff', fontWeight: '900' },

  unblockBtn: {
    marginTop: 10,
    backgroundColor: '#333',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#444',
  },
  unblockBtnText: { color: '#fff', fontWeight: '900' },

  note: { color: '#777', fontSize: 12, marginTop: 10, lineHeight: 16 },
});
