import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, ScrollView } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';
import { makeRedirectUri, useAuthRequest } from 'expo-auth-session';

WebBrowser.maybeCompleteAuthSession();

const discovery = {
  authorizationEndpoint: 'https://accounts.spotify.com/authorize',
  tokenEndpoint: 'https://accounts.spotify.com/api/token',
};

const SPOTIFY_CLIENT_ID = process.env.EXPO_PUBLIC_SPOTIFY_CLIENT_ID || '';

type SpotifyTrack = {
  id: string;
  name: string;
  artists: Array<{ name: string }>;
};

type SpotifyArtist = {
  id: string;
  name: string;
  genres: string[];
};

type Props = {
  onConnectSuccess?: () => void;
  onData?: (payload: { tracks: any[]; genres: string[] }) => void;
};

export default function SpotifyConnect({ onConnectSuccess, onData }: Props) {
  const [loading, setLoading] = useState(false);
  const [debugInfo, setDebugInfo] = useState<string[]>([]);

  const addDebug = (msg: string) => {
    const line = `${new Date().toLocaleTimeString()}: ${msg}`;
    console.log(`🔍 ${line}`);
    setDebugInfo((prev) => [...prev.slice(-30), line]);
  };

  const redirectUri = useMemo(() => {
    return makeRedirectUri({ scheme: 'exp', path: 'spotify-auth-callback' });
  }, []);

  useEffect(() => {
    addDebug(`Redirect URI: ${redirectUri}`);
    if (!SPOTIFY_CLIENT_ID) addDebug('❌ Missing EXPO_PUBLIC_SPOTIFY_CLIENT_ID');
  }, [redirectUri]);

  const [request, response, promptAsync] = useAuthRequest(
    {
      clientId: SPOTIFY_CLIENT_ID,
      scopes: ['user-read-email', 'user-read-private', 'user-top-read'],
      redirectUri,
      usePKCE: true,
      responseType: AuthSession.ResponseType.Code,
    },
    discovery
  );

  const fetchTopTracks = async (accessToken: string): Promise<SpotifyTrack[]> => {
    const res = await fetch('https://api.spotify.com/v1/me/top/tracks?limit=50&time_range=medium_term', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!res.ok) throw new Error(`Top tracks failed: ${res.status}`);
    const data = await res.json();
    return data.items || [];
  };

  const fetchTopArtists = async (accessToken: string): Promise<SpotifyArtist[]> => {
    const res = await fetch('https://api.spotify.com/v1/me/top/artists?limit=50&time_range=medium_term', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!res.ok) throw new Error(`Top artists failed: ${res.status}`);
    const data = await res.json();
    return data.items || [];
  };

  const extractTopGenres = (artists: SpotifyArtist[]): string[] => {
    const counts: Record<string, number> = {};
    for (const a of artists) for (const g of a.genres || []) counts[g] = (counts[g] || 0) + 1;
    return Object.entries(counts)
      .sort(([, x], [, y]) => y - x)
      .slice(0, 15)
      .map(([g]) => g);
  };

  useEffect(() => {
    (async () => {
      if (!response) return;
      if (response.type !== 'success') return;

      const code = response.params?.code;
      if (!code) {
        Alert.alert('Spotify', 'Nema auth code.');
        return;
      }
      if (!request?.codeVerifier) {
        Alert.alert('Spotify', 'Nedostaje PKCE codeVerifier.');
        return;
      }

      setLoading(true);
      setDebugInfo(['Starting Spotify PKCE flow...']);

      try {
        addDebug('Exchanging code for token...');
        const tokenResponse = await AuthSession.exchangeCodeAsync(
          {
            clientId: SPOTIFY_CLIENT_ID,
            code,
            redirectUri,
            extraParams: { code_verifier: request.codeVerifier },
          },
          discovery
        );

        const accessToken = tokenResponse.accessToken;
        if (!accessToken) throw new Error('No access token.');

        addDebug('Token OK. Fetching data...');
        const [tracks, artists] = await Promise.all([fetchTopTracks(accessToken), fetchTopArtists(accessToken)]);
        const genres = extractTopGenres(artists);

        // ✅ return data to Wizard (Wizard saves to DB)
        onData?.({ tracks, genres });

        Alert.alert('🎉 Spotify povezan!', `Top tracks: ${tracks.length}\nTop artists: ${artists.length}`);
        onConnectSuccess?.();
      } catch (e: any) {
        addDebug(`💥 Error: ${e.message}`);
        Alert.alert('Spotify nije uspio', e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [response, request, redirectUri]);

  const startAuth = async () => {
    if (!SPOTIFY_CLIENT_ID) {
      Alert.alert('Greška', 'Nedostaje EXPO_PUBLIC_SPOTIFY_CLIENT_ID u .env');
      return;
    }
    addDebug('Starting Spotify auth...');
    await promptAsync();
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[styles.connectButton, (!request || loading) && styles.buttonDisabled]}
        onPress={startAuth}
        disabled={!request || loading}
      >
        {loading ? (
          <>
            <ActivityIndicator color="#FFFFFF" size="small" />
            <Text style={[styles.connectText, { marginLeft: 10 }]}>Connecting...</Text>
          </>
        ) : (
          <>
            <Text style={styles.spotifyIcon}>🎵</Text>
            <Text style={styles.connectText}>Connect Spotify (PKCE)</Text>
          </>
        )}
      </TouchableOpacity>

      {debugInfo.length ? (
        <View style={styles.debugBox}>
          <Text style={styles.debugTitle}>DEBUG</Text>
          <ScrollView style={{ maxHeight: 140 }}>
            {debugInfo.map((l, i) => (
              <Text key={i} style={styles.debugText}>{l}</Text>
            ))}
          </ScrollView>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', marginVertical: 10, width: '100%' },
  connectButton: {
    flexDirection: 'row',
    backgroundColor: '#1DB954',
    paddingHorizontal: 30,
    paddingVertical: 16,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 250,
    marginBottom: 12,
  },
  buttonDisabled: { backgroundColor: '#999', opacity: 0.7 },
  spotifyIcon: { fontSize: 24, marginRight: 12 },
  connectText: { color: 'white', fontSize: 16, fontWeight: 'bold', textAlign: 'center' },

  debugBox: { width: '100%', backgroundColor: '#0A0A0A', borderRadius: 12, padding: 10, borderWidth: 1, borderColor: '#333' },
  debugTitle: { color: '#1DB954', fontWeight: '900', marginBottom: 6, fontSize: 12 },
  debugText: { color: '#888', fontSize: 10, fontFamily: 'monospace', marginBottom: 3 },
});
