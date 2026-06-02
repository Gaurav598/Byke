import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  Linking,
  Share,
} from 'react-native';
import MapView, {Marker, Polyline} from 'react-native-maps';
import {useSelector} from 'react-redux';
import {RootState} from '../store';
import api from '../config/api';

const TrackingScreen = ({route, navigation}: any) => {
  const {bookingId} = route.params;
  const [booking, setBooking] = useState<any>(null);
  const [riderLocation, setRiderLocation] = useState({
    latitude: 0,
    longitude: 0,
  });
  const [routeCoordinates, setRouteCoordinates] = useState<any[]>([]);

  useEffect(() => {
    fetchBookingDetails();
    const interval = setInterval(fetchBookingDetails, 5000);
    return () => clearInterval(interval);
  }, [bookingId]);

  const fetchBookingDetails = async () => {
    try {
      const response = await api.get(`/bookings/${bookingId}`);
      setBooking(response.data);

      if (response.data.rider) {
        setRiderLocation({
          latitude: response.data.rider.currentLatitude || 0,
          longitude: response.data.rider.currentLongitude || 0,
        });
      }
    } catch (error) {
      console.error('Failed to fetch booking:', error);
    }
  };

  const handleCallRider = () => {
    if (booking?.rider?.user?.mobileNumber) {
      Linking.openURL(`tel:${booking.rider.user.mobileNumber}`);
    }
  };

  const handleSOS = () => {
    Alert.alert(
      'EMERGENCY SOS',
      'This will call emergency services (112). Only use in case of real danger.',
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'CALL 112',
          style: 'destructive',
          onPress: () => Linking.openURL('tel:112'),
        }
      ],
    );
  };

  const handleShareTrip = async () => {
    try {
      const shareMessage = `I'm on a BYKE ride! Tracking ID: ${bookingId}. Rider: ${
        booking.rider?.user?.fullName || 'Rider'
      }. Services: ${booking.serviceType}.`;
      await Share.share({
        message: shareMessage,
      });
    } catch (error: any) {
      Alert.alert('Error', 'Failed to share trip');
    }
  };

  const handleCancelBooking = () => {
    Alert.alert(
      'Cancel Booking',
      'Are you sure you want to cancel this booking?',
      [
        {text: 'No', style: 'cancel'},
        {
          text: 'Yes',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.post(`/bookings/${bookingId}/cancel`, null, {
                params: {reason: 'User cancelled', byUser: true},
              });
              navigation.navigate('Home');
            } catch (error: any) {
              Alert.alert('Error', 'Failed to cancel booking');
            }
          },
        },
      ],
    );
  };

  const getStatusText = () => {
    switch (booking?.status) {
      case 'ACCEPTED':
        return 'Rider is on the way';
      case 'RIDER_ARRIVED':
        return 'Rider has arrived';
      case 'IN_PROGRESS':
        return 'Ride in progress';
      case 'COMPLETED':
        return 'Ride completed';
      default:
        return 'Finding rider...';
    }
  };

  if (!booking) {
    return (
      <View className="flex-1 justify-center items-center">
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <View className="flex-1">
      <MapView
        className="flex-1"
        region={{
          latitude: booking.pickupLatitude || 28.6139,
          longitude: booking.pickupLongitude || 77.209,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        }}>
        <Marker
          coordinate={{
            latitude: booking.pickupLatitude,
            longitude: booking.pickupLongitude,
          }}
          pinColor="green"
          title="Pickup"
        />
        <Marker
          coordinate={{
            latitude: booking.dropLatitude,
            longitude: booking.dropLongitude,
          }}
          pinColor="red"
          title="Drop"
        />
        {riderLocation.latitude !== 0 && (
          <Marker coordinate={riderLocation} title="Rider">
            <View className="bg-blue-600 p-2 rounded-full">
              <Text className="text-white text-xl">🏍️</Text>
            </View>
          </Marker>
        )}
        {routeCoordinates.length > 0 && (
          <Polyline
            coordinates={routeCoordinates}
            strokeColor="#2563eb"
            strokeWidth={4}
          />
        )}
      </MapView>

      <TouchableOpacity
        className="absolute top-12 left-6 bg-white p-3 rounded-full shadow-md"
        onPress={() => navigation.goBack()}>
        <Text className="text-gray-900 font-bold text-lg">←</Text>
      </TouchableOpacity>

      <TouchableOpacity
        className="absolute top-12 right-6 bg-red-600 px-5 py-3 rounded-full shadow-lg"
        onPress={handleSOS}>
        <Text className="text-white font-bold">🚨 SOS</Text>
      </TouchableOpacity>

      <TouchableOpacity
        className="absolute top-28 right-6 bg-white px-4 py-3 rounded-full shadow-lg flex-row items-center"
        onPress={handleShareTrip}>
        <Text className="text-blue-600 font-bold">📤 Share</Text>
      </TouchableOpacity>

      <View className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl p-6 shadow-lg">
        <Text className="text-2xl font-bold text-gray-900 mb-2">
          {getStatusText()}

        {booking.rider && (
          <View className="mb-4">
            <Text className="text-gray-600 mb-1">
              {booking.rider.user?.fullName || 'Rider'}
            </Text>
            <Text className="text-gray-500 text-sm">
              {booking.rider.vehicleMake} {booking.rider.vehicleModel} •{' '}
              {booking.rider.vehicleRegistrationNumber}
            </Text>
            <View className="flex-row items-center mt-2">
              <Text className="text-yellow-500 mr-1">⭐</Text>
              <Text className="text-gray-700">
                {booking.rider.averageRating?.toFixed(1) || '5.0'}
              </Text>
              <Text className="text-gray-500 ml-2">
                ({booking.rider.totalRides || 0} rides)
              </Text>
            </View>
          </View>
        )}

        <View className="flex-row space-x-3">
          <TouchableOpacity
            className="flex-1 bg-blue-600 rounded-lg py-4 items-center"
            onPress={handleCallRider}>
            <Text className="text-white font-semibold">Call Rider</Text>
          </TouchableOpacity>

          {booking.status !== 'COMPLETED' && (
            <TouchableOpacity
              className="flex-1 bg-red-600 rounded-lg py-4 items-center"
              onPress={handleCancelBooking}>
              <Text className="text-white font-semibold">Cancel</Text>
            </TouchableOpacity>
          )}
        </View>

        {booking.status === 'COMPLETED' && (
          <TouchableOpacity
            className="bg-green-600 rounded-lg py-4 items-center mt-3"
            onPress={() => navigation.navigate('Rating', {bookingId})}>
            <Text className="text-white font-semibold">Rate Rider</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

export default TrackingScreen;
