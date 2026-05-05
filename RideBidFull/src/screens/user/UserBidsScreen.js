import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Animated } from 'react-native';
import { Colors, Spacing, Radius } from '../../styles/tokens';
import { Card, Badge, Pill, Avatar, TimerBar, LocationRoute, LiveDot, StatusBar, NavBar } from '../../components/SharedComponents';
import { MOCK_BIDS } from '../../data/mockData';

const SORT_OPTIONS = [
  { key: 'price', label: 'Lowest price' },
  { key: 'rating', label: 'Top rated' },
  { key: 'eta', label: 'Nearest' },
];

const BidItem = ({ item, onAccept, isNew }) => {
  const fade = useRef(new Animated.Value(isNew ? 0 : 1)).current;
  const slide = useRef(new Animated.Value(isNew ? -8 : 0)).current;
  useEffect(() => {
    if (isNew) Animated.parallel([
      Animated.timing(fade, { toValue: 1, duration: 280, useNativeDriver: true }),
      Animated.timing(slide, { toValue: 0, duration: 280, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <Animated.View style={[styles.bidRow, { opacity: fade, transform: [{ translateY: slide }] }]}>
      <Avatar initials={item.initials} bgColor={item.avatarColor} textColor={item.avatarTextColor} size={42} />
      <View style={styles.bidInfo}>
        <View style={styles.bidNameRow}>
          <Text style={styles.bidName}>{item.name}</Text>
          {item.isTopRated && <Badge label="Top" type="success" style={{ marginLeft: 4 }} />}
          {item.isWomenPreferred && <Badge label="Women" type="info" style={{ marginLeft: 4 }} />}
        </View>
        <View style={styles.bidMeta}>
          <Text style={styles.stars}>★ {item.rating}</Text>
          <Pill label={item.vehicle} style={{ marginLeft: 4 }} />
          <Pill label={`${item.etaMin} min`} style={{ marginLeft: 4 }} />
          <Pill label={`${item.totalRides} rides`} style={{ marginLeft: 4 }} />
        </View>
        <TimerBar percent={item.timerPercent} color={item.timerColor} />
      </View>
      <View style={styles.bidRight}>
        <Text style={styles.bidAmt}>₹{item.bidAmount}</Text>
        <Text style={styles.bidSave}>Save ₹{item.maxFare - item.bidAmount}</Text>
        <TouchableOpacity style={styles.acceptBtn} onPress={() => onAccept(item)} activeOpacity={0.8}>
          <Text style={styles.acceptBtnText}>Accept</Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
};

export default function UserBidsScreen({ navigation, route }) {
  const { from, to, maxFare, vehicleType, distanceKm } = route.params;
  const [sortKey, setSortKey] = useState('price');
  const [bids, setBids] = useState(MOCK_BIDS.map(b => ({ ...b, maxFare })));
  const [newBidIds, setNewBidIds] = useState([]);
  const [bidCount, setBidCount] = useState(MOCK_BIDS.length);

  useEffect(() => {
    const t = setInterval(() => {
      const newBid = {
        id: 'b' + Date.now(),
        name: 'Vikram S.', initials: 'VS', avatarColor: '#FBEAF0', avatarTextColor: '#72243E',
        rating: 4.7, vehicle: vehicleType, etaMin: 3, totalRides: 178,
        bidAmount: Math.round(maxFare * 0.75 + Math.random() * maxFare * 0.15),
        maxFare, isVerified: true, isTopRated: false, isWomenPreferred: false,
        timerPercent: 100, timerColor: Colors.green,
      };
      setBids(prev => [...prev, newBid]);
      setNewBidIds(prev => [...prev, newBid.id]);
      setBidCount(c => c + 1);
    }, 7000);
    return () => clearInterval(t);
  }, []);

  const sorted = [...bids].sort((a, b) => {
    if (sortKey === 'price') return a.bidAmount - b.bidAmount;
    if (sortKey === 'rating') return b.rating - a.rating;
    return a.etaMin - b.etaMin;
  });

  const handleAccept = (rider) => {
    navigation.navigate('UserTracking', { rider, from, to, maxFare });
  };

  return (
    <View style={styles.container}>
      <StatusBar />
      <NavBar
        title="Bids coming in"
        subtitle={`${bidCount} bids · max ₹${maxFare}`}
        showBack onBack={() => navigation.goBack()}
        rightContent={<View style={styles.liveRow}><LiveDot /><Text style={styles.liveText}>Live</Text></View>}
      />

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Route card */}
        <View style={styles.content}>
          <Card>
            <View style={styles.routeRow}>
              <View style={{ flex: 1 }}><LocationRoute from={from} to={to} /></View>
              <View style={styles.maxBlock}>
                <Text style={styles.maxLabel}>Your max</Text>
                <Text style={styles.maxValue}>₹{maxFare}</Text>
              </View>
            </View>
            <View style={styles.pillRow}>
              <Pill label={`${distanceKm} km`} style={{ marginRight: 6 }} />
              <Pill label={vehicleType} style={{ marginRight: 6 }} />
              <Badge label="Bids open" type="success" />
            </View>
          </Card>

          {/* Sort row */}
          <View style={styles.sortRow}>
            {SORT_OPTIONS.map(o => (
              <TouchableOpacity key={o.key} style={[styles.sortBtn, sortKey === o.key && styles.sortBtnActive]} onPress={() => setSortKey(o.key)}>
                <Text style={[styles.sortText, sortKey === o.key && styles.sortTextActive]}>{o.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Bid list */}
          <Card style={{ padding: Spacing.sm }}>
            {sorted.map(bid => (
              <BidItem key={bid.id} item={bid} onAccept={handleAccept} isNew={newBidIds.includes(bid.id)} />
            ))}
          </Card>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bgTertiary },
  content: { padding: Spacing.md, gap: Spacing.md, paddingBottom: Spacing.xl },
  liveRow: { flexDirection: 'row', alignItems: 'center' },
  liveText: { fontSize: 11, color: Colors.textSuccess, fontWeight: '500' },
  routeRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: Spacing.sm },
  maxBlock: { alignItems: 'flex-end', marginLeft: Spacing.sm },
  maxLabel: { fontSize: 11, color: Colors.textSecondary },
  maxValue: { fontSize: 24, fontWeight: '700', color: Colors.textPrimary },
  pillRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap' },
  sortRow: { flexDirection: 'row', gap: Spacing.sm },
  sortBtn: { paddingHorizontal: Spacing.md, paddingVertical: 5, borderRadius: Radius.full, backgroundColor: Colors.bgSecondary, borderWidth: 0.5, borderColor: Colors.borderTertiary },
  sortBtnActive: { backgroundColor: Colors.bgInfo, borderColor: Colors.borderInfo },
  sortText: { fontSize: 11, color: Colors.textSecondary },
  sortTextActive: { color: Colors.textInfo, fontWeight: '500' },
  bidRow: { flexDirection: 'row', alignItems: 'flex-start', paddingVertical: Spacing.sm, borderBottomWidth: 0.5, borderBottomColor: Colors.borderTertiary },
  bidInfo: { flex: 1, marginLeft: Spacing.sm },
  bidNameRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 3 },
  bidName: { fontSize: 13, fontWeight: '500', color: Colors.textPrimary },
  bidMeta: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap' },
  stars: { fontSize: 11, color: '#BA7517' },
  bidRight: { alignItems: 'flex-end', marginLeft: Spacing.sm },
  bidAmt: { fontSize: 22, fontWeight: '700', color: Colors.textSuccess },
  bidSave: { fontSize: 11, color: Colors.textSuccess, marginBottom: 4 },
  acceptBtn: { backgroundColor: Colors.bgSuccess, borderRadius: Radius.md, paddingHorizontal: Spacing.md, paddingVertical: 6 },
  acceptBtnText: { fontSize: 12, fontWeight: '500', color: Colors.textSuccess },
});
