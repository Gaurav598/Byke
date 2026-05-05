import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Animated, Alert, Linking, ActivityIndicator, SafeAreaView, StyleSheet, Dimensions } from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { useSelector } from 'react-redux';
import { RootState } from '../../../store';
import MapView, { Marker, PROVIDER_GOOGLE, MapStyleElement } from 'react-native-maps';
import MapViewDirections from 'react-native-maps-directions';
import { GOOGLE_PLACES_API_KEY } from '../../../config/env';
import websocketService from '../../../services/websocketService';
import { getRideDetails, cancelRide } from '../../../services/rideService';
import { ArrowLeft, Phone, MessageSquare, Shield, Navigation, Clock, X, Check, MapPin, AlertTriangle, User, Star, CreditCard, ChevronRight, Home, Bike, CheckCircle2 } from 'lucide-react-native';

const { width, height } = Dimensions.get('window');

type RootStackParamList = {
  UserTracking: {
    rideId: string;
    rider: any;
    from: string;
    to: string;
    maxFare: number;
  };
  UserHome: undefined;
};

type TrackingScreenRouteProp = RouteProp<RootStackParamList, 'UserTracking'>;
type TrackingScreenNavigationProp = any;

export default function TrackingScreen() {
  const route = useRoute<TrackingScreenRouteProp>();
  const navigation = useNavigation<TrackingScreenNavigationProp>();
  const { rideId, rider, from, to, maxFare } = route.params;
  const { token } = useSelector((state: RootState) => state.auth);

  const [phase, setPhase] = useState<'pickup' | 'enroute' | 'arrived' | 'completed'>('pickup');
  const [etaSeconds, setEtaSeconds] = useState(rider.etaMinutes * 60);
  const [rideSeconds, setRideSeconds] = useState(0);
  const [riderLocation, setRiderLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const [otp, setOtp] = useState<string | null>(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    setupWebSocket();
    loadRideDetails();

    return () => {
      websocketService.leaveRideRoom(rideId);
    };
  }, [rideId]);

  const setupWebSocket = () => {
    if (!token) return;

    if (!websocketService.isConnected()) {
      websocketService.connect(token);
    }

    websocketService.joinRideRoom(rideId);

    websocketService.onRideStatusUpdate((data: any) => {
      if (data.status === 'RIDER_ARRIVED') {
        setPhase('arrived');
      } else if (data.status === 'IN_PROGRESS') {
        setPhase('enroute');
      } else if (data.status === 'COMPLETED') {
        setPhase('completed');
      }
    });

    websocketService.onRiderLocationUpdate((location: any) => {
      setRiderLocation(location);
    });
  };

  const loadRideDetails = async () => {
    try {
      const rideDetails = await getRideDetails(rideId);
      if (rideDetails.status === 'RIDER_ARRIVED') {
        setPhase('arrived');
      } else if (rideDetails.status === 'IN_PROGRESS') {
        setPhase('enroute');
      } else if (rideDetails.status === 'COMPLETED') {
        setPhase('completed');
      }
      // Get OTP from ride details
      if (rideDetails.verificationOtp) {
        setOtp(rideDetails.verificationOtp);
      }
    } catch (error) {
      console.error('Error loading ride details:', error);
    }
  };

  useEffect(() => {
    if (phase !== 'pickup' || etaSeconds <= 0) return;
    const interval = setInterval(() => setEtaSeconds(s => s - 1), 1000);
    return () => clearInterval(interval);
  }, [phase, etaSeconds]);

  useEffect(() => {
    if (phase !== 'enroute') return;
    const interval = setInterval(() => setRideSeconds(s => s + 1), 1000);
    return () => clearInterval(interval);
  }, [phase]);

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.2, duration: 1000, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
      ]),
    ).start();
  }, [pulseAnim]);

  const formatTime = (secs: number) =>
    `${String(Math.floor(secs / 60)).padStart(2, '0')}:${String(secs % 60).padStart(2, '0')}`;
  const etaDisplay = `${Math.ceil(etaSeconds / 60)} min`;

  const handleCall = () => {
    if (rider.riderPhone) {
      Linking.openURL(`tel:${rider.riderPhone}`);
    }
  };

  const handleCancel = async () => {
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
              setCancelling(true);
              await cancelRide(rideId, 'User cancelled');
              navigation.navigate('UserHome');
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to cancel ride');
            } finally {
              setCancelling(false);
            }
          },
        },
      ]
    );
  };

  if (phase === 'completed') {
    return (
      <CompletedScreen
        rider={rider}
        fare={rider.bidAmount}
        from={from}
        to={to}
        navigation={navigation}
      />
    );
  }

  return (
    <View style={styles.container}>
      {/* Map Background */}
      <View style={styles.mapContainer}>
        {riderLocation ? (
          <MapView
            provider={PROVIDER_GOOGLE}
            style={StyleSheet.absoluteFill}
            initialRegion={{
              latitude: riderLocation.latitude,
              longitude: riderLocation.longitude,
              latitudeDelta: 0.015,
              longitudeDelta: 0.015,
            }}
            customMapStyle={mapStyle}
            showsUserLocation={true}
            showsMyLocationButton={false}
          >
            <Marker coordinate={riderLocation}>
              <View style={styles.riderMarker}>
                <Navigation size={20} color="black" fill="black" />
              </View>
            </Marker>
            
            {phase === 'pickup' && (
              <MapViewDirections
                origin={riderLocation}
                destination={rider.pickupCoords || { latitude: 28.6139, longitude: 77.2090 }}
                apikey={GOOGLE_PLACES_API_KEY}
                strokeWidth={4}
                strokeColor="#EAB308"
              />
            )}
          </MapView>
        ) : (
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="large" color="#EAB308" />
            <Text style={styles.loaderText}>Connecting to Rider...</Text>
          </View>
        )}
      </View>

      {/* Header Overlay */}
      <SafeAreaView style={styles.headerOverlay}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.navigate('UserHome')}
        >
          <ArrowLeft size={24} color="black" />
        </TouchableOpacity>

        <View style={styles.statusBadge}>
          <View style={[styles.statusDot, { backgroundColor: phase === 'arrived' ? '#22C55E' : '#EAB308' }]} />
          <Text style={styles.statusText}>
            {phase === 'pickup' ? 'Coming' : phase === 'enroute' ? 'En Route' : 'Arrived'}
          </Text>
        </View>
      </SafeAreaView>

      {/* Bottom Interface */}
      <View style={styles.bottomContainer}>
        <View style={styles.sheet}>
          <View style={styles.sheetHandle} />
          
          <View style={styles.riderRow}>
            <View style={styles.avatarContainer}>
              <View style={styles.avatar}>
                <User size={40} color="#9CA3AF" />
              </View>
              <View style={styles.starBadge}>
                <Star size={12} color="black" fill="black" />
              </View>
            </View>

            <View style={styles.riderInfo}>
              <Text style={styles.riderName}>{rider.name}</Text>
              <View style={styles.vehicleRow}>
                <View style={styles.vehicleBadge}>
                  <Text style={styles.vehicleNumber}>{rider.vehicleNumber || 'UP 32 AB 1234'}</Text>
                </View>
                <Text style={styles.vehicleModel}>{rider.vehicle || 'Honda Activa'}</Text>
              </View>
            </View>

            <View style={styles.actionRow}>
              <TouchableOpacity onPress={handleCall} style={styles.iconButton}>
                <Phone size={24} color="#22C55E" />
              </TouchableOpacity>
              <TouchableOpacity 
                onPress={() => navigation.navigate('Chat', { riderName: rider.name, rideId })}
                style={[styles.iconButton, { marginLeft: 12, backgroundColor: '#EFF6FF' }]}
              >
                <MessageSquare size={24} color="#3B82F6" />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>{phase === 'pickup' ? 'ETA' : 'Time'}</Text>
              <Text style={styles.statValue}>{phase === 'pickup' ? etaDisplay : formatTime(rideSeconds)}</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Fare</Text>
              <Text style={[styles.statValue, { color: '#22C55E' }]}>₹{rider.bidAmount}</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Saved</Text>
              <Text style={[styles.statValue, { color: '#3B82F6' }]}>₹{maxFare - rider.bidAmount}</Text>
            </View>
          </View>

          <View style={styles.locationContainer}>
            <View style={styles.locationRow}>
              <View style={[styles.routeDot, { backgroundColor: '#22C55E' }]} />
              <Text style={styles.locationText} numberOfLines={1}>{from}</Text>
            </View>
            <View style={styles.routeLine} />
            <View style={styles.locationRow}>
              <View style={[styles.routeDot, { backgroundColor: '#EF4444' }]} />
              <Text style={styles.locationText} numberOfLines={1}>{to}</Text>
            </View>
          </View>

          <View style={styles.buttonRow}>
            <TouchableOpacity 
              onPress={handleCancel}
              disabled={cancelling}
              style={styles.cancelButton}
            >
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.sosButton}>
              <Shield size={18} color="white" strokeWidth={3} />
              <Text style={styles.sosText}>SOS</Text>
            </TouchableOpacity>
          </View>

          {phase === 'arrived' && (
            <View style={styles.arrivalOverlay}>
              <Animated.View style={{ transform: [{ scale: pulseAnim }], marginBottom: 24 }}>
                <View style={styles.arrivalIcon}>
                  <Check size={48} color="white" strokeWidth={4} />
                </View>
              </Animated.View>
              <Text style={styles.arrivalTitle}>{rider.name} is here!</Text>
              <Text style={styles.arrivalSubtitle}>Verify vehicle number and share OTP with rider</Text>
              
              {otp && (
                <View style={styles.otpContainer}>
                  <Text style={styles.otpLabel}>Your OTP</Text>
                  <View style={styles.otpBoxes}>
                    {otp.split('').map((digit, i) => (
                      <View key={i} style={styles.otpBox}>
                        <Text style={styles.otpDigit}>{digit}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}
              
              <TouchableOpacity 
                onPress={() => setPhase('enroute')}
                style={styles.boardedButton}
              >
                <Text style={styles.boardedText}>I have boarded</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </View>
  );
}

const CompletedScreen = ({ rider, fare, from, to, navigation }: any) => {
  const [rating, setRating] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const scaleAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      tension: 50,
      friction: 7,
    }).start();
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        <View style={styles.completedContent}>
          <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
            <View style={styles.completedIcon}>
              <Check size={64} color="white" strokeWidth={4} />
            </View>
          </Animated.View>

          <Text style={styles.completedTitle}>Ride Completed!</Text>
          <Text style={styles.completedSubtitle}>Hope you had a great journey</Text>

          <View style={styles.receiptCard}>
            <View style={styles.receiptHeader}>
              <Text style={styles.receiptLabel}>Trip Receipt</Text>
              <View style={styles.receiptBadge}>
                <Text style={styles.receiptId}>#BYK-{Math.floor(1000 + Math.random() * 9000)}</Text>
              </View>
            </View>

            <View style={styles.receiptDetails}>
              <View style={styles.receiptRow}>
                <View style={styles.receiptIconText}>
                  <User size={16} color="#6B7280" />
                  <Text style={styles.receiptRowLabel}>Captain</Text>
                </View>
                <Text style={styles.receiptRowValue}>{rider.name}</Text>
              </View>

              <View style={styles.receiptRow}>
                <View style={styles.receiptIconText}>
                  <Bike size={16} color="#6B7280" />
                  <Text style={styles.receiptRowLabel}>Vehicle</Text>
                </View>
                <Text style={styles.receiptRowValue}>{rider.vehicleNumber}</Text>
              </View>

              <View style={styles.receiptRow}>
                <View style={styles.receiptIconText}>
                  <CreditCard size={16} color="#6B7280" />
                  <Text style={styles.receiptRowLabel}>Payment</Text>
                </View>
                <Text style={styles.receiptRowValue}>UPI / Cash</Text>
              </View>

              <View style={styles.receiptDashedLine} />

              <View style={styles.receiptTotalRow}>
                <Text style={styles.totalLabel}>Total Paid</Text>
                <Text style={styles.totalValue}>₹{fare}</Text>
              </View>
            </View>
          </View>

          <View style={styles.ratingSection}>
            {!submitted ? (
              <>
                <Text style={styles.ratingTitle}>How was your Captain?</Text>
                <View style={styles.starsRow}>
                  {[1, 2, 3, 4, 5].map((s) => (
                    <TouchableOpacity key={s} onPress={() => setRating(s)} style={{ marginLeft: 8 }}>
                      <Star 
                        size={40} 
                        color={s <= rating ? '#EAB308' : '#E5E7EB'} 
                        fill={s <= rating ? '#EAB308' : 'transparent'} 
                        strokeWidth={2.5}
                      />
                    </TouchableOpacity>
                  ))}
                </View>
                {rating > 0 && (
                  <TouchableOpacity
                    onPress={() => setSubmitted(true)}
                    style={styles.submitButton}
                  >
                    <Text style={styles.submitText}>Submit Review</Text>
                  </TouchableOpacity>
                )}
              </>
            ) : (
              <View style={styles.thanksCard}>
                <CheckCircle2 size={32} color="#EAB308" strokeWidth={3} />
                <Text style={styles.thanksText}>Thanks for the feedback!</Text>
              </View>
            )}
          </View>

          <TouchableOpacity
            onPress={() => navigation.navigate('UserHome')}
            style={styles.homeButton}
          >
            <Home size={20} color="black" />
            <Text style={styles.homeButtonText}>Back to Home</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'white' },
  mapContainer: { position: 'absolute', top: 0, left: 0, right: 0, height: '65%' },
  loaderContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F3F4F6' },
  loaderText: { color: '#9CA3AF', fontWeight: '900', marginTop: 16, textTransform: 'uppercase', fontSize: 10, letterSpacing: 1 },
  headerOverlay: { position: 'absolute', top: 0, left: 20, right: 20, zIndex: 10, flexDirection: 'row', justifyContent: 'space-between', paddingTop: 50 },
  backButton: { backgroundColor: 'white', width: 48, height: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center', elevation: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8 },
  statusBadge: { backgroundColor: 'rgba(255,255,255,0.9)', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 16, borderWidth: 1, borderColor: '#F3F4F6', flexDirection: 'row', alignItems: 'center', elevation: 5 },
  statusDot: { width: 8, height: 8, borderRadius: 4, marginRight: 8 },
  statusText: { fontSize: 12, fontWeight: '900', color: 'black', textTransform: 'uppercase', letterSpacing: 1 },
  bottomContainer: { flex: 1, justifyContent: 'flex-end' },
  sheet: { backgroundColor: 'white', borderTopLeftRadius: 40, borderTopRightRadius: 40, paddingHorizontal: 24, paddingTop: 32, paddingBottom: 40, elevation: 25, shadowColor: '#000', shadowOffset: { width: 0, height: -10 }, shadowOpacity: 0.2, shadowRadius: 20 },
  sheetHandle: { width: 48, height: 6, backgroundColor: '#E5E7EB', borderRadius: 3, alignSelf: 'center', marginBottom: 32 },
  riderRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 32 },
  avatarContainer: { position: 'relative' },
  avatar: { width: 80, height: 80, backgroundColor: '#F3F4F6', borderRadius: 24, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#F3F4F6' },
  starBadge: { position: 'absolute', bottom: -4, right: -4, backgroundColor: '#EAB308', padding: 6, borderRadius: 12, borderWidth: 4, borderColor: 'white' },
  riderInfo: { flex: 1, marginLeft: 20 },
  riderName: { fontSize: 24, fontWeight: '900', color: 'black' },
  vehicleRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  vehicleBadge: { backgroundColor: '#F3F4F6', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  vehicleNumber: { fontSize: 11, fontWeight: '900', color: '#4B5563', textTransform: 'uppercase' },
  vehicleModel: { fontSize: 12, color: '#9CA3AF', fontWeight: '700', marginLeft: 12 },
  actionRow: { flexDirection: 'row' },
  iconButton: { width: 56, height: 56, backgroundColor: '#F0FDF4', borderRadius: 20, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#DCFCE7' },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: '#F9FAFB', borderRadius: 32, padding: 24, marginBottom: 32, borderWidth: 1, borderColor: '#F3F4F6' },
  statItem: { alignItems: 'center', flex: 1 },
  statLabel: { fontSize: 10, fontWeight: '900', color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 },
  statValue: { fontSize: 20, fontWeight: '900', color: 'black' },
  statDivider: { width: 1, height: 40, backgroundColor: '#E5E7EB' },
  locationContainer: { marginBottom: 40, paddingHorizontal: 8 },
  locationRow: { flexDirection: 'row', alignItems: 'center' },
  routeDot: { width: 12, height: 12, borderRadius: 6, marginRight: 16 },
  locationText: { flex: 1, fontSize: 14, fontWeight: '700', color: '#6B7280', textTransform: 'uppercase' },
  routeLine: { width: 2, height: 24, backgroundColor: '#F3F4F6', marginLeft: 5, marginVertical: 4 },
  buttonRow: { flexDirection: 'row', gap: 16 },
  cancelButton: { flex: 1, backgroundColor: '#F3F4F6', height: 64, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  cancelText: { color: '#9CA3AF', fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1 },
  sosButton: { flex: 1, backgroundColor: '#EF4444', height: 64, borderRadius: 24, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', elevation: 10, shadowColor: '#EF4444', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.2, shadowRadius: 12 },
  sosText: { color: 'white', fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1, marginLeft: 8 },
  arrivalOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(255,255,255,0.98)', borderTopLeftRadius: 40, borderTopRightRadius: 40, alignItems: 'center', justifyContent: 'center', padding: 32, zIndex: 50 },
  arrivalIcon: { backgroundColor: '#22C55E', padding: 32, borderRadius: 100, elevation: 20, shadowColor: '#22C55E', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.3, shadowRadius: 20 },
  arrivalTitle: { fontSize: 32, fontWeight: '900', color: 'black', marginBottom: 8 },
  arrivalSubtitle: { fontSize: 14, color: '#9CA3AF', fontWeight: '700', textAlign: 'center', marginBottom: 20 },
  otpContainer: { alignItems: 'center', marginBottom: 32, width: '100%' },
  otpLabel: { fontSize: 12, fontWeight: '900', color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 12 },
  otpBoxes: { flexDirection: 'row', justifyContent: 'center', gap: 12 },
  otpBox: { width: 56, height: 72, backgroundColor: '#F9FAFB', borderRadius: 16, borderWidth: 2, borderColor: '#EAB308', alignItems: 'center', justifyContent: 'center' },
  otpDigit: { fontSize: 32, fontWeight: '900', color: 'black' },
  boardedButton: { backgroundColor: 'black', width: '100%', height: 72, borderRadius: 24, alignItems: 'center', justifyContent: 'center', elevation: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.2, shadowRadius: 15 },
  boardedText: { color: 'white', fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1 },
  completedContent: { paddingHorizontal: 24, paddingTop: 40, alignItems: 'center' },
  completedIcon: { backgroundColor: '#22C55E', padding: 32, borderRadius: 100, elevation: 20, shadowColor: '#22C55E', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.3, shadowRadius: 20, marginBottom: 32 },
  completedTitle: { fontSize: 36, fontWeight: '900', color: 'black', textAlign: 'center' },
  completedSubtitle: { fontSize: 16, color: '#9CA3AF', fontWeight: '700', marginTop: 8 },
  receiptCard: { width: '100%', backgroundColor: '#F9FAFB', borderRadius: 40, padding: 32, marginTop: 40, borderWidth: 1, borderColor: '#F3F4F6' },
  receiptHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 },
  receiptLabel: { fontSize: 12, fontWeight: '900', color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 2 },
  receiptBadge: { backgroundColor: 'white', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, borderWidth: 1, borderColor: '#F3F4F6' },
  receiptId: { fontSize: 10, fontWeight: '900', color: 'black' },
  receiptDetails: { gap: 24 },
  receiptRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  receiptIconText: { flexDirection: 'row', alignItems: 'center' },
  receiptRowLabel: { fontSize: 14, fontWeight: '700', color: '#6B7280', marginLeft: 12 },
  receiptRowValue: { fontSize: 14, fontWeight: '900', color: 'black' },
  receiptDashedLine: { height: 1, backgroundColor: '#E5E7EB', marginVertical: 8 },
  receiptTotalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  totalLabel: { fontSize: 20, fontWeight: '900', color: 'black' },
  totalValue: { fontSize: 32, fontWeight: '900', color: '#22C55E' },
  ratingSection: { width: '100%', marginTop: 40, alignItems: 'center' },
  ratingTitle: { fontSize: 18, fontWeight: '900', color: 'black', marginBottom: 24 },
  starsRow: { flexDirection: 'row', marginBottom: 32 },
  submitButton: { backgroundColor: 'black', width: '100%', height: 72, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  submitText: { color: 'white', fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1 },
  thanksCard: { backgroundColor: '#FEFCE8', width: '100%', padding: 32, borderRadius: 40, borderWidth: 1, borderColor: '#FEF9C3', alignItems: 'center' },
  thanksText: { color: '#854D0E', fontWeight: '900', marginTop: 16 },
  homeButton: { marginTop: 32, flexDirection: 'row', alignItems: 'center', backgroundColor: '#F3F4F6', paddingHorizontal: 32, paddingVertical: 20, borderRadius: 24 },
  homeButtonText: { fontSize: 14, fontWeight: '900', color: 'black', textTransform: 'uppercase', letterSpacing: 1, marginLeft: 12 },
  riderMarker: { backgroundColor: '#EAB308', padding: 10, borderRadius: 20, borderWidth: 4, borderColor: 'white', elevation: 15, shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.3, shadowRadius: 10 }
});

const mapStyle: MapStyleElement[] = [
  { "elementType": "geometry", "stylers": [{"color": "#212121"}] },
  { "elementType": "labels.icon", "stylers": [{"visibility": "off"}] },
  { "elementType": "labels.text.fill", "stylers": [{"color": "#757575"}] },
  { "elementType": "labels.text.stroke", "stylers": [{"color": "#212121"}] },
  { "featureType": "administrative", "elementType": "geometry", "stylers": [{"color": "#757575"}] },
  { "featureType": "road", "elementType": "geometry.fill", "stylers": [{"color": "#2c2c2c"}] },
  { "featureType": "water", "elementType": "geometry", "stylers": [{"color": "#000000"}] }
];
