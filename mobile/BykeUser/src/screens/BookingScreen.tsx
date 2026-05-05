import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
} from 'react-native';
import { useDispatch } from 'react-redux';
import { createBooking } from '../store/slices/bookingSlice';
import api from '../config/api';

const BookingScreen = ({ route, navigation }: any) => {
  const { serviceType } = route.params;
  const dispatch = useDispatch();
  
  const [pickupAddress, setPickupAddress] = useState('');
  const [dropAddress, setDropAddress] = useState('');
  const [description, setDescription] = useState('');
  const [estimatedBudget, setEstimatedBudget] = useState('');
  const [loading, setLoading] = useState(false);

  const serviceConfig = {
    ride: {
      title: 'Book a Ride',
      icon: '🏍️',
      color: '#3b82f6',
      fields: ['pickup', 'drop'],
    },
    errand: {
      title: 'Book an Errand',
      icon: '🛒',
      color: '#10b981',
      fields: ['pickup', 'drop', 'description', 'budget'],
    },
    parcel: {
      title: 'Send a Parcel',
      icon: '📦',
      color: '#f59e0b',
      fields: ['pickup', 'drop', 'description'],
    },
  };

  const config = serviceConfig[serviceType as keyof typeof serviceConfig];

  const handleSubmit = async () => {
    if (!pickupAddress || !dropAddress) {
      Alert.alert('Error', 'Please fill in pickup and drop locations');
      return;
    }

    if (serviceType === 'errand' && !description) {
      Alert.alert('Error', 'Please describe the errand task');
      return;
    }

    setLoading(true);
    try {
      const bookingData = {
        serviceType: serviceType.toUpperCase(),
        vehicleType: 'BIKE',
        pickupAddress,
        pickupLatitude: 28.6139,
        pickupLongitude: 77.2090,
        dropAddress,
        dropLatitude: 28.6239,
        dropLongitude: 77.2190,
        description: description || undefined,
        estimatedBudget: estimatedBudget ? parseFloat(estimatedBudget) : undefined,
      };

      const response = await api.post('/bookings', bookingData);
      const booking = response.data;

      dispatch(createBooking(booking));
      
      navigation.navigate('BidSelection', { bookingId: booking.id });
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to create booking');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={[styles.icon, { color: config.color }]}>{config.icon}</Text>
        <Text style={styles.title}>{config.title}</Text>
      </View>

      <View style={styles.form}>
        {config.fields.includes('pickup') && (
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Pickup Location</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter pickup address"
              value={pickupAddress}
              onChangeText={setPickupAddress}
            />
          </View>
        )}

        {config.fields.includes('drop') && (
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Drop Location</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter drop address"
              value={dropAddress}
              onChangeText={setDropAddress}
            />
          </View>
        )}

        {config.fields.includes('description') && (
          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              {serviceType === 'errand' ? 'Task Description' : 'Parcel Details'}
            </Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder={
                serviceType === 'errand'
                  ? 'Describe what you need done (e.g., buy groceries, collect medicine)'
                  : 'Describe the parcel (type, size, weight)'
              }
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={4}
            />
          </View>
        )}

        {config.fields.includes('budget') && (
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Estimated Budget (₹)</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter estimated amount for purchases"
              value={estimatedBudget}
              onChangeText={setEstimatedBudget}
              keyboardType="numeric"
            />
          </View>
        )}

        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>How it works:</Text>
          <Text style={styles.infoText}>
            1. Submit your booking request{'\n'}
            2. Nearby riders will bid on your request{'\n'}
            3. Choose your preferred rider{'\n'}
            4. Track your {serviceType} in real-time
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.submitButton, { backgroundColor: config.color }]}
          onPress={handleSubmit}
          disabled={loading}
        >
          <Text style={styles.submitButtonText}>
            {loading ? 'Creating...' : 'Find Riders'}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    alignItems: 'center',
    paddingVertical: 24,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  icon: {
    fontSize: 48,
    marginBottom: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  form: {
    padding: 16,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    backgroundColor: '#fff',
    fontSize: 16,
    paddingHorizontal: 12,
    paddingVertical: 12,
    color: '#374151',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  infoCard: {
    backgroundColor: '#f0f9ff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 24,
    borderLeftWidth: 4,
    borderLeftColor: '#3b82f6',
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e40af',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#1e40af',
    lineHeight: 20,
  },
  submitButton: {
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 24,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default BookingScreen;
