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


const HomeScreen = () => {

  // Updated handlePress to show alert instead of console log
  const handlePress = (item: string) => {
    Alert.alert('Button Pressed', `${item} pressed`);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      {/* Fixed Header */}
      <View style={styles.header}>
        <View style={styles.logoContainer}>
          <Text style={styles.logoText}>PROMET</Text>
          <View style={styles.euFlag}>
            <Text style={styles.euStars}>⭐</Text>
          </View>
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
        {/* 2x3 Squares + Rectangle */}
        <View style={styles.grid}>
          {[1, 2, 3, 4, 5, 6].map((item, i) => (
            <TouchableOpacity
              key={i}
              style={[styles.gridItem, i % 2 === 0 ? styles.gridItemLeft : null]}
              onPress={() => handlePress(`Item ${item}`)}
            >
              <Text style={styles.gridIcon}>📌</Text>
              <Text style={styles.gridLabel}>Item {item}</Text>
            </TouchableOpacity>
          ))}

          {/* Rectangle spanning full width */}
          <TouchableOpacity
            style={styles.rectangleFull}
            onPress={() => handlePress('Rectangle')}
          >
            <Text style={styles.profileIcon}>👤</Text>
            <Text style={styles.profileText}>Rectangle</Text>
          </TouchableOpacity>
        </View>

        {/* Nearby Stations Section */}
        <View style={styles.stationsSection}>
          <Text style={styles.sectionTitle}>STANICE U BLIZINI</Text>
          <View style={styles.mapPlaceholder}>
            <Text style={styles.mapText}>🗺️ Map View</Text>
            <Text style={styles.stationName}>SPINUT</Text>
          </View>
          
        </View>
        {/* New Quote Rectangle */}
        <View style={styles.quoteRectangle}>
            <View style={styles.quoteImageContainer}>
                <Image
                    source={require('./assets/paradizot.jpg')}
                    style={styles.quoteImage}
                />
            </View>
            <View style={styles.quoteTextContainer}>
                <Text style={styles.quoteText}>
                Powered by Paradižot🧁
                </Text>
            </View>
        </View>

        
      </ScrollView>

      {/* Fixed Footer */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.footerItem}
          onPress={() => handlePress('Početna')}
        >
          <Text style={styles.footerIcon}>🏠</Text>
          <Text style={styles.footerLabel}>Početna</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.footerItem}
          onPress={() => handlePress('Karte')}
        >
          <Text style={styles.footerIcon}>🎯</Text>
          <Text style={styles.footerLabel}>Karte</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.footerItem}
          onPress={() => handlePress('Linije')}
        >
          <Text style={styles.footerIcon}>📖</Text>
          <Text style={styles.footerLabel}>Linije</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.footerItem}
          onPress={() => handlePress('Profil')}
        >
          <Text style={styles.footerIcon}>👤</Text>
          <Text style={styles.footerLabel}>Profil</Text>
        </TouchableOpacity>
      </View>
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
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#0066cc',
    letterSpacing: 2,
  },
  euFlag: {
    width: 50,
    height: 35,
    backgroundColor: '#003399',
    marginLeft: 10,
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  euStars: {
    fontSize: 20,
  },
  headerIcons: {
    flexDirection: 'row',
    gap: 15,
  },
  iconText: {
    fontSize: 24,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 15,
  },
  gridItem: {
    width: '48%',
    aspectRatio: 1,
    backgroundColor: '#e8ecf4',
    borderRadius: 16,
    padding: 15,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  gridItemLeft: {
    marginRight: '4%',
  },
  gridIcon: {
    fontSize: 40,
    marginBottom: 10,
  },
  gridLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0066cc',
    textAlign: 'center',
  },
  rectangleFull: {
    width: '100%',
    height: 120,
    backgroundColor: '#e8ecf4',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 15,
  },
  profileIcon: {
    fontSize: 50,
    marginBottom: 10,
  },
  profileText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0066cc',
  },
  stationsSection: {
    marginTop: 10,
  },
  sectionTitle: {
    fontSize: 12,
    color: '#999',
    marginBottom: 10,
    letterSpacing: 1,
  },
  mapPlaceholder: {
    height: 150,
    backgroundColor: '#2c5f7a',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mapText: {
    fontSize: 24,
    marginBottom: 10,
  },
  stationName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  footer: {
    height: 70,
    backgroundColor: '#fff',
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  footerItem: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  footerLabel: {
    fontSize: 11,
    color: '#0066cc',
    fontWeight: '500',
  },
  quoteRectangle: {
  flexDirection: 'row',
  backgroundColor: '#b4911eff',
  borderRadius: 16,
  height: 150,
  padding: 15,
  alignItems: 'center',
  marginTop: 15,
},
quoteImageContainer: {
  marginRight: 15,
},
quoteImage: {
  width: 100,
  height: 100,
  borderRadius: 30, // makes it circular
},
quoteTextContainer: {
  flex: 1,                 // take up remaining horizontal space
  justifyContent: 'center', // vertical centering
},
quoteText: {
  color: '#fff',
  fontSize: 20,
  fontStyle: 'italic',
  textAlign: 'center',     // horizontal centering within container
},
});

export default HomeScreen;
