import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../store/slices/authSlice';
import { AppDispatch, RootState } from '../store';

const ProfileScreen = ({ navigation }: any) => {
  const dispatch = useDispatch<AppDispatch>();
  const { user } = useSelector((state: RootState) => state.auth);

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            await dispatch(logout());
            navigation.replace('Login');
          },
        },
      ]
    );
  };

  const menuItems = [
    { icon: '📋', title: 'My Bookings', screen: 'MyBookings' },
    { icon: '💳', title: 'Payment Methods', screen: null },
    { icon: '📍', title: 'Saved Addresses', screen: null },
    { icon: '⭐', title: 'My Ratings', screen: null },
    { icon: '🎁', title: 'Offers & Promotions', screen: null },
    { icon: '❓', title: 'Help & Support', screen: null },
    { icon: '⚙️', title: 'Settings', screen: null },
    { icon: '📄', title: 'Terms & Conditions', screen: null },
    { icon: '🔒', title: 'Privacy Policy', screen: null },
  ];

  return (
    <ScrollView className="flex-1 bg-gray-50">
      <View className="bg-blue-600 p-6 pb-12">
        <Text className="text-white text-2xl font-bold">Profile</Text>
      </View>

      <View className="bg-white rounded-t-3xl -mt-6 p-6">
        <View className="items-center mb-6">
          <View className="w-24 h-24 bg-blue-100 rounded-full items-center justify-center mb-3">
            <Text className="text-4xl">👤</Text>
          </View>
          <Text className="text-xl font-bold text-gray-900">User</Text>
          <Text className="text-gray-600 mt-1">+91 XXXXXXXXXX</Text>
        </View>

        <View className="space-y-2">
          {menuItems.map((item, index) => (
            <TouchableOpacity
              key={index}
              className="flex-row items-center py-4 border-b border-gray-100"
              onPress={() => {
                if (item.screen) {
                  navigation.navigate(item.screen);
                } else {
                  Alert.alert('Coming Soon', 'This feature will be available soon');
                }
              }}
            >
              <Text className="text-2xl mr-4">{item.icon}</Text>
              <Text className="flex-1 text-gray-900 font-medium">{item.title}</Text>
              <Text className="text-gray-400">›</Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          className="bg-red-600 rounded-lg py-4 items-center mt-6"
          onPress={handleLogout}
        >
          <Text className="text-white font-semibold text-base">Logout</Text>
        </TouchableOpacity>

        <Text className="text-center text-gray-500 text-sm mt-6">
          Version 1.0.0
        </Text>
      </View>
    </ScrollView>
  );
};

export default ProfileScreen;
