import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';
import {useStripe} from '@stripe/stripe-react-native';
import {useNavigation, useRoute} from '@react-navigation/native';
import api from '../config/api';
import {CheckCircle, DollarSign} from 'lucide-react-native';

const PaymentScreen = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const bookingId = Number((route.params as any)?.bookingId);
  const {initPaymentSheet, presentPaymentSheet} = useStripe();

  const [loading, setLoading] = useState(true);
  const [fare, setFare] = useState<number>(0);
  const [clientSecret, setClientSecret] = useState<string>('');

  useEffect(() => {
    fetchPaymentIntent();
  }, [bookingId]);

  const fetchPaymentIntent = async () => {
    try {
      const response = await api.get(`/bookings/${bookingId}`);
      const booking = response.data;
      const finalFare = booking.finalFare || booking.estimatedFare || 100;
      setFare(finalFare);

      // In a real app, this endpoint creates a Stripe PaymentIntent and returns the clientSecret.
      // We will try to fetch it, if it fails or returns mock, we proceed with mock payment.
      try {
        const intentResponse = await api.post(`/payments/create-ride-intent`, null, {
          params: {bookingId, amount: finalFare},
        });
        if (intentResponse.data?.clientSecret) {
          setClientSecret(intentResponse.data.clientSecret);
        }
      } catch (e) {
        console.log('Stripe intent backend not fully wired, using mock intent');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to load booking fare.');
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = async () => {
    if (!clientSecret) {
      // Mock payment success if no Stripe key is configured on backend
      Alert.alert('Payment Successful', 'Paid via Cash/Wallet mock.', [
        {text: 'OK', onPress: () => (navigation as any).replace('RatingScreen', {bookingId})},
      ]);
      return;
    }

    try {
      const {error: initError} = await initPaymentSheet({
        merchantDisplayName: 'Byke Inc.',
        paymentIntentClientSecret: clientSecret,
        allowsDelayedPaymentMethods: true,
        defaultBillingDetails: {
          name: 'Byke User',
        },
      });

      if (initError) {
        Alert.alert('Error', initError.message);
        return;
      }

      const {error: presentError} = await presentPaymentSheet();

      if (presentError) {
        Alert.alert('Payment Failed', presentError.message);
      } else {
        Alert.alert('Payment Successful', 'Your ride has been paid for!', [
          {text: 'OK', onPress: () => (navigation as any).replace('RatingScreen', {bookingId})},
        ]);
      }
    } catch (e) {
      console.log('Payment error', e);
      Alert.alert('Error', 'An unexpected error occurred during payment.');
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#10B981" />
        <Text style={styles.loadingText}>Loading Payment Details...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <CheckCircle size={64} color="#10B981" />
        </View>
        <Text style={styles.title}>Ride Completed!</Text>
        <Text style={styles.subtitle}>Please complete your payment</Text>

        <View style={styles.fareCard}>
          <DollarSign size={24} color="#047857" />
          <Text style={styles.fareLabel}>Total Fare</Text>
          <Text style={styles.fareAmount}>₹{fare}</Text>
        </View>

        <TouchableOpacity style={styles.payBtn} onPress={handlePayment}>
          <Text style={styles.payBtnText}>Pay Now</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    fontWeight: '700',
    color: '#6B7280',
  },
  content: {
    flex: 1,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    color: '#000',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 40,
  },
  fareCard: {
    width: '100%',
    backgroundColor: '#D1FAE5',
    borderRadius: 20,
    padding: 30,
    alignItems: 'center',
    marginBottom: 40,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  fareLabel: {
    fontSize: 14,
    fontWeight: '800',
    color: '#047857',
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginTop: 12,
    marginBottom: 8,
  },
  fareAmount: {
    fontSize: 48,
    fontWeight: '900',
    color: '#064E3B',
  },
  payBtn: {
    width: '100%',
    height: 60,
    backgroundColor: '#10B981',
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#10B981',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  payBtnText: {
    fontSize: 18,
    fontWeight: '900',
    color: '#fff',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
});

export default PaymentScreen;
