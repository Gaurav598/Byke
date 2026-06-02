import React, {useState, useEffect, useRef, useCallback} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Switch,
  Alert,
  StyleSheet,
  useWindowDimensions,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import MapView, {Marker, PROVIDER_GOOGLE} from 'react-native-maps';
import {useSelector, useDispatch} from 'react-redux';
import {RootState, AppDispatch} from '../store';
import {
  toggleOnlineStatus,
  setEarnings,
  updateLocation,
} from '../store/slices/riderSlice';
import api from '../config/api';
import {
  clearLocationWatch,
  getCurrentLocation as fetchCurrentLocation,
  requestLocationPermission,
  watchLocation,
} from '../services/locationService';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {
  Bell,
  Wallet,
  TrendingUp,
  Navigation,
  Clock,
  Shield,
  List,
} from 'lucide-react-native';

const HomeScreen = ({navigation}: any) => {
  const {height} = useWindowDimensions();
  const mapHeight = height * 0.58;
  const insets = useSafeAreaInsets();
  const dispatch = useDispatch<AppDispatch>();
  const {isOnline, earnings} = useSelector(
    (state: RootState) => state.rider,
  ) as any;
  const mapRef = useRef<MapView>(null);
  const watchIdRef = useRef<number | null>(null);

  const [location, setLocation] = useState({
    latitude: 28.6139,
    longitude: 77.209,
    latitudeDelta: 0.0122,
    longitudeDelta: 0.0121,
  });
  const [hasLocationPermission, setHasLocationPermission] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);

  const getCurrentLocation = useCallback(async () => {
    try {
      setLocationLoading(true);
      const position = await fetchCurrentLocation();
      const newLocation = {
        latitude: position.latitude,
        longitude: position.longitude,
        latitudeDelta: 0.0122,
        longitudeDelta: 0.0121,
      };
      setLocation(newLocation);
      mapRef.current?.animateToRegion(newLocation, 800);
    } catch (error) {
      console.log('Location error:', error);
    } finally {
      setLocationLoading(false);
    }
  }, []);

  const requestAndLoadLocation = useCallback(async () => {
    const granted = await requestLocationPermission();
    setHasLocationPermission(granted);
    if (!granted) {
      Alert.alert(
        'Location Required',
        'Please enable location permission to receive nearby bookings.',
      );
      return;
    }

    await getCurrentLocation();

    if (watchIdRef.current === null) {
      watchIdRef.current = watchLocation(loc => {
        setLocation(prev => ({
          ...prev,
          latitude: loc.latitude,
          longitude: loc.longitude,
        }));
      });
    }
  }, [getCurrentLocation]);

  const fetchRealEarnings = useCallback(async () => {
    try {
      const response = await api.get('/rider/stats');
      dispatch(
        setEarnings({
          today: response.data.earningsToday || 0,
          thisWeek: response.data.earningsWeek || 0,
          thisMonth: response.data.earningsMonth || 0,
        }),
      );
    } catch (error) {
      console.log('Error fetching earnings:', error);
    }
  }, [dispatch]);

  const checkActiveRide = useCallback(async () => {
    try {
      const response = await api.get('/bookings/rider/active');
      if (response.status === 200 && response.data) {
        const booking = response.data;
        navigation.replace('RideTracking', {booking});
      }
    } catch {
      // no active ride
    }
  }, [navigation]);

  const startLocationTracking = useCallback(async () => {
    try {
      const position = await fetchCurrentLocation();
      const {latitude, longitude} = position;
      dispatch(updateLocation({latitude, longitude}));
      setLocation(prev => ({...prev, latitude, longitude}));
      api
        .patch('/rider/location', null, {
          params: {latitude, longitude},
        })
        .catch(console.log);
    } catch (error) {
      console.log('Location tracking error:', error);
    }
  }, [dispatch]);

  useEffect(() => {
    requestAndLoadLocation();
    fetchRealEarnings();
    checkActiveRide();

    const rideCheckInterval = setInterval(checkActiveRide, 5000);
    return () => {
      clearInterval(rideCheckInterval);
      if (watchIdRef.current !== null) {
        clearLocationWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    };
  }, [checkActiveRide, fetchRealEarnings, requestAndLoadLocation]);

  useEffect(() => {
    if (isOnline && hasLocationPermission) {
      void startLocationTracking();
      const interval = setInterval(() => {
        void startLocationTracking();
      }, 6000);
      return () => clearInterval(interval);
    }
  }, [hasLocationPermission, isOnline, startLocationTracking]);

  const handleToggleOnline = async () => {
    try {
      const newStatus = !isOnline;

      await api.patch('/rider/status', null, {
        params: {status: newStatus ? 'AVAILABLE' : 'OFFLINE'},
      });

      dispatch(toggleOnlineStatus());

      if (newStatus) {
        await startLocationTracking();
        Alert.alert(
          'You are now online',
          'You will receive booking notifications',
        );
      } else {
        Alert.alert('You are now offline', 'You will not receive new bookings');
      }
    } catch (error: any) {
      Alert.alert(
        'Error',
        error.response?.data?.message || 'Failed to update status',
      );
    }
  };

  return (
    <View style={styles.container}>
      <View style={[styles.mapContainer, {height: mapHeight}]}> 
        <MapView
          ref={mapRef}
          provider={PROVIDER_GOOGLE}
          style={StyleSheet.absoluteFill}
          region={location}
          showsUserLocation
          showsMyLocationButton={false}
          showsCompass={false}>
          <Marker coordinate={location}>
            <View style={styles.riderMarker}>
              <Navigation size={20} color="white" fill="white" />
            </View>
          </Marker>
        </MapView>

        <View style={[styles.headerOverlay, {top: insets.top + 8}]}> 
          <View style={styles.headerLeft}>
            <View
              style={[
                styles.statusBadge,
                {backgroundColor: isOnline ? '#10B981' : '#6B7280'},
              ]}>
              <View style={styles.statusDot} />
              <Text style={styles.statusText}>
                {isOnline ? 'ONLINE' : 'OFFLINE'}
              </Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.notificationBtn}
            onPress={() => navigation.navigate('Notifications')}>
            <Bell size={22} color="black" />
            <View style={styles.notificationDot} />
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.recenterBtn} onPress={getCurrentLocation}>
          {locationLoading ? (
            <ActivityIndicator size="small" color="#000" />
          ) : (
            <Navigation size={20} color="black" />
          )}
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.bottomSheet}
        contentContainerStyle={[
          styles.bottomSheetContent,
          {paddingBottom: Math.max(insets.bottom + 84, 92)},
        ]}
        showsVerticalScrollIndicator={false}>
        <View
          style={[
            styles.onlineCard,
            {backgroundColor: isOnline ? '#10B98115' : '#F3F4F6'},
          ]}>
          <View style={styles.onlineCardLeft}>
            <Text style={styles.onlineLabel}>
              Go {isOnline ? 'Offline' : 'Online'}
            </Text>
            <Text style={styles.onlineSubtext}>
              {isOnline ? 'Stop receiving orders' : 'Start accepting orders'}
            </Text>
          </View>
          <Switch
            value={isOnline}
            onValueChange={handleToggleOnline}
            trackColor={{false: '#D1D5DB', true: '#10B981'}}
            thumbColor="#fff"
          />
        </View>

        <View style={styles.earningsCard}>
          <View style={styles.earningsHeader}>
            <View style={styles.earningsIcon}>
              <Wallet size={18} color="#EAB308" />
            </View>
            <Text style={styles.earningsTitle}>Today's Earnings</Text>
          </View>
          <View style={styles.earningsRow}>
            <Text style={styles.earningsAmount}>₹{earnings.today}</Text>
            <View style={styles.earningsBadge}>
              <TrendingUp size={12} color="#166534" />
              <Text style={styles.earningsBadgeText}>+12%</Text>
            </View>
          </View>
          <View style={styles.earningsFooter}>
            <Text style={styles.earningsWeekly}>Weekly: ₹{earnings.thisWeek}</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Earnings')}>
              <Text style={styles.earningsLink}>View Details →</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={[styles.actionBtn, {backgroundColor: '#EAB30815'}]}
            onPress={() => navigation.navigate('AvailableBookings')}>
            <List size={22} color="#EAB308" strokeWidth={2.5} />
            <Text style={styles.actionText}>Orders</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionBtn, {backgroundColor: '#3B82F615'}]}
            onPress={() => navigation.navigate('MyBids')}>
            <Clock size={22} color="#3B82F6" strokeWidth={2.5} />
            <Text style={styles.actionText}>My Bids</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionBtn, {backgroundColor: '#10B98115'}]}
            onPress={() => navigation.navigate('Documents')}>
            <Shield size={22} color="#10B981" strokeWidth={2.5} />
            <Text style={styles.actionText}>Docs</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  mapContainer: {
    width: '100%',
  },
  riderMarker: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  headerOverlay: {
    position: 'absolute',
    left: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {
    flex: 1,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 24,
    alignSelf: 'flex-start',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#fff',
    marginRight: 8,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1,
  },
  notificationBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  notificationDot: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#EF4444',
    borderWidth: 2,
    borderColor: '#fff',
  },
  recenterBtn: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  bottomSheet: {
    flex: 1,
    backgroundColor: '#fff',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: 20,
    paddingTop: 24,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: -4},
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  bottomSheetContent: {
    paddingBottom: 92,
  },
  onlineCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderRadius: 24,
    marginBottom: 16,
  },
  onlineCardLeft: {
    flex: 1,
  },
  onlineLabel: {
    fontSize: 16,
    fontWeight: '900',
    color: '#000',
    marginBottom: 4,
  },
  onlineSubtext: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
  },
  earningsCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 24,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  earningsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  earningsIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  earningsTitle: {
    fontSize: 12,
    fontWeight: '900',
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  earningsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  earningsAmount: {
    fontSize: 32,
    fontWeight: '900',
    color: '#000',
    marginRight: 12,
  },
  earningsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  earningsBadgeText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#166534',
    marginLeft: 4,
  },
  earningsFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  earningsWeekly: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6B7280',
  },
  earningsLink: {
    fontSize: 12,
    fontWeight: '900',
    color: '#3B82F6',
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 16,
    borderRadius: 20,
    marginHorizontal: 4,
  },
  actionText: {
    fontSize: 11,
    fontWeight: '900',
    color: '#000',
    marginTop: 8,
  },
});

export default HomeScreen;
