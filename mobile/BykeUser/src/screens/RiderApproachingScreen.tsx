import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Linking,
  Platform,
  SafeAreaView,
  Alert,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import MapViewDirections from 'react-native-maps-directions';
import { Phone, MessageCircle, Navigation, User, Star, Clock, MapPin, AlertCircle } from 'lucide-react-native';
import api from '../config/api';
import { GOOGLE_PLACES_API_KEY } from '../config/env';

const { width, height } = Dimensions.get('window');

const RiderApproachingScreen = ({ route, navigation }: any) => {
  const { bookingId } = route.params;
  const mapRef = useRef<MapView>(null);
  const [booking, setBooking] = useState<any>(null);
  const [riderLocation, setRiderLocation] = useState<any>(null);
  const [eta, setEta] = useState<string>('Calculating...');
  const [otp, setOtp] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchBookingDetails();
    const interval = setInterval(fetchBookingDetails, 7000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (booking && mapRef.current) {
      const coordinates = [];
      
      if (riderLocation) {
        coordinates.push({ latitude: riderLocation.latitude, longitude: riderLocation.longitude });
      }
      
      if (booking.pickupLatitude && booking.pickupLongitude) {
        coordinates.push({ latitude: booking.pickupLatitude, longitude: booking.pickupLongitude });
      }
      
      if (coordinates.length === 2) {
        mapRef.current.fitToCoordinates(coordinates, {
          edgePadding: { top: 100, right: 50, bottom: 350, left: 50 },
          animated: true,
        });
      } else if (coordinates.length === 1) {
        mapRef.current.animateToRegion({
          ...coordinates[0],
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }, 1000);
      }
    }
  }, [booking, riderLocation]);

  const fetchBookingDetails = async () => {
    try {
      const response = await api.get(`/bookings/${bookingId}`);
      const bookingData = response.data;
      setBooking(bookingData);
      setLoading(false);
      setError(null);

      const status = bookingData.status?.toUpperCase();

      if (status === 'RIDER_ARRIVED' && bookingData.verificationOtp) {
        setOtp(bookingData.verificationOtp);
      }

      if (status === 'IN_PROGRESS') {
        navigation.replace('RideInProgress', { bookingId });
      }

      if (status === 'COMPLETED') {
        navigation.replace('RatingScreen', { bookingId });
      }

      if (bookingData.rider?.currentLatitude && bookingData.rider?.currentLongitude) {
        const newLocation = {
          latitude: bookingData.rider.currentLatitude,
          longitude: bookingData.rider.currentLongitude,
        };
        setRiderLocation(newLocation);
      }
    } catch (err: any) {
      console.log('Error fetching booking:', err);
      setError(err.response?.data?.message || 'Failed to load booking details');
      setLoading(false);
    }
  };

  const handleCall = () => {
    const phoneNumber = booking?.rider?.user?.mobileNumber || booking?.rider?.mobileNumber;
    if (phoneNumber) {
      Linking.openURL(`tel:${phoneNumber}`);
    } else {
      Alert.alert('Error', 'Phone number not available');
    }
  };

  const handleChat = () => {
    Alert.alert('Chat', 'Chat feature coming soon!');
  };

  const handleCancelRide = () => {
    Alert.alert(
      'Cancel Ride',
      'Are you sure you want to cancel this ride?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.post(`/bookings/${bookingId}/cancel`, null, {
                params: { reason: 'User cancelled', byUser: true }
              });
              Alert.alert('Cancelled', 'Ride cancelled successfully.', [
                { text: 'OK', onPress: () => navigation.replace('Home') }
              ]);
            } catch (error: any) {
              Alert.alert('Error', error.response?.data?.message || 'Failed to cancel ride');
            }
          }
        }
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={styles.loadingText}>Finding your rider...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.loadingContainer}>
        <AlertCircle size={48} color="#EF4444" />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={fetchBookingDetails}>
          <Text style={styles.retryBtnText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!booking) {
    return (
      <View style={styles.loadingContainer}>
        <AlertCircle size={48} color="#EF4444" />
        <Text style={styles.errorText}>Booking not found</Text>
      </View>
    );
  }

  const status = booking.status?.toUpperCase();
  const isRiderArrived = status === 'RIDER_ARRIVED';
  const isAccepted = status === 'ACCEPTED';
  
  const riderName = booking.rider?.user?.fullName || booking.rider?.fullName || 'Rider';
  const riderRating = booking.rider?.averageRating || booking.rider?.rating || 5.0;
  const vehicleModel = booking.rider?.vehicleModel || 'Two Wheeler';
  const vehicleNumber = booking.rider?.vehicleRegistrationNumber || booking.rider?.vehicleNumber || 'N/A';
  const phoneNumber = booking.rider?.user?.mobileNumber || booking.rider?.mobileNumber;
  const totalRides = booking.rider?.totalRides || 0;

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        initialRegion={{
          latitude: booking.pickupLatitude,
          longitude: booking.pickupLongitude,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        }}
      >
        {riderLocation && (
          <Marker 
            coordinate={riderLocation} 
            title="Rider Location"
            anchor={{ x: 0.5, y: 0.5 }}
          >
            <View style={styles.riderMarker}>
              <Navigation size={20} color="white" fill="white" />
            </View>
          </Marker>
        )}

        <Marker
          coordinate={{
            latitude: booking.pickupLatitude,
            longitude: booking.pickupLongitude,
          }}
          title="Your Pickup Location"
        >
          <View style={styles.pickupMarker}>
            <User size={24} color="white" />
          </View>
        </Marker>

        {riderLocation && (
          <MapViewDirections
            origin={riderLocation}
            destination={{
              latitude: booking.pickupLatitude,
              longitude: booking.pickupLongitude,
            }}
            apikey={GOOGLE_PLACES_API_KEY}
            strokeWidth={4}
            strokeColor="#3B82F6"
            onReady={(result) => {
              const minutes = Math.ceil(result.duration);
              setEta(`${minutes} min${minutes !== 1 ? 's' : ''}`);
            }}
          />
        )}
      </MapView>

      <SafeAreaView style={styles.topBar}>
        <View style={styles.statusBadge}>
          <View style={[styles.statusDot, { backgroundColor: isRiderArrived ? '#10B981' : '#3B82F6' }]} />
          <Text style={styles.statusText}>
            {isRiderArrived ? 'RIDER ARRIVED' : isAccepted ? 'RIDER COMING' : status}
          </Text>
        </View>
      </SafeAreaView>

      <View style={styles.bottomSheet}>
        {isRiderArrived && otp && (
          <View style={styles.otpCard}>
            <Text style={styles.otpLabel}>SHARE THIS OTP WITH RIDER</Text>
            <Text style={styles.otpValue}>{otp}</Text>
            <Text style={styles.otpHint}>Rider will ask for this code to start your ride</Text>
          </View>
        )}

        <View style={styles.riderCard}>
          <View style={styles.riderHeader}>
            <View style={styles.riderAvatar}>
              <Text style={styles.riderInitial}>{riderName.charAt(0).toUpperCase()}</Text>
            </View>
            <View style={styles.riderInfo}>
              <Text style={styles.riderName}>{riderName}</Text>
              <View style={styles.riderMeta}>
                <Star size={14} color="#F59E0B" fill="#F59E0B" />
                <Text style={styles.riderRating}>{riderRating.toFixed(1)}</Text>
                <Text style={styles.riderDivider}>•</Text>
                <Text style={styles.riderRides}>{totalRides} rides</Text>
              </View>
            </View>
            <View style={styles.actionButtons}>
              <TouchableOpacity 
                style={[styles.iconBtn, !phoneNumber && styles.iconBtnDisabled]} 
                onPress={handleCall}
                disabled={!phoneNumber}
              >
                <Phone size={20} color="white" />
              </TouchableOpacity>
              <TouchableOpacity style={[styles.iconBtn, { backgroundColor: '#10B981' }]} onPress={handleChat}>
                <MessageCircle size={20} color="white" />
              </TouchableOpacity>
            </View>
          </View>
          <View style={styles.vehicleDetails}>
            <View style={styles.vehicleInfoRow}>
              <View style={styles.vehicleIconContainer}>
                <Navigation size={16} color="#3B82F6" />
              </View>
              <View style={styles.vehicleTextContainer}>
                <Text style={styles.vehicleLabel}>Vehicle</Text>
                <Text style={styles.vehicleModel}>{vehicleModel}</Text>
              </View>
            </View>
            <View style={styles.vehicleNumberBadge}>
              <Text style={styles.vehicleNumber}>{vehicleNumber}</Text>
            </View>
          </View>
          {phoneNumber && (
            <View style={styles.contactInfo}>
              <Text style={styles.contactLabel}>Contact: </Text>
              <Text style={styles.contactNumber}>{phoneNumber}</Text>
            </View>
          )}
        </View>

        {!isRiderArrived && (
          <View style={styles.etaCard}>
            <Clock size={20} color="#3B82F6" />
            <View style={styles.etaInfo}>
              <Text style={styles.etaLabel}>Estimated Arrival</Text>
              <Text style={styles.etaValue}>{eta}</Text>
            </View>
          </View>
        )}

        <View style={styles.locationCard}>
          <View style={styles.locationDot} />
          <View style={styles.locationInfo}>
            <Text style={styles.locationLabel}>PICKUP</Text>
            <Text style={styles.locationAddress} numberOfLines={2}>
              {booking.pickupAddress || 'Pickup location'}
            </Text>
          </View>
        </View>

        {booking.dropAddress && (
          <View style={styles.locationCard}>
            <View style={[styles.locationDot, { backgroundColor: '#EF4444' }]} />
            <View style={styles.locationInfo}>
              <Text style={styles.locationLabel}>DROP-OFF</Text>
              <Text style={styles.locationAddress} numberOfLines={2}>
                {booking.dropAddress}
              </Text>
            </View>
          </View>
        )}

        <TouchableOpacity style={styles.cancelBtn} onPress={handleCancelRide}>
          <Text style={styles.cancelBtnText}>Cancel Ride</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  loadingText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
    marginTop: 12,
  },
  errorText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#EF4444',
    marginTop: 12,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  retryBtn: {
    marginTop: 16,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: '#3B82F6',
    borderRadius: 8,
  },
  retryBtnText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  map: {
    flex: 1,
  },
  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingTop: 10,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 10,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '900',
    color: '#000',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  riderMarker: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#3B82F6',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 6,
  },
  pickupMarker: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 6,
  },
  bottomSheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  otpCard: {
    backgroundColor: '#DBEAFE',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#3B82F6',
  },
  otpLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1E40AF',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
  },
  otpValue: {
    fontSize: 48,
    fontWeight: '900',
    color: '#1E3A8A',
    letterSpacing: 12,
    marginBottom: 8,
  },
  otpHint: {
    fontSize: 11,
    fontWeight: '600',
    color: '#3B82F6',
    textAlign: 'center',
  },
  riderCard: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 24,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 6,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  riderHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  riderAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#3B82F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  riderInitial: {
    fontSize: 30,
    fontWeight: '900',
    color: 'white',
  },
  riderInfo: {
    flex: 1,
  },
  riderName: {
    fontSize: 18,
    fontWeight: '900',
    color: '#000',
    marginBottom: 4,
  },
  riderMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  riderRating: {
    fontSize: 13,
    fontWeight: '700',
    color: '#000',
    marginLeft: 4,
  },
  riderVehicle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
    marginLeft: 4,
  },
  riderDivider: {
    fontSize: 13,
    color: '#9CA3AF',
    marginHorizontal: 4,
  },
  riderRides: {
    fontSize: 13,
    fontWeight: '500',
    color: '#6B7280',
  },
  vehicleDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    padding: 14,
    borderRadius: 16,
    marginBottom: 12,
  },
  vehicleInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  vehicleIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  vehicleTextContainer: {
    flex: 1,
  },
  vehicleLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#9CA3AF',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  vehicleModel: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1F2937',
  },
  vehicleNumberBadge: {
    backgroundColor: '#1F2937',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  vehicleNumber: {
    fontSize: 13,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 1,
  },
  contactInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    padding: 12,
    borderRadius: 12,
  },
  contactLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
  },
  contactNumber: {
    fontSize: 13,
    fontWeight: '800',
    color: '#1F2937',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  iconBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#3B82F6',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  iconBtnDisabled: {
    backgroundColor: '#9CA3AF',
    opacity: 0.6,
  },
  etaCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    padding: 14,
    borderRadius: 12,
    marginBottom: 12,
  },
  etaInfo: {
    flex: 1,
    marginLeft: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  etaLabel: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
    color: '#1E40AF',
    marginLeft: 12,
  },
  etaValue: {
    fontSize: 18,
    fontWeight: '900',
    color: '#1E3A8A',
  },
  locationCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#F9FAFB',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
  },
  locationDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#10B981',
    marginTop: 4,
    marginRight: 12,
  },
  locationInfo: {
    flex: 1,
  },
  locationLabel: {
    fontSize: 10,
    fontWeight: '900',
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4,
  },
  locationAddress: {
    fontSize: 14,
    fontWeight: '700',
    color: '#000',
    lineHeight: 20,
  },
  cancelBtn: {
    marginTop: 8,
    paddingVertical: 16,
    borderRadius: 16,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  cancelBtnText: {
    fontSize: 15,
    fontWeight: '900',
    color: '#DC2626',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
});

export default RiderApproachingScreen;
