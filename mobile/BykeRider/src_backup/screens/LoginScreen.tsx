import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { sendOtp, verifyOtp } from '../store/slices/authSlice';
import { AppDispatch, RootState } from '../store';

const LoginScreen = ({ navigation }: any) => {
  const [mobileNumber, setMobileNumber] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [fullName, setFullName] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [timer, setTimer] = useState(60);

  const dispatch = useDispatch<AppDispatch>();
  const { loading, error } = useSelector((state: RootState) => state.auth);

  const handleSendOtp = async () => {
    if (mobileNumber.length !== 10) {
      Alert.alert('Error', 'Please enter a valid 10-digit mobile number');
      return;
    }

    try {
      await dispatch(sendOtp(mobileNumber)).unwrap();
      setOtpSent(true);
      startTimer();
      Alert.alert('Success', 'OTP sent to your mobile number');
    } catch (err: any) {
      Alert.alert('Error', err);
    }
  };

  const handleVerifyOtp = async () => {
    if (otpCode.length !== 6) {
      Alert.alert('Error', 'Please enter a valid 6-digit OTP');
      return;
    }

    try {
      await dispatch(verifyOtp({ mobileNumber, otpCode, fullName })).unwrap();
      navigation.replace('Home');
    } catch (err: any) {
      Alert.alert('Error', err);
    }
  };

  const startTimer = () => {
    const interval = setInterval(() => {
      setTimer((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  return (
    <View className="flex-1 bg-white px-6 justify-center">
      <Text className="text-3xl font-bold text-gray-900 mb-2">Welcome to BYKE</Text>
      <Text className="text-gray-600 mb-8">Enter your mobile number to continue</Text>

      {!otpSent ? (
        <>
          <TextInput
            className="border border-gray-300 rounded-lg px-4 py-3 mb-4 text-base"
            placeholder="Mobile Number"
            keyboardType="phone-pad"
            maxLength={10}
            value={mobileNumber}
            onChangeText={setMobileNumber}
          />
          <TouchableOpacity
            className="bg-blue-600 rounded-lg py-4 items-center"
            onPress={handleSendOtp}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text className="text-white font-semibold text-base">Send OTP</Text>
            )}
          </TouchableOpacity>
        </>
      ) : (
        <>
          <TextInput
            className="border border-gray-300 rounded-lg px-4 py-3 mb-4 text-base"
            placeholder="Full Name"
            value={fullName}
            onChangeText={setFullName}
          />
          <TextInput
            className="border border-gray-300 rounded-lg px-4 py-3 mb-4 text-base"
            placeholder="Enter OTP"
            keyboardType="number-pad"
            maxLength={6}
            value={otpCode}
            onChangeText={setOtpCode}
          />
          <TouchableOpacity
            className="bg-blue-600 rounded-lg py-4 items-center mb-4"
            onPress={handleVerifyOtp}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text className="text-white font-semibold text-base">Verify OTP</Text>
            )}
          </TouchableOpacity>
          {timer > 0 ? (
            <Text className="text-center text-gray-600">Resend OTP in {timer}s</Text>
          ) : (
            <TouchableOpacity onPress={handleSendOtp}>
              <Text className="text-center text-blue-600 font-semibold">Resend OTP</Text>
            </TouchableOpacity>
          )}
        </>
      )}
    </View>
  );
};

export default LoginScreen;
