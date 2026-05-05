import React, { useState, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Animated, PanResponder } from 'react-native';
import { Colors, Spacing, Radius } from '../../styles/tokens';
import { Card, Badge, Pill, StatCard, LocationRoute, LiveDot, StatusBar, NavBar, BottomNav } from '../../components/SharedComponents';
import { RIDER_REQUESTS } from '../../data/mockData';

const QuickBidBtn = ({ amount, selected, onPress }) => (
  <TouchableOpacity style={[styles.qbBtn, selected && styles.qbSelected]} onPress={onPress} activeOpacity={0.7}>
    <Text style={[styles.qbText, selected && styles.qbTextSelected]}>₹{amount}</Text>
  </TouchableOpacity>
);

export default function RiderRequestsScreen({ navigation }) {
  const [idx, setIdx] = useState(0);
  const [bidIdx, setBidIdx] = useState(2);
  const [placed, setPlaced] = useState([]);
  const [animating, setAnimating] = useState(false);

  const tx = useRef(new Animated.Value(0)).current;
  const op = useRef(new Animated.Value(1)).current;
  const rot = useRef(new Animated.Value(0)).current;

  const current = RIDER_REQUESTS[idx];
  const hasMore = idx < RIDER_REQUESTS.length;
  const selectedAmt = current ? current.quickBids[bidIdx] ?? current.quickBids[2] : 0;
  const earnAmt = Math.round(selectedAmt * 0.85);

  const animateOut = useCallback((dir, done) => {
    if (animating) return;
    setAnimating(true);
    Animated.parallel([
      Animated.timing(tx, { toValue: dir === 'right' ? 420 : -420, duration: 250, useNativeDriver: true }),
      Animated.timing(op, { toValue: 0, duration: 200, useNativeDriver: true }),
      Animated.timing(rot, { toValue: dir === 'right' ? 10 : -10, duration: 250, useNativeDriver: true }),
    ]).start(() => {
      done();
      tx.setValue(0); op.setValue(1); rot.setValue(0);
      setAnimating(false);
    });
  }, [animating, tx, op, rot]);

  const skip = useCallback(() => {
    if (!hasMore || animating) return;
    animateOut('right', () => { setIdx(i => i + 1); setBidIdx(2); });
  }, [hasMore, animating, animateOut]);

  const bid = useCallback(() => {
    if (!hasMore || animating) return;
    animateOut('left', () => {
      setPlaced(p => [...p, { from: current.from, to: current.to, amt: selectedAmt }]);
      setIdx(i => i + 1);
      setBidIdx(2);
    });
  }, [hasMore, animating, animateOut, current, selectedAmt]);

  const acceptBid = useCallback(() => {
    if (!hasMore || animating) return;
    navigation.navigate('RiderTrip', { request: current, bidAmount: selectedAmt });
  }, [hasMore, animating, current, selectedAmt, navigation]);

  const panResponder = useRef(PanResponder.create({
    onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > 8,
    onPanResponderMove: (_, g) => { tx.setValue(g.dx); rot.setValue(g.dx * 0.025); op.setValue(1 - Math.abs(g.dx) / 280); },
    onPanResponderRelease: (_, g) => {
      if (g.dx > 80) { Animated.parallel([Animated.timing(tx, { toValue: 420, duration: 220, useNativeDriver: true }), Animated.timing(op, { toValue: 0, duration: 180, useNativeDriver: true })]).start(() => { setIdx(i => i + 1); setBidIdx(2); tx.setValue(0); op.setValue(1); rot.setValue(0); }); }
      else if (g.dx < -80) { Animated.parallel([Animated.timing(tx, { toValue: -420, duration: 220, useNativeDriver: true }), Animated.timing(op, { toValue: 0, duration: 180, useNativeDriver: true })]).start(() => { setPlaced(p => [...p, { from: current?.from, to: current?.to, amt: selectedAmt }]); setIdx(i => i + 1); setBidIdx(2); tx.setValue(0); op.setValue(1); rot.setValue(0); }); }
      else { Animated.parallel([Animated.spring(tx, { toValue: 0, useNativeDriver: true }), Animated.spring(op, { toValue: 1, useNativeDriver: true }), Animated.spring(rot, { toValue: 0, useNativeDriver: true })]).start(); }
    },
  })).current;

  const rotDeg = rot.interpolate({ inputRange: [-15, 0, 15], outputRange: ['-15deg', '0deg', '15deg'] });

  return (
    <View style={styles.container}>
      <StatusBar />
      <NavBar
        title="Ride requests"
        subtitle="Bid fast — users pick instantly"
        showBack onBack={() => navigation.goBack()}
        rightContent={<Badge label="Online" type="success" />}
      />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Stats */}
        <View style={styles.statsRow}>
          <StatCard label="Today" value="₹840" />
          <View style={{ width: Spacing.sm }} />
          <StatCard label="Rides" value="6" />
          <View style={{ width: Spacing.sm }} />
          <StatCard label="Rating" value="4.8" valueColor={Colors.textSuccess} />
        </View>

        {/* Card stack */}
        {hasMore ? (
          <View style={styles.stackWrap}>
            {idx + 1 < RIDER_REQUESTS.length && (
              <View style={[styles.swipeCard, styles.bgCard]} />
            )}
            <Animated.View
              style={[styles.swipeCard, { transform: [{ translateX: tx }, { rotate: rotDeg }], opacity: op }]}
              {...panResponder.panHandlers}
            >
              <View style={styles.cardHead}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <LiveDot />
                  <Text style={styles.cardHeadText}>New request</Text>
                </View>
                <Text style={styles.cardCounter}>{idx + 1}/{RIDER_REQUESTS.length}</Text>
              </View>

              {/* User info */}
              <View style={styles.userRow}>
                <View style={styles.userAvatar}><Text style={styles.userAvatarText}>{current.userInitials}</Text></View>
                <View>
                  <Text style={styles.userName}>{current.userName}</Text>
                  <Text style={styles.userRating}>★ {current.userRating} passenger</Text>
                </View>
              </View>

              {/* Route */}
              <View style={styles.routeRow}>
                <View style={{ flex: 1 }}><LocationRoute from={current.from} to={current.to} /></View>
                <View style={styles.pills}>
                  <Pill label={`${current.distanceKm} km`} style={{ marginBottom: 4 }} />
                  <Pill label={`~${current.estimatedMins} min`} style={{ marginBottom: 4 }} />
                  <Pill label={`${current.currentBids} bids`} />
                </View>
              </View>

              {/* Max fare */}
              <View style={styles.maxFareBar}>
                <Text style={styles.maxFareLabel}>User's max fare</Text>
                <Text style={styles.maxFareVal}>₹{current.maxFare}</Text>
              </View>

              {/* Quick bids */}
              <Text style={styles.bidHint}>Your bid — lower = better chance:</Text>
              <View style={styles.quickGrid}>
                {current.quickBids.map((amt, i) => (
                  <QuickBidBtn key={amt} amount={amt} selected={bidIdx === i} onPress={() => setBidIdx(i)} />
                ))}
              </View>

              {/* Actions */}
              <View style={styles.actions}>
                <TouchableOpacity style={styles.bidBtn} onPress={bid} activeOpacity={0.8}>
                  <Text style={styles.bidBtnText}>Bid ₹{selectedAmt}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.acceptBidBtn} onPress={acceptBid} activeOpacity={0.8}>
                  <Text style={styles.acceptBidText}>Accept Now</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.skipBtn} onPress={skip} activeOpacity={0.8}>
                  <Text style={styles.skipText}>Skip</Text>
                </TouchableOpacity>
              </View>
              <Text style={styles.earnNote}>~₹{earnAmt} after 15% cut · swipe left to bid, right to skip</Text>
            </Animated.View>

            <View style={styles.hints}>
              <Text style={styles.hintText}>← swipe to skip</Text>
              <Text style={styles.hintText}>bid to accept →</Text>
            </View>
          </View>
        ) : (
          <Card style={styles.noMore}>
            <Text style={styles.noMoreTitle}>No more requests right now</Text>
            <Text style={styles.noMoreSub}>New requests appear every few seconds</Text>
          </Card>
        )}

        {/* Placed bids */}
        {placed.length > 0 && (
          <Card style={{ padding: Spacing.md }}>
            <Text style={styles.placedTitle}>Bids placed this session</Text>
            {placed.map((b, i) => (
              <View key={i} style={styles.placedRow}>
                <Text style={styles.placedRoute}>{b.from} → {b.to}</Text>
                <View style={styles.placedBadge}><Text style={styles.placedAmt}>₹{b.amt}</Text></View>
              </View>
            ))}
          </Card>
        )}
      </ScrollView>

      <BottomNav items={[
        ['🏠', 'Home', false, () => navigation.navigate('RiderHome')],
        ['📋', 'Requests', true, null],
        ['💰', 'Earnings', false, null],
        ['👤', 'Profile', false, null],
      ]} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bgTertiary },
  scrollContent: { padding: Spacing.md, gap: Spacing.md, paddingBottom: Spacing.xl },
  statsRow: { flexDirection: 'row' },
  stackWrap: {},
  swipeCard: { backgroundColor: Colors.bgPrimary, borderRadius: Radius.lg, borderWidth: 1.5, borderColor: Colors.borderInfo, padding: Spacing.md },
  bgCard: { position: 'absolute', top: 6, left: 6, right: 6, bottom: -6, zIndex: -1, opacity: 0.4, transform: [{ scale: 0.97 }] },
  cardHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.sm },
  cardHeadText: { fontSize: 12, fontWeight: '500', color: Colors.textInfo, marginLeft: 4 },
  cardCounter: { fontSize: 11, color: Colors.textSecondary },
  userRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.sm, padding: Spacing.sm, backgroundColor: Colors.bgSecondary, borderRadius: Radius.md },
  userAvatar: { width: 34, height: 34, borderRadius: 17, backgroundColor: Colors.bgInfo, alignItems: 'center', justifyContent: 'center' },
  userAvatarText: { fontSize: 12, fontWeight: '600', color: Colors.textInfo },
  userName: { fontSize: 13, fontWeight: '500', color: Colors.textPrimary },
  userRating: { fontSize: 11, color: '#BA7517', marginTop: 1 },
  routeRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: Spacing.sm },
  pills: { alignItems: 'flex-end', marginLeft: Spacing.sm },
  maxFareBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: Colors.bgSecondary, borderRadius: Radius.md, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, marginBottom: Spacing.sm },
  maxFareLabel: { fontSize: 12, color: Colors.textSecondary },
  maxFareVal: { fontSize: 22, fontWeight: '700', color: Colors.textPrimary },
  bidHint: { fontSize: 11, color: Colors.textSecondary, marginBottom: 6 },
  quickGrid: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.sm },
  qbBtn: { flex: 1, backgroundColor: Colors.bgSecondary, borderRadius: Radius.md, borderWidth: 0.5, borderColor: Colors.borderTertiary, paddingVertical: Spacing.sm, alignItems: 'center' },
  qbSelected: { backgroundColor: Colors.bgSuccess, borderColor: Colors.borderSuccess },
  qbText: { fontSize: 13, fontWeight: '500', color: Colors.textSecondary },
  qbTextSelected: { color: Colors.textSuccess },
  actions: { flexDirection: 'row', gap: Spacing.sm, marginBottom: 6 },
  bidBtn: { flex: 2, backgroundColor: Colors.bgSuccess, borderRadius: Radius.md, paddingVertical: 12, alignItems: 'center' },
  bidBtnText: { fontSize: 14, fontWeight: '600', color: Colors.textSuccess },
  acceptBidBtn: { flex: 2, backgroundColor: Colors.bgInfo, borderRadius: Radius.md, paddingVertical: 12, alignItems: 'center' },
  acceptBidText: { fontSize: 14, fontWeight: '600', color: Colors.textInfo },
  skipBtn: { width: 56, backgroundColor: Colors.bgDanger, borderRadius: Radius.md, paddingVertical: 12, alignItems: 'center' },
  skipText: { fontSize: 13, fontWeight: '500', color: Colors.textDanger },
  earnNote: { fontSize: 10, color: Colors.textTertiary, textAlign: 'center' },
  hints: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 2, marginTop: 6 },
  hintText: { fontSize: 11, color: Colors.textTertiary },
  noMore: { alignItems: 'center', padding: Spacing.xl },
  noMoreTitle: { fontSize: 14, fontWeight: '500', color: Colors.textPrimary, marginBottom: 4 },
  noMoreSub: { fontSize: 12, color: Colors.textSecondary },
  placedTitle: { fontSize: 11, fontWeight: '500', color: Colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: Spacing.sm },
  placedRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 6, borderBottomWidth: 0.5, borderBottomColor: Colors.borderTertiary },
  placedRoute: { fontSize: 12, color: Colors.textSecondary, flex: 1 },
  placedBadge: { backgroundColor: Colors.bgSuccess, borderRadius: Radius.full, paddingHorizontal: Spacing.sm, paddingVertical: 2 },
  placedAmt: { fontSize: 12, fontWeight: '500', color: Colors.textSuccess },
});
