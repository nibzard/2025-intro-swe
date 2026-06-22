import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, Platform } from 'react-native';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Session, User } from '@supabase/supabase-js';

import { supabase } from './lib/supabase';

import Auth from './components/Auth';
import MapScreen from './components/MapScreen';
import MusicProfileWizard from './components/MusicProfileWizard';
import ProfileScreen from './components/ProfileScreen';
import ChatListScreen from './components/ChatListScreen';
import ChatScreen from './components/ChatScreen';
import UserProfileScreen from './components/UserProfileScreen';

/* ------------------ THEME ------------------ */

const MyTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: '#121212',
    card: '#1E1E1E',
    text: '#FFFFFF',
    border: '#333333',
    primary: '#1DB954',
  },
};

/* ------------------ NAV TYPES ------------------ */

export type RootStackParamList = {
  Home: undefined;
  Chat: {
    chatId: string;
    otherUserId: string;
    otherUserName: string;
  };
  UserProfile: {
    userId: string;
    userName?: string;
    userEmail?: string;
  };
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator();

/* ------------------ TABS ------------------ */

function Tabs({ session }: { session: Session }) {
  return (
    <Tab.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: '#1E1E1E' },
        headerTintColor: '#fff',
        tabBarStyle: {
          backgroundColor: '#1E1E1E',
          height: Platform.OS === 'ios' ? 85 : 60,
          paddingBottom: Platform.OS === 'ios' ? 20 : 6,
        },
        tabBarActiveTintColor: '#1DB954',
        tabBarInactiveTintColor: '#888',
      }}
    >
      <Tab.Screen
        name="Mapa"
        options={{ tabBarIcon: ({ color }) => <Text style={{ color }}>🗺️</Text> }}
      >
        {() => <MapScreen session={session} />}
      </Tab.Screen>

      <Tab.Screen
        name="Glazba"
        options={{ tabBarIcon: ({ color }) => <Text style={{ color }}>🎵</Text> }}
      >
        {() => <MusicProfileWizard />}
      </Tab.Screen>

      <Tab.Screen
        name="Chatovi"
        options={{ tabBarIcon: ({ color }) => <Text style={{ color }}>💬</Text> }}
      >
        {() => <ChatListScreen session={session} />}
      </Tab.Screen>

      <Tab.Screen
        name="Profil"
        options={{ tabBarIcon: ({ color }) => <Text style={{ color }}>👤</Text> }}
      >
        {() => <ProfileScreen session={session} />}
      </Tab.Screen>
    </Tab.Navigator>
  );
}

/* ------------------ APP ------------------ */

export default function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
      if (data.session?.user) ensureUser(data.session.user);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      if (nextSession?.user) ensureUser(nextSession.user);
    });

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  const ensureUser = async (user: User) => {
    await supabase.from('users').upsert(
      {
        id: user.id,
        email: user.email,
        full_name: user.email?.split('@')[0] || 'Korisnik',
      },
      { onConflict: 'id' }
    );

    await supabase.from('user_locations').upsert(
      {
        user_id: user.id,
        latitude: 0,
        longitude: 0,
      },
      { onConflict: 'user_id' }
    );
  };

  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: '#121212',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <ActivityIndicator size="large" color="#1DB954" />
        <Text style={{ color: '#fff', marginTop: 10 }}>Učitavanje…</Text>
      </View>
    );
  }

  return (
    <NavigationContainer theme={MyTheme}>
      {session ? (
        <Stack.Navigator>
          <Stack.Screen name="Home" options={{ headerShown: false }}>
            {() => <Tabs session={session} />}
          </Stack.Screen>

          <Stack.Screen name="UserProfile" options={{ title: 'Profil korisnika' }}>
            {({ route }) => (
              <UserProfileScreen
                session={session}
                userId={route.params.userId}
                userName={route.params.userName}
                userEmail={route.params.userEmail}
              />
            )}
          </Stack.Screen>

          <Stack.Screen name="Chat" options={{ title: 'Chat' }}>
            {({ route }) => (
              <ChatScreen
                session={session}
                chatId={route.params.chatId}
                otherUserId={route.params.otherUserId}
                otherUserName={route.params.otherUserName}
              />
            )}
          </Stack.Screen>
        </Stack.Navigator>
      ) : (
        <Auth />
      )}
    </NavigationContainer>
  );
}
