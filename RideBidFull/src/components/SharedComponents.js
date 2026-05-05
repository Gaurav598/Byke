import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Colors, Spacing, Radius } from '../styles/tokens';

export const Card = ({ children, style, highlighted }) => (
  <View style={[styles.card, highlighted && styles.highlighted, style]}>{children}</View>
);

export const Badge = ({ label, type = 'default', style }) => {
  const m = { default: [Colors.bgSecondary, Colors.textSecondary], success: [Colors.bgSuccess, Colors.textSuccess], info: [Colors.bgInfo, Colors.textInfo], warning: [Colors.bgWarning, Colors.textWarning], danger: [Colors.bgDanger, Colors.textDanger] };
  const [bg, tc] = m[type] || m.default;
  return <View style={[styles.badge, { backgroundColor: bg }, style]}><Text style={[styles.badgeText, { color: tc }]}>{label}</Text></View>;
};

export const Pill = ({ label, style }) => (
  <View style={[styles.pill, style]}><Text style={styles.pillText}>{label}</Text></View>
);

export const Avatar = ({ initials, bgColor, textColor, size = 40 }) => (
  <View style={[styles.avatar, { width: size, height: size, borderRadius: size / 2, backgroundColor: bgColor }]}>
    <Text style={[styles.avatarText, { color: textColor, fontSize: size * 0.34 }]}>{initials}</Text>
  </View>
);

export const TimerBar = ({ percent, color }) => (
  <View style={styles.timerTrack}><View style={[styles.timerFill, { width: `${percent}%`, backgroundColor: color }]} /></View>
);

export const LocationRoute = ({ from, to }) => (
  <View>
    <View style={styles.locRow}><View style={styles.dotG} /><Text style={styles.locText}>{from}</Text></View>
    <View style={styles.vline} />
    <View style={styles.locRow}><View style={styles.dotR} /><Text style={styles.locText}>{to}</Text></View>
  </View>
);

export const LiveDot = () => <View style={styles.liveDot} />;

export const StatCard = ({ label, value, valueColor, style }) => (
  <View style={[styles.statCard, style]}>
    <Text style={styles.statLabel}>{label}</Text>
    <Text style={[styles.statValue, valueColor && { color: valueColor }]}>{value}</Text>
  </View>
);

export const PrimaryBtn = ({ label, onPress, loading, style }) => (
  <TouchableOpacity style={[styles.primaryBtn, style]} onPress={onPress} activeOpacity={0.8}>
    {loading ? <ActivityIndicator color={Colors.textSuccess} /> : <Text style={styles.primaryBtnText}>{label}</Text>}
  </TouchableOpacity>
);

export const SecondaryBtn = ({ label, onPress, style }) => (
  <TouchableOpacity style={[styles.secondaryBtn, style]} onPress={onPress} activeOpacity={0.8}>
    <Text style={styles.secondaryBtnText}>{label}</Text>
  </TouchableOpacity>
);

export const NavBar = ({ title, subtitle, rightContent, showBack, onBack }) => (
  <View style={styles.navBar}>
    <View style={styles.navLeft}>
      {showBack && (
        <TouchableOpacity onPress={onBack} style={styles.backBtn} activeOpacity={0.7}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
      )}
      <View>
        <Text style={styles.navTitle}>{title}</Text>
        {subtitle ? <Text style={styles.navSubtitle}>{subtitle}</Text> : null}
      </View>
    </View>
    {rightContent}
  </View>
);

export const BottomNav = ({ items }) => (
  <View style={styles.bottomNav}>
    {items.map(([icon, label, active, onPress]) => (
      <TouchableOpacity key={label} style={styles.navItem} onPress={onPress}>
        <Text style={[styles.navIcon, active && { color: Colors.textInfo }]}>{icon}</Text>
        <Text style={[styles.navLabel, active && { color: Colors.textInfo }]}>{label}</Text>
      </TouchableOpacity>
    ))}
  </View>
);

export const StatusBar = ({ time = '9:14' }) => (
  <View style={styles.statusBar}>
    <Text style={styles.statusText}>{time}</Text>
    <Text style={styles.statusText}>WiFi 🔋</Text>
  </View>
);

const styles = StyleSheet.create({
  card: { backgroundColor: Colors.bgPrimary, borderRadius: Radius.lg, borderWidth: 0.5, borderColor: Colors.borderTertiary, padding: Spacing.md },
  highlighted: { borderWidth: 1.5, borderColor: Colors.borderInfo },
  badge: { paddingHorizontal: Spacing.sm, paddingVertical: 3, borderRadius: Radius.full },
  badgeText: { fontSize: 11, fontWeight: '500' },
  pill: { paddingHorizontal: Spacing.sm, paddingVertical: 3, borderRadius: Radius.full, backgroundColor: Colors.bgSecondary, borderWidth: 0.5, borderColor: Colors.borderTertiary },
  pillText: { fontSize: 11, color: Colors.textSecondary },
  avatar: { alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontWeight: '500' },
  timerTrack: { height: 2, backgroundColor: Colors.borderTertiary, borderRadius: 2, marginTop: Spacing.sm, overflow: 'hidden' },
  timerFill: { height: '100%', borderRadius: 2 },
  locRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 3 },
  dotG: { width: 9, height: 9, borderRadius: 5, backgroundColor: Colors.green, marginRight: Spacing.sm },
  dotR: { width: 9, height: 9, borderRadius: 5, backgroundColor: Colors.red, marginRight: Spacing.sm },
  vline: { width: 1.5, height: 12, backgroundColor: Colors.borderSecondary, marginLeft: 4, marginVertical: 1 },
  locText: { fontSize: 13, fontWeight: '500', color: Colors.textPrimary },
  liveDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: Colors.green, marginRight: 4 },
  statCard: { flex: 1, backgroundColor: Colors.bgSecondary, borderRadius: Radius.md, padding: Spacing.sm, alignItems: 'center' },
  statLabel: { fontSize: 11, color: Colors.textSecondary, marginBottom: 3 },
  statValue: { fontSize: 17, fontWeight: '500', color: Colors.textPrimary },
  primaryBtn: { backgroundColor: Colors.bgSuccess, borderRadius: Radius.md, padding: Spacing.md, alignItems: 'center' },
  primaryBtnText: { fontSize: 14, fontWeight: '500', color: Colors.textSuccess },
  secondaryBtn: { backgroundColor: Colors.bgSecondary, borderRadius: Radius.md, borderWidth: 0.5, borderColor: Colors.borderSecondary, padding: Spacing.md, alignItems: 'center' },
  secondaryBtnText: { fontSize: 13, color: Colors.textSecondary },
  navBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md, backgroundColor: Colors.bgPrimary, borderBottomWidth: 0.5, borderBottomColor: Colors.borderTertiary },
  navLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  backBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: Colors.bgSecondary, alignItems: 'center', justifyContent: 'center' },
  backIcon: { fontSize: 16, color: Colors.textPrimary },
  navTitle: { fontSize: 15, fontWeight: '500', color: Colors.textPrimary },
  navSubtitle: { fontSize: 11, color: Colors.textSecondary, marginTop: 1 },
  bottomNav: { flexDirection: 'row', justifyContent: 'space-around', paddingVertical: Spacing.sm, paddingBottom: 12, backgroundColor: Colors.bgPrimary, borderTopWidth: 0.5, borderTopColor: Colors.borderTertiary },
  navItem: { alignItems: 'center', paddingHorizontal: Spacing.md },
  navIcon: { fontSize: 16, color: Colors.textTertiary },
  navLabel: { fontSize: 10, color: Colors.textTertiary, marginTop: 2 },
  statusBar: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: Spacing.lg, paddingTop: 10, paddingBottom: 6, backgroundColor: Colors.bgPrimary },
  statusText: { fontSize: 11, fontWeight: '500', color: Colors.textSecondary },
});
