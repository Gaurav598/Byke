import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
  SafeAreaView,
  Image,
} from 'react-native';
import {useSelector, useDispatch} from 'react-redux';
import {RootState, AppDispatch} from '../store';
import {logout} from '../store/slices/authSlice';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  MapPin,
  CreditCard,
  Bell,
  HelpCircle,
  LogOut,
  ChevronRight,
  Settings,
} from 'lucide-react-native';

const ProfileScreen = () => {
  const dispatch = useDispatch<AppDispatch>();
  const {user} = useSelector((state: RootState) => state.auth);

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      {text: 'Cancel', style: 'cancel'},
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          await AsyncStorage.clear();
          dispatch(logout());
        },
      },
    ]);
  };

  const menuItems = [
    {icon: MapPin, label: 'Saved Addresses', color: '#3B82F6'},
    {icon: CreditCard, label: 'Payment Methods', color: '#10B981'},
    {icon: Bell, label: 'Notifications', color: '#F59E0B'},
    {icon: Settings, label: 'Settings', color: '#6B7280'},
    {icon: HelpCircle, label: 'Help & Support', color: '#8B5CF6'},
  ];

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Header Section */}
        <View className="px-6 pt-10 pb-12 items-center bg-gray-50 rounded-b-[50px] border-b border-gray-100">
          <View className="relative">
            {user?.profilePhoto ? (
              <Image
                source={{uri: user.profilePhoto}}
                className="w-28 h-28 rounded-[40px]"
                style={{width: 112, height: 112, borderRadius: 40}}
              />
            ) : (
              <View className="w-28 h-28 bg-yellow-400 rounded-[40px] items-center justify-center shadow-2xl shadow-yellow-400/30">
                <Text className="text-4xl font-black text-black">
                  {user?.name?.charAt(0).toUpperCase() || 'U'}
                </Text>
              </View>
            )}
            <TouchableOpacity className="absolute -bottom-2 -right-2 bg-black p-3 rounded-2xl border-4 border-white">
              <Settings size={18} color="white" />
            </TouchableOpacity>
          </View>

          <Text className="text-3xl font-black text-black mt-6">
            {user?.name || 'Byke User'}
          </Text>
          <View className="bg-white/80 px-4 py-2 rounded-2xl mt-3 border border-gray-100">
            <Text className="text-sm font-black text-gray-400 uppercase tracking-widest">
              {user?.phone || '+91 00000 00000'}
            </Text>
          </View>
        </View>

        {/* Menu Section */}
        <View className="px-6 py-10">
          <Text className="text-xs font-black text-gray-400 uppercase tracking-widest mb-6 ml-1">
            Account Overview
          </Text>

          <View className="space-y-4">
            {menuItems.map((item, index) => (
              <TouchableOpacity
                key={index}
                activeOpacity={0.7}
                className="flex-row items-center bg-white border border-gray-100 p-5 rounded-3xl shadow-sm shadow-black/5 mb-4">
                <View
                  className="p-3 rounded-2xl mr-4"
                  style={{backgroundColor: `${item.color}15`}}>
                  <item.icon size={22} color={item.color} strokeWidth={2.5} />
                </View>
                <Text className="flex-1 text-lg font-black text-gray-800">
                  {item.label}
                </Text>
                <ChevronRight size={20} color="#D1D5DB" strokeWidth={3} />
              </TouchableOpacity>
            ))}

            <TouchableOpacity
              activeOpacity={0.7}
              onPress={handleLogout}
              className="flex-row items-center bg-red-50 border border-red-100 p-5 rounded-3xl mt-6">
              <View className="bg-red-500/10 p-3 rounded-2xl mr-4">
                <LogOut size={22} color="#EF4444" strokeWidth={2.5} />
              </View>
              <Text className="flex-1 text-lg font-black text-red-500">
                Logout Session
              </Text>
              <ChevronRight size={20} color="#FCA5A5" strokeWidth={3} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Footer info */}
        <View className="items-center pb-12">
          <Text className="text-[10px] font-black text-gray-300 uppercase tracking-[4px]">
            BYKE v1.0.1
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default ProfileScreen;
