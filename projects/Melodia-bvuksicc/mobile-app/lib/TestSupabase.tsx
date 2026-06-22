import React, { useEffect, useState } from 'react';
import { View, Text, Button, ScrollView, StyleSheet } from 'react-native';
import { supabase } from '../lib/supabase';

interface User {
  id: string;
  email: string;
  full_name: string;
  latitude: number;
  longitude: number;
}

export default function TestSupabase() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Fetching users from Supabase...');
      
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .limit(10);

      if (error) {
        throw error;
      }

      console.log('Users fetched:', data?.length);
      setUsers(data || []);
    } catch (err: any) {
      setError(err.message);
      console.error('Error fetching users:', err);
    } finally {
      setLoading(false);
    }
  };

  const addTestUser = async () => {
    try {
      const testUser = {
        email: `test${Date.now()}@email.com`,
        full_name: `Test User ${Date.now()}`,
        latitude: 43.5000 + Math.random() * 0.1,
        longitude: 16.4400 + Math.random() * 0.1,
      };

      const { data, error } = await supabase
        .from('users')
        .insert([testUser])
        .select();

      if (error) throw error;

      alert(`✅ User added: ${testUser.email}`);
      fetchUsers();
    } catch (err: any) {
      alert(`❌ Error: ${err.message}`);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🎵 Supabase Connection Test</Text>
      
      <View style={styles.buttonContainer}>
        <Button title="🔄 Refresh Users" onPress={fetchUsers} />
        <View style={{ width: 10 }} />
        <Button title="➕ Add Test User" onPress={addTestUser} color="green" />
      </View>

      {error && (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>Error: {error}</Text>
        </View>
      )}

      {loading ? (
        <Text style={styles.loadingText}>Loading users...</Text>
      ) : (
        <ScrollView style={styles.listContainer}>
          <Text style={styles.subtitle}>Users ({users.length}):</Text>
          
          {users.length === 0 ? (
            <Text style={styles.emptyText}>No users found</Text>
          ) : (
            users.map((user) => (
              <View key={user.id} style={styles.userCard}>
                <Text style={styles.userName}>{user.full_name || 'No name'}</Text>
                <Text style={styles.userEmail}>📧 {user.email}</Text>
                <Text style={styles.userLocation}>
                  📍 {user.latitude?.toFixed(4)}, {user.longitude?.toFixed(4)}
                </Text>
                <Text style={styles.userId}>ID: {user.id.substring(0, 8)}...</Text>
              </View>
            ))
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  buttonContainer: {
    flexDirection: 'row',
    marginBottom: 20,
    justifyContent: 'center',
  },
  errorBox: {
    backgroundColor: '#ffebee',
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#f44336',
  },
  errorText: {
    color: '#d32f2f',
    fontSize: 14,
  },
  loadingText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 20,
  },
  listContainer: {
    flex: 1,
  },
  subtitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 10,
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 20,
    color: '#666',
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
    marginBottom: 5,
  },
  userId: {
    fontSize: 10,
    color: '#aaa',
    fontFamily: 'monospace',
  },
});