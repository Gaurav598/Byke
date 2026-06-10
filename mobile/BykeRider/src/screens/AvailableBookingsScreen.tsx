import React, {useState, useEffect, useRef, useCallback} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  TextInput,
  SafeAreaView,
  ActivityIndicator,
  StyleSheet,
  ScrollView,
} from 'react-native';
import MapView, {Marker, PROVIDER_GOOGLE, Polyline} from 'react-native-maps';
import {useSelector, useDispatch} from 'react-redux';
import {RootState, AppDispatch} from '../store';
import {setAvailableBookings, addBid} from '../store/slices/riderSlice';
import api from '../config/api';
import {
  getCurrentLocation as fetchCurrentLocation,
  requestLocationPermission,
} from '../services/locationService';
import websocketService from '../services/websocketService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {
  MapPin,
  ChevronRight,
  ArrowLeft,
  X,
  User,
  Info,
} from 'lucide-react-native';
import {Image} from 'react-native';

const AvailableBookingsScreen = ({navigation}: any) => {
  const dispatch = useDispatch<AppDispatch>();
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [bidAmount, setBidAmount] = useState('');
  const [currentLocation, setCurrentLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const {availableBookings} = useSelector(
    (state: RootState) => state.rider,
  ) as any;
  const mapRef = useRef<MapView>(null);

  const currentBooking = availableBookings[currentIndex] ?? null;

  const isValidCoordinate = (value: unknown) => {
    const num = Number(value);
    return Number.isFinite(num) && Math.abs(num) <= 180;
  };

  const fetchAvailableBookings = useCallback(
    async (lat?: number, lng?: number) => {
      const latitude = lat || currentLocation?.latitude || 28.6139;
      const longitude = lng || currentLocation?.longitude || 77.209;

      setLoading(true);
      try {
        const response = await api.get('/bookings/available', {
          params: {
            latitude,
            longitude,
            radius: 10.0,
          },
        });

        const rawBookings = Array.isArray(response.data)
          ? response.data
          : response.data?.data || [];

        const bookings = rawBookings
          .map((booking: any) => {
            const pickupLatitude = Number(booking.pickupLatitude);
            const pickupLongitude = Number(booking.pickupLongitude);
            const dropLatitude = Number(booking.dropLatitude);
            const dropLongitude = Number(booking.dropLongitude);

            if (
              !isValidCoordinate(pickupLatitude) ||
              !isValidCoordinate(pickupLongitude) ||
              !isValidCoordinate(dropLatitude) ||
              !isValidCoordinate(dropLongitude)
            ) {
              return null;
            }

            return {
              id: String(booking.id),
              type: booking.serviceType?.toLowerCase() || 'ride',
              status: booking.status?.toLowerCase() || 'bidding',
              pickupLocation: {
                address: booking.pickupAddress || 'Pickup location',
                latitude: pickupLatitude,
                longitude: pickupLongitude,
              },
              dropLocation: {
                address: booking.dropAddress || 'Drop location',
                latitude: dropLatitude,
                longitude: dropLongitude,
              },
              description: booking.errandDescription || booking.parcelDescription,
              estimatedFare: booking.estimatedFare || 100,
              userAmount:
                booking.userEnteredAmount || booking.estimatedFare || 100,
              user: {
                id: String(booking.user?.id || ''),
                name: booking.user?.fullName || 'User',
                phone: booking.user?.mobileNumber || '',
                rating: 4.8,
              },
              createdAt: booking.createdAt || new Date().toISOString(),
            };
          })
          .filter(Boolean);

        dispatch(setAvailableBookings(bookings));
        setCurrentIndex(0);
      } catch (error: any) {
        console.log('Error fetching bookings:', error);
        Alert.alert(
          'Error',
          error.response?.data?.message || 'Failed to fetch available bookings',
        );
      } finally {
        setLoading(false);
      }
    },
    [currentLocation?.latitude, currentLocation?.longitude, dispatch],
  );

  const getCurrentLocation = useCallback(async () => {
    try {
      const position = await fetchCurrentLocation();
      const {latitude, longitude} = position;
      setCurrentLocation({latitude, longitude});
      await fetchAvailableBookings(latitude, longitude);
    } catch (error) {
      console.log('Location Error:', error);
      await fetchAvailableBookings(28.6139, 77.209);
    }
  }, [fetchAvailableBookings]);

  useEffect(() => {
    const initialize = async () => {
      const granted = await requestLocationPermission();
      if (granted) {
        await getCurrentLocation();
      } else {
        await fetchAvailableBookings(28.6139, 77.209);
      }

      // Connect WebSocket and subscribe
      websocketService.connect(async () => {
        const riderIdStr = await AsyncStorage.getItem('riderId');
        if (riderIdStr) {
          websocketService.subscribe(`/topic/rider/${riderIdStr}/bookings`, (newBooking: any) => {
            // Re-fetch to get the full updated list
            if (currentLocation) {
              fetchAvailableBookings(currentLocation.latitude, currentLocation.longitude);
            }
          });
        }
      });
    };
    void initialize();

    return () => {
      websocketService.disconnect();
    };
  }, [fetchAvailableBookings, getCurrentLocation, currentLocation]);

  useEffect(() => {
    if (currentBooking && mapRef.current) {
      const coords = [
        {
          latitude: currentBooking.pickupLocation.latitude,
          longitude: currentBooking.pickupLocation.longitude,
        },
        {
          latitude: currentBooking.dropLocation.latitude,
          longitude: currentBooking.dropLocation.longitude,
        },
      ];
      mapRef.current.fitToCoordinates(coords, {
        edgePadding: {top: 50, right: 50, bottom: 50, left: 50},
        animated: true,
      });
    }
  }, [currentBooking]);

  useEffect(() => {
    if (availableBookings.length === 0) {
      if (currentIndex !== 0) {
        setCurrentIndex(0);
      }
      setBidAmount('');
      return;
    }

    if (currentIndex > availableBookings.length - 1) {
      setCurrentIndex(availableBookings.length - 1);
      setBidAmount('');
    }
  }, [availableBookings.length, currentIndex]);

  const handlePlaceBid = async () => {
    if (!currentBooking) {
      Alert.alert('Wait', 'Refreshing booking details. Please try again.');
      return;
    }

    if (!bidAmount || parseFloat(bidAmount) <= 0) {
      Alert.alert('Error', 'Please enter a valid bid amount');
      return;
    }

    const amount = parseFloat(bidAmount);
    const maxAllowed = currentBooking.userAmount + 80;

    if (amount > maxAllowed) {
      Alert.alert(
        'Limit Exceeded',
        `You can bid at most ₹80 more than user's price (Max: ₹${maxAllowed})`,
      );
      return;
    }

    try {
      setLoading(true);
      const response = await api.post('/bids', null, {
        params: {
          bookingId: currentBooking.id,
          bidAmount: amount,
        },
      });

      dispatch(addBid(response.data));
      Alert.alert('Success', 'Bid placed successfully!');
      setBidAmount('');
      handleNext();
    } catch (error: any) {
      Alert.alert(
        'Error',
        error.response?.data?.message || 'Failed to place bid',
      );
    } finally {
      setLoading(false);
    }
  };

  const handleNext = () => {
    if (availableBookings.length === 0) {
      return;
    }

    if (currentIndex < availableBookings.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setBidAmount('');
    } else {
      // No more bookings
      dispatch(setAvailableBookings([]));
    }
  };

  const handleSkip = () => {
    handleNext();
  };

  const getServiceInfo = (type: string) => {
    switch (type) {
      case 'ride':
        return {
          icon: require('../../assets/icons/bike.png'),
          color: '#EAB308',
          label: 'Ride Request',
        };
      case 'errand':
        return {
          icon: require('../../assets/icons/auto.png'),
          color: '#10B981',
          label: 'Errand Task',
        };
      case 'parcel':
        return {
          icon: require('../../assets/icons/parcel.png'),
          color: '#3B82F6',
          label: 'Parcel Delivery',
        };
      default:
        return {
          icon: require('../../assets/icons/bike.png'),
          color: '#6B7280',
          label: type,
        };
    }
  };

  if (loading && availableBookings.length === 0) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#000" />
        <Text style={styles.loadingText}>Searching for nearby rides...</Text>
      </View>
    );
  }

  if (availableBookings.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backBtn}>
            <ArrowLeft size={24} color="black" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>New Requests</Text>
        </View>
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconContainer}>
            <Image
              source={require('../../assets/icons/bike.png')}
              style={{width: 64, height: 64, opacity: 0.5}}
            />
          </View>
          <Text style={styles.emptyTitle}>All caught up!</Text>
          <Text style={styles.emptySubtitle}>
            No new requests within 10km. Stay online to get notified of new
            orders.
          </Text>
          <TouchableOpacity
            onPress={() => fetchAvailableBookings()}
            style={styles.refreshBtn}>
            <Text style={styles.refreshText}>Refresh</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (!currentBooking) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backBtn}>
            <ArrowLeft size={24} color="black" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>New Requests</Text>
        </View>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#000" />
          <Text style={styles.loadingText}>Refreshing request details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const serviceInfo = getServiceInfo(currentBooking.type);

  return (
    <View style={styles.container}>
      {/* Map Background */}
      <MapView
        ref={mapRef}
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        initialRegion={{
          latitude: currentBooking.pickupLocation.latitude,
          longitude: currentBooking.pickupLocation.longitude,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        }}>
        <Polyline
          coordinates={[
            {
              latitude: currentBooking.pickupLocation.latitude,
              longitude: currentBooking.pickupLocation.longitude,
            },
            {
              latitude: currentBooking.dropLocation.latitude,
              longitude: currentBooking.dropLocation.longitude,
            },
          ]}
          strokeColor="#000"
          strokeWidth={3}
          lineDashPattern={[5, 5]}
        />
        <Marker
          coordinate={{
            latitude: currentBooking.pickupLocation.latitude,
            longitude: currentBooking.pickupLocation.longitude,
          }}>
          <View style={[styles.marker, {backgroundColor: 'black'}]}>
            <User size={20} color="white" />
          </View>
        </Marker>
        <Marker
          coordinate={{
            latitude: currentBooking.dropLocation.latitude,
            longitude: currentBooking.dropLocation.longitude,
          }}>
          <View style={[styles.marker, {backgroundColor: '#EF4444'}]}>
            <MapPin size={20} color="white" />
          </View>
        </Marker>
      </MapView>

      {/* Header Overlay */}
      <View style={[styles.headerOverlay, {paddingTop: insets.top + 8}]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtnOverlay}>
          <ArrowLeft size={24} color="black" />
        </TouchableOpacity>
        <View style={styles.counterBadge}>
          <Text style={styles.counterText}>
            {currentIndex + 1} / {availableBookings.length}
          </Text>
        </View>
      </View>

      {/* Booking Card */}
      <View
        style={[
          styles.cardContainer,
          {paddingBottom: Math.max(insets.bottom + 84, 96)},
        ]}>
        <View style={styles.card}>
          <ScrollView
            style={styles.cardScroll}
            contentContainerStyle={styles.cardScrollContent}
            showsVerticalScrollIndicator={false}>
            <View style={styles.cardHeader}>
            <View
              style={[styles.serviceTag, {backgroundColor: serviceInfo.color}]}>
              <Image
                source={serviceInfo.icon}
                style={{width: 16, height: 16, tintColor: 'white'}}
              />
              <Text style={styles.serviceLabel}>{serviceInfo.label}</Text>
            </View>
            <View style={styles.userContainer}>
              <User size={16} color="#6B7280" />
              <Text style={styles.userName}>{currentBooking.user.name}</Text>
              <Text style={styles.userRating}>
                ⭐ {currentBooking.user.rating}
              </Text>
            </View>
          </View>

          <View style={styles.locationContainer}>
            <View style={styles.locationRow}>
              <View style={[styles.dot, {backgroundColor: '#10B981'}]} />
              <Text style={styles.locationText} numberOfLines={1}>
                {currentBooking.pickupLocation.address}
              </Text>
            </View>
            <View style={styles.line} />
            <View style={styles.locationRow}>
              <View style={[styles.dot, {backgroundColor: '#EF4444'}]} />
              <Text style={styles.locationText} numberOfLines={1}>
                {currentBooking.dropLocation.address}
              </Text>
            </View>
          </View>

          {currentBooking.description && (
            <View style={styles.descriptionBox}>
              <Info size={14} color="#6B7280" />
              <Text style={styles.descriptionText} numberOfLines={2}>
                {currentBooking.description}
              </Text>
            </View>
          )}

          <View style={styles.fareContainer}>
            <View>
              <Text style={styles.fareLabel}>User's Price</Text>
              <Text style={styles.fareAmount}>
                ₹{currentBooking.userAmount}
              </Text>
            </View>
            <View style={styles.bidInputContainer}>
              <Text style={styles.bidLabel}>
                Your Bid (Max ₹{currentBooking.userAmount + 80})
              </Text>
              <View style={styles.bidInputWrapper}>
                <Text style={styles.currency}>₹</Text>
                <TextInput
                  style={styles.bidInput}
                  value={bidAmount}
                  onChangeText={setBidAmount}
                  placeholder={String(currentBooking.userAmount)}
                  keyboardType="numeric"
                />
              </View>
            </View>
          </View>

            <View style={styles.actionRow}>
              <TouchableOpacity style={styles.skipBtn} onPress={handleSkip}>
                <X size={24} color="#6B7280" />
                <Text style={styles.skipText}>Skip</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.bidBtn}
                onPress={handlePlaceBid}
                disabled={loading}>
                {loading ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <>
                    <Text style={styles.bidBtnText}>Place Bid</Text>
                    <ChevronRight size={20} color="white" />
                  </>
                )}
              </TouchableOpacity>
            </View>
          </ScrollView>
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
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    fontWeight: '700',
    color: '#6B7280',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '900',
    marginLeft: 15,
  },
  headerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  backBtnOverlay: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  counterBadge: {
    backgroundColor: 'black',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 24,
    justifyContent: 'center',
  },
  counterText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '900',
  },
  cardContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingBottom: 96,
    paddingTop: 10,
    backgroundColor: 'transparent',
    zIndex: 999,
    elevation: 999,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 24,
    padding: 18,
    maxHeight: 440,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: -4},
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 10,
  },
  cardScroll: {
    maxHeight: 404,
  },
  cardScrollContent: {
    paddingBottom: 6,
  },
  bidInputContainer: {
    flex: 1,
    marginLeft: 16,
  },
  bidInputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 56,
  },
  rupeeSymbol: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6B7280',
    marginRight: 8,
  },
  bidInput: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
    color: '#000',
    height: '100%',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  serviceTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    paddingRight: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  serviceIcon: {
    width: 32,
    height: 32,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  serviceLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#374151',
    textTransform: 'uppercase',
  },
  userContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userName: {
    fontSize: 13,
    fontWeight: '800',
    marginLeft: 6,
    color: '#374151',
  },
  userRating: {
    fontSize: 12,
    fontWeight: '700',
    marginLeft: 8,
    color: '#EAB308',
  },
  locationContainer: {
    marginBottom: 20,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 12,
  },
  locationText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#4B5563',
    flex: 1,
  },
  line: {
    width: 2,
    height: 20,
    backgroundColor: '#F3F4F6',
    marginLeft: 3,
    marginVertical: 4,
  },
  descriptionBox: {
    flexDirection: 'row',
    backgroundColor: '#F9FAFB',
    padding: 12,
    borderRadius: 16,
    marginBottom: 20,
    alignItems: 'center',
  },
  descriptionText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    marginLeft: 8,
    fontStyle: 'italic',
  },
  fareContainer: {
    marginBottom: 24,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  fareLabel: {
    fontSize: 10,
    fontWeight: '900',
    color: '#9CA3AF',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  fareAmount: {
    fontSize: 24,
    fontWeight: '900',
    color: 'black',
  },
  bidLabel: {
    fontSize: 10,
    fontWeight: '900',
    color: '#9CA3AF',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  currency: {
    fontSize: 16,
    fontWeight: '900',
    color: '#6B7280',
    marginRight: 4,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  skipBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    height: 56,
    borderRadius: 20,
    backgroundColor: '#F9FAFB',
    marginRight: 12,
  },
  skipText: {
    fontSize: 14,
    fontWeight: '900',
    color: '#6B7280',
    marginLeft: 4,
  },
  bidBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 56,
    borderRadius: 28,
    backgroundColor: 'black',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  bidBtnText: {
    fontSize: 16,
    fontWeight: '900',
    color: 'white',
    marginRight: 8,
  },
  marker: {
    padding: 6,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: 'white',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#F9FAFB',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: 'black',
    marginBottom: 12,
  },
  emptySubtitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 30,
  },
  refreshBtn: {
    backgroundColor: 'black',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 32,
  },
  refreshText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#F9FAFB',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default AvailableBookingsScreen;
