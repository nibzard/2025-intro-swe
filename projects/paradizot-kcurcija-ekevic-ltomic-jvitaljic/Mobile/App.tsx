import React, { useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import SplashScreen from './BusLoading';
import HomeScreen from './HomeScreen';

export default function App() {
  const [loading, setLoading] = useState(true);

  return (
    <SafeAreaView style={{ flex: 1 }}>
      {loading ? (
        <SplashScreen onFinish={() => setLoading(false)} />
      ) : (
        <HomeScreen />
      )}
    </SafeAreaView>
  );
}


