import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';

const HomeScreen = () => {
  const navigation = useNavigation<any>();

  const services = [
    { id: 'RIDE', title: 'Ride', icon: '🏍️', color: 'bg-blue-500' },
    { id: 'ERRAND', title: 'Errand', icon: '🛒', color: 'bg-green-500' },
    { id: 'PARCEL', title: 'Parcel', icon: '📦', color: 'bg-purple-500' },
  ];

  const handleServiceSelect = (serviceType: string) => {
    navigation.navigate('Booking', { serviceType });
  };

  return (
    <ScrollView className="flex-1 bg-gray-50">
      <View className="bg-blue-600 px-6 pt-12 pb-8 flex-row justify-between items-center">
        <View>
          <Text className="text-white text-2xl font-bold">Hello, User!</Text>
          <Text className="text-blue-100 mt-1">Where would you like to go?</Text>
        </View>
        <TouchableOpacity 
          onPress={() => navigation.navigate('Notifications')}
          className="bg-blue-500 p-2 rounded-full"
        >
          <Text className="text-2xl">🔔</Text>
        </TouchableOpacity>
      </View>

      <View className="px-6 py-6">
        <Text className="text-lg font-semibold text-gray-900 mb-4">Choose a Service</Text>
        
        {services.map((service) => (
          <TouchableOpacity
            key={service.id}
            className={`${service.color} rounded-xl p-6 mb-4 flex-row items-center`}
            onPress={() => handleServiceSelect(service.id)}
          >
            <Text className="text-4xl mr-4">{service.icon}</Text>
            <View>
              <Text className="text-white text-xl font-bold">{service.title}</Text>
              <Text className="text-white opacity-90 mt-1">
                {service.id === 'RIDE' && 'Book a two-wheeler ride'}
                {service.id === 'ERRAND' && 'Get errands done for you'}
                {service.id === 'PARCEL' && 'Send parcels quickly'}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>

      <View className="px-6 pb-6">
        <TouchableOpacity
          className="border border-gray-300 rounded-xl p-4"
          onPress={() => navigation.navigate('MyBookings')}
        >
          <Text className="text-gray-900 font-semibold text-base">My Bookings</Text>
          <Text className="text-gray-600 mt-1">View your ride history</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

export default HomeScreen;
