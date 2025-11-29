import React, { useEffect, useRef } from 'react';
import { ImageBackground, Text, StyleSheet, Animated, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');

type SplashScreenProps = {
  onFinish: () => void; // Callback when animation ends
};

const SplashScreen= ({ onFinish }: SplashScreenProps) => {
  const translateX = useRef(new Animated.Value(-150)).current;

  useEffect(() => {
    // Bus animation sequence: come in, pause, leave
    Animated.sequence([
      Animated.timing(translateX, {
        toValue: width / 2 - 75, // Stop in center
        duration: 2000,
        useNativeDriver: true,
      }),
      Animated.delay(1000), // Pause
      Animated.timing(translateX, {
        toValue: width + 150, // Move off-screen
        duration: 2000,
        useNativeDriver: true,
      }),
    ]).start(() => onFinish());
  }, []);

  return (
    <ImageBackground
      source={require('./assets/prometnovi.jpg')}
      style={styles.container}
      resizeMode="cover"
    >
      <Text style={styles.title}>PROMET Split</Text>
      <Text style={styles.subtitle}>Made by Paradižot</Text>
      <Animated.View style={[styles.bus, { transform: [{ translateX }] }]}>
        <Text style={styles.busText}>🚌</Text>
      </Animated.View>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    marginTop: 100,
    fontSize: 28,
    color: '#fff',
    marginBottom: 50,
    fontWeight: 'bold',
  },
    subtitle: {
      fontSize: 16,
      color: '#fff',
      marginBottom: 50,
      fontStyle: 'italic',
    },
  bus: {
    width: 150,
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
  },
  busText: {
    fontSize: 60,
  },
});

export default SplashScreen;
