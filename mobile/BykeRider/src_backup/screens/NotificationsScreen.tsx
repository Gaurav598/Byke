import React, {useState} from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';

const NotificationsScreen = () => {
  const navigation = useNavigation();
  const [notifications, setNotifications] = useState([
    {
      id: '1',
      title: 'Welcome to BYKE!',
      message: 'Thank you for joining BYKE. Start booking rides now!',
      time: '2 hours ago',
      read: false,
    },
    {
      id: '2',
      title: 'Promo Offer',
      message: 'Use code BYKE50 to get 50% off on your next ride.',
      time: '5 hours ago',
      read: true,
    },
    {
      id: '3',
      title: 'Security Alert',
      message: 'New login detected on your account.',
      time: '1 day ago',
      read: true,
    },
  ]);

  const markAsRead = (id: string) => {
    setNotifications(prev =>
      prev.map(n => (n.id === id ? {...n, read: true} : n)),
    );
  };

  const renderItem = ({item}: any) => (
    <TouchableOpacity
      className={`p-4 border-b border-gray-100 ${
        item.read ? 'bg-white' : 'bg-blue-50'
      }`}
      onPress={() => markAsRead(item.id)}>
      <View className="flex-row justify-between items-start">
        <Text
          className={`font-bold text-gray-900 ${
            item.read ? '' : 'text-blue-600'
          }`}>
          {item.title}
        </Text>
        <Text className="text-xs text-gray-500">{item.time}</Text>
      </View>
      <Text className="text-gray-600 mt-1">{item.message}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-row items-center p-4 border-b border-gray-200">
        <TouchableOpacity onPress={() => navigation.goBack()} className="mr-4">
          <Text className="text-blue-600 text-lg">←</Text>
        </TouchableOpacity>
        <Text className="text-xl font-bold text-gray-900">Notifications</Text>
      </View>

      {notifications.length > 0 ? (
        <FlatList
          data={notifications}
          renderItem={renderItem}
          keyExtractor={item => item.id}
        />
      ) : (
        <View className="flex-1 justify-center items-center">
          <Text className="text-gray-500">No notifications yet</Text>
        </View>
      )}
    </SafeAreaView>
  );
};

export default NotificationsScreen;
