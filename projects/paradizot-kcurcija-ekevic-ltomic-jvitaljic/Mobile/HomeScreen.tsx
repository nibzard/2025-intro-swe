import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Alert,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import SquareItem from './SquareComponent';
import RectangleItem from './RectangleComponent';

const HomeScreen = () => {

  const handlePress = (item: string) => {
    Alert.alert('Button Pressed', `${item} pressed`);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.logoContainer}>
          <Text style={styles.logoText}>PROMET</Text>
          <Image
            source={require('./assets/bus1.png')}
            style={styles.headerImage}
          />
        </View>
        <View style={styles.headerIcons}>
          <TouchableOpacity onPress={() => handlePress('Bell')}>
            <Text style={styles.iconText}>🔔</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => handlePress('Star')}>
            <Text style={styles.iconText}>⭐</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Scrollable Content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >

        {/* Grid of Squares */}
        <View style={styles.grid}>
          <SquareItem
            label="Planiraj putovanje"
            icon={require('./assets/map.png')}
            onPress={() => handlePress('Planiraj putovanje')}
          />

          <SquareItem
            label="Vozni red"
            icon={require('./assets/book.png')}
            onPress={() => handlePress('Vozni red')}
            style={{ marginLeft: '4%' }} 
          />

          <SquareItem
            label="Prodajna mjesta"
            icon={require('./assets/shop.jpg')}
            onPress={() => handlePress('Prodajna mjesta')}
          />

          <SquareItem
            label="Stanje u novčaniku"
            icon={require('./assets/wallet.png')}
            onPress={() => handlePress('Stanje u novčaniku')}
            style={{ marginLeft: '4%' }}
          />

          <SquareItem
            label="Moje karte"
            icon={require('./assets/ticket.png')}
            onPress={() => handlePress('Moje karte')}
          />

          <SquareItem
            label="Kupi kartu"
            icon={require('./assets/shoping_bag.png')}
            onPress={() => handlePress('Kupi kartu')}
            style={{ marginLeft: '4%' }}
          />

          <RectangleItem
            label="Aktiviraj puni profil"
            icon={require('./assets/profile.png')}
            onPress={() => handlePress('Aktiviraj puni profil')}
          />
        </View>


        {/* Nearby Stations */}
        <View style={styles.stationsSection}>
          <Text style={styles.sectionTitle}>STANICE U BLIZINI</Text>
          <View style={styles.mapPlaceholder}>
            <Text style={styles.mapText}>🗺️ Map View</Text>
            <Text style={styles.stationName}>SPINUT</Text>
          </View>
        </View>

        {/* Quote Section */}
        <View style={styles.quoteRectangle}>
          <Image
            source={require('./assets/paradizot.jpg')}
            style={styles.quoteImage}
          />
          <Text style={styles.quoteText}>Powered by Paradižot🧁</Text>
        </View>

      </ScrollView>


    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },

  header: {
    height: 70,
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  logoContainer: { flexDirection: 'row', alignItems: 'center' },
  logoText: { fontSize: 28, fontWeight: 'bold', color: '#0066cc', letterSpacing: 2 },
  headerImage: { width: undefined, height: 28, resizeMode: 'contain', marginLeft: 10, aspectRatio: 1 },
  headerIcons: { flexDirection: 'row', gap: 15 },
  iconText: { fontSize: 24 },

  scrollView: { flex: 1 },
  scrollContent: { padding: 20, paddingBottom: 40 },

  grid: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 15 },
  

  stationsSection: { marginTop: 10 },
  sectionTitle: { fontSize: 12, color: '#999', marginBottom: 10, letterSpacing: 1 },
  mapPlaceholder: { height: 150, backgroundColor: '#2c5f7a', borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  mapText: { fontSize: 24, marginBottom: 10 },
  stationName: { fontSize: 18, fontWeight: 'bold', color: '#fff' },

  quoteRectangle: { flexDirection: 'row', backgroundColor: '#b4911eff', borderRadius: 16, height: 150, padding: 15, alignItems: 'center', marginTop: 15 },
  quoteImage: { width: 100, height: 100, borderRadius: 30, marginRight: 15 },
  quoteText: { color: '#fff', fontSize: 20, fontStyle: 'italic', textAlign: 'center', flex: 1, textAlignVertical: 'center' },


});

export default HomeScreen;
