import React, {useState} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';
import {ArrowLeft} from 'lucide-react-native';
import api from '../config/api';

const OTPEntryScreen = ({route, navigation}: any) => {
  const {bookingId} = route.params;
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);

  const handleVerifyOTP = async () => {
    if (otp.length !== 4) {
      Alert.alert('Invalid OTP', 'Please enter a 4-digit OTP');
      return;
    }

    setLoading(true);
    try {
      await api.post(`/bookings/${bookingId}/verify-otp`, null, {
        params: {otp},
      });

      Alert.alert('Success', 'Ride started! Navigate to destination.', [
        {
          text: 'OK',
          onPress: () => navigation.replace('RideTracking', {bookingId}),
        },
      ]);
    } catch (error: any) {
      Alert.alert(
        'Error',
        error.response?.data?.message || 'Invalid OTP. Please try again.',
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}>
          <ArrowLeft size={24} color="black" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Enter OTP</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Text style={styles.iconText}>🔐</Text>
        </View>

        <Text style={styles.title}>Verify with User</Text>
        <Text style={styles.subtitle}>
          Ask the user for the 4-digit OTP displayed on their screen
        </Text>

        <View style={styles.otpContainer}>
          <TextInput
            style={styles.otpInput}
            value={otp}
            onChangeText={text =>
              setOtp(text.replace(/[^0-9]/g, '').slice(0, 4))
            }
            keyboardType="number-pad"
            maxLength={4}
            placeholder="0000"
            placeholderTextColor="#D1D5DB"
            autoFocus
          />
        </View>

        <TouchableOpacity
          style={[
            styles.verifyBtn,
            (!otp || otp.length !== 4) && styles.verifyBtnDisabled,
          ]}
          onPress={handleVerifyOTP}
          disabled={loading || !otp || otp.length !== 4}>
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.verifyBtnText}>Verify & Start Ride</Text>
          )}
        </TouchableOpacity>

        <Text style={styles.helpText}>
          The OTP ensures you're picking up the correct passenger
        </Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#F9FAFB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '900',
    marginLeft: 15,
  },
  content: {
    flex: 1,
    paddingHorizontal: 30,
    paddingTop: 60,
    alignItems: 'center',
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
  },
  iconText: {
    fontSize: 50,
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    color: 'black',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 40,
    lineHeight: 22,
  },
  otpContainer: {
    width: '100%',
    marginBottom: 30,
  },
  otpInput: {
    width: '100%',
    height: 80,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderRadius: 20,
    fontSize: 40,
    fontWeight: '900',
    textAlign: 'center',
    letterSpacing: 20,
    color: 'black',
  },
  verifyBtn: {
    width: '100%',
    height: 56,
    backgroundColor: 'black',
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  verifyBtnDisabled: {
    backgroundColor: '#D1D5DB',
  },
  verifyBtnText: {
    fontSize: 16,
    fontWeight: '900',
    color: 'white',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  helpText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default OTPEntryScreen;
