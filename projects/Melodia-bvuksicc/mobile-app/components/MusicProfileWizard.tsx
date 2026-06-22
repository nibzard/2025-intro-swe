// components/MusicProfileWizard.tsx
import React, { useEffect, useMemo, useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { supabase } from '../lib/supabase';
import { Session } from '@supabase/supabase-js';
import SpotifyConnect from './SpotifyConnect';
import { useFocusEffect } from '@react-navigation/native';

type TrackManual = { name: string; artist: string };

type MusicProfileRow = {
  user_id: string;
  data_source: 'spotify' | 'lastfm' | 'manual' | 'none';
  top_genres: string[] | null;
  top_tracks: any[] | null;
  spotify_id: string | null;
  lastfm_username: string | null;
  updated_at?: string | null;
};

type Props = {
  onComplete?: () => void;
};

type WizardStep = 'selection' | 'spotify_connect' | 'manual_selection';

const normalizeTracks = (raw: any[] | null | undefined): Array<{ title: string; artist: string }> => {
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
    .filter(Boolean) as Array<{ title: string; artist: string }>;
};

const normalizeGenres = (raw: any): string[] => (Array.isArray(raw) ? raw.map((g) => String(g)) : []);

export default function MusicProfileWizard({ onComplete }: Props) {
  const [step, setStep] = useState<WizardStep>('selection');
  const [loading, setLoading] = useState(false);
  const [session, setSession] = useState<Session | null>(null);

  const [profile, setProfile] = useState<MusicProfileRow | null>(null);

  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [manualTracks, setManualTracks] = useState<TrackManual[]>(
    Array.from({ length: 10 }).map(() => ({ name: '', artist: '' }))
  );

  const ALL_GENRES = useMemo(
    () => ['Pop', 'Rock', 'Hip Hop', 'Electronic', 'Indie', 'Jazz', 'Classical'],
    []
  );

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user?.id) refreshProfile(session.user.id);
    });
  }, []);

  // ✅ refresh kad se vratiš u tab
  useFocusEffect(
    useCallback(() => {
      if (session?.user?.id) refreshProfile(session.user.id);
    }, [session?.user?.id])
  );

  const refreshProfile = async (userId: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('music_profiles')
        .select('user_id, data_source, top_genres, top_tracks, spotify_id, lastfm_username, updated_at')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) throw error;
      setProfile((data as MusicProfileRow) || null);
    } catch (e: any) {
      console.log('refreshProfile error:', e?.message || e);
      setProfile(null);
    } finally {
      setLoading(false);
    }
  };

  // ✅ BITNO: ne oslanjaj se na session state (Spotify callback zna doći prije nego state sjedne)
  const saveProfile = async (partial: Partial<MusicProfileRow>) => {
    setLoading(true);

    try {
      const { data: sessData, error: sessErr } = await supabase.auth.getSession();
      if (sessErr) throw sessErr;

      const userId = sessData.session?.user?.id;
      if (!userId) {
        Alert.alert('Greška', 'Nisi prijavljen (nema session).');
        return;
      }

      const payload = {
        user_id: userId,
        updated_at: new Date().toISOString(),
        ...partial,
      };

      const { data, error } = await supabase
        .from('music_profiles')
        .upsert(payload, { onConflict: 'user_id' })
        .select('user_id, data_source, top_genres, top_tracks, spotify_id, lastfm_username, updated_at')
        .single();

      if (error) throw error;

      setProfile(data as MusicProfileRow);
      onComplete?.();
      Alert.alert('✅ Spremljeno', 'Glazbeni profil je ažuriran.');
    } catch (e: any) {
      console.log('saveProfile error:', e?.message || e);
      Alert.alert('Greška', e?.message || 'Ne mogu spremiti profil.');
    } finally {
      setLoading(false);
    }
  };

  const clearManual = async () => {
    await saveProfile({
      data_source: 'none',
      top_genres: [],
      top_tracks: [],
      spotify_id: null,
      lastfm_username: null,
    });
  };

  // ---- MANUAL ----
  const toggleGenre = (genre: string) => {
    setSelectedGenres((prev) =>
      prev.includes(genre) ? prev.filter((g) => g !== genre) : [...prev, genre]
    );
  };

  const updateTrack = (index: number, field: keyof TrackManual, value: string) => {
    const updated = [...manualTracks];
    updated[index] = { ...updated[index], [field]: value };
    setManualTracks(updated);
  };

  const saveManualProfile = async () => {
    const validTracks = manualTracks
      .filter((t) => t.name.trim() && t.artist.trim())
      .slice(0, 10);

    if (selectedGenres.length === 0 || validTracks.length === 0) {
      Alert.alert('Upozorenje', 'Odaberi barem jedan žanr i barem jednu pjesmu.');
      return;
    }

    await saveProfile({
      data_source: 'manual',
      top_genres: selectedGenres,
      top_tracks: validTracks as any,
      spotify_id: null,
      lastfm_username: null,
    });
  };

  const renderCurrentProfile = () => {
    const ds = profile?.data_source || 'none';
    const genres = normalizeGenres(profile?.top_genres);
    const tracks = normalizeTracks(profile?.top_tracks);

    return (
      <View style={styles.profileCard}>
        <View style={styles.profileHeaderRow}>
          <Text style={styles.profileTitle}>🎧 Tvoj glazbeni profil</Text>

          <TouchableOpacity
            style={styles.smallBtn}
            onPress={async () => {
              const { data: sessData } = await supabase.auth.getSession();
              const uid = sessData.session?.user?.id;
              if (uid) refreshProfile(uid);
            }}
          >
            <Text style={styles.smallBtnText}>🔄 Refresh</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.metaText}>
          Izvor: <Text style={styles.metaStrong}>{ds}</Text>
        </Text>

        <Text style={styles.metaText}>
          Žanrovi:{' '}
          <Text style={styles.metaStrong}>{genres.length ? genres.join(', ') : '—'}</Text>
        </Text>

        <Text style={styles.metaText}>
          Broj pjesama: <Text style={styles.metaStrong}>{tracks.length}</Text>
        </Text>

        <Text style={styles.sectionHeader}>🎵 Top 5</Text>

        {tracks.length === 0 ? (
          <Text style={styles.emptyText}>Nema spremljenih pjesama. Spoji Spotify ili unesi ručno.</Text>
        ) : (
          tracks.slice(0, 5).map((t, i) => (
            <View key={`${t.title}-${i}`} style={styles.trackRow}>
              <Text style={styles.trackIndex}>{i + 1}.</Text>
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

        <View style={{ flexDirection: 'row', gap: 10, marginTop: 14 }}>
          <TouchableOpacity style={styles.actionBtn} onPress={() => setStep('spotify_connect')}>
            <Text style={styles.actionBtnText}>🎵 Spoji Spotify</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionBtn} onPress={() => setStep('manual_selection')}>
            <Text style={styles.actionBtnText}>✍️ Ručni unos</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.dangerBtn} onPress={clearManual}>
          <Text style={styles.dangerBtnText}>🗑️ Očisti ručni unos (da Spotify preuzme)</Text>
        </TouchableOpacity>

        <Text style={styles.note}>Napomena: matching radi najbolje kad oba korisnika imaju Spotify podatke.</Text>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#1DB954" />
        <Text style={styles.loadingText}>Učitavanje...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
      {renderCurrentProfile()}

      {step === 'selection' ? (
        <View style={styles.stepCard}>
          <Text style={styles.stepTitle}>Odaberi kako želiš postaviti glazbu</Text>
          <Text style={styles.hint}>Možeš kasnije promijeniti. Spotify automatski povuče top pjesme.</Text>
        </View>
      ) : null}

      {step === 'spotify_connect' ? (
        <View style={styles.stepCard}>
          <Text style={styles.stepTitle}>🎵 Spotify connect</Text>
          <Text style={styles.hint}>Spoji Spotify i spremit ćemo pjesme + žanrove u bazu.</Text>

          <SpotifyConnect
            // ✅ OVO je ključ: Spotify vraća data, mi odmah spremimo u DB
            onData={async ({ tracks, genres }) => {
              await saveProfile({
                data_source: 'spotify',
                top_tracks: tracks as any,
                top_genres: genres,
                spotify_id: 'connected',
                lastfm_username: null,
              });
            }}
            onConnectSuccess={async () => {
              const { data: sessData } = await supabase.auth.getSession();
              const uid = sessData.session?.user?.id;
              if (uid) await refreshProfile(uid);

              setStep('selection');
              onComplete?.();
            }}
          />

          <TouchableOpacity style={styles.backBtn} onPress={() => setStep('selection')}>
            <Text style={styles.backText}>← Nazad</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      {step === 'manual_selection' ? (
        <View style={styles.stepCard}>
          <Text style={styles.stepTitle}>✍️ Ručni unos (max 10)</Text>

          <Text style={styles.subtitle}>Žanrovi</Text>
          <View style={styles.genres}>
            {ALL_GENRES.map((g) => (
              <TouchableOpacity
                key={g}
                style={[styles.genre, selectedGenres.includes(g) && styles.genreSelected]}
                onPress={() => toggleGenre(g)}
              >
                <Text style={styles.genreText}>{g}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.subtitle}>Pjesme</Text>
          {manualTracks.map((t, i) => (
            <View key={i} style={{ marginBottom: 10 }}>
              <TextInput
                style={styles.input}
                placeholder={`Pjesma #${i + 1}`}
                placeholderTextColor="#888"
                value={t.name}
                onChangeText={(v) => updateTrack(i, 'name', v)}
              />
              <TextInput
                style={styles.input}
                placeholder="Izvođač"
                placeholderTextColor="#888"
                value={t.artist}
                onChangeText={(v) => updateTrack(i, 'artist', v)}
              />
            </View>
          ))}

          <TouchableOpacity style={styles.saveBtn} onPress={saveManualProfile}>
            <Text style={styles.saveBtnText}>✓ Spremi ručno</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.backBtn} onPress={() => setStep('selection')}>
            <Text style={styles.backText}>← Nazad</Text>
          </TouchableOpacity>
        </View>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212', padding: 16 },
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#121212' },
  loadingText: { color: '#fff', marginTop: 10 },

  profileCard: {
    backgroundColor: '#1E1E1E',
    borderRadius: 14,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#2b2b2b',
  },
  profileHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  profileTitle: { color: '#1DB954', fontSize: 18, fontWeight: '800' },

  smallBtn: { backgroundColor: '#333', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10 },
  smallBtnText: { color: '#fff', fontWeight: '700' },

  metaText: { color: '#bbb', marginTop: 6, lineHeight: 18 },
  metaStrong: { color: '#fff', fontWeight: '700' },

  sectionHeader: { color: '#fff', fontSize: 16, fontWeight: '800', marginTop: 12, marginBottom: 8 },
  emptyText: { color: '#888', lineHeight: 18 },

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
  trackTitle: { color: '#fff', fontWeight: '700' },
  trackArtist: { color: '#aaa', marginTop: 2, fontSize: 12 },

  actionBtn: { flex: 1, backgroundColor: '#1DB954', paddingVertical: 12, borderRadius: 12, alignItems: 'center' },
  actionBtnText: { color: '#fff', fontWeight: '800' },

  dangerBtn: {
    marginTop: 12,
    backgroundColor: '#333',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  dangerBtnText: { color: '#fff', fontWeight: '800' },

  note: { color: '#777', fontSize: 12, marginTop: 10, lineHeight: 16 },

  stepCard: {
    backgroundColor: '#1E1E1E',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#2b2b2b',
  },
  stepTitle: { color: '#fff', fontSize: 18, fontWeight: '800', marginBottom: 10 },
  hint: { color: '#888', lineHeight: 18, marginBottom: 10 },

  subtitle: { color: '#fff', fontSize: 15, fontWeight: '700', marginTop: 10, marginBottom: 8 },

  genres: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 10 },
  genre: { borderWidth: 1, borderColor: '#333', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6, margin: 4 },
  genreSelected: { backgroundColor: '#1DB954', borderColor: '#1DB954' },
  genreText: { color: '#fff' },

  input: {
    backgroundColor: '#151515',
    borderWidth: 1,
    borderColor: '#2b2b2b',
    borderRadius: 10,
    padding: 12,
    color: '#fff',
    marginBottom: 6,
  },
  saveBtn: { marginTop: 10, backgroundColor: '#1DB954', paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  saveBtnText: { color: '#fff', fontWeight: '900' },

  backBtn: { alignItems: 'center', marginTop: 14 },
  backText: { color: '#aaa', fontWeight: '800' },
});
