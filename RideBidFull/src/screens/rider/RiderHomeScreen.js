import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Switch } from 'react-native';
import { Colors, Spacing, Radius } from '../../styles/tokens';
import { Card, StatCard, Badge, StatusBar, NavBar, BottomNav } from '../../components/SharedComponents';
import MockMap from '../../components/MockMap';

const HISTORY = [
  { id: 'h1', from: 'Koramangala', to: 'Manyata', fare: 175, time: '8:42 AM', rating: 5 },
  { id: 'h2', from: 'HSR Layout', to: 'Whitefield', fare: 155, time: '7:15 AM', rating: 4 },
  { id: 'h3', from: 'BTM', to: 'MG Road', fare: 120, time: 'Yesterday', rating: 5 },
];

export default function RiderHomeScreen({ navigation }) {
  const [isOnline, setIsOnline] = useState(false);

  return (
    <View style={styles.container}>
      <StatusBar />
      <NavBar
        title="RideBid Rider"
        rightContent={
          <TouchableOpacity style={styles.profileBtn}>
            <Text style={styles.profileInitials}>RK</Text>
          </TouchableOpacity>
        }
      />

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Online toggle hero */}
        <View style={[styles.heroCard, isOnline ? styles.heroOnline : styles.heroOffline]}>
          <MockMap height={160} showRider={isOnline} variant="pickup" style={{ borderRadius: Radius.lg }} />
          <View style={styles.heroOverlay}>
            <Text style={styles.heroTitle}>{isOnline ? 'You are Online' : 'You are Offline'}</Text>
            <Text style={styles.heroSub}>{isOnline ? 'Receiving ride requests near you' : 'Go online to start receiving bids'}</Text>
            <TouchableOpacity
              style={[styles.onlineBtn, isOnline ? styles.onlineBtnActive : styles.onlineBtnInactive]}
              onPress={() => {
                setIsOnline(!isOnline);
                if (!isOnline) navigation.navigate('RiderRequests');
              }}
              activeOpacity={0.8}
            >
              <Text style={[styles.onlineBtnText, isOnline ? styles.onlineBtnTextActive : styles.onlineBtnTextInactive]}>
                {isOnline ? '● Online — tap to go offline' : '○ Go Online'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.content}>
          {/* Today stats */}
          <Text style={styles.sectionLabel}>Today's earnings</Text>
          <View style={styles.statsRow}>
            <StatCard label="Earned" value="₹840" valueColor={Colors.textSuccess} />
            <View style={{ width: Spacing.sm }} />
            <StatCard label="Rides" value="6" />
            <View style={{ width: Spacing.sm }} />
            <StatCard label="Rating" value="4.8" valueColor={Colors.textSuccess} />
            <View style={{ width: Spacing.sm }} />
            <StatCard label="Hours" value="4.5" />
          </View>

          {/* Weekly earnings bar */}
          <Card>
            <Text style={styles.weekTitle}>This week</Text>
            <View style={styles.barsRow}>
              {[520, 680, 420, 840, 760, 380, 840].map((val, i) => (
                <View key={i} style={styles.barWrapper}>
                  <View style={[styles.bar, { height: (val / 900) * 60, backgroundColor: i === 6 ? Colors.green : Colors.bgInfo }]} />
                  <Text style={styles.barLabel}>{['M', 'T', 'W', 'T', 'F', 'S', 'S'][i]}</Text>
                </View>
              ))}
            </View>
            <Text style={styles.weekTotal}>₹4,440 this week</Text>
          </Card>

          {/* Recent rides */}
          <Text style={styles.sectionLabel}>Recent rides</Text>
          <Card>
            {HISTORY.map((h, i) => (
              <View key={h.id} style={[styles.historyRow, i < HISTORY.length - 1 && styles.historyBorder]}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.historyRoute}>{h.from} → {h.to}</Text>
                  <Text style={styles.historyTime}>{h.time}</Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={styles.historyFare}>₹{h.fare}</Text>
                  <Text style={styles.historyRating}>{'★'.repeat(h.rating)}{'☆'.repeat(5 - h.rating)}</Text>
                </View>
              </View>
            ))}
          </Card>
        </View>
      </ScrollView>

      <BottomNav items={[
        ['🏠', 'Home', true, null],
        ['📋', 'Requests', false, () => navigation.navigate('RiderRequests')],
        ['💰', 'Earnings', false, null],
        ['👤', 'Profile', false, null],
      ]} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bgTertiary },
  heroCard: { margin: Spacing.md, borderRadius: Radius.xl, overflow: 'hidden', position: 'relative' },
  heroOnline: { borderWidth: 2, borderColor: Colors.borderSuccess },
  heroOffline: { borderWidth: 1, borderColor: Colors.borderTertiary },
  heroOverlay: { padding: Spacing.md, backgroundColor: 'rgba(255,255,255,0.95)' },
  heroTitle: { fontSize: 18, fontWeight: '600', color: Colors.textPrimary },
  heroSub: { fontSize: 12, color: Colors.textSecondary, marginTop: 2, marginBottom: Spacing.md },
  onlineBtn: { borderRadius: Radius.full, padding: Spacing.md, alignItems: 'center' },
  onlineBtnActive: { backgroundColor: Colors.bgSuccess },
  onlineBtnInactive: { backgroundColor: Colors.bgInfo },
  onlineBtnText: { fontSize: 14, fontWeight: '600' },
  onlineBtnTextActive: { color: Colors.textSuccess },
  onlineBtnTextInactive: { color: Colors.textInfo },
  content: { paddingHorizontal: Spacing.md, gap: Spacing.md, paddingBottom: Spacing.xl },
  sectionLabel: { fontSize: 11, fontWeight: '500', color: Colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5 },
  statsRow: { flexDirection: 'row' },
  weekTitle: { fontSize: 13, fontWeight: '500', color: Colors.textPrimary, marginBottom: Spacing.md },
  barsRow: { flexDirection: 'row', alignItems: 'flex-end', height: 72, gap: 6, marginBottom: 6 },
  barWrapper: { flex: 1, alignItems: 'center', justifyContent: 'flex-end' },
  bar: { width: '100%', borderRadius: 4, marginBottom: 4 },
  barLabel: { fontSize: 10, color: Colors.textTertiary },
  weekTotal: { fontSize: 13, fontWeight: '600', color: Colors.textSuccess },
  historyRow: { flexDirection: 'row', paddingVertical: Spacing.sm, alignItems: 'center' },
  historyBorder: { borderBottomWidth: 0.5, borderBottomColor: Colors.borderTertiary },
  historyRoute: { fontSize: 13, fontWeight: '500', color: Colors.textPrimary },
  historyTime: { fontSize: 11, color: Colors.textSecondary, marginTop: 2 },
  historyFare: { fontSize: 15, fontWeight: '600', color: Colors.textSuccess },
  historyRating: { fontSize: 11, color: '#BA7517', marginTop: 2 },
  profileBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.bgSuccess, alignItems: 'center', justifyContent: 'center' },
  profileInitials: { fontSize: 13, fontWeight: '600', color: Colors.textSuccess },
});
