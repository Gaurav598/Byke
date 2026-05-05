import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Animated } from 'react-native';
import { Colors, Spacing, Radius } from '../../styles/tokens';
import { Card, Badge, PrimaryBtn, StatusBar, NavBar } from '../../components/SharedComponents';
import MockMap from '../../components/MockMap';

export default function RiderTripScreen({ navigation, route }) {
  const { request, bidAmount } = route.params;
  const [phase, setPhase] = useState('heading'); // heading | pickup | enroute | completed
  const [elapsed, setElapsed] = useState(0);
  const [etaSecs, setEtaSecs] = useState(120); // 2 min ETA to pickup
  const scaleAnim = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    const t1 = setTimeout(() => setPhase('pickup'), 5000);
    const t2 = setTimeout(() => setPhase('enroute'), 10000);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  useEffect(() => {
    if (phase === 'heading') {
      const t = setInterval(() => setEtaSecs(s => Math.max(0, s - 1)), 1000);
      return () => clearInterval(t);
    }
    if (phase === 'enroute') {
      const t = setInterval(() => setElapsed(s => s + 1), 1000);
      return () => clearInterval(t);
    }
  }, [phase]);

  const formatTime = s => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  const handleComplete = () => {
    Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, tension: 70 }).start();
    setPhase('completed');
  };

  if (phase === 'completed') {
    return <RiderCompletedScreen navigation={navigation} request={request} bidAmount={bidAmount} scaleAnim={scaleAnim} />;
  }

  const phaseLabel = phase === 'heading' ? 'Heading to pickup' : phase === 'pickup' ? 'User is boarding' : 'Trip in progress';
  const phaseSub = phase === 'heading' ? `${request.userName} is waiting` : phase === 'pickup' ? 'Wait for user to board' : `En route to ${request.to}`;

  return (
    <View style={styles.container}>
      <StatusBar />
      <NavBar
        title={phaseLabel}
        subtitle={phaseSub}
        rightContent={<Badge label={phase === 'enroute' ? '🟢 Enroute' : '🟡 Pickup'} type={phase === 'enroute' ? 'success' : 'warning'} />}
      />

      <ScrollView showsVerticalScrollIndicator={false}>
        <MockMap height={220} showRider variant={phase === 'heading' ? 'pickup' : 'enroute'} style={{ borderRadius: 0 }} />

        <View style={styles.content}>
          {/* User info */}
          <Card style={styles.userCard}>
            <View style={styles.userRow}>
              <View style={styles.userAvatar}>
                <Text style={styles.userAvatarText}>{request.userInitials}</Text>
              </View>
              <View style={{ flex: 1, marginLeft: Spacing.md }}>
                <Text style={styles.userName}>{request.userName}</Text>
                <Text style={styles.userRating}>★ {request.userRating} · Verified user</Text>
                <Text style={styles.userRoute}>{request.from} → {request.to}</Text>
              </View>
              <TouchableOpacity style={styles.callBtn}>
                <Text style={styles.callIcon}>📞</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.tripStats}>
              <View style={styles.tripStat}>
                <Text style={styles.tripStatLabel}>{phase === 'heading' ? 'ETA pickup' : 'Elapsed'}</Text>
                <Text style={styles.tripStatVal}>{phase === 'heading' ? `${Math.ceil(etaSecs / 60)} min` : formatTime(elapsed)}</Text>
              </View>
              <View style={styles.tripStat}>
                <Text style={styles.tripStatLabel}>Distance</Text>
                <Text style={styles.tripStatVal}>{request.distanceKm} km</Text>
              </View>
              <View style={styles.tripStat}>
                <Text style={styles.tripStatLabel}>Your fare</Text>
                <Text style={[styles.tripStatVal, { color: Colors.textSuccess }]}>₹{bidAmount}</Text>
              </View>
            </View>
          </Card>

          {/* Phase actions */}
          {phase === 'pickup' && (
            <Card style={styles.pickupCard}>
              <Text style={styles.pickupTitle}>User is boarding</Text>
              <Text style={styles.pickupSub}>Confirm once user is seated and ready</Text>
              <TouchableOpacity style={styles.startBtn} onPress={() => setPhase('enroute')} activeOpacity={0.8}>
                <Text style={styles.startBtnText}>Start Trip ▶</Text>
              </TouchableOpacity>
            </Card>
          )}

          {phase === 'enroute' && (
            <Card style={styles.enrouteCard}>
              <View style={styles.enrouteRow}>
                <View style={styles.dotR} />
                <View>
                  <Text style={styles.destLabel}>Drop location</Text>
                  <Text style={styles.destName}>{request.to}</Text>
                </View>
              </View>
              <TouchableOpacity style={styles.completeBtn} onPress={handleComplete} activeOpacity={0.8}>
                <Text style={styles.completeBtnText}>Complete Trip ✓</Text>
              </TouchableOpacity>
            </Card>
          )}

          {/* SOS */}
          <TouchableOpacity style={styles.sosBtn}>
            <Text style={styles.sosText}>🆘  Emergency SOS</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

function RiderCompletedScreen({ navigation, request, bidAmount, scaleAnim }) {
  const [rating, setRating] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const earned = Math.round(bidAmount * 0.85);

  return (
    <View style={styles.container}>
      <StatusBar />
      <NavBar title="Trip complete" />
      <ScrollView contentContainerStyle={styles.completedContent}>

        <Animated.View style={[styles.successCircle, { transform: [{ scale: scaleAnim }] }]}>
          <Text style={styles.successIcon}>₹</Text>
        </Animated.View>

        <Text style={styles.completedTitle}>₹{earned} earned!</Text>
        <Text style={styles.completedSub}>{request.from} → {request.to}</Text>

        {/* Earnings breakdown */}
        <Card style={styles.breakdown}>
          <Text style={styles.breakdownTitle}>Earnings breakdown</Text>
          <View style={styles.breakdownRow}>
            <Text style={styles.breakdownLabel}>Bid amount</Text>
            <Text style={styles.breakdownVal}>₹{bidAmount}</Text>
          </View>
          <View style={styles.breakdownRow}>
            <Text style={styles.breakdownLabel}>Platform cut (15%)</Text>
            <Text style={[styles.breakdownVal, { color: Colors.textDanger }]}>- ₹{bidAmount - earned}</Text>
          </View>
          <View style={[styles.breakdownRow, styles.breakdownTotal]}>
            <Text style={[styles.breakdownLabel, { fontWeight: '600' }]}>You earned</Text>
            <Text style={[styles.breakdownVal, { color: Colors.textSuccess, fontSize: 18, fontWeight: '700' }]}>₹{earned}</Text>
          </View>
          <View style={styles.breakdownRow}>
            <Text style={styles.breakdownLabel}>Payment</Text>
            <Text style={[styles.breakdownVal, { color: Colors.textSuccess }]}>Credited to wallet ✓</Text>
          </View>
        </Card>

        {/* Rate user */}
        {!submitted ? (
          <Card style={styles.ratingCard}>
            <Text style={styles.ratingTitle}>Rate {request.userName}</Text>
            <View style={styles.starsRow}>
              {[1, 2, 3, 4, 5].map(s => (
                <TouchableOpacity key={s} onPress={() => setRating(s)}>
                  <Text style={[styles.star, s <= rating && styles.starFilled]}>★</Text>
                </TouchableOpacity>
              ))}
            </View>
            {rating > 0 && (
              <TouchableOpacity style={styles.submitBtn} onPress={() => setSubmitted(true)}>
                <Text style={styles.submitBtnText}>Submit</Text>
              </TouchableOpacity>
            )}
          </Card>
        ) : (
          <Card style={[styles.ratingCard, { backgroundColor: Colors.bgSuccess }]}>
            <Text style={[styles.ratingTitle, { color: Colors.textSuccess }]}>Rating submitted ✓</Text>
          </Card>
        )}

        <PrimaryBtn label="Find more rides →" onPress={() => navigation.navigate('RiderRequests')} style={styles.moreBtn} />
        <TouchableOpacity onPress={() => navigation.navigate('RiderHome')} style={styles.homeLink}>
          <Text style={styles.homeLinkText}>Back to home</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bgTertiary },
  content: { padding: Spacing.md, gap: Spacing.md, paddingBottom: Spacing.xl },
  userCard: {},
  userRow: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.md },
  userAvatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: Colors.bgInfo, alignItems: 'center', justifyContent: 'center' },
  userAvatarText: { fontSize: 16, fontWeight: '600', color: Colors.textInfo },
  userName: { fontSize: 16, fontWeight: '600', color: Colors.textPrimary },
  userRating: { fontSize: 11, color: '#BA7517', marginTop: 2 },
  userRoute: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  callBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.bgSuccess, alignItems: 'center', justifyContent: 'center' },
  callIcon: { fontSize: 20 },
  tripStats: { flexDirection: 'row', gap: Spacing.sm },
  tripStat: { flex: 1, backgroundColor: Colors.bgSecondary, borderRadius: Radius.md, padding: Spacing.sm, alignItems: 'center' },
  tripStatLabel: { fontSize: 11, color: Colors.textSecondary, marginBottom: 2 },
  tripStatVal: { fontSize: 16, fontWeight: '600', color: Colors.textPrimary },
  pickupCard: { borderWidth: 1.5, borderColor: Colors.borderWarning, backgroundColor: Colors.bgWarning, alignItems: 'center', padding: Spacing.lg },
  pickupTitle: { fontSize: 16, fontWeight: '600', color: Colors.textWarning, marginBottom: 4 },
  pickupSub: { fontSize: 12, color: Colors.textWarning, marginBottom: Spacing.lg },
  startBtn: { backgroundColor: '#FFFFFF', borderRadius: Radius.md, paddingHorizontal: Spacing.xl, paddingVertical: Spacing.md, borderWidth: 1, borderColor: Colors.borderWarning },
  startBtnText: { fontSize: 14, fontWeight: '600', color: Colors.textWarning },
  enrouteCard: { borderWidth: 1.5, borderColor: Colors.borderSuccess },
  enrouteRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.md },
  dotR: { width: 12, height: 12, borderRadius: 6, backgroundColor: Colors.red },
  destLabel: { fontSize: 11, color: Colors.textSecondary },
  destName: { fontSize: 14, fontWeight: '500', color: Colors.textPrimary },
  completeBtn: { backgroundColor: Colors.bgSuccess, borderRadius: Radius.md, padding: Spacing.md, alignItems: 'center' },
  completeBtnText: { fontSize: 14, fontWeight: '600', color: Colors.textSuccess },
  sosBtn: { backgroundColor: Colors.bgDanger, borderRadius: Radius.md, padding: Spacing.md, alignItems: 'center' },
  sosText: { fontSize: 13, color: Colors.textDanger, fontWeight: '500' },
  // Completed
  completedContent: { padding: Spacing.xl, alignItems: 'center', gap: Spacing.md },
  successCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: Colors.bgSuccess, alignItems: 'center', justifyContent: 'center' },
  successIcon: { fontSize: 36, color: Colors.green, fontWeight: '700' },
  completedTitle: { fontSize: 28, fontWeight: '700', color: Colors.textSuccess },
  completedSub: { fontSize: 13, color: Colors.textSecondary, textAlign: 'center' },
  breakdown: { width: '100%' },
  breakdownTitle: { fontSize: 14, fontWeight: '600', color: Colors.textPrimary, marginBottom: Spacing.sm },
  breakdownRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, borderBottomWidth: 0.5, borderBottomColor: Colors.borderTertiary },
  breakdownTotal: { backgroundColor: Colors.bgSuccess, borderRadius: Radius.sm, paddingHorizontal: 6, marginTop: 4, borderBottomWidth: 0 },
  breakdownLabel: { fontSize: 13, color: Colors.textSecondary },
  breakdownVal: { fontSize: 13, color: Colors.textPrimary },
  ratingCard: { width: '100%', alignItems: 'center', padding: Spacing.lg },
  ratingTitle: { fontSize: 15, fontWeight: '500', color: Colors.textPrimary, marginBottom: Spacing.md },
  starsRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.md },
  star: { fontSize: 36, color: Colors.borderSecondary },
  starFilled: { color: '#BA7517' },
  submitBtn: { backgroundColor: Colors.bgSuccess, borderRadius: Radius.md, paddingHorizontal: Spacing.xl, paddingVertical: Spacing.sm },
  submitBtnText: { fontSize: 13, fontWeight: '500', color: Colors.textSuccess },
  moreBtn: { width: '100%' },
  homeLink: { paddingVertical: Spacing.sm },
  homeLinkText: { fontSize: 13, color: Colors.textInfo },
});
