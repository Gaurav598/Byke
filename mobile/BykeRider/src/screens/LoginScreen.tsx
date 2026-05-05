import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  SafeAreaView,
  StyleSheet,
  Dimensions,
  Image,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import auth from '@react-native-firebase/auth';
import { useDispatch } from 'react-redux';
import { loginSuccess, setLoading } from '../store/slices/authSlice';
import { AppDispatch } from '../store';
import api from '../config/api';
import { ChevronLeft, Phone, ShieldCheck, ArrowRight } from 'lucide-react-native';
import { API_BASE_URL } from '../config/env';
import { TOKEN_KEY, REFRESH_TOKEN_KEY, USER_PROFILE_KEY } from '../constants/storageKeys';
import { getFCMToken } from '../services/notificationService';

const { width, height } = Dimensions.get('window');

const LoginScreen = () => {
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoadingState] = useState(false);
  const [confirmation, setConfirmation] = useState<any>(null);
  const dispatch = useDispatch<AppDispatch>();
  const otpInputRef = useRef<TextInput>(null);

  const sendOTP = async () => {
    if (!phone || phone.length !== 10) {
      Alert.alert('Error', 'Please enter a valid 10-digit phone number');
      return;
    }
    setLoadingState(true);
    try {
      const confirmationResult = await auth().signInWithPhoneNumber('+91' + phone);
      setConfirmation(confirmationResult);
      setOtpSent(true);
    } catch (error: any) {
      let msg = 'Failed to send OTP';
      if (error.code === 'auth/invalid-phone-number') msg = 'Invalid phone number format';
      else if (error.code === 'auth/too-many-requests') msg = 'Too many requests. Please try again later';
      else if (error.message) msg = error.message;
      Alert.alert('Error', msg);
    } finally {
      setLoadingState(false);
    }
  };

  const verifyOTP = async () => {
    if (!otp || otp.length !== 6) {
      Alert.alert('Error', 'Please enter a valid 6-digit OTP');
      return;
    }
    if (!confirmation) {
      Alert.alert('Error', 'Session expired. Please send OTP again');
      return;
    }
    setLoadingState(true);
    dispatch(setLoading(true));
    try {
      const userCredential = await confirmation.confirm(otp);
      const idToken = await userCredential.user.getIdToken();
      const response = await api.post('/auth/rider/verify-firebase-token', {
        idToken,
        mobileNumber: `+91${phone}`,
        fullName: `Rider ${phone.slice(-4)}`,
      });
      const { accessToken, refreshToken, userId, fullName, profilePhotoUrl } = response.data;
      
      // Register FCM token for push notifications
      try {
        const fcmToken = await getFCMToken();
        if (fcmToken) {
          await api.post('/api/rider/fcm-token', { fcmToken }, {
            headers: { Authorization: `Bearer ${accessToken}` }
          });
          console.log('FCM token registered successfully');
        }
      } catch (fcmError) {
        console.log('FCM token registration failed:', fcmError);
      }
      
      const userPayload = {
        id: String(userId),
        name: fullName || `Rider ${phone.slice(-4)}`,
        phone: `+91${phone}`,
        profilePhoto: profilePhotoUrl || undefined,
        role: 'rider' as const,
      };
      await AsyncStorage.multiSet([
        [TOKEN_KEY, accessToken],
        ...(refreshToken ? [[REFRESH_TOKEN_KEY, refreshToken]] as [string, string][] : []),
        [USER_PROFILE_KEY, JSON.stringify(userPayload)],
      ]);
      dispatch(loginSuccess({ user: userPayload, accessToken }));
    } catch (error: any) {
      if (error.code === 'ERR_NETWORK' || !error.response) {
        Alert.alert('Network Error', `Cannot connect to server at ${API_BASE_URL}.`);
      } else {
        Alert.alert('Error', error.response?.data?.message || 'Login failed');
      }
    } finally {
      setLoadingState(false);
      dispatch(setLoading(false));
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.content}>
          {/* Top Branding Section */}
          <View style={styles.brandSection}>
            <View style={styles.logoContainer}>
              <Text style={styles.logoText}>BYKE</Text>
              <View style={styles.riderBadge}>
                <Text style={styles.riderBadgeText}>CAPTAIN</Text>
              </View>
            </View>
          </View>

          {otpSent && (
            <TouchableOpacity
              onPress={() => {
                setOtpSent(false);
                setOtp('');
              }}
              style={styles.backBtn}
            >
              <ChevronLeft size={24} color="black" strokeWidth={3} />
            </TouchableOpacity>
          )}

          <View style={styles.formContainer}>
            <Text style={styles.title}>{otpSent ? 'Verification' : 'Welcome Back'}</Text>
            <Text style={styles.subtitle}>
              {otpSent
                ? `Enter the 6-digit code sent to +91 ${phone}`
                : 'Login to your captain account to start earning today.'}
            </Text>

            {!otpSent ? (
              <>
                <View style={styles.inputWrapper}>
                  <Text style={styles.label}>Mobile Number</Text>
                  <View style={styles.phoneInputContainer}>
                    <View style={styles.countryCodeContainer}>
                      <Text style={styles.countryCode}>+91</Text>
                    </View>
                    <TextInput
                      style={styles.phoneInput}
                      placeholder="00000 00000"
                      placeholderTextColor="#9CA3AF"
                      keyboardType="number-pad"
                      maxLength={10}
                      value={phone}
                      onChangeText={setPhone}
                    />
                    <Phone size={20} color="#D1D5DB" style={styles.inputIcon} />
                  </View>
                </View>

                <TouchableOpacity
                  onPress={sendOTP}
                  disabled={loading || phone.length !== 10}
                  style={[
                    styles.primaryButton,
                    (loading || phone.length !== 10) && styles.buttonDisabled,
                  ]}
                >
                  {loading ? (
                    <ActivityIndicator color="black" />
                  ) : (
                    <>
                      <Text style={styles.primaryButtonText}>Send OTP</Text>
                      <ArrowRight size={20} color="black" strokeWidth={3} />
                    </>
                  )}
                </TouchableOpacity>
              </>
            ) : (
              <>
                <View style={styles.otpSection}>
                  <Text style={styles.label}>One-Time Password</Text>
                  <TouchableOpacity
                    activeOpacity={1}
                    onPress={() => otpInputRef.current?.focus()}
                    style={styles.otpWrapper}
                  >
                    {Array.from({ length: 6 }).map((_, i) => (
                      <View
                        key={i}
                        style={[
                          styles.otpBox,
                          otp[i] ? styles.otpBoxFilled : null,
                          otp.length === i ? styles.otpBoxActive : null,
                        ]}
                      >
                        <Text style={styles.otpText}>{otp[i] ?? ''}</Text>
                      </View>
                    ))}
                  </TouchableOpacity>
                  <TextInput
                    ref={otpInputRef}
                    style={styles.hiddenInput}
                    value={otp}
                    onChangeText={setOtp}
                    keyboardType="number-pad"
                    maxLength={6}
                    autoFocus
                  />
                </View>

                <TouchableOpacity
                  onPress={verifyOTP}
                  disabled={loading || otp.length !== 6}
                  style={[
                    styles.primaryButton,
                    (loading || otp.length !== 6) && styles.buttonDisabled,
                  ]}
                >
                  {loading ? (
                    <ActivityIndicator color="black" />
                  ) : (
                    <>
                      <Text style={styles.primaryButtonText}>Verify & Continue</Text>
                      <ShieldCheck size={20} color="black" strokeWidth={2.5} />
                    </>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={sendOTP}
                  style={styles.resendBtn}
                  disabled={loading}
                >
                  <Text style={styles.resendText}>
                    Didn't receive code? <Text style={styles.resendLink}>Resend OTP</Text>
                  </Text>
                </TouchableOpacity>
              </>
            )}
          </View>

          {/* Bottom Footer */}
          <View style={styles.footer}>
            <View style={styles.securityBadge}>
              <ShieldCheck size={14} color="#10B981" />
              <Text style={styles.securityText}>Secure End-to-End Encryption</Text>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  brandSection: {
    alignItems: 'center',
    marginTop: height * 0.08,
    marginBottom: 40,
  },
  logoContainer: {
    alignItems: 'center',
  },
  logoText: {
    fontSize: 42,
    fontWeight: '900',
    color: 'black',
    letterSpacing: -2,
  },
  riderBadge: {
    backgroundColor: '#EAB308',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
    marginTop: -5,
  },
  riderBadgeText: {
    fontSize: 10,
    fontWeight: '900',
    color: 'black',
    letterSpacing: 2,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#F9FAFB',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  formContainer: {
    flex: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    color: 'black',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 15,
    color: '#6B7280',
    lineHeight: 22,
    fontWeight: '600',
    marginBottom: 40,
  },
  inputWrapper: {
    marginBottom: 30,
  },
  label: {
    fontSize: 12,
    fontWeight: '900',
    color: '#9CA3AF',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 12,
    marginLeft: 4,
  },
  phoneInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    height: 64,
    paddingHorizontal: 4,
  },
  countryCodeContainer: {
    paddingHorizontal: 16,
    borderRightWidth: 1,
    borderRightColor: '#E5E7EB',
    height: 30,
    justifyContent: 'center',
  },
  countryCode: {
    fontSize: 16,
    fontWeight: '800',
    color: 'black',
  },
  phoneInput: {
    flex: 1,
    fontSize: 18,
    fontWeight: '800',
    color: 'black',
    paddingHorizontal: 16,
  },
  inputIcon: {
    marginRight: 16,
  },
  primaryButton: {
    backgroundColor: '#EAB308',
    height: 64,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#EAB308',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 8,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '900',
    color: 'black',
    marginRight: 10,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  buttonDisabled: {
    backgroundColor: '#F3F4F6',
    shadowOpacity: 0,
    elevation: 0,
  },
  otpSection: {
    marginBottom: 40,
  },
  otpWrapper: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  otpBox: {
    width: (width - 100) / 6,
    height: 60,
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  otpBoxActive: {
    borderColor: '#EAB308',
    borderWidth: 2,
    backgroundColor: '#fff',
  },
  otpBoxFilled: {
    borderColor: 'black',
    backgroundColor: '#fff',
  },
  otpText: {
    fontSize: 22,
    fontWeight: '900',
    color: 'black',
  },
  hiddenInput: {
    position: 'absolute',
    opacity: 0,
  },
  resendBtn: {
    alignItems: 'center',
    marginTop: 25,
  },
  resendText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#9CA3AF',
  },
  resendLink: {
    color: 'black',
    fontWeight: '900',
  },
  footer: {
    paddingBottom: 20,
    alignItems: 'center',
  },
  securityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  securityText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#065F46',
    marginLeft: 6,
    textTransform: 'uppercase',
  },
});

export default LoginScreen;
