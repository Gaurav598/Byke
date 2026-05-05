import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  SafeAreaView,
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../store';
import api from '../config/api';
import { Calendar, MapPin, ChevronRight, Clock, CheckCircle2, XCircle, AlertCircle, ArrowLeft } from 'lucide-react-native';

const MyBookingsScreen = ({ navigation }: any) => {
  const dispatch = useDispatch<AppDispatch>();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const { user } = useSelector((state: RootState) => state.auth);

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const response = await api.get('/bookings/user/my-bookings');
      setBookings(response.data);
    } catch (error) {
      console.log('Error fetching bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'PENDING': return { color: '#F59E0B', icon: Clock, label: 'Pending' };
      case 'BIDDING': return { color: '#3B82F6', icon: AlertCircle, label: 'Bidding' };
      case 'ACCEPTED': return { color: '#10B981', icon: CheckCircle2, label: 'Accepted' };
      case 'IN_PROGRESS': return { color: '#8B5CF6', icon: CheckCircle2, label: 'En Route' };
      case 'COMPLETED': return { color: '#059669', icon: CheckCircle2, label: 'Completed' };
      case 'CANCELLED': return { color: '#EF4444', icon: XCircle, label: 'Cancelled' };
      default: return { color: '#6B7280', icon: AlertCircle, label: status };
    }
  };

  const renderBooking = ({ item }: any) => {
    const status = getStatusInfo(item.status);
    return (
      <TouchableOpacity
        activeOpacity={0.7}
        className="bg-white rounded-[32px] p-6 mb-4 border border-gray-100 shadow-sm shadow-black/5"
        onPress={() => {
          if (item.status === 'IN_PROGRESS' || item.status === 'ACCEPTED') {
            navigation.navigate('UserTracking', { rideId: item.id, rider: item.rider, from: item.pickupAddress, to: item.dropAddress, maxFare: item.finalFare || item.estimatedFare });
          }
        }}
      >
        <View className="flex-row items-center justify-between mb-4">
          <View className="flex-row items-center">
            <View className="bg-yellow-400/10 px-3 py-1 rounded-xl">
              <Text className="text-[10px] font-black text-yellow-700 uppercase tracking-tighter">{item.serviceType || 'RIDE'}</Text>
            </View>
            <View className="flex-row items-center ml-3">
              <Calendar size={12} color="#9CA3AF" />
              <Text className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
                {new Date(item.createdAt).toLocaleDateString(undefined, { day: '2-digit', month: 'short' })}
              </Text>
            </View>
          </View>
          <View className="flex-row items-center" style={{ backgroundColor: `${status.color}15`, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 }}>
            <status.icon size={12} color={status.color} />
            <Text className="text-[10px] font-black uppercase tracking-widest ml-1" style={{ color: status.color }}>{status.label}</Text>
          </View>
        </View>

        <View className="mb-4">
          <View className="flex-row items-center">
            <View className="w-2 h-2 rounded-full bg-green-500 mr-3" />
            <Text className="flex-1 text-sm font-bold text-gray-600 truncate" numberOfLines={1}>{item.pickupAddress}</Text>
          </View>
          <View className="w-[1px] h-3 bg-gray-100 ml-1 my-1" />
          <View className="flex-row items-center">
            <View className="w-2 h-2 rounded-full bg-red-500 mr-3" />
            <Text className="flex-1 text-sm font-bold text-gray-600 truncate" numberOfLines={1}>{item.dropAddress}</Text>
          </View>
        </View>

        <View className="flex-row items-center justify-between pt-4 border-t border-gray-50">
          <View>
            <Text className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Total Fare</Text>
            <Text className="text-xl font-black text-black">₹{item.finalFare || item.estimatedFare}</Text>
          </View>
          <ChevronRight size={20} color="#D1D5DB" strokeWidth={3} />
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* Header */}
      <View className="px-6 pt-4 pb-6 flex-row items-center">
        <TouchableOpacity 
          onPress={() => navigation.goBack()}
          className="bg-gray-50 p-2.5 rounded-xl border border-gray-100 mr-4"
        >
          <ArrowLeft size={24} color="black" strokeWidth={2.5} />
        </TouchableOpacity>
        <Text className="text-2xl font-black text-black">My Bookings</Text>
      </View>

      <FlatList
        data={bookings}
        renderItem={renderBooking}
        keyExtractor={(item: any) => item.id.toString()}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={fetchBookings} tintColor="#EAB308" />
        }
        ListEmptyComponent={
          <View className="flex-1 items-center justify-center py-20 px-10">
            <View className="bg-gray-50 p-10 rounded-[50px] mb-6">
              <Clock size={64} color="#D1D5DB" strokeWidth={1.5} />
            </View>
            <Text className="text-xl font-black text-black mb-2">No Bookings Yet</Text>
            <Text className="text-gray-400 text-center font-bold leading-5">Your ride history will appear here once you take your first trip.</Text>
            <TouchableOpacity 
              onPress={() => navigation.navigate('UserHome')}
              className="mt-8 bg-yellow-400 px-8 py-4 rounded-3xl shadow-xl shadow-yellow-400/20"
            >
              <Text className="text-black font-black uppercase tracking-widest">Book Now</Text>
            </TouchableOpacity>
          </View>
        }
        contentContainerStyle={{ padding: 24 }}
        className="flex-1"
      />
    </SafeAreaView>
  );
};

export default MyBookingsScreen;
