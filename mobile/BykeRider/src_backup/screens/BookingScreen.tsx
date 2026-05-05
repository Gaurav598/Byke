import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { createBooking } from '../store/slices/bookingSlice';
import { AppDispatch, RootState } from '../store';
import MapView, { Marker } from 'react-native-maps';
import Geolocation from 'react-native-geolocation-service';

const BookingScreen = ({ route, navigation }: any) => {
  const { serviceType } = route.params;
  const dispatch = useDispatch<AppDispatch>();
  const { loading } = useSelector((state: RootState) => state.booking);

  const [pickupAddress, setPickupAddress] = useState('');
  const [pickupCoords, setPickupCoords] = useState({ latitude: 0, longitude: 0 });
  const [dropAddress, setDropAddress] = useState('');
  const [dropCoords, setDropCoords] = useState({ latitude: 0, longitude: 0 });
  const [errandDescription, setErrandDescription] = useState('');
  const [errandItems, setErrandItems] = useState('');
  const [estimatedBudget, setEstimatedBudget] = useState('');
  const [parcelDescription, setParcelDescription] = useState('');
  const [parcelWeight, setParcelWeight] = useState('');
  const [recipientName, setRecipientName] = useState('');
  const [recipientPhone, setRecipientPhone] = useState('');
  const [currentLocation, setCurrentLocation] = useState({ latitude: 28.6139, longitude: 77.2090 });

  useEffect(() => {
    getCurrentLocation();
  }, []);

  const getCurrentLocation = () => {
    Geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setCurrentLocation({ latitude, longitude });
        setPickupCoords({ latitude, longitude });
      },
      (error) => {
        console.log(error);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
    );
  };

  const handleCreateBooking = async () => {
    if (!pickupAddress || !dropAddress) {
      Alert.alert('Error', 'Please enter pickup and drop locations');
      return;
    }

    const bookingData: any = {
      serviceType,
      pickupAddress,
      pickupLatitude: pickupCoords.latitude,
      pickupLongitude: pickupCoords.longitude,
      dropAddress,
      dropLatitude: dropCoords.latitude,
      dropLongitude: dropCoords.longitude,
      estimatedDistance: 5.0,
      estimatedDuration: 20,
    };

    if (serviceType === 'ERRAND') {
      bookingData.errandDescription = errandDescription;
      bookingData.errandItemsList = errandItems;
      bookingData.estimatedBudget = parseFloat(estimatedBudget || '0');
    } else if (serviceType === 'PARCEL') {
      bookingData.parcelDescription = parcelDescription;
      bookingData.parcelWeight = parseFloat(parcelWeight || '0');
      bookingData.recipientName = recipientName;
      bookingData.recipientPhone = recipientPhone;
    }

    try {
      const result = await dispatch(createBooking(bookingData)).unwrap();
      navigation.navigate('Bidding', { bookingId: result.id });
    } catch (error: any) {
      Alert.alert('Error', error);
    }
  };

  return (
    <ScrollView className="flex-1 bg-white">
      <View className="h-64">
        <MapView
          className="flex-1"
          region={{
            latitude: currentLocation.latitude,
            longitude: currentLocation.longitude,
            latitudeDelta: 0.05,
            longitudeDelta: 0.05,
          }}
        >
          {pickupCoords.latitude !== 0 && (
            <Marker coordinate={pickupCoords} pinColor="green" title="Pickup" />
          )}
          {dropCoords.latitude !== 0 && (
            <Marker coordinate={dropCoords} pinColor="red" title="Drop" />
          )}
        </MapView>
      </View>

      <View className="p-6">
        <Text className="text-2xl font-bold text-gray-900 mb-4">
          Book {serviceType === 'RIDE' ? 'a Ride' : serviceType === 'ERRAND' ? 'an Errand' : 'Parcel Delivery'}
        </Text>

        <TextInput
          className="border border-gray-300 rounded-lg px-4 py-3 mb-4"
          placeholder="Pickup Location"
          value={pickupAddress}
          onChangeText={setPickupAddress}
        />

        <TextInput
          className="border border-gray-300 rounded-lg px-4 py-3 mb-4"
          placeholder="Drop Location"
          value={dropAddress}
          onChangeText={setDropAddress}
        />

        {serviceType === 'ERRAND' && (
          <>
            <TextInput
              className="border border-gray-300 rounded-lg px-4 py-3 mb-4"
              placeholder="Errand Description"
              multiline
              numberOfLines={3}
              value={errandDescription}
              onChangeText={setErrandDescription}
            />
            <TextInput
              className="border border-gray-300 rounded-lg px-4 py-3 mb-4"
              placeholder="Items List (comma separated)"
              value={errandItems}
              onChangeText={setErrandItems}
            />
            <TextInput
              className="border border-gray-300 rounded-lg px-4 py-3 mb-4"
              placeholder="Estimated Budget (₹)"
              keyboardType="numeric"
              value={estimatedBudget}
              onChangeText={setEstimatedBudget}
            />
          </>
        )}

        {serviceType === 'PARCEL' && (
          <>
            <TextInput
              className="border border-gray-300 rounded-lg px-4 py-3 mb-4"
              placeholder="Parcel Description"
              value={parcelDescription}
              onChangeText={setParcelDescription}
            />
            <TextInput
              className="border border-gray-300 rounded-lg px-4 py-3 mb-4"
              placeholder="Weight (kg)"
              keyboardType="numeric"
              value={parcelWeight}
              onChangeText={setParcelWeight}
            />
            <TextInput
              className="border border-gray-300 rounded-lg px-4 py-3 mb-4"
              placeholder="Recipient Name"
              value={recipientName}
              onChangeText={setRecipientName}
            />
            <TextInput
              className="border border-gray-300 rounded-lg px-4 py-3 mb-4"
              placeholder="Recipient Phone"
              keyboardType="phone-pad"
              value={recipientPhone}
              onChangeText={setRecipientPhone}
            />
          </>
        )}

        <TouchableOpacity
          className="bg-blue-600 rounded-lg py-4 items-center mt-4"
          onPress={handleCreateBooking}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text className="text-white font-semibold text-base">Find Riders</Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

export default BookingScreen;
