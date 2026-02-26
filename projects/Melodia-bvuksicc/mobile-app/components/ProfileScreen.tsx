import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
} from 'react-native';
import { Session } from '@supabase/supabase-js';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '../lib/supabase';

type Props = { session: Session };

type UserRow = {
  id: string;
  email: string | null;
  full_name: string | null;
  bio: string | null;
  avatar_url: string | null;
};

type BlockedRow = {
  blocked_id: string;
  other_name: string;
};

export default function ProfileScreen({ session }: Props) {
  const userId = session.user.id;
  const email = useMemo(() => session.user.email || '', [session.user.email]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [fullName, setFullName] = useState('');
  const [bio, setBio] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  const [blockedLoading, setBlockedLoading] = useState(false);
  const [blocked, setBlocked] = useState<BlockedRow[]>([]);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, email, full_name, bio, avatar_url')
        .eq('id', userId)
        .single();

      if (error) throw error;

      const row = data as UserRow;
      setFullName(row.full_name || (row.email ? row.email.split('@')[0] : ''));
      setBio(row.bio || '');
      setAvatarUrl(row.avatar_url || null);
    } catch (e: any) {
      console.log('fetchProfile error:', e?.message || e);
      Alert.alert('Greška', e?.message || 'Ne mogu dohvatiti profil.');
    } finally {
      setLoading(false);
    }
  };

  const fetchBlocked = async () => {
    setBlockedLoading(true);
    try {
      const { data: bRows, error: bErr } = await supabase
        .from('blocked_users')
        .select('blocked_id')
        .eq('blocker_id', userId);

      if (bErr) throw bErr;

      const ids = (bRows || []).map((x: any) => x.blocked_id);
      if (!ids.length) {
        setBlocked([]);
        return;
      }

      // fetch user names/emails for blocked ids
      const { data: users, error: uErr } = await supabase
        .from('users')
        .select('id, full_name, email')
        .in('id', ids);

      if (uErr) throw uErr;

      const map = new Map<string, { full_name: string | null; email: string | null }>();
      for (const u of users || []) map.set(u.id, { full_name: u.full_name, email: u.email });

      const list: BlockedRow[] = ids.map((id) => {
        const u = map.get(id);
        const name =
          u?.full_name ||
          (u?.email ? u.email.split('@')[0] : null) ||
          u?.email ||
          'Korisnik';
        return { blocked_id: id, other_name: name };
      });

      setBlocked(list);
    } catch (e: any) {
      console.log('fetchBlocked error:', e?.message || e);
      // ako nema tablice/policy, neće crashat app — samo pokaže poruku
      setBlocked([]);
    } finally {
      setBlockedLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
    fetchBlocked();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const saveProfile = async () => {
    setSaving(true);
    try {
      const payload = {
        full_name: fullName.trim(),
        bio: bio.trim(),
      };

      const { error } = await supabase.from('users').update(payload).eq('id', userId);
      if (error) throw error;

      Alert.alert('✅ Spremljeno', 'Profil je ažuriran.');
      await fetchProfile();
    } catch (e: any) {
      console.log('saveProfile error:', e?.message || e);
      Alert.alert('Greška', e?.message || 'Ne mogu spremiti profil.');
    } finally {
      setSaving(false);
    }
  };

  const pickAndUploadAvatar = async () => {
    try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        Alert.alert('Dozvola', 'Trebaš dopustiti pristup galeriji.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.9,
      });

      if (result.canceled) return;

      const asset = result.assets[0];
      const uri = asset.uri;

      const res = await fetch(uri);
      const arrayBuffer = await res.arrayBuffer();
      const bytes = new Uint8Array(arrayBuffer);

      const ext = (uri.split('.').pop() || 'jpg').toLowerCase();
      const fileName = `${userId}/avatar_${Date.now()}.${ext}`;

      const contentType =
        asset.mimeType ||
        (ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : 'image/jpeg');

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, bytes, { contentType, upsert: true });

      if (uploadError) throw uploadError;

      const { data: publicData } = supabase.storage.from('avatars').getPublicUrl(fileName);
      const publicUrl = publicData.publicUrl;

      const { error: updateError } = await supabase
        .from('users')
        .update({ avatar_url: publicUrl })
        .eq('id', userId);

      if (updateError) throw updateError;

      const busted = `${publicUrl}?t=${Date.now()}`;
      setAvatarUrl(busted);

      Alert.alert('✅ Slika spremljena', 'Avatar je uspješno postavljen.');
    } catch (e: any) {
      console.log('pickAndUploadAvatar error:', e?.message || e);
      Alert.alert('Greška pri uploadu', e?.message || 'Ne mogu spremiti sliku. Pokušaj ponovo.');
    }
  };

  const unblock = async (blockedId: string) => {
    try {
      const { error } = await supabase
        .from('blocked_users')
        .delete()
        .eq('blocker_id', userId)
        .eq('blocked_id', blockedId);

      if (error) throw error;

      Alert.alert('✅ Odblokirano', 'Korisnik je odblokiran.');
      await fetchBlocked();
    } catch (e: any) {
      Alert.alert('Greška', e?.message || 'Ne mogu odblokirati.');
    }
  };

  const logout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } catch (e: any) {
      Alert.alert('Greška', e?.message || 'Odjava nije uspjela.');
    }
  };

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#1DB954" />
        <Text style={styles.loadingText}>Učitavam profil…</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
      <Text style={styles.title}>👤 Profil</Text>

      <View style={styles.card}>
        <Text style={styles.label}>Email</Text>
        <Text style={styles.value}>{email}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Profilna slika</Text>

        <View style={styles.avatarRow}>
          <View style={styles.avatarWrap}>
            {avatarUrl ? (
              <Image
                source={{ uri: avatarUrl }}
                style={styles.avatar}
                onError={(e) => console.log('❌ Avatar load error:', e?.nativeEvent)}
              />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarPlaceholderText}>🙂</Text>
              </View>
            )}
          </View>

          <TouchableOpacity style={styles.avatarBtn} onPress={pickAndUploadAvatar}>
            <Text style={styles.avatarBtnText}>📷 Odaberi sliku</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Ime i prezime</Text>
        <TextInput
          style={styles.input}
          value={fullName}
          onChangeText={setFullName}
          placeholder="npr. Marko Perković"
          placeholderTextColor="#777"
        />

        <Text style={[styles.label, { marginTop: 14 }]}>O meni</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={bio}
          onChangeText={setBio}
          placeholder="Napiši nešto kratko…"
          placeholderTextColor="#777"
          multiline
        />

        <TouchableOpacity style={[styles.saveBtn, saving && styles.btnDisabled]} onPress={saveProfile} disabled={saving}>
          {saving ? (
            <>
              <ActivityIndicator color="#fff" />
              <Text style={[styles.saveBtnText, { marginLeft: 10 }]}>Spremam…</Text>
            </>
          ) : (
            <Text style={styles.saveBtnText}>💾 Spremi promjene</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* ✅ BLOCKED LIST */}
      <View style={styles.card}>
        <View style={styles.blockedHeader}>
          <Text style={styles.sectionTitle}>⛔ Blokirani korisnici</Text>
          <TouchableOpacity style={styles.smallBtn} onPress={fetchBlocked} disabled={blockedLoading}>
            <Text style={styles.smallBtnText}>{blockedLoading ? '...' : '🔄'}</Text>
          </TouchableOpacity>
        </View>

        {blockedLoading ? (
          <Text style={{ color: '#aaa' }}>Učitavam…</Text>
        ) : blocked.length === 0 ? (
          <Text style={{ color: '#888' }}>Nema blokiranih korisnika.</Text>
        ) : (
          blocked.map((b) => (
            <View key={b.blocked_id} style={styles.blockRow}>
              <Text style={styles.blockName} numberOfLines={1}>{b.other_name}</Text>
              <TouchableOpacity
                style={styles.unblockBtn}
                onPress={() =>
                  Alert.alert('Odblokiranje', `Odblokirati: ${b.other_name}?`, [
                    { text: 'Ne', style: 'cancel' },
                    { text: 'Da', style: 'destructive', onPress: () => unblock(b.blocked_id) },
                  ])
                }
              >
                <Text style={styles.unblockText}>Odblokiraj</Text>
              </TouchableOpacity>
            </View>
          ))
        )}

        <Text style={styles.hint}>
          Blokirani korisnici se ne prikazuju na mapi i u chat listi.
        </Text>
      </View>

      <View style={styles.card}>
        <TouchableOpacity style={styles.refreshBtn} onPress={fetchProfile}>
          <Text style={styles.refreshText}>🔄 Osvježi profil</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
          <Text style={styles.logoutText}>🚪 Odjava</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212', padding: 16 },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#121212' },
  loadingText: { color: '#fff', marginTop: 12 },

  title: { color: '#1DB954', fontSize: 26, fontWeight: 'bold', marginBottom: 16, textAlign: 'center' },

  card: {
    backgroundColor: '#1E1E1E',
    borderRadius: 14,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#2b2b2b',
  },
  label: { color: '#9a9a9a', fontSize: 12, marginBottom: 6 },
  value: { color: '#fff', fontSize: 16, fontWeight: '600' },

  input: {
    backgroundColor: '#151515',
    borderWidth: 1,
    borderColor: '#2b2b2b',
    borderRadius: 10,
    padding: 12,
    color: '#fff',
    fontSize: 16,
  },
  textArea: { minHeight: 90, textAlignVertical: 'top' },

  saveBtn: {
    marginTop: 16,
    backgroundColor: '#1DB954',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  btnDisabled: { opacity: 0.7 },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },

  avatarRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  avatarWrap: { width: 72, height: 72, borderRadius: 36, overflow: 'hidden', backgroundColor: '#151515' },
  avatar: { width: '100%', height: '100%' },
  avatarPlaceholder: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  avatarPlaceholderText: { fontSize: 30 },

  avatarBtn: { backgroundColor: '#333', paddingVertical: 12, paddingHorizontal: 14, borderRadius: 12 },
  avatarBtnText: { color: '#fff', fontWeight: '700' },

  hint: { color: '#777', fontSize: 12, marginTop: 10, lineHeight: 16 },

  refreshBtn: { backgroundColor: '#333', paddingVertical: 14, borderRadius: 12, alignItems: 'center', marginBottom: 10 },
  refreshText: { color: '#fff', fontWeight: '700' },

  logoutBtn: { backgroundColor: '#FF6B6B', paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  logoutText: { color: '#fff', fontWeight: '800' },

  sectionTitle: { color: '#fff', fontWeight: '900', fontSize: 16 },

  blockedHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  smallBtn: { backgroundColor: '#333', paddingHorizontal: 10, paddingVertical: 8, borderRadius: 10 },
  smallBtnText: { color: '#fff', fontWeight: '900' },

  blockRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#2b2b2b',
  },
  blockName: { color: '#ddd', fontWeight: '700', flex: 1, marginRight: 10 },
  unblockBtn: { backgroundColor: '#333', paddingVertical: 10, paddingHorizontal: 12, borderRadius: 10 },
  unblockText: { color: '#fff', fontWeight: '900', fontSize: 12 },
});
