import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Switch,
  Alert,
  StyleSheet,
  Dimensions,
  Platform,
  PermissionsAndroid,
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../store';
import { toggleOnlineStatus, setEarnings, updateLocation } from '../store/slices/riderSlice';
import api from '../config/api';
import Geolocation from 'react-native-geolocation-service';
import { Bell, Wallet, TrendingUp, Navigation, Clock, Shield, List } from 'lucide-react-native';

const { width, height } = Dimensions.get('window');
const MAP_HEIGHT = height * 0.65;

const HomeScreen = ({ navigation }: any) => {
  const dispatch = useDispatch<AppDispatch>();
  const { user: rider } = useSelector((state: RootState) => state.auth);
  const { isOnline, earnings } = useSelector((state: RootState) => state.rider) as any;
  const mapRef = useRef<MapView>(null);
  
  const [location, setLocation] = useState({
    latitude: 28.6139,
    longitude: 77.2090,
    latitudeDelta: 0.0122,
    longitudeDelta: 0.0121,
  });
  const [hasLocationPermission, setHasLocationPermission] = useState(false);

  useEffect(() => {
    requestLocationPermission();
    fetchRealEarnings();
    checkActiveRide();
    
    // Poll for active rides every 5 seconds to detect accepted bids immediately
    const rideCheckInterval = setInterval(checkActiveRide, 5000);
    return () => clearInterval(rideCheckInterval);
  }, []);

  useEffect(() => {
    if (isOnline && hasLocationPermission) {
      startLocationTracking();
      // Poll location every 6 seconds for real-time tracking
      const interval = setInterval(startLocationTracking, 6000);
      return () => clearInterval(interval);
    }
  }, [isOnline, hasLocationPermission]);

  const requestLocationPermission = async () => {
    if (Platform.OS === 'android') {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        {
          title: 'Location Permission',
          message: 'BYKE Rider needs access to your location',
          buttonNeutral: 'Ask Me Later',
          buttonNegative: 'Cancel',
          buttonPositive: 'OK',
        }
      );
      setHasLocationPermission(granted === PermissionsAndroid.RESULTS.GRANTED);
      if (granted === PermissionsAndroid.RESULTS.GRANTED) {
        getCurrentLocation();
      }
    } else {
      setHasLocationPermission(true);
      getCurrentLocation();
    }
  };

  const getCurrentLocation = () => {
    Geolocation.getCurrentPosition(
      (position) => {
        const newLocation = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          latitudeDelta: 0.0122,
          longitudeDelta: 0.0121,
        };
        setLocation(newLocation);
        mapRef.current?.animateToRegion(newLocation, 800);
      },
      (error) => console.log('Location error:', error),
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
    );
  };

  const fetchRealEarnings = async () => {
    try {
      const response = await api.get('/rider/stats');
      dispatch(setEarnings({
        today: response.data.earningsToday || 0,
        thisWeek: response.data.earningsWeek || 0,
        thisMonth: response.data.earningsMonth || 0,
      }));
    } catch (error) {
      console.log('Error fetching earnings:', error);
    }
  };

  const checkActiveRide = async () => {
    try {
      const response = await api.get('/bookings/rider/active');
      if (response.status === 200 && response.data) {
        const booking = response.data;
        navigation.replace('RideTracking', { booking });
      }
    } catch (error) {
      // No active ride
    }
  };

  const startLocationTracking = () => {
    Geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        dispatch(updateLocation({ latitude, longitude }));
        setLocation(prev => ({ ...prev, latitude, longitude }));
        
        api.patch('/rider/location', null, {
          params: { latitude, longitude }
        }).catch(console.log);
      },
      (error) => console.log('Location error:', error),
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
    );
  };

  const handleToggleOnline = async () => {
    try {
      const newStatus = !isOnline;
      
      // Update status on backend
      await api.patch('/rider/status', null, {
        params: { status: newStatus ? 'AVAILABLE' : 'OFFLINE' }
      });
      
      dispatch(toggleOnlineStatus());
      
      if (newStatus) {
        startLocationTracking();
        Alert.alert('You are now online', 'You will receive booking notifications');
      } else {
        Alert.alert('You are now offline', 'You will not receive new bookings');
      }
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to update status');
    }
  };

  return (
    <View style={styles.container}>
      {/* Map View */}
      <View style={styles.mapContainer}>
        <MapView
          ref={mapRef}
          provider={PROVIDER_GOOGLE}
          style={StyleSheet.absoluteFill}
          region={location}
          showsUserLocation
          showsMyLocationButton={false}
          showsCompass={false}
        >
          <Marker coordinate={location}>
            <View style={styles.riderMarker}>
              <Navigation size={20} color="white" fill="white" />
            </View>
          </Marker>
        </MapView>

        {/* Header Overlay */}
        <View style={styles.headerOverlay}>
          <View style={styles.headerLeft}>
            <View style={[styles.statusBadge, { backgroundColor: isOnline ? '#10B981' : '#6B7280' }]}>
              <View style={styles.statusDot} />
              <Text style={styles.statusText}>{isOnline ? 'ONLINE' : 'OFFLINE'}</Text>
            </View>
          </View>
          <TouchableOpacity 
            style={styles.notificationBtn}
            onPress={() => navigation.navigate('Notifications')}
          >
            <Bell size={22} color="black" />
            <View style={styles.notificationDot} />
          </TouchableOpacity>
        </View>

        {/* Recenter Button */}
        <TouchableOpacity 
          style={styles.recenterBtn}
          onPress={getCurrentLocation}
        >
          <Navigation size={20} color="black" />
        </TouchableOpacity>
      </View>

      {/* Bottom Sheet */}
      <View style={styles.bottomSheet}>
        {/* Online Toggle */}
        <View style={[styles.onlineCard, { backgroundColor: isOnline ? '#10B98115' : '#F3F4F6' }]}>
          <View style={styles.onlineCardLeft}>
            <Text style={styles.onlineLabel}>Go {isOnline ? 'Offline' : 'Online'}</Text>
            <Text style={styles.onlineSubtext}>
              {isOnline ? 'Stop receiving orders' : 'Start accepting orders'}
            </Text>
          </View>
          <Switch
            value={isOnline}
            onValueChange={handleToggleOnline}
            trackColor={{ false: '#D1D5DB', true: '#10B981' }}
            thumbColor="#fff"
          />
        </View>

        {/* Earnings Summary */}
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

        {/* Quick Actions */}
        <View style={styles.actionsRow}>
          <TouchableOpacity 
            style={[styles.actionBtn, { backgroundColor: '#EAB30815' }]}
            onPress={() => navigation.navigate('AvailableBookings')}
          >
            <List size={22} color="#EAB308" strokeWidth={2.5} />
            <Text style={styles.actionText}>Orders</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.actionBtn, { backgroundColor: '#3B82F615' }]}
            onPress={() => navigation.navigate('MyBids')}
          >
            <Clock size={22} color="#3B82F6" strokeWidth={2.5} />
            <Text style={styles.actionText}>My Bids</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.actionBtn, { backgroundColor: '#10B98115' }]}
            onPress={() => navigation.navigate('Documents')}
          >
            <Shield size={22} color="#10B981" strokeWidth={2.5} />
            <Text style={styles.actionText}>Docs</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  mapContainer: {
    height: MAP_HEIGHT,
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
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  headerOverlay: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 20,
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
    shadowOffset: { width: 0, height: 2 },
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
    shadowOffset: { width: 0, height: 2 },
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
    paddingBottom: Platform.OS === 'ios' ? 90 : 80,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
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
