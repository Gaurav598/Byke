import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

// Auth
import LoginScreen from '../screens/auth/LoginScreen';
import OTPScreen from '../screens/auth/OTPScreen';

// User flow
import UserHomeScreen from '../screens/user/UserHomeScreen';
import UserSelectRideScreen from '../screens/user/UserSelectRideScreen';
import UserBidsScreen from '../screens/user/UserBidsScreen';
import UserTrackingScreen from '../screens/user/UserTrackingScreen';

// Rider flow
import RiderHomeScreen from '../screens/rider/RiderHomeScreen';
import RiderRequestsScreen from '../screens/rider/RiderRequestsScreen';
import RiderTripScreen from '../screens/rider/RiderTripScreen';

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
      {/* Auth */}
      <Stack.Screen name="Login"          component={LoginScreen} />
      <Stack.Screen name="OTP"            component={OTPScreen} />

      {/* User */}
      <Stack.Screen name="UserHome"       component={UserHomeScreen} />
      <Stack.Screen name="UserSelectRide" component={UserSelectRideScreen} />
      <Stack.Screen name="UserBids"       component={UserBidsScreen} />
      <Stack.Screen name="UserTracking"   component={UserTrackingScreen} />

      {/* Rider */}
      <Stack.Screen name="RiderHome"      component={RiderHomeScreen} />
      <Stack.Screen name="RiderRequests"  component={RiderRequestsScreen} />
      <Stack.Screen name="RiderTrip"      component={RiderTripScreen} />
    </Stack.Navigator>
  );
}
