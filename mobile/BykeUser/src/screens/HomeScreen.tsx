import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  StyleSheet,
  Dimensions,
  Platform,
  PermissionsAndroid,
  Modal,
  ScrollView,
  Animated,
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE, Circle } from 'react-native-maps';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import api from '../config/api';
import Geolocation from 'react-native-geolocation-service';
import { Bell, User, MapPin, Navigation, Package, ShoppingCart, ChevronRight } from 'lucide-react-native';

const { width, height } = Dimensions.get('window');

interface NearbyRider {
  id: number;
  currentLatitude: number;
  currentLongitude: number;
  vehicleType: string;
  averageRating: number;
  user: { fullName: string };
}

const HomeScreen = ({ navigation }: any) => {
  const { user } = useSelector((state: RootState) => state.auth);
  const mapRef = useRef<MapView>(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  const [location, setLocation] = useState({
    latitude: 28.6139,
    longitude: 77.2090,
    latitudeDelta: 0.0122,
    longitudeDelta: 0.0121,
  });
  const [hasLocationPermission, setHasLocationPermission] = useState(false);
  const [serviceModalVisible, setServiceModalVisible] = useState(false);
  const [nearbyRiders, setNearbyRiders] = useState<NearbyRider[]>([]);
  const [pickupCoord, setPickupCoord] = useState<{ latitude: number; longitude: number } | null>(null);

  useEffect(() => {
    requestLocationPermission();
    startPulseAnimation();
    checkActiveBooking();
  }, []);

  const fetchNearbyRiders = useCallback(async (lat: number, lng: number) => {
    try {
      const response = await api.get('/rider/nearby', {
        params: { latitude: lat, longitude: lng, radius: 5.0 },
      });
      setNearbyRiders(response.data || []);
    } catch (error) {
      // silently fail
    }
  }, []);

  const getCurrentLocation = useCallback((onFetch?: (lat: number, lng: number) => void) => {
    Geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const newLocation = {
          latitude,
          longitude,
          latitudeDelta: 0.0122,
          longitudeDelta: 0.0121,
        };
        setLocation(newLocation);
        setPickupCoord({ latitude, longitude });
        mapRef.current?.animateToRegion(newLocation, 800);
        fetchNearbyRiders(latitude, longitude);
        onFetch?.(latitude, longitude);
      },
      (error) => console.log('Location error:', error),
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
    );
  }, [fetchNearbyRiders]);

  useEffect(() => {
    if (hasLocationPermission) {
      getCurrentLocation();
      const interval = setInterval(() => {
        Geolocation.getCurrentPosition(
          (pos) => fetchNearbyRiders(pos.coords.latitude, pos.coords.longitude),
          () => {},
          { enableHighAccuracy: false, timeout: 10000, maximumAge: 30000 }
        );
      }, 30000);
      return () => clearInterval(interval);
    }
  }, [hasLocationPermission, getCurrentLocation, fetchNearbyRiders]);

  const startPulseAnimation = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.4, duration: 900, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 900, useNativeDriver: true }),
      ])
    ).start();
  };

  const requestLocationPermission = async () => {
    if (Platform.OS === 'android') {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        {
          title: 'Location Permission',
          message: 'BYKE needs access to your location to show nearby riders',
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

  const checkActiveBooking = async () => {
    try {
      const response = await api.get('/bookings/user/active');
      if (response.status === 200 && response.data) {
        const booking = response.data;
        navigation.replace('ActiveBooking', {
          bookingId: booking.id,
          otp: booking.verificationOtp,
        });
      }
    } catch (error) {
      // No active booking, stay on home
    }
  };

  const serviceTypes = [
    { id: 'ride', title: 'Ride', icon: '🏍️', color: '#3b82f6' },
    { id: 'errand', title: 'Errand', icon: '🛒', color: '#10b981' },
    { id: 'parcel', title: 'Parcel', icon: '📦', color: '#f59e0b' },
  ];

  const handleServiceSelect = (serviceType: string) => {
    setServiceModalVisible(false);
    navigation.navigate('Booking', { serviceType, pickupLocation: location });
  };

  return (
    <View style={styles.container}>
      {/* Full Screen Map */}
      <MapView
        ref={mapRef}
        provider={PROVIDER_GOOGLE}
        style={StyleSheet.absoluteFill}
        region={location}
        showsUserLocation={false}
        showsMyLocationButton={false}
        showsCompass={false}
        onLongPress={(e) => setPickupCoord(e.nativeEvent.coordinate)}
      >
        {/* User Location - Large blue circle with pulse */}
        <Circle
          center={location}
          radius={80}
          fillColor="rgba(59,130,246,0.15)"
          strokeColor="rgba(59,130,246,0.4)"
          strokeWidth={2}
        />
        <Marker coordinate={location} anchor={{ x: 0.5, y: 0.5 }}>
          <View style={styles.userMarkerOuter}>
            <View style={styles.userMarkerInner} />
          </View>
        </Marker>

        {/* Draggable Pickup Pin */}
        {pickupCoord && (
          <Marker
            coordinate={pickupCoord}
            draggable
            onDragEnd={(e) => setPickupCoord(e.nativeEvent.coordinate)}
            pinColor="#10B981"
          />
        )}

        {/* Nearby Rider Markers */}
        {nearbyRiders.map((rider) => (
          <Marker
            key={rider.id}
            coordinate={{
              latitude: rider.currentLatitude,
              longitude: rider.currentLongitude,
            }}
            anchor={{ x: 0.5, y: 0.5 }}
          >
            <View style={styles.bikeMarker}>
              <Text style={styles.bikeIcon}>🏍️</Text>
            </View>
          </Marker>
        ))}
      </MapView>

      {/* Floating Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.menuButton} onPress={() => navigation.navigate('Profile')}>
          <User size={20} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.notificationButton} onPress={() => navigation.navigate('Notifications')}>
          <Bell size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Location Button */}
      <TouchableOpacity style={styles.myLocationButton} onPress={() => getCurrentLocation()}>
        <MapPin size={20} color="#fff" />
      </TouchableOpacity>

      {/* Bottom Card for "Where to?" */}
      <View style={styles.bottomCard}>
        <Text style={styles.greeting}>Hello, {user?.name?.split(' ')[0] || 'User'}</Text>
        <TouchableOpacity
          style={styles.whereToButton}
          onPress={() => setServiceModalVisible(true)}
        >
          <Text style={styles.whereToText}>Where to?</Text>
        </TouchableOpacity>

        <View style={styles.quickActions}>
          <TouchableOpacity style={styles.quickAction} onPress={() => navigation.navigate('MyBookings')}>
            <View style={styles.quickActionIconContainer}>
              <Navigation size={20} color="#fff" />
            </View>
            <Text style={styles.quickActionText}>Bookings</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Services Modal (Bottom Sheet Alternative) */}
      <Modal
        visible={serviceModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setServiceModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalBackdrop}
          activeOpacity={1}
          onPress={() => setServiceModalVisible(false)}
        />
        <View style={styles.modalContent}>
          <View style={styles.modalHandle} />
          <Text style={styles.modalTitle}>Choose a Service</Text>
          <View style={styles.servicesGrid}>
            {serviceTypes.map((service) => (
              <TouchableOpacity
                key={service.id}
                style={styles.serviceItem}
                onPress={() => handleServiceSelect(service.id)}
              >
                <View style={[styles.serviceIconWrapper, { backgroundColor: `${service.color}15` }]}>
                  <Text style={styles.serviceEmoji}>{service.icon}</Text>
                </View>
                <Text style={styles.serviceName}>{service.title}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 20,
    left: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  menuButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  notificationButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  myLocationButton: {
    position: 'absolute',
    bottom: 220,
    right: 20,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  bottomCard: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  greeting: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 16,
  },
  whereToButton: {
    backgroundColor: '#f1f5f9',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  whereToText: {
    fontSize: 18,
    color: '#64748b',
    fontWeight: '600',
  },
  quickActions: {
    flexDirection: 'row',
  },
  quickAction: {
    alignItems: 'center',
    marginRight: 24,
  },
  quickActionIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  quickActionText: {
    fontSize: 12,
    color: '#475569',
    fontWeight: '500',
  },
  modal: {
    justifyContent: 'flex-end',
    margin: 0,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
  },
  modalHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#cbd5e1',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 20,
    textAlign: 'center',
  },
  servicesGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  serviceItem: {
    alignItems: 'center',
    flex: 1,
  },
  serviceIconWrapper: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  serviceEmoji: {
    fontSize: 28,
  },
  serviceName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#334155',
  },
  userMarkerOuter: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(59,130,246,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(59,130,246,0.5)',
  },
  userMarkerInner: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#3B82F6',
    borderWidth: 2.5,
    borderColor: '#fff',
  },
  bikeMarker: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
  },
  bikeIcon: {
    fontSize: 16,
  },
});

export default HomeScreen;
