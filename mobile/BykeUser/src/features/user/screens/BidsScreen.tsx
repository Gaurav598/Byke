import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Animated, ActivityIndicator, Alert } from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { useSelector } from 'react-redux';
import { RootState } from '../../../store';
import websocketService from '../../../services/websocketService';
import { getRideBids, acceptBid, Bid } from '../../../services/rideService';
import { ChevronLeft, Star, Clock, Shield, ArrowRight, User } from 'lucide-react-native';

type RootStackParamList = {
  UserBids: {
    rideId: string;
    from: string;
    to: string;
    maxFare: number;
    vehicleType: string;
    distanceKm: number;
  };
  UserTracking: {
    rideId: string;
    rider: any;
    from: string;
    to: string;
    maxFare: number;
  };
};

type BidsScreenRouteProp = RouteProp<RootStackParamList, 'UserBids'>;
type BidsScreenNavigationProp = any;

interface BidItemProps {
  item: any;
  onAccept: (item: any) => void;
  isNew: boolean;
  disabled?: boolean;
}

const BidItem: React.FC<BidItemProps> = ({ item, onAccept, isNew, disabled }) => {
  const fade = useRef(new Animated.Value(isNew ? 0 : 1)).current;
  const slide = useRef(new Animated.Value(isNew ? 20 : 0)).current;

  useEffect(() => {
    if (isNew) {
      Animated.parallel([
        Animated.timing(fade, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.spring(slide, { toValue: 0, tension: 50, friction: 7, useNativeDriver: true }),
      ]).start();
    }
  }, [isNew, fade, slide]);

  const riderName = item.rider?.user?.fullName || item.riderName || item.name || 'Rider';
  const rating = item.rider?.averageRating || item.rating || 4.8;
  const totalRides = item.rider?.totalRides || item.totalRides || 0;
  const vehicle = item.rider?.vehicleType || item.vehicleType || item.vehicle || 'Auto';

  return (
    <Animated.View style={{ opacity: fade, transform: [{ translateY: slide }] }}>
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={() => onAccept(item)}
        disabled={disabled}
        className="bg-white rounded-[32px] p-5 mb-4 border border-gray-100 shadow-sm shadow-black/5"
      >
        <View className="flex-row items-center">
          <View className="relative">
            <View
              className="w-16 h-16 rounded-2xl items-center justify-center shadow-sm"
              style={{ backgroundColor: '#F3F4F6' }}>
              <User size={32} color="#9CA3AF" />
            </View>
            <View className="absolute -bottom-1 -right-1 bg-green-500 w-4 h-4 rounded-full border-2 border-white" />
          </View>

          <View className="flex-1 ml-4">
            <View className="flex-row items-center justify-between mb-1">
              <Text className="text-lg font-black text-gray-900">{riderName}</Text>
              <Text className="text-2xl font-black text-black">₹{item.bidAmount}</Text>
            </View>

            <View className="flex-row items-center space-x-3">
              <View className="flex-row items-center bg-yellow-50 px-2 py-1 rounded-lg">
                <Star size={12} color="#EAB308" fill="#EAB308" />
                <Text className="text-xs font-black text-yellow-700 ml-1">{typeof rating === 'number' ? rating.toFixed(1) : rating}</Text>
              </View>
              <View className="flex-row items-center bg-gray-50 px-2 py-1 rounded-lg ml-2">
                <Clock size={12} color="#6B7280" />
                <Text className="text-xs font-black text-gray-600 ml-1">5 min</Text>
              </View>
              <View className="flex-row items-center bg-blue-50 px-2 py-1 rounded-lg ml-2">
                <Shield size={12} color="#3B82F6" />
                <Text className="text-xs font-black text-blue-600 ml-1">{totalRides} rides</Text>
              </View>
            </View>
          </View>
        </View>

        <View className="mt-4 pt-4 border-t border-gray-50 flex-row items-center justify-between">
          <View className="flex-row items-center">
            <Text className="text-xs font-bold text-gray-400 uppercase tracking-widest">Vehicle: </Text>
            <Text className="text-xs font-black text-gray-700 uppercase">{vehicle}</Text>
          </View>
          <View className="flex-row items-center">
            <Text className="text-sm font-black text-green-600 mr-2">Accept Offer</Text>
            <View className="bg-green-500 rounded-full p-1">
              <ArrowRight size={14} color="white" strokeWidth={3} />
            </View>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

export default function BidsScreen() {
  const route = useRoute<BidsScreenRouteProp>();
  const navigation = useNavigation<BidsScreenNavigationProp>();
  const rideId = route.params?.rideId ?? '';
  const from = route.params?.from ?? '';
  const to = route.params?.to ?? '';
  const maxFare = route.params?.maxFare ?? 0;
  const vehicleType = route.params?.vehicleType ?? '';
  const distanceKm = route.params?.distanceKm ?? 0;

  const { token } = useSelector((state: RootState) => state.auth);

  const [bids, setBids] = useState<any[]>([]);
  const [newBidIds, setNewBidIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);

  const loadBids = useCallback(async () => {
    if (!rideId) return;
    try {
      setLoading(true);
      const fetchedBids = await getRideBids(rideId);
      setBids(fetchedBids || []);
    } catch (error: any) {
      console.error('Error loading bids:', error);
      // Don't show alert for empty bids - it's normal to have no bids initially
    } finally {
      setLoading(false);
    }
  }, [rideId]);

  const setupWebSocket = useCallback(() => {
    if (!token || !rideId) return;

    if (!websocketService.isConnected()) {
      websocketService.connect(token);
    }

    websocketService.joinRideRoom(rideId);

    websocketService.onNewBid((bid: any) => {
      setBids((prev) => {
        // Check if bid already exists
        const exists = prev.some(b => b.id === bid.id);
        if (exists) return prev;
        return [bid, ...prev];
      });
      setNewBidIds((prev) => new Set(prev).add(bid.id));
      setTimeout(() => {
        setNewBidIds((prev) => {
          const updated = new Set(prev);
          updated.delete(bid.id);
          return updated;
        });
      }, 800);
    });
  }, [token, rideId]);

  useEffect(() => {
    if (!rideId) {
      console.error('BidsScreen opened without rideId:', route.params);
      return;
    }
    
    loadBids();
    setupWebSocket();

    // Poll for bids every 5 seconds as a fallback
    const pollInterval = setInterval(loadBids, 5000);

    return () => {
      clearInterval(pollInterval);
      if (rideId) {
        websocketService.leaveRideRoom(rideId);
      }
    };
  }, [rideId, loadBids, setupWebSocket]);

  // Show error state if no rideId
  if (!rideId) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <Text className="text-gray-700 text-lg font-semibold mb-4">Invalid booking</Text>
        <TouchableOpacity 
          onPress={() => navigation.goBack()}
          className="bg-black px-6 py-3 rounded-xl"
        >
          <Text className="text-white font-bold">Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const handleAcceptBid = async (bid: any) => {
    try {
      setAccepting(true);
      await acceptBid(rideId, String(bid.id));
      
      navigation.navigate('UserTracking', {
        rideId,
        rider: bid.rider || bid,
        from,
        to,
        maxFare: bid.bidAmount,
      });
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to accept bid');
    } finally {
      setAccepting(false);
    }
  };

  return (
    <View className="flex-1 bg-white">
      {/* Header */}
      <View className="bg-white pt-14 pb-6 px-6 shadow-sm shadow-black/5 z-10">
        <View className="flex-row items-center justify-between">
          <TouchableOpacity 
            onPress={() => navigation.goBack()}
            className="bg-gray-50 p-2.5 rounded-xl border border-gray-100"
          >
            <ChevronLeft size={24} color="black" strokeWidth={2.5} />
          </TouchableOpacity>
          <View className="items-center">
            <Text className="text-xl font-black text-black">Bids Arriving</Text>
            <View className="flex-row items-center mt-1">
              <View className="w-1.5 h-1.5 rounded-full bg-green-500 mr-2" />
              <Text className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Searching nearby riders</Text>
            </View>
          </View>
          <View className="w-10" />
        </View>
      </View>

      <View className="flex-1 px-6 pt-4 bg-gray-50">
        {/* Ride Info Summary */}
        <View className="bg-black rounded-3xl p-6 mb-6 shadow-xl shadow-black/20">
          <View className="flex-row items-center justify-between mb-4">
            <View className="bg-yellow-400 px-3 py-1.5 rounded-xl">
              <Text className="text-[10px] font-black text-black uppercase tracking-tighter">Your Max Price</Text>
              <Text className="text-lg font-black text-black">₹{maxFare}</Text>
            </View>
            <View className="items-end">
              <Text className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Distance</Text>
              <Text className="text-lg font-black text-white">{typeof distanceKm === 'number' ? distanceKm.toFixed(1) : distanceKm} km</Text>
            </View>
          </View>
          
          <View className="flex-row items-center">
            <View className="flex-1">
              <Text className="text-xs font-bold text-gray-500 uppercase" numberOfLines={1}>From: {from}</Text>
              <Text className="text-xs font-bold text-gray-500 uppercase mt-1" numberOfLines={1}>To: {to}</Text>
            </View>
          </View>
        </View>

        <View className="flex-row items-center justify-between mb-4 px-1">
          <Text className="text-xs font-black text-gray-400 uppercase tracking-widest">Available Offers ({bids.length})</Text>
        </View>

        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
          {loading && bids.length === 0 ? (
            <View className="py-20 items-center">
              <ActivityIndicator size="large" color="#EAB308" />
              <Text className="text-gray-400 mt-6 font-black uppercase tracking-widest text-xs">Finding best offers...</Text>
            </View>
          ) : bids.length === 0 ? (
            <View className="py-20 items-center">
              <View className="bg-white p-8 rounded-[40px] shadow-sm mb-6 border border-gray-100">
                <Clock size={48} color="#EAB308" strokeWidth={1.5} />
              </View>
              <Text className="text-gray-900 text-xl font-black mb-2">Almost there!</Text>
              <Text className="text-gray-400 text-center px-10 font-bold leading-5">Waiting for nearby riders to bid on your request...</Text>
            </View>
          ) : (
            <View className="pb-10">
              {bids.map((item) => (
                <BidItem 
                  key={item.id} 
                  item={item} 
                  onAccept={handleAcceptBid} 
                  isNew={newBidIds.has(item.id)} 
                  disabled={accepting} 
                />
              ))}
            </View>
          )}
        </ScrollView>
      </View>
    </View>
  );
}
