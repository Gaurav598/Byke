import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, TextInput,
  ActivityIndicator, Alert, StyleSheet, Dimensions,
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE, Region } from 'react-native-maps';
import { useSelector } from 'react-redux';
import { RootState } from '../../../store';
import { GOOGLE_PLACES_API_KEY } from '../../../config/env';
import { getCurrentLocation, reverseGeocode, requestLocationPermission } from '../../../services/locationService';
import { searchPlaces, getNearbyPlaces, PlaceResult } from '../../../services/placesService';
import { User, MapPin, Search, Clock, Navigation, X, Bike, Car, Package, LayoutGrid, Crosshair } from 'lucide-react-native';

const { height } = Dimensions.get('window');
const MAP_HEIGHT = height * 0.70;
const SHEET_HEIGHT = height * 0.30;
const FALLBACK_LOCATION = 'Getting your location...';

const HomeScreen = ({ navigation }: any) => {
  const { user } = useSelector((s: RootState) => s.auth);
  const mapRef = useRef<MapView>(null);

  const [searchText, setSearchText] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [currentLocation, setCurrentLocation] = useState(FALLBACK_LOCATION);
  const [currentCoords, setCurrentCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [popularPlaces, setPopularPlaces] = useState<PlaceResult[]>([]);
  const [searchResults, setSearchResults] = useState<PlaceResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);

  useEffect(() => { initializeLocation(); }, []);

  useEffect(() => {
    if (searchText.trim().length >= 2) {
      const t = setTimeout(searchPlacesDebounced, 500);
      return () => clearTimeout(t);
    } else setSearchResults([]);
  }, [searchText]);

  const initializeLocation = async () => {
    try {
      setLoading(true);
      const hasPermission = await requestLocationPermission();
      if (!hasPermission) {
        Alert.alert('Permission Required', 'Location permission is needed to find nearby places');
        setCurrentLocation('Location unavailable');
        return;
      }
      const coords = await getCurrentLocation();
      setCurrentCoords(coords);
      animateToCoords(coords);
      const address = await reverseGeocode(coords.latitude, coords.longitude);
      setCurrentLocation(address);
      const nearby = await getNearbyPlaces(coords.latitude, coords.longitude);
      setPopularPlaces(nearby);
    } catch {
      setCurrentLocation('Location unavailable');
    } finally {
      setLoading(false);
    }
  };

  const animateToCoords = (coords: { latitude: number; longitude: number }) => {
    mapRef.current?.animateToRegion({
      ...coords,
      latitudeDelta: 0.015,
      longitudeDelta: 0.015,
    }, 800);
  };

  const handleRecenter = async () => {
    if (currentCoords) {
      animateToCoords(currentCoords);
    } else {
      await initializeLocation();
    }
  };

  const searchPlacesDebounced = async () => {
    try {
      setSearchLoading(true);
      const results = await searchPlaces(searchText, currentCoords || undefined);
      setSearchResults(results);
    } catch (e) {
      console.error('Error searching places:', e);
    } finally {
      setSearchLoading(false);
    }
  };

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371, dLat = ((lat2 - lat1) * Math.PI) / 180, dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLon/2)**2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  };

  const handleSelectPlace = (place: PlaceResult) => {
    if (!currentCoords) { Alert.alert('Error', 'Unable to get your current location'); return; }
    const distance = calculateDistance(currentCoords.latitude, currentCoords.longitude, place.latitude, place.longitude);
    navigation.navigate('SelectRide', {
      pickup: currentLocation,
      pickupCoords: currentCoords,
      drop: place.address,
      dropCoords: { latitude: place.latitude, longitude: place.longitude },
      distanceKm: Math.round(distance * 10) / 10,
    });
  };

  return (
    <View style={styles.container}>
      {/* Map — top 70% */}
      <View style={styles.mapContainer}>
        <MapView
          ref={mapRef}
          provider={PROVIDER_GOOGLE}
          style={StyleSheet.absoluteFill}
          initialRegion={{
            latitude: currentCoords?.latitude ?? 28.6139,
            longitude: currentCoords?.longitude ?? 77.2090,
            latitudeDelta: 0.015,
            longitudeDelta: 0.015,
          }}
          showsUserLocation
          showsMyLocationButton={false}
          showsCompass={false}
        >
          {currentCoords && (
            <Marker coordinate={currentCoords}>
              <View style={styles.marker}>
                <Navigation size={18} color="black" fill="black" />
              </View>
            </Marker>
          )}
        </MapView>

        {/* Header overlay on map */}
        <View style={styles.headerOverlay}>
          <TouchableOpacity style={styles.profileBtn} onPress={() => navigation.navigate('Profile')}>
            {user?.profilePhoto ? (
              <View style={styles.profilePhotoCircle} />
            ) : (
              <User size={22} color="black" />
            )}
          </TouchableOpacity>
          <View style={styles.locationBadge}>
            <View style={styles.locationDot} />
            <Text style={styles.locationText} numberOfLines={1}>
              {loading ? 'Locating...' : currentLocation}
            </Text>
          </View>
        </View>

        {/* Recenter button — bottom right of map */}
        <TouchableOpacity style={styles.recenterBtn} onPress={handleRecenter}>
          <Crosshair size={22} color="#1F2937" strokeWidth={2.5} />
        </TouchableOpacity>

        {loading && (
          <View style={styles.mapLoader}>
            <ActivityIndicator size="small" color="#EAB308" />
          </View>
        )}
      </View>

      {/* Bottom sheet — 30% */}
      <View style={styles.sheet}>
        <View style={styles.sheetHandle} />
        <Text style={styles.sheetTitle}>Where to go?</Text>
        <TouchableOpacity activeOpacity={0.9} style={styles.searchBar} onPress={() => setShowSearch(true)}>
          <Search size={20} color="#9CA3AF" strokeWidth={2.5} />
          <Text style={styles.searchPlaceholder}>Search destination...</Text>
        </TouchableOpacity>
        <View style={styles.serviceGrid}>
          {[
            { id: 'bike', label: 'Bike', icon: Bike, color: '#EAB308' },
            { id: 'auto', label: 'Auto', icon: Car, color: '#10B981' },
            { id: 'parcel', label: 'Parcel', icon: Package, color: '#3B82F6' },
            { id: 'more', label: 'More', icon: LayoutGrid, color: '#6B7280' },
          ].map((s) => (
            <TouchableOpacity key={s.id} style={styles.serviceItem} onPress={() => setShowSearch(true)}>
              <View style={[styles.serviceIcon, { backgroundColor: `${s.color}18` }]}>
                <s.icon size={24} color={s.color} strokeWidth={2.5} />
              </View>
              <Text style={styles.serviceLabel}>{s.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Full-screen search overlay */}
      {showSearch && (
        <View style={styles.searchOverlay}>
          <View style={styles.searchHeader}>
            <TouchableOpacity onPress={() => { setShowSearch(false); setSearchText(''); }} style={styles.closeBtn}>
              <X size={26} color="black" />
            </TouchableOpacity>
            <Text style={styles.searchTitle}>Search</Text>
          </View>
          <View style={styles.searchInputs}>
            <View style={styles.inputRow}>
              <View style={[styles.dot, { backgroundColor: '#22C55E' }]} />
              <Text style={styles.inputFixed} numberOfLines={1}>{currentLocation}</Text>
            </View>
            <View style={[styles.inputRow, { backgroundColor: '#F3F4F6' }]}>
              <View style={[styles.dot, { backgroundColor: '#EF4444' }]} />
              <TextInput style={styles.textIn} placeholder="Where to?" placeholderTextColor="#9CA3AF" value={searchText} onChangeText={setSearchText} autoFocus />
            </View>
          </View>
          <ScrollView style={styles.results} showsVerticalScrollIndicator={false}>
            {searchLoading ? (
              <ActivityIndicator color="#EAB308" style={{ marginTop: 40 }} />
            ) : (
              searchResults.map((place) => (
                <TouchableOpacity key={place.id} style={styles.resultItem} onPress={() => { setShowSearch(false); handleSelectPlace(place); }}>
                  <View style={styles.resultIcon}><MapPin size={18} color="#6B7280" /></View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.resultName}>{place.name}</Text>
                    <Text style={styles.resultAddr} numberOfLines={1}>{place.address}</Text>
                  </View>
                </TouchableOpacity>
              ))
            )}
            {!searchLoading && searchText.trim().length < 2 && popularPlaces.map((place) => (
              <TouchableOpacity key={place.id} style={styles.resultItem} onPress={() => { setShowSearch(false); handleSelectPlace(place); }}>
                <View style={styles.resultIcon}><Clock size={18} color="#EAB308" /></View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.resultName}>{place.name}</Text>
                  <Text style={styles.resultAddr} numberOfLines={1}>{place.address}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'white' },
  mapContainer: { height: MAP_HEIGHT, overflow: 'hidden' },
  marker: { backgroundColor: '#EAB308', padding: 8, borderRadius: 20, borderWidth: 3, borderColor: 'white', elevation: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.15, shadowRadius: 6 },
  headerOverlay: { position: 'absolute', top: 50, left: 16, right: 16, flexDirection: 'row', alignItems: 'center', zIndex: 10 },
  profileBtn: { backgroundColor: 'white', padding: 12, borderRadius: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 4 },
  profilePhotoCircle: { width: 24, height: 24, borderRadius: 12, backgroundColor: '#EAB308' },
  locationBadge: { flex: 1, marginLeft: 12, backgroundColor: 'rgba(255,255,255,0.95)', paddingHorizontal: 14, paddingVertical: 12, borderRadius: 16, flexDirection: 'row', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 4 },
  locationDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#22C55E', marginRight: 10 },
  locationText: { fontSize: 13, fontWeight: '700', color: '#1F2937', flex: 1 },
  recenterBtn: { position: 'absolute', bottom: 16, right: 16, backgroundColor: 'white', width: 46, height: 46, borderRadius: 14, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 10, elevation: 6 },
  mapLoader: { position: 'absolute', bottom: 16, left: 16 },
  sheet: { height: SHEET_HEIGHT, backgroundColor: 'white', borderTopLeftRadius: 32, borderTopRightRadius: 32, paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8, shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.08, shadowRadius: 12, elevation: 16 },
  sheetHandle: { width: 40, height: 5, backgroundColor: '#E5E7EB', borderRadius: 3, alignSelf: 'center', marginBottom: 12 },
  sheetTitle: { fontSize: 20, fontWeight: '900', color: 'black', marginBottom: 12 },
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: '#F3F4F6', borderRadius: 16, paddingHorizontal: 16, paddingVertical: 14, marginBottom: 16 },
  searchPlaceholder: { marginLeft: 12, fontSize: 16, color: '#9CA3AF', fontWeight: '600' },
  serviceGrid: { flexDirection: 'row', justifyContent: 'space-between' },
  serviceItem: { alignItems: 'center' },
  serviceIcon: { width: 54, height: 54, borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
  serviceLabel: { fontSize: 11, fontWeight: '900', color: '#4B5563', textTransform: 'uppercase', letterSpacing: 0.5 },
  searchOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'white', zIndex: 100, paddingTop: 52 },
  searchHeader: { paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  closeBtn: { padding: 8, marginLeft: -8, marginRight: 8 },
  searchTitle: { fontSize: 22, fontWeight: '900', color: 'black' },
  searchInputs: { paddingHorizontal: 20, marginBottom: 8 },
  inputRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F9FAFB', borderRadius: 14, paddingHorizontal: 14, paddingVertical: 2, borderWidth: 1, borderColor: '#F3F4F6', marginBottom: 12 },
  dot: { width: 8, height: 8, borderRadius: 4, marginRight: 12 },
  inputFixed: { flex: 1, height: 46, color: '#374151', fontWeight: '700', fontSize: 15 },
  textIn: { flex: 1, height: 46, color: 'black', fontWeight: '700', fontSize: 15 },
  results: { paddingHorizontal: 20 },
  resultItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#F9FAFB' },
  resultIcon: { backgroundColor: '#F3F4F6', padding: 10, borderRadius: 12, marginRight: 14 },
  resultName: { fontSize: 15, fontWeight: '800', color: 'black' },
  resultAddr: { fontSize: 13, color: '#9CA3AF', fontWeight: '600', marginTop: 2 },
});

export default HomeScreen;
