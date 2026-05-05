import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, Alert, StyleSheet, SafeAreaView, Dimensions } from 'react-native';
import { ArrowLeft, Plus, Edit3 } from 'lucide-react-native';
import { createRideRequest } from '../../../services/rideService';

const { height } = Dimensions.get('window');
const BASE_FARE_PER_KM = 15;
const QUICK_INCREMENTS = [10, 20, 30];

const SetPriceScreen = ({ navigation, route }: any) => {
  const { pickup, drop, distanceKm, pickupCoords, dropCoords, vehicle } = route.params;
  
  // Safely get vehicle label
  const vehicleLabel = vehicle?.label || vehicle?.name || 'Auto';
  const vehicleType = vehicle?.type || vehicle?.id || 'auto';
  
  const baseFare = Math.round(BASE_FARE_PER_KM * distanceKm);
  const [userAmount, setUserAmount] = useState(baseFare);
  const [manualInput, setManualInput] = useState('');
  const [showManualInput, setShowManualInput] = useState(false);
  const [loading, setLoading] = useState(false);
  const [pressed, setPressed] = useState(false);

  const handleQuickIncrement = (amount: number) => {
    setUserAmount(prev => prev + amount);
    setShowManualInput(false);
  };

  const handleManualSubmit = () => {
    const amount = parseInt(manualInput);
    if (amount && amount >= baseFare) {
      setUserAmount(amount);
      setShowManualInput(false);
      setManualInput('');
    } else {
      Alert.alert('Invalid Amount', `Please enter amount greater than or equal to ₹${baseFare}`);
    }
  };

  const handleFindRiders = async () => {
    if (!pickupCoords || !dropCoords) {
      Alert.alert('Error', 'Location coordinates are missing');
      return;
    }

    if (userAmount < baseFare) {
      Alert.alert('Error', `Amount must be at least ₹${baseFare}`);
      return;
    }

    try {
      if (pressed) return; // prevent double press
      setPressed(true);
      setLoading(true);
      const result = await createRideRequest({
        pickupLocation: {
          latitude: pickupCoords.latitude,
          longitude: pickupCoords.longitude,
          address: pickup,
        },
        dropLocation: {
          latitude: dropCoords.latitude,
          longitude: dropCoords.longitude,
          address: drop,
        },
        vehicleType: vehicleLabel,
        userEnteredAmount: userAmount,
        distanceKm,
      });

      console.log('createRideRequest result:', result);
      const rideId = result?.rideId ?? null;
      if (!rideId) {
        console.error('Booking created but no rideId returned', result);
        Alert.alert('Error', 'Booking created but server did not return booking id');
        setPressed(false);
        return;
      }

      // small delay to avoid potential navigation race conditions
      try {
        await new Promise((res) => setTimeout(res, 200));
        navigation.navigate('UserBids', {
          rideId: String(rideId),
          from: pickup,
          to: drop,
          maxFare: userAmount,
          vehicleType: vehicleLabel,
          distanceKm,
        });
      } catch (navError) {
        console.error('Navigation error to UserBids:', navError);
        Alert.alert('Error', 'Unable to proceed to bids screen');
      } finally {
        setPressed(false);
      }
    } catch (error: any) {
      console.error('Create ride failed:', error);
      Alert.alert('Error', error.message || 'Failed to create ride request');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <ArrowLeft size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Set Your Price</Text>
        <View style={{ width: 40 }} />
      </SafeAreaView>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={styles.label}>Base Fare (₹{BASE_FARE_PER_KM}/km)</Text>
          <View style={styles.baseFareCard}>
            <Text style={styles.baseFareAmount}>₹{baseFare}</Text>
            <Text style={styles.baseFareLabel}>Minimum Amount</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Your Offer</Text>
          <View style={styles.offerCard}>
            <Text style={styles.offerAmount}>₹{userAmount}</Text>
            <Text style={styles.offerLabel}>Riders will bid around this amount</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Quick Adjustments</Text>
          <View style={styles.quickButtons}>
            {QUICK_INCREMENTS.map((amount) => (
              <TouchableOpacity
                key={amount}
                style={styles.quickButton}
                onPress={() => handleQuickIncrement(amount)}
              >
                <Plus size={16} color="#111827" />
                <Text style={styles.quickButtonText}>₹{amount}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <TouchableOpacity
            style={styles.manualButton}
            onPress={() => setShowManualInput(!showManualInput)}
          >
            <Edit3 size={18} color="#6B7280" />
            <Text style={styles.manualButtonText}>Enter Custom Amount</Text>
          </TouchableOpacity>

          {showManualInput && (
            <View style={styles.manualInputContainer}>
              <TextInput
                style={styles.manualInput}
                placeholder={`Min ₹${baseFare}`}
                placeholderTextColor="#9CA3AF"
                keyboardType="number-pad"
                value={manualInput}
                onChangeText={setManualInput}
              />
              <TouchableOpacity style={styles.manualSubmitButton} onPress={handleManualSubmit}>
                <Text style={styles.manualSubmitText}>Apply</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        <View style={styles.infoBox}>
          <Text style={styles.infoText}>
            💡 Higher offers may attract riders faster, but you can always choose the best bid.
          </Text>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.createButton, loading && { opacity: 0.5 }]}
          onPress={handleFindRiders}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.createButtonText}>Create Ride Request</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 16, backgroundColor: 'white', borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  backButton: { padding: 8 },
  headerTitle: { fontSize: 18, fontWeight: '600', color: '#111827' },
  content: { flex: 1, paddingHorizontal: 20 },
  section: { marginTop: 24 },
  label: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 12 },
  baseFareCard: { backgroundColor: 'white', borderRadius: 16, padding: 20, borderWidth: 1, borderColor: '#E5E7EB' },
  baseFareAmount: { fontSize: 32, fontWeight: '700', color: '#111827', marginBottom: 4 },
  baseFareLabel: { fontSize: 14, color: '#6B7280' },
  offerCard: { backgroundColor: '#111827', borderRadius: 16, padding: 24 },
  offerAmount: { fontSize: 48, fontWeight: '700', color: '#EAB308', marginBottom: 8 },
  offerLabel: { fontSize: 14, color: '#9CA3AF' },
  quickButtons: { flexDirection: 'row', gap: 12 },
  quickButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: 'white', paddingVertical: 16, borderRadius: 12, borderWidth: 1, borderColor: '#E5E7EB' },
  quickButtonText: { fontSize: 16, fontWeight: '600', color: '#111827' },
  manualButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: 'white', paddingVertical: 14, borderRadius: 12, borderWidth: 1, borderColor: '#E5E7EB' },
  manualButtonText: { fontSize: 14, fontWeight: '500', color: '#6B7280' },
  manualInputContainer: { flexDirection: 'row', gap: 12, marginTop: 12 },
  manualInput: { flex: 1, backgroundColor: 'white', borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, fontSize: 16, color: '#111827' },
  manualSubmitButton: { backgroundColor: '#111827', paddingHorizontal: 24, borderRadius: 12, justifyContent: 'center' },
  manualSubmitText: { fontSize: 14, fontWeight: '600', color: 'white' },
  infoBox: { backgroundColor: '#FEF3C7', borderRadius: 12, padding: 16, marginTop: 24, marginBottom: 100 },
  infoText: { fontSize: 14, color: '#92400E', lineHeight: 20 },
  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: 'white', paddingHorizontal: 20, paddingVertical: 16, borderTopWidth: 1, borderTopColor: '#E5E7EB' },
  createButton: { backgroundColor: '#111827', paddingVertical: 16, borderRadius: 12, alignItems: 'center' },
  createButtonText: { fontSize: 16, fontWeight: '600', color: 'white' },
});

export default SetPriceScreen;
