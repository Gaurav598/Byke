import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { Colors, Spacing, Radius } from '../../styles/tokens';
import { PrimaryBtn, StatusBar } from '../../components/SharedComponents';
import { MOCK_OTP } from '../../data/mockData';

export default function OTPScreen({ navigation, route }) {
  const { phone, role } = route.params;
  const [otp, setOtp] = useState(['', '', '', '']);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendSeconds, setResendSeconds] = useState(30);
  const [shakeAnim] = useState(new Animated.Value(0));
  const inputs = useRef([]);

  // Countdown timer
  useEffect(() => {
    if (resendSeconds <= 0) return;
    const t = setTimeout(() => setResendSeconds(s => s - 1), 1000);
    return () => clearTimeout(t);
  }, [resendSeconds]);

  const shake = () => {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 10, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 60, useNativeDriver: true }),
    ]).start();
  };

  const handleChange = (val, idx) => {
    setError('');
    const newOtp = [...otp];
    newOtp[idx] = val;
    setOtp(newOtp);
    if (val && idx < 3) inputs.current[idx + 1]?.focus();
    if (!val && idx > 0) inputs.current[idx - 1]?.focus();
  };

  const handleVerify = () => {
    const entered = otp.join('');
    if (entered.length < 4) return;
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      if (entered === MOCK_OTP) {
        navigation.reset({
          index: 0,
          routes: [{ name: role === 'rider' ? 'RiderHome' : 'UserHome' }],
        });
      } else {
        setError('Incorrect OTP. Hint: try ' + MOCK_OTP);
        setOtp(['', '', '', '']);
        inputs.current[0]?.focus();
        shake();
      }
    }, 1000);
  };

  const filledCount = otp.filter(Boolean).length;

  return (
    <View style={styles.container}>
      <StatusBar />

      <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
        <Text style={styles.backText}>← Back</Text>
      </TouchableOpacity>

      <View style={styles.content}>
        <Text style={styles.title}>Enter OTP</Text>
        <Text style={styles.subtitle}>
          Sent to +91 {phone}{'\n'}
          <Text style={styles.hintText}>(Hint: use {MOCK_OTP})</Text>
        </Text>

        <Animated.View style={[styles.otpRow, { transform: [{ translateX: shakeAnim }] }]}>
          {otp.map((digit, idx) => (
            <TextInput
              key={idx}
              ref={r => inputs.current[idx] = r}
              style={[
                styles.otpBox,
                digit && styles.otpBoxFilled,
                error && styles.otpBoxError,
              ]}
              value={digit}
              onChangeText={val => handleChange(val.slice(-1), idx)}
              keyboardType="number-pad"
              maxLength={1}
              textAlign="center"
              caretHidden
            />
          ))}
        </Animated.View>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <PrimaryBtn
          label={loading ? 'Verifying...' : 'Verify & Continue'}
          onPress={handleVerify}
          loading={loading}
          style={[styles.verifyBtn, filledCount < 4 && { opacity: 0.4 }]}
        />

        <TouchableOpacity
          style={styles.resendBtn}
          onPress={() => setResendSeconds(30)}
          disabled={resendSeconds > 0}
        >
          <Text style={[styles.resendText, resendSeconds > 0 && { color: Colors.textTertiary }]}>
            {resendSeconds > 0 ? `Resend OTP in ${resendSeconds}s` : 'Resend OTP'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bgPrimary },
  backBtn: { paddingHorizontal: Spacing.xl, paddingVertical: Spacing.md },
  backText: { fontSize: 14, color: Colors.textInfo },
  content: { flex: 1, paddingHorizontal: Spacing.xl, paddingTop: Spacing.xl },
  title: { fontSize: 28, fontWeight: '700', color: Colors.textPrimary, marginBottom: Spacing.sm },
  subtitle: { fontSize: 14, color: Colors.textSecondary, lineHeight: 22, marginBottom: Spacing.xl },
  hintText: { color: Colors.textInfo, fontSize: 12 },
  otpRow: { flexDirection: 'row', gap: Spacing.md, marginBottom: Spacing.lg },
  otpBox: { flex: 1, height: 60, borderRadius: Radius.md, borderWidth: 1.5, borderColor: Colors.borderSecondary, fontSize: 24, fontWeight: '700', color: Colors.textPrimary, backgroundColor: Colors.bgSecondary },
  otpBoxFilled: { borderColor: Colors.borderInfo, backgroundColor: Colors.bgInfo },
  otpBoxError: { borderColor: Colors.borderDanger || Colors.red, backgroundColor: Colors.bgDanger },
  errorText: { fontSize: 13, color: Colors.textDanger, marginBottom: Spacing.md },
  verifyBtn: { marginBottom: Spacing.md },
  resendBtn: { alignItems: 'center', padding: Spacing.sm },
  resendText: { fontSize: 14, color: Colors.textInfo, fontWeight: '500' },
});
