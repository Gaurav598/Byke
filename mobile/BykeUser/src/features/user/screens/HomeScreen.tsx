import React, {useState, useEffect, useRef, useCallback} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Alert,
  StyleSheet,
  useWindowDimensions,
} from 'react-native';
import MapView, {
  Marker,
  Circle,
  PROVIDER_GOOGLE,
  Region,
} from 'react-native-maps';
import {useSelector} from 'react-redux';
import {RootState} from '../../../store';
import api from '../../../config/api';
import {
  getCurrentLocation,
  reverseGeocode,
  requestLocationPermission,
  watchLocation,
  clearLocationWatch,
} from '../../../services/locationService';
import {
  searchPlaces,
  getNearbyPlaces,
  PlaceResult,
} from '../../../services/placesService';
import {
  User,
  MapPin,
  Search,
  Clock,
  X,
  Bike,
  Car,
  Package,
  LayoutGrid,
  Crosshair,
  LocateFixed,
  Route,
} from 'lucide-react-native';

const FALLBACK_LOCATION = 'Getting your location...';

const HomeScreen = ({navigation}: any) => {
  const {width, height} = useWindowDimensions();
  const mapHeight = height * 0.7;
  const sheetHeight = Math.max(height * 0.3, 240);
  const {user} = useSelector((s: RootState) => s.auth);
  const mapRef = useRef<MapView>(null);
  const watchIdRef = useRef<number | null>(null);
  const geocodeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [searchText, setSearchText] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [currentLocation, setCurrentLocation] = useState(FALLBACK_LOCATION);
  const [currentCoords, setCurrentCoords] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [heading, setHeading] = useState<number>(0);
  const [popularPlaces, setPopularPlaces] = useState<PlaceResult[]>([]);
  const [searchResults, setSearchResults] = useState<PlaceResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [activeBooking, setActiveBooking] = useState<any | null>(null);

  // Pickup mode: 'current' = use GPS location, 'pin' = user picks on map
  const [pickupMode, setPickupMode] = useState<'current' | 'pin'>('current');
  const [pinCoords, setPinCoords] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [pinAddress, setPinAddress] = useState('');
  const [pinGeocoding, setPinGeocoding] = useState(false);

  const initializeLocation = useCallback(async () => {
    try {
      setLoading(true);
      const hasPermission = await requestLocationPermission();
      if (!hasPermission) {
        Alert.alert(
          'Permission Required',
          'Location permission is needed to find nearby places',
        );
        setCurrentLocation('Location unavailable');
        setLoading(false);
        return;
      }
      const coords = await getCurrentLocation();
      setCurrentCoords({
        latitude: coords.latitude,
        longitude: coords.longitude,
      });
      if (coords.heading != null && !isNaN(coords.heading)) {
        setHeading(coords.heading);
      }
      animateToCoords(coords);
      setCurrentLocation(
        `${coords.latitude.toFixed(4)}, ${coords.longitude.toFixed(4)}`,
      );
      setLoading(false);

      // Resolve address + nearby suggestions in the background so UI never blocks.
      void (async () => {
        const [addressResult, nearbyResult] = await Promise.allSettled([
          reverseGeocode(coords.latitude, coords.longitude),
          getNearbyPlaces(coords.latitude, coords.longitude),
        ]);

        if (addressResult.status === 'fulfilled' && addressResult.value) {
          setCurrentLocation(addressResult.value);
        }
        if (nearbyResult.status === 'fulfilled') {
          setPopularPlaces(nearbyResult.value);
        }
      })();

      watchIdRef.current = watchLocation(
        loc => {
          setCurrentCoords({latitude: loc.latitude, longitude: loc.longitude});
          if (loc.heading != null && !isNaN(loc.heading) && loc.heading >= 0) {
            setHeading(loc.heading);
          }
        },
        () => {},
      );
    } catch (error) {
      console.log('Location init failed:', error);
      setCurrentLocation('Unable to fetch location. Tap recenter to retry');
      setLoading(false);
    } finally {
      setLoading(false);
    }
  }, []);

  const searchPlacesDebounced = useCallback(async () => {
    try {
      setSearchLoading(true);
      const results = await searchPlaces(
        searchText,
        currentCoords || undefined,
      );
      setSearchResults(results);
    } catch (e) {
      console.error('Error searching places:', e);
    } finally {
      setSearchLoading(false);
    }
  }, [currentCoords, searchText]);

  useEffect(() => {
    initializeLocation();
    return () => {
      if (watchIdRef.current !== null) {
        clearLocationWatch(watchIdRef.current);
      }
    };
  }, [initializeLocation]);

  const loadActiveBooking = useCallback(async () => {
    try {
      const response = await api.get('/bookings/user/active');
      setActiveBooking(response.data || null);
    } catch {
      setActiveBooking(null);
    }
  }, []);

  useEffect(() => {
    loadActiveBooking();
    const interval = setInterval(loadActiveBooking, 7000);
    return () => clearInterval(interval);
  }, [loadActiveBooking]);

  useEffect(() => {
    if (searchText.trim().length >= 2) {
      const t = setTimeout(searchPlacesDebounced, 500);
      return () => clearTimeout(t);
    } else {
      setSearchResults([]);
    }
  }, [searchPlacesDebounced, searchText]);

  const animateToCoords = (coords: {latitude: number; longitude: number}) => {
    mapRef.current?.animateToRegion(
      {
        ...coords,
        latitudeDelta: 0.015,
        longitudeDelta: 0.015,
      },
      800,
    );
  };

  const handleRecenter = async () => {
    if (pickupMode === 'pin' && currentCoords) {
      // Switch back to current location mode
      setPickupMode('current');
      animateToCoords(currentCoords);
    } else if (currentCoords) {
      animateToCoords(currentCoords);
    } else {
      await initializeLocation();
    }
  };

  const handleTogglePickupMode = () => {
    if (pickupMode === 'current') {
      setPickupMode('pin');
      if (currentCoords) {
        setPinCoords(currentCoords);
        setPinAddress(currentLocation);
      }
    } else {
      setPickupMode('current');
      if (currentCoords) {
        animateToCoords(currentCoords);
      }
    }
  };

  const handleMapRegionChangeComplete = useCallback(
    (region: Region) => {
      if (pickupMode !== 'pin') {
        return;
      }
      const newCoords = {
        latitude: region.latitude,
        longitude: region.longitude,
      };
      setPinCoords(newCoords);
      // Debounced reverse geocode
      if (geocodeTimer.current) {
        clearTimeout(geocodeTimer.current);
      }
      geocodeTimer.current = setTimeout(async () => {
        try {
          setPinGeocoding(true);
          const addr = await reverseGeocode(
            newCoords.latitude,
            newCoords.longitude,
          );
          setPinAddress(addr);
        } catch {
          setPinAddress(
            `${newCoords.latitude.toFixed(4)}, ${newCoords.longitude.toFixed(
              4,
            )}`,
          );
        } finally {
          setPinGeocoding(false);
        }
      }, 400);
    },
    [pickupMode],
  );

  const calculateDistance = (
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
  ) => {
    const R = 6371,
      dLat = ((lat2 - lat1) * Math.PI) / 180,
      dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  };

  // Get effective pickup info based on mode
  const getPickupInfo = () => {
    if (pickupMode === 'pin' && pinCoords) {
      return {coords: pinCoords, address: pinAddress || 'Selected location'};
    }
    return {coords: currentCoords, address: currentLocation};
  };

  const handleSelectPlace = (place: PlaceResult) => {
    const pickup = getPickupInfo();
    if (!pickup.coords) {
      Alert.alert('Error', 'Unable to get your pickup location');
      return;
    }
    const distance = calculateDistance(
      pickup.coords.latitude,
      pickup.coords.longitude,
      place.latitude,
      place.longitude,
    );
    navigation.navigate('SelectRide', {
      pickup: pickup.address,
      pickupCoords: pickup.coords,
      drop: place.address,
      dropCoords: {latitude: place.latitude, longitude: place.longitude},
      distanceKm: Math.round(distance * 10) / 10,
    });
  };

  const pickupInfo = getPickupInfo();

  return (
    <View style={styles.container}>
      {/* Map — top 70% */}
      <View style={[styles.mapContainer, {height: mapHeight}]}>
        <MapView
          ref={mapRef}
          provider={PROVIDER_GOOGLE}
          style={StyleSheet.absoluteFill}
          initialRegion={{
            latitude: currentCoords?.latitude ?? 28.6139,
            longitude: currentCoords?.longitude ?? 77.209,
            latitudeDelta: 0.015,
            longitudeDelta: 0.015,
          }}
          showsUserLocation={false}
          showsMyLocationButton={false}
          showsCompass={false}
          onRegionChangeComplete={handleMapRegionChangeComplete}>
          {/* User location - Google Maps style blue dot with direction cone */}
          {currentCoords && (
            <>
              {/* Direction cone - light blue fan showing heading */}
              <Marker
                coordinate={currentCoords}
                anchor={{x: 0.5, y: 0.5}}
                flat
                rotation={heading}
                tracksViewChanges={true}>
                <View style={styles.directionContainer}>
                  <View style={styles.directionCone} />
                </View>
              </Marker>
              {/* Accuracy circle */}
              <Circle
                center={currentCoords}
                radius={40}
                fillColor="rgba(66,133,244,0.1)"
                strokeColor="rgba(66,133,244,0.25)"
                strokeWidth={1}
              />
              {/* Blue dot */}
              <Marker
                coordinate={currentCoords}
                anchor={{x: 0.5, y: 0.5}}
                flat
                tracksViewChanges={false}>
                <View style={styles.blueDotOuter}>
                  <View style={styles.blueDotInner} />
                </View>
              </Marker>
            </>
          )}
        </MapView>

        {/* Fixed center pin for pickup (Rapido style) - only in pin mode */}
        {pickupMode === 'pin' && (
          <View
            style={[
              styles.fixedPinContainer,
              {top: mapHeight / 2 - 48, left: width / 2 - 16},
            ]}
            pointerEvents="none">
            <View style={styles.fixedPinShadow} />
            <View style={styles.fixedPin}>
              <View style={styles.fixedPinHead} />
              <View style={styles.fixedPinStick} />
            </View>
          </View>
        )}

        {/* Pin address badge - shows when in pin mode */}
        {pickupMode === 'pin' && (
          <View style={[styles.pinAddressBadge, {top: mapHeight / 2 + 12}]}>
            <View style={styles.pinAddressDot} />
            <Text style={styles.pinAddressText} numberOfLines={1}>
              {pinGeocoding
                ? 'Getting address...'
                : pinAddress || 'Move map to set pickup'}
            </Text>
          </View>
        )}

        {/* Header overlay on map */}
        <View style={styles.headerOverlay}>
          <TouchableOpacity
            style={styles.profileBtn}
            onPress={() => navigation.navigate('Profile')}>
            {user?.profilePhoto ? (
              <View style={styles.profilePhotoCircle} />
            ) : (
              <User size={22} color="black" />
            )}
          </TouchableOpacity>
          <View style={styles.locationBadge}>
            <View
              style={[
                styles.locationDot,
                pickupMode === 'pin' && {backgroundColor: '#3B82F6'},
              ]}
            />
            <Text style={styles.locationText} numberOfLines={1}>
              {loading ? 'Locating...' : pickupInfo.address}
            </Text>
          </View>
        </View>

        {activeBooking?.id ? (
          <TouchableOpacity
            style={styles.ongoingRideBtn}
            onPress={() =>
              navigation.navigate('UserTracking', {rideId: String(activeBooking.id)})
            }>
            <Route size={16} color="white" strokeWidth={2.8} />
            <Text style={styles.ongoingRideText}>Ongoing Ride</Text>
          </TouchableOpacity>
        ) : null}

        {/* Map action buttons — bottom right */}
        <View style={styles.mapActions}>
          {/* Toggle pickup mode button */}
          <TouchableOpacity
            style={[
              styles.mapActionBtn,
              pickupMode === 'pin' && styles.mapActionBtnActive,
            ]}
            onPress={handleTogglePickupMode}>
            <MapPin
              size={20}
              color={pickupMode === 'pin' ? '#fff' : '#1F2937'}
              strokeWidth={2.5}
            />
          </TouchableOpacity>
          {/* Recenter button */}
          <TouchableOpacity
            style={[styles.mapActionBtn, {marginTop: 10}]}
            onPress={handleRecenter}>
            {pickupMode === 'pin' ? (
              <LocateFixed size={20} color="#3B82F6" strokeWidth={2.5} />
            ) : (
              <Crosshair size={20} color="#1F2937" strokeWidth={2.5} />
            )}
          </TouchableOpacity>
        </View>

        {loading && (
          <View style={styles.mapLoader}>
            <ActivityIndicator size="small" color="#EAB308" />
          </View>
        )}
      </View>

      {/* Bottom sheet — 30% */}
      <View style={[styles.sheet, {height: sheetHeight}]}>
        <View style={styles.sheetHandle} />
        <Text style={styles.sheetTitle}>Where to go?</Text>
        <TouchableOpacity
          activeOpacity={0.9}
          style={styles.searchBar}
          onPress={() => setShowSearch(true)}>
          <Search size={20} color="#9CA3AF" strokeWidth={2.5} />
          <Text style={styles.searchPlaceholder}>Search destination...</Text>
        </TouchableOpacity>
        <View style={styles.serviceGrid}>
          {[
            {id: 'bike', label: 'Bike', icon: Bike, color: '#EAB308'},
            {id: 'auto', label: 'Auto', icon: Car, color: '#10B981'},
            {id: 'parcel', label: 'Parcel', icon: Package, color: '#3B82F6'},
            {id: 'more', label: 'More', icon: LayoutGrid, color: '#6B7280'},
          ].map(s => (
            <TouchableOpacity
              key={s.id}
              style={styles.serviceItem}
              onPress={() => setShowSearch(true)}>
              <View
                style={[styles.serviceIcon, {backgroundColor: `${s.color}18`}]}>
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
            <TouchableOpacity
              onPress={() => {
                setShowSearch(false);
                setSearchText('');
              }}
              style={styles.closeBtn}>
              <X size={26} color="black" />
            </TouchableOpacity>
            <Text style={styles.searchTitle}>Search</Text>
          </View>
          <View style={styles.searchInputs}>
            <View style={styles.inputRow}>
              <View style={[styles.dot, {backgroundColor: '#22C55E'}]} />
              <Text style={styles.inputFixed} numberOfLines={1}>
                {pickupInfo.address}
              </Text>
            </View>
            <View style={[styles.inputRow, {backgroundColor: '#F3F4F6'}]}>
              <View style={[styles.dot, {backgroundColor: '#EF4444'}]} />
              <TextInput
                style={styles.textIn}
                placeholder="Where to?"
                placeholderTextColor="#9CA3AF"
                value={searchText}
                onChangeText={setSearchText}
                autoFocus
              />
            </View>
          </View>
          <ScrollView
            style={styles.results}
            showsVerticalScrollIndicator={false}>
            {searchLoading ? (
              <ActivityIndicator color="#EAB308" style={{marginTop: 40}} />
            ) : (
              searchResults.map(place => (
                <TouchableOpacity
                  key={place.id}
                  style={styles.resultItem}
                  onPress={() => {
                    setShowSearch(false);
                    handleSelectPlace(place);
                  }}>
                  <View style={styles.resultIcon}>
                    <MapPin size={18} color="#6B7280" />
                  </View>
                  <View style={{flex: 1}}>
                    <Text style={styles.resultName}>{place.name}</Text>
                    <Text style={styles.resultAddr} numberOfLines={1}>
                      {place.address}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))
            )}
            {!searchLoading &&
              searchText.trim().length < 2 &&
              popularPlaces.map(place => (
                <TouchableOpacity
                  key={place.id}
                  style={styles.resultItem}
                  onPress={() => {
                    setShowSearch(false);
                    handleSelectPlace(place);
                  }}>
                  <View style={styles.resultIcon}>
                    <Clock size={18} color="#EAB308" />
                  </View>
                  <View style={{flex: 1}}>
                    <Text style={styles.resultName}>{place.name}</Text>
                    <Text style={styles.resultAddr} numberOfLines={1}>
                      {place.address}
                    </Text>
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
  container: {flex: 1, backgroundColor: 'white'},
  mapContainer: {overflow: 'hidden'},

  // Google Maps style blue dot
  blueDotOuter: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 6,
  },
  blueDotInner: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#4285F4',
  },

  // Direction cone
  directionContainer: {
    width: 80,
    height: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  directionCone: {
    width: 0,
    height: 0,
    borderLeftWidth: 18,
    borderRightWidth: 18,
    borderBottomWidth: 40,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: 'rgba(66,133,244,0.28)',
    borderRadius: 4,
    marginBottom: 16,
  },

  // Fixed center pin (Rapido style)
  fixedPinContainer: {position: 'absolute', alignItems: 'center', zIndex: 20},
  fixedPin: {alignItems: 'center'},
  fixedPinHead: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#10B981',
    borderWidth: 4,
    borderColor: 'white',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 3},
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
  fixedPinStick: {
    width: 3,
    height: 16,
    backgroundColor: '#374151',
    borderBottomLeftRadius: 2,
    borderBottomRightRadius: 2,
    marginTop: -2,
  },
  fixedPinShadow: {
    position: 'absolute',
    bottom: -6,
    width: 12,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(0,0,0,0.2)',
  },

  // Pin address badge
  pinAddressBadge: {
    position: 'absolute',
    left: 20,
    right: 20,
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 3},
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 6,
    zIndex: 20,
  },
  pinAddressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10B981',
    marginRight: 10,
  },
  pinAddressText: {flex: 1, fontSize: 13, fontWeight: '700', color: '#1F2937'},

  headerOverlay: {
    position: 'absolute',
    top: 50,
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 10,
  },
  profileBtn: {
    backgroundColor: 'white',
    padding: 12,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 3},
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  profilePhotoCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#EAB308',
  },
  locationBadge: {
    flex: 1,
    marginLeft: 12,
    backgroundColor: 'rgba(255,255,255,0.95)',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 3},
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  locationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#22C55E',
    marginRight: 10,
  },
  locationText: {fontSize: 13, fontWeight: '700', color: '#1F2937', flex: 1},
  ongoingRideBtn: {
    position: 'absolute',
    top: 118,
    right: 16,
    zIndex: 11,
    backgroundColor: '#111827',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  ongoingRideText: {
    color: 'white',
    fontSize: 11,
    fontWeight: '900',
    marginLeft: 7,
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },

  // Map action buttons
  mapActions: {position: 'absolute', bottom: 16, right: 16},
  mapActionBtn: {
    backgroundColor: 'white',
    width: 46,
    height: 46,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 6,
  },
  mapActionBtnActive: {backgroundColor: '#3B82F6'},

  mapLoader: {position: 'absolute', bottom: 16, left: 16},
  sheet: {
    backgroundColor: 'white',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: -4},
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 16,
  },
  sheetHandle: {
    width: 40,
    height: 5,
    backgroundColor: '#E5E7EB',
    borderRadius: 3,
    alignSelf: 'center',
    marginBottom: 12,
  },
  sheetTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: 'black',
    marginBottom: 12,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#F3F4F6',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 16,
  },
  searchPlaceholder: {
    marginLeft: 12,
    fontSize: 16,
    color: '#9CA3AF',
    fontWeight: '600',
  },
  serviceGrid: {flexDirection: 'row', justifyContent: 'space-between'},
  serviceItem: {alignItems: 'center'},
  serviceIcon: {
    width: 54,
    height: 54,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  serviceLabel: {
    fontSize: 11,
    fontWeight: '900',
    color: '#4B5563',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  searchOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'white',
    zIndex: 100,
    paddingTop: 52,
  },
  searchHeader: {
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  closeBtn: {padding: 8, marginLeft: -8, marginRight: 8},
  searchTitle: {fontSize: 22, fontWeight: '900', color: 'black'},
  searchInputs: {paddingHorizontal: 20, marginBottom: 8},
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    marginBottom: 12,
  },
  dot: {width: 8, height: 8, borderRadius: 4, marginRight: 12},
  inputFixed: {
    flex: 1,
    height: 46,
    lineHeight: 46,
    color: '#374151',
    fontWeight: '700',
    fontSize: 15,
  },
  textIn: {
    flex: 1,
    height: 46,
    color: 'black',
    fontWeight: '700',
    fontSize: 15,
  },
  results: {paddingHorizontal: 20},
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F9FAFB',
  },
  resultIcon: {
    backgroundColor: '#F3F4F6',
    padding: 10,
    borderRadius: 12,
    marginRight: 14,
  },
  resultName: {fontSize: 15, fontWeight: '800', color: 'black'},
  resultAddr: {fontSize: 13, color: '#9CA3AF', fontWeight: '600', marginTop: 2},
});

export default HomeScreen;
