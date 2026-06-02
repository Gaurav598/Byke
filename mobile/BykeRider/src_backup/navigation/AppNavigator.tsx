import React from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {createStackNavigator} from '@react-navigation/stack';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {useSelector} from 'react-redux';
import {RootState} from '../store';

import LoginScreen from '../screens/LoginScreen';
import HomeScreen from '../screens/HomeScreen';
import BookingScreen from '../screens/BookingScreen';
import BiddingScreen from '../screens/BiddingScreen';
import TrackingScreen from '../screens/TrackingScreen';
import MyBookingsScreen from '../screens/MyBookingsScreen';
import ProfileScreen from '../screens/ProfileScreen';
import RatingScreen from '../screens/RatingScreen';
import NotificationsScreen from '../screens/NotificationsScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

const HomeTabs = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: '#2563eb',
        tabBarInactiveTintColor: '#9ca3af',
        headerShown: false,
      }}>
      <Tab.Screen
        name="HomeTab"
        component={HomeScreen}
        options={{
          tabBarLabel: 'Home',
          tabBarIcon: ({color}) => <span style={{fontSize: 24}}>🏠</span>,
        }}
      />
      <Tab.Screen
        name="BookingsTab"
        component={MyBookingsScreen}
        options={{
          tabBarLabel: 'Bookings',
          tabBarIcon: ({color}) => <span style={{fontSize: 24}}>📋</span>,
        }}
      />
      <Tab.Screen
        name="ProfileTab"
        component={ProfileScreen}
        options={{
          tabBarLabel: 'Profile',
          tabBarIcon: ({color}) => <span style={{fontSize: 24}}>👤</span>,
        }}
      />
    </Tab.Navigator>
  );
};

const AppNavigator = () => {
  const {isAuthenticated} = useSelector((state: RootState) => state.auth);

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{headerShown: false}}>
        {!isAuthenticated ? (
          <Stack.Screen name="Login" component={LoginScreen} />
        ) : (
          <>
            <Stack.Screen name="Home" component={HomeTabs} />
            <Stack.Screen
              name="Booking"
              component={BookingScreen}
              options={{headerShown: true, title: 'Book Service'}}
            />
            <Stack.Screen
              name="Bidding"
              component={BiddingScreen}
              options={{headerShown: true, title: 'Select Rider'}}
            />
            <Stack.Screen
              name="Tracking"
              component={TrackingScreen}
              options={{headerShown: false}}
            />
            <Stack.Screen
              name="Rating"
              component={RatingScreen}
              options={{headerShown: true, title: 'Rate Ride'}}
            />
            <Stack.Screen
              name="MyBookings"
              component={MyBookingsScreen}
              options={{headerShown: true, title: 'My Bookings'}}
            />
            <Stack.Screen
              name="Notifications"
              component={NotificationsScreen}
              options={{headerShown: false}}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
