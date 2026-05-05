import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { fetchBookingBids, acceptBid, addBid } from '../store/slices/bookingSlice';
import { AppDispatch, RootState } from '../store';
import io from 'socket.io-client';

const BiddingScreen = ({ route, navigation }: any) => {
  const { bookingId } = route.params;
  const dispatch = useDispatch<AppDispatch>();
  const { bids, loading } = useSelector((state: RootState) => state.booking);
  const [timeLeft, setTimeLeft] = useState(60);
  const [socket, setSocket] = useState<any>(null);

  useEffect(() => {
    dispatch(fetchBookingBids(bookingId));
    
    const newSocket = io('http://localhost:8080', {
      transports: ['websocket'],
    });

    newSocket.on('connect', () => {
      console.log('Connected to WebSocket');
      newSocket.emit('subscribe', `/topic/booking/${bookingId}/bids`);
    });

    newSocket.on(`/topic/booking/${bookingId}/bids`, (bid: any) => {
      dispatch(addBid(bid));
    });

    setSocket(newSocket);

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      clearInterval(timer);
      if (newSocket) {
        newSocket.disconnect();
      }
    };
  }, [bookingId]);

  const handleAcceptBid = async (bidId: number) => {
    Alert.alert(
      'Accept Bid',
      'Are you sure you want to accept this bid?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Accept',
          onPress: async () => {
            try {
              await dispatch(acceptBid(bidId)).unwrap();
              navigation.navigate('Tracking', { bookingId });
            } catch (error: any) {
              Alert.alert('Error', error);
            }
          },
        },
      ]
    );
  };

  const renderBidItem = ({ item }: any) => (
    <View className="bg-white rounded-lg p-4 mb-3 border border-gray-200">
      <View className="flex-row justify-between items-center mb-2">
        <Text className="text-lg font-bold text-gray-900">₹{item.bidAmount}</Text>
        <View className="flex-row items-center">
          <Text className="text-yellow-500 mr-1">⭐</Text>
          <Text className="text-gray-700">{item.rider?.averageRating?.toFixed(1) || '5.0'}</Text>
        </View>
      </View>
      
      <Text className="text-gray-600 mb-1">
        {item.rider?.user?.fullName || 'Rider'}
      </Text>
      <Text className="text-gray-500 text-sm mb-3">
        {item.rider?.totalRides || 0} rides completed
      </Text>

      {item.isEdited && (
        <Text className="text-orange-500 text-xs mb-2">
          Bid updated from ₹{item.previousBidAmount}
        </Text>
      )}

      <TouchableOpacity
        className="bg-blue-600 rounded-lg py-3 items-center"
        onPress={() => handleAcceptBid(item.id)}
      >
        <Text className="text-white font-semibold">Accept Bid</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View className="flex-1 bg-gray-50">
      <View className="bg-blue-600 p-6">
        <Text className="text-white text-2xl font-bold">Receiving Bids</Text>
        <Text className="text-blue-100 mt-2">
          Time remaining: {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
        </Text>
      </View>

      {loading && bids.length === 0 ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#2563eb" />
          <Text className="text-gray-600 mt-4">Waiting for riders to bid...</Text>
        </View>
      ) : bids.length === 0 ? (
        <View className="flex-1 justify-center items-center px-6">
          <Text className="text-6xl mb-4">🏍️</Text>
          <Text className="text-gray-900 text-lg font-semibold mb-2">No bids yet</Text>
          <Text className="text-gray-600 text-center">
            Riders nearby are reviewing your request. Bids will appear here shortly.
          </Text>
        </View>
      ) : (
        <FlatList
          data={bids}
          renderItem={renderBidItem}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={{ padding: 16 }}
        />
      )}

      {timeLeft === 0 && bids.length === 0 && (
        <View className="p-6">
          <Text className="text-center text-gray-600 mb-4">
            No riders available at the moment. Please try again later.
          </Text>
          <TouchableOpacity
            className="bg-blue-600 rounded-lg py-4 items-center"
            onPress={() => navigation.goBack()}
          >
            <Text className="text-white font-semibold">Try Again</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

export default BiddingScreen;
