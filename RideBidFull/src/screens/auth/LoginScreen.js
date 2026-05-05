import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { Colors, Spacing, Radius } from '../../styles/tokens';
import { PrimaryBtn, StatusBar } from '../../components/SharedComponents';

export default function LoginScreen({ navigation }) {
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [role, setRole] = useState('user'); // 'user' | 'rider'

  const handleSendOTP = () => {
    if (phone.length < 10) return;
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      navigation.navigate('OTP', { phone, role });
    }, 1200);
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <StatusBar />

      {/* Logo area */}
      <View style={styles.logoArea}>
        <View style={styles.logoCircle}>
          <Text style={styles.logoText}>RB</Text>
        </View>
        <Text style={styles.appName}>RideBid</Text>
        <Text style={styles.appTagline}>Bid your fare. Own your ride.</Text>
      </View>

      {/* Role selector */}
      <View style={styles.roleRow}>
        <TouchableOpacity
          style={[styles.roleBtn, role === 'user' && styles.roleBtnActive]}
          onPress={() => setRole('user')}
          activeOpacity={0.8}
        >
          <Text style={styles.roleIcon}>🧑</Text>
          <Text style={[styles.roleLabel, role === 'user' && styles.roleLabelActive]}>I need a ride</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.roleBtn, role === 'rider' && styles.roleBtnActive]}
          onPress={() => setRole('rider')}
          activeOpacity={0.8}
        >
          <Text style={styles.roleIcon}>🛺</Text>
          <Text style={[styles.roleLabel, role === 'rider' && styles.roleLabelActive]}>I give rides</Text>
        </TouchableOpacity>
      </View>

      {/* Phone input */}
      <View style={styles.inputSection}>
        <Text style={styles.inputLabel}>Mobile number</Text>
        <View style={styles.phoneRow}>
          <View style={styles.countryCode}>
            <Text style={styles.countryCodeText}>🇮🇳 +91</Text>
          </View>
          <TextInput
            style={styles.phoneInput}
            placeholder="Enter 10-digit mobile number"
            placeholderTextColor={Colors.textTertiary}
            keyboardType="number-pad"
            maxLength={10}
            value={phone}
            onChangeText={setPhone}
          />
        </View>
        <Text style={styles.otpNote}>We'll send a 4-digit OTP to verify</Text>
      </View>

      <PrimaryBtn
        label={loading ? 'Sending OTP...' : 'Send OTP →'}
        onPress={handleSendOTP}
        loading={loading}
        style={[styles.sendBtn, phone.length < 10 && { opacity: 0.4 }]}
      />

      <Text style={styles.termsText}>
        By continuing you agree to our Terms of Service and Privacy Policy
      </Text>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bgPrimary, padding: Spacing.xl },
  logoArea: { alignItems: 'center', paddingTop: Spacing.xxl, paddingBottom: Spacing.xl },
  logoCircle: { width: 72, height: 72, borderRadius: 36, backgroundColor: Colors.bgInfo, alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.md },
  logoText: { fontSize: 26, fontWeight: '700', color: Colors.textInfo },
  appName: { fontSize: 32, fontWeight: '700', color: Colors.textPrimary, letterSpacing: -0.5 },
  appTagline: { fontSize: 14, color: Colors.textSecondary, marginTop: 4 },
  roleRow: { flexDirection: 'row', gap: Spacing.md, marginBottom: Spacing.xl },
  roleBtn: { flex: 1, backgroundColor: Colors.bgSecondary, borderRadius: Radius.lg, padding: Spacing.lg, alignItems: 'center', borderWidth: 1.5, borderColor: 'transparent' },
  roleBtnActive: { backgroundColor: Colors.bgInfo, borderColor: Colors.borderInfo },
  roleIcon: { fontSize: 28, marginBottom: Spacing.sm },
  roleLabel: { fontSize: 13, fontWeight: '500', color: Colors.textSecondary },
  roleLabelActive: { color: Colors.textInfo },
  inputSection: { marginBottom: Spacing.xl },
  inputLabel: { fontSize: 13, fontWeight: '500', color: Colors.textSecondary, marginBottom: Spacing.sm },
  phoneRow: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: Colors.borderSecondary, borderRadius: Radius.md, overflow: 'hidden' },
  countryCode: { paddingHorizontal: Spacing.md, paddingVertical: 14, backgroundColor: Colors.bgSecondary, borderRightWidth: 0.5, borderRightColor: Colors.borderSecondary },
  countryCodeText: { fontSize: 14, color: Colors.textPrimary },
  phoneInput: { flex: 1, fontSize: 16, paddingHorizontal: Spacing.md, paddingVertical: 14, color: Colors.textPrimary },
  otpNote: { fontSize: 11, color: Colors.textTertiary, marginTop: 6 },
  sendBtn: { marginBottom: Spacing.lg },
  termsText: { fontSize: 11, color: Colors.textTertiary, textAlign: 'center', lineHeight: 16 },
});
