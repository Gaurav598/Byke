import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Animated } from 'react-native';
import { Colors, Spacing, Radius } from '../../styles/tokens';
import { Card, Badge, Avatar, PrimaryBtn, StatusBar, NavBar } from '../../components/SharedComponents';
import MockMap from '../../components/MockMap';

// ─── PHASE FLOW ───────────────────────────────────────────────────────────────
// pickup → enroute → arrived → completed

export default function UserTrackingScreen({ navigation, route }) {
  const { rider, from, to, maxFare } = route.params;
  const [phase, setPhase] = useState('pickup'); // pickup | enroute | arrived | completed
  const [etaSeconds, setEtaSeconds] = useState(rider.etaMin * 60);
  const [rideSeconds, setRideSeconds] = useState(0);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Auto-advance phases for demo
  useEffect(() => {
    const t1 = setTimeout(() => setPhase('enroute'), 6000);
    const t2 = setTimeout(() => setPhase('arrived'), 14000);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  // ETA countdown
  useEffect(() => {
    if (phase !== 'pickup' || etaSeconds <= 0) return;
    const t = setInterval(() => setEtaSeconds(s => s - 1), 1000);
    return () => clearInterval(t);
  }, [phase, etaSeconds]);

  // Ride timer
  useEffect(() => {
    if (phase !== 'enroute') return;
    const t = setInterval(() => setRideSeconds(s => s + 1), 1000);
    return () => clearInterval(t);
  }, [phase]);

  // Pulse
  useEffect(() => {
    Animated.loop(Animated.sequence([
      Animated.timing(pulseAnim, { toValue: 1.5, duration: 700, useNativeDriver: true }),
      Animated.timing(pulseAnim, { toValue: 1, duration: 700, useNativeDriver: true }),
    ])).start();
  }, []);

  const formatTime = (secs) => `${String(Math.floor(secs / 60)).padStart(2, '0')}:${String(secs % 60).padStart(2, '0')}`;
  const etaDisplay = `${Math.ceil(etaSeconds / 60)} min`;

  if (phase === 'completed') {
    return <CompletedScreen rider={rider} fare={rider.bidAmount} from={from} to={to} navigation={navigation} />;
  }

  return (
    <View style={styles.container}>
      <StatusBar />
      <NavBar
        title={phase === 'pickup' ? 'Rider on the way' : phase === 'enroute' ? 'Ride in progress' : 'Rider arrived!'}
        subtitle={phase === 'pickup' ? `${rider.name} is coming` : phase === 'enroute' ? `En route to ${to}` : 'Please board the vehicle'}
        rightContent={<Badge label={phase === 'arrived' ? '✓ Here' : phase === 'enroute' ? 'Enroute' : 'Coming'} type={phase === 'arrived' ? 'success' : 'info'} />}
      />

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Map */}
        <MockMap
          height={240}
          showRider
          variant={phase}
          style={{ borderRadius: 0 }}
        />

        <View style={styles.content}>
          {/* Rider card */}
          <Card style={styles.riderCard}>
            <View style={styles.riderTop}>
              <Avatar initials={rider.initials} bgColor={rider.avatarColor} textColor={rider.avatarTextColor} size={52} />
              <View style={styles.riderInfo}>
                <Text style={styles.riderName}>{rider.name}</Text>
                <Text style={styles.riderVehicle}>{rider.vehicle} · {rider.vehicleNumber}</Text>
                <Text style={styles.riderRating}>★ {rider.rating} · {rider.totalRides} rides</Text>
              </View>
              <TouchableOpacity style={styles.callBtn}>
                <Text style={styles.callIcon}>📞</Text>
              </TouchableOpacity>
            </View>

            {/* Stats row */}
            <View style={styles.statsRow}>
              <View style={styles.stat}>
                <Text style={styles.statLabel}>{phase === 'pickup' ? 'ETA' : phase === 'enroute' ? 'Elapsed' : 'Arrived'}</Text>
                <Text style={styles.statValue}>
                  {phase === 'pickup' ? etaDisplay : phase === 'enroute' ? formatTime(rideSeconds) : '0:00'}
                </Text>
              </View>
              <View style={styles.stat}>
                <Text style={styles.statLabel}>Fare</Text>
                <Text style={[styles.statValue, { color: Colors.textSuccess }]}>₹{rider.bidAmount}</Text>
              </View>
              <View style={styles.stat}>
                <Text style={styles.statLabel}>Saved</Text>
                <Text style={[styles.statValue, { color: Colors.textSuccess }]}>₹{maxFare - rider.bidAmount}</Text>
              </View>
            </View>
          </Card>

          {/* Route card */}
          <Card>
            <View style={styles.routeItem}>
              <View style={styles.routeDotG} />
              <View>
                <Text style={styles.routeLabel}>Pickup</Text>
                <Text style={styles.routeText}>{from}</Text>
              </View>
            </View>
            <View style={styles.routeVline} />
            <View style={styles.routeItem}>
              <View style={styles.routeDotR} />
              <View>
                <Text style={styles.routeLabel}>Drop</Text>
                <Text style={styles.routeText}>{to}</Text>
              </View>
            </View>
          </Card>

          {/* Phase-specific action */}
          {phase === 'arrived' && (
            <Card style={styles.arrivedCard}>
              <Animated.View style={[styles.arrivedPulse, { transform: [{ scale: pulseAnim }] }]} />
              <Text style={styles.arrivedTitle}>{rider.name} is here!</Text>
              <Text style={styles.arrivedSub}>Look for {rider.vehicle} · {rider.vehicleNumber}</Text>
              <TouchableOpacity style={styles.boardedBtn} onPress={() => setPhase('completed')} activeOpacity={0.8}>
                <Text style={styles.boardedBtnText}>I've boarded the vehicle ✓</Text>
              </TouchableOpacity>
            </Card>
          )}

          {/* SOS */}
          <TouchableOpacity style={styles.sosBtn} activeOpacity={0.8}>
            <Text style={styles.sosText}>🆘  Emergency SOS — alerts police instantly</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

// ─── COMPLETED SCREEN ─────────────────────────────────────────────────────────
function CompletedScreen({ rider, fare, from, to, navigation }) {
  const [rating, setRating] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const scaleAnim = useRef(new Animated.Value(0.7)).current;

  useEffect(() => {
    Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, tension: 80, friction: 6 }).start();
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar />
      <NavBar title="Ride complete" />
      <ScrollView contentContainerStyle={styles.completedContent}>

        <Animated.View style={[styles.completedCheck, { transform: [{ scale: scaleAnim }] }]}>
          <Text style={styles.checkIcon}>✓</Text>
        </Animated.View>

        <Text style={styles.completedTitle}>You've arrived!</Text>
        <Text style={styles.completedSub}>{from} → {to}</Text>

        {/* Receipt */}
        <Card style={styles.receipt}>
          <Text style={styles.receiptTitle}>Ride receipt</Text>
          <View style={styles.receiptRow}><Text style={styles.receiptLabel}>Rider</Text><Text style={styles.receiptVal}>{rider.name}</Text></View>
          <View style={styles.receiptRow}><Text style={styles.receiptLabel}>Vehicle</Text><Text style={styles.receiptVal}>{rider.vehicle} · {rider.vehicleNumber}</Text></View>
          <View style={styles.receiptRow}><Text style={styles.receiptLabel}>Fare paid</Text><Text style={[styles.receiptVal, { color: Colors.textSuccess, fontWeight: '600' }]}>₹{fare}</Text></View>
          <View style={styles.receiptRow}><Text style={styles.receiptLabel}>Payment</Text><Text style={styles.receiptVal}>UPI auto-deducted ✓</Text></View>
          <View style={[styles.receiptRow, { backgroundColor: Colors.bgSuccess, borderRadius: Radius.sm, padding: 6, marginTop: 4 }]}>
            <Text style={[styles.receiptLabel, { color: Colors.textSuccess }]}>You saved</Text>
            <Text style={[styles.receiptVal, { color: Colors.textSuccess, fontWeight: '600' }]}>₹{rider.maxFare - fare}</Text>
          </View>
        </Card>

        {/* Rating */}
        {!submitted ? (
          <Card style={styles.ratingCard}>
            <Text style={styles.ratingTitle}>Rate your ride</Text>
            <View style={styles.starsRow}>
              {[1, 2, 3, 4, 5].map(s => (
                <TouchableOpacity key={s} onPress={() => setRating(s)}>
                  <Text style={[styles.starIcon, s <= rating && styles.starFilled]}>★</Text>
                </TouchableOpacity>
              ))}
            </View>
            {rating > 0 && (
              <TouchableOpacity style={styles.submitRating} onPress={() => setSubmitted(true)}>
                <Text style={styles.submitRatingText}>Submit rating</Text>
              </TouchableOpacity>
            )}
          </Card>
        ) : (
          <Card style={[styles.ratingCard, { backgroundColor: Colors.bgSuccess }]}>
            <Text style={[styles.ratingTitle, { color: Colors.textSuccess }]}>Thanks for rating! ★★★★★</Text>
          </Card>
        )}

        <PrimaryBtn label="Book another ride" onPress={() => navigation.navigate('UserHome')} style={styles.homeBtn} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bgTertiary },
  content: { padding: Spacing.md, gap: Spacing.md, paddingBottom: Spacing.xl },
  riderCard: {},
  riderTop: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.md },
  riderInfo: { flex: 1, marginLeft: Spacing.md },
  riderName: { fontSize: 16, fontWeight: '600', color: Colors.textPrimary },
  riderVehicle: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  riderRating: { fontSize: 12, color: '#BA7517', marginTop: 2 },
  callBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.bgSuccess, alignItems: 'center', justifyContent: 'center' },
  callIcon: { fontSize: 20 },
  statsRow: { flexDirection: 'row', gap: Spacing.sm },
  stat: { flex: 1, backgroundColor: Colors.bgSecondary, borderRadius: Radius.md, padding: Spacing.sm, alignItems: 'center' },
  statLabel: { fontSize: 11, color: Colors.textSecondary, marginBottom: 2 },
  statValue: { fontSize: 16, fontWeight: '600', color: Colors.textPrimary },
  routeItem: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm, paddingVertical: 4 },
  routeVline: { width: 1.5, height: 16, backgroundColor: Colors.borderSecondary, marginLeft: 4, marginVertical: 2 },
  routeDotG: { width: 10, height: 10, borderRadius: 5, backgroundColor: Colors.green, marginTop: 4 },
  routeDotR: { width: 10, height: 10, borderRadius: 5, backgroundColor: Colors.red, marginTop: 4 },
  routeLabel: { fontSize: 11, color: Colors.textTertiary },
  routeText: { fontSize: 13, fontWeight: '500', color: Colors.textPrimary, marginTop: 2 },
  arrivedCard: { borderWidth: 2, borderColor: Colors.borderSuccess, alignItems: 'center', padding: Spacing.xl },
  arrivedPulse: { width: 56, height: 56, borderRadius: 28, backgroundColor: Colors.bgSuccess, marginBottom: Spacing.md },
  arrivedTitle: { fontSize: 18, fontWeight: '600', color: Colors.textSuccess, marginBottom: 4 },
  arrivedSub: { fontSize: 12, color: Colors.textSecondary, marginBottom: Spacing.lg },
  boardedBtn: { backgroundColor: Colors.bgSuccess, borderRadius: Radius.md, paddingHorizontal: Spacing.xl, paddingVertical: Spacing.md },
  boardedBtnText: { fontSize: 14, fontWeight: '500', color: Colors.textSuccess },
  sosBtn: { backgroundColor: Colors.bgDanger, borderRadius: Radius.md, padding: Spacing.md, alignItems: 'center' },
  sosText: { fontSize: 13, color: Colors.textDanger, fontWeight: '500' },
  // Completed
  completedContent: { padding: Spacing.xl, alignItems: 'center', gap: Spacing.md },
  completedCheck: { width: 80, height: 80, borderRadius: 40, backgroundColor: Colors.bgSuccess, alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.sm },
  checkIcon: { fontSize: 36, color: Colors.green },
  completedTitle: { fontSize: 24, fontWeight: '700', color: Colors.textPrimary },
  completedSub: { fontSize: 13, color: Colors.textSecondary, textAlign: 'center' },
  receipt: { width: '100%', gap: 4 },
  receiptTitle: { fontSize: 14, fontWeight: '600', color: Colors.textPrimary, marginBottom: Spacing.sm },
  receiptRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 5, borderBottomWidth: 0.5, borderBottomColor: Colors.borderTertiary },
  receiptLabel: { fontSize: 13, color: Colors.textSecondary },
  receiptVal: { fontSize: 13, color: Colors.textPrimary },
  ratingCard: { width: '100%', alignItems: 'center', padding: Spacing.lg },
  ratingTitle: { fontSize: 15, fontWeight: '500', color: Colors.textPrimary, marginBottom: Spacing.md },
  starsRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.md },
  starIcon: { fontSize: 36, color: Colors.borderSecondary },
  starFilled: { color: '#BA7517' },
  submitRating: { backgroundColor: Colors.bgSuccess, borderRadius: Radius.md, paddingHorizontal: Spacing.xl, paddingVertical: Spacing.sm },
  submitRatingText: { fontSize: 13, fontWeight: '500', color: Colors.textSuccess },
  homeBtn: { width: '100%', marginTop: Spacing.sm },
});
