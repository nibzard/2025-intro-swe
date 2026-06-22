import React, { useEffect, useState } from 'react';
import { View, Text, Button, ScrollView, StyleSheet, Alert } from 'react-native';
import { supabase, testSupabaseConnection } from '../lib/supabase';

export default function DatabaseTest() {
  const [connectionStatus, setConnectionStatus] = useState<string>('Checking...');
  const [databaseStats, setDatabaseStats] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);

  useEffect(() => {
    testConnection();
    fetchDatabaseStats();
  }, []);

  const testConnection = async () => {
    const result = await testSupabaseConnection();
    setConnectionStatus(result.success ? '✅ Connected' : `❌ Error: ${result.error?.message}`);
  };

  const fetchDatabaseStats = async () => {
    try {
      // Dohvati broj korisnika
      const { count: usersCount } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true });

      // Dohvati broj profila
      const { count: profilesCount } = await supabase
        .from('music_profiles')
        .select('*', { count: 'exact', head: true });

      // Dohvati nekoliko korisnika s profilima
      const { data: usersData } = await supabase
        .from('users')
        .select(`
          *,
          music_profiles (*)
        `)
        .limit(5);

      setDatabaseStats({
        users: usersCount || 0,
        profiles: profilesCount || 0,
      });

      setUsers(usersData || []);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const createTestUser = async () => {
    try {
      const testUser = {
        email: `mobile_test_${Date.now()}@email.com`,
        full_name: `Mobile Test User ${Date.now()}`,
        latitude: 43.5000 + (Math.random() * 0.1),
        longitude: 16.4400 + (Math.random() * 0.1),
      };

      const { data, error } = await supabase
        .from('users')
        .insert([testUser])
        .select();

      if (error) throw error;

      Alert.alert('✅ Success', `User created: ${testUser.email}`);
      fetchDatabaseStats();
    } catch (error: any) {
      Alert.alert('❌ Error', error.message);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🛠️ Database Test</Text>
      
      <View style={styles.statusBox}>
        <Text style={styles.statusTitle}>Connection Status:</Text>
        <Text style={[
          styles.statusText,
          connectionStatus.includes('✅') ? styles.statusSuccess : styles.statusError
        ]}>
          {connectionStatus}
        </Text>
      </View>

      {databaseStats && (
        <View style={styles.statsBox}>
          <Text style={styles.statsTitle}>Database Statistics:</Text>
          <View style={styles.statsRow}>
            <Text>👥 Users: {databaseStats.users}</Text>
            <Text>🎵 Music Profiles: {databaseStats.profiles}</Text>
          </View>
        </View>
      )}

      <View style={styles.buttonRow}>
        <Button title="🔁 Test Connection" onPress={testConnection} />
        <Button title="➕ Add Test User" onPress={createTestUser} color="green" />
        <Button title="📊 Refresh Stats" onPress={fetchDatabaseStats} color="blue" />
      </View>

      <ScrollView style={styles.usersList}>
        <Text style={styles.sectionTitle}>Sample Users:</Text>
        
        {users.length === 0 ? (
          <Text style={styles.emptyText}>No users found</Text>
        ) : (
          users.map((user) => (
            <View key={user.id} style={styles.userCard}>
              <Text style={styles.userName}>{user.full_name || user.email}</Text>
              <Text style={styles.userEmail}>📧 {user.email}</Text>
              <Text style={styles.userLocation}>
                📍 {user.latitude?.toFixed(4)}, {user.longitude?.toFixed(4)}
              </Text>
              
              {user.music_profiles && user.music_profiles.length > 0 && (
                <View style={styles.profileInfo}>
                  <Text style={styles.profileTitle}>Music Profile:</Text>
                  <Text style={styles.profileText}>
                    Genres: {JSON.parse(user.music_profiles[0]?.top_genres || '[]').join(', ') || 'None'}
                  </Text>
                </View>
              )}
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f0f2f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  statusBox: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statusTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 5,
  },
  statusText: {
    fontSize: 14,
  },
  statusSuccess: {
    color: 'green',
  },
  statusError: {
    color: 'red',
  },
  statsBox: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statsTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  usersList: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 10,
  },
  emptyText: {
    textAlign: 'center',
    color: '#666',
    marginTop: 20,
  },
  userCard: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  userName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  userEmail: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  userLocation: {
    fontSize: 12,
    color: '#888',
    marginBottom: 10,
  },
  profileInfo: {
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 10,
    marginTop: 5,
  },
  profileTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#555',
    marginBottom: 3,
  },
  profileText: {
    fontSize: 11,
    color: '#777',
  },
});