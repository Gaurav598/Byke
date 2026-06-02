import React, {useEffect} from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import {useDispatch, useSelector} from 'react-redux';
import {fetchMyBookings} from '../store/slices/bookingSlice';
import {AppDispatch, RootState} from '../store';

const MyBookingsScreen = ({navigation}: any) => {
  const dispatch = useDispatch<AppDispatch>();
  const {bookings, loading} = useSelector((state: RootState) => state.booking);

  useEffect(() => {
    dispatch(fetchMyBookings());
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'bg-green-100 text-green-800';
      case 'IN_PROGRESS':
        return 'bg-blue-100 text-blue-800';
      case 'CANCELLED_BY_USER':
      case 'CANCELLED_BY_RIDER':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const renderBookingItem = ({item}: any) => (
    <TouchableOpacity
      className="bg-white rounded-lg p-4 mb-3 border border-gray-200"
      onPress={() => {
        if (item.status === 'IN_PROGRESS' || item.status === 'ACCEPTED') {
          navigation.navigate('Tracking', {bookingId: item.id});
        }
      }}>
      <View className="flex-row justify-between items-start mb-2">
        <View className="flex-1">
          <Text className="text-lg font-bold text-gray-900 mb-1">
            {item.serviceType}
          </Text>
          <Text className="text-gray-600 text-sm" numberOfLines={1}>
            {item.pickupAddress}
          </Text>
          <Text className="text-gray-600 text-sm" numberOfLines={1}>
            → {item.dropAddress}
          </Text>
        </View>
        <View
          className={`px-3 py-1 rounded-full ${getStatusColor(item.status)}`}>
          <Text className="text-xs font-semibold">
            {item.status.replace(/_/g, ' ')}
          </Text>
        </View>
      </View>

      <View className="flex-row justify-between items-center mt-3 pt-3 border-t border-gray-100">
        <Text className="text-gray-500 text-sm">
          {new Date(item.createdAt).toLocaleDateString()}
        </Text>
        {item.finalFare && (
          <Text className="text-lg font-bold text-gray-900">
            ₹{item.finalFare}
          </Text>
        )}
      </View>

      {item.rider && (
        <View className="mt-2 pt-2 border-t border-gray-100">
          <Text className="text-gray-600 text-sm">
            Rider: {item.rider.user?.fullName || 'N/A'}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-50">
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-50">
      <View className="bg-blue-600 p-6">
        <Text className="text-white text-2xl font-bold">My Bookings</Text>
        <Text className="text-blue-100 mt-1">
          {bookings.length} total bookings
        </Text>
      </View>

      {bookings.length === 0 ? (
        <View className="flex-1 justify-center items-center px-6">
          <Text className="text-6xl mb-4">📋</Text>
          <Text className="text-gray-900 text-lg font-semibold mb-2">
            No bookings yet
          </Text>
          <Text className="text-gray-600 text-center mb-6">
            Start your first ride by booking from the home screen
          </Text>
          <TouchableOpacity
            className="bg-blue-600 rounded-lg py-3 px-6"
            onPress={() => navigation.navigate('Home')}>
            <Text className="text-white font-semibold">Book Now</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={bookings}
          renderItem={renderBookingItem}
          keyExtractor={item => item.id.toString()}
          contentContainerStyle={{padding: 16}}
        />
      )}
    </View>
  );
};

export default MyBookingsScreen;
