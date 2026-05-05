import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { Colors, Radius } from '../styles/tokens';

// Draws a simple SVG-style mock map using React Native Views
// showRider: show animated rider dot moving toward user
// showRoute: draw a dotted route line
// variant: 'pickup' | 'dropoff' | 'enroute' | 'arrived'

export default function MockMap({ showRider = false, variant = 'pickup', height = 200, style }) {
  const riderX = useRef(new Animated.Value(0.15)).current;
  const riderY = useRef(new Animated.Value(0.2)).current;
  const pulseScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Rider moves toward user pin
    if (showRider && variant === 'pickup') {
      Animated.loop(
        Animated.sequence([
          Animated.parallel([
            Animated.timing(riderX, { toValue: 0.35, duration: 3000, useNativeDriver: false }),
            Animated.timing(riderY, { toValue: 0.45, duration: 3000, useNativeDriver: false }),
          ]),
          Animated.parallel([
            Animated.timing(riderX, { toValue: 0.15, duration: 3000, useNativeDriver: false }),
            Animated.timing(riderY, { toValue: 0.2, duration: 3000, useNativeDriver: false }),
          ]),
        ])
      ).start();
    }
    if (showRider && variant === 'enroute') {
      Animated.loop(
        Animated.sequence([
          Animated.parallel([
            Animated.timing(riderX, { toValue: 0.6, duration: 4000, useNativeDriver: false }),
            Animated.timing(riderY, { toValue: 0.55, duration: 4000, useNativeDriver: false }),
          ]),
          Animated.parallel([
            Animated.timing(riderX, { toValue: 0.3, duration: 4000, useNativeDriver: false }),
            Animated.timing(riderY, { toValue: 0.3, duration: 4000, useNativeDriver: false }),
          ]),
        ])
      ).start();
    }
    // Pulse for user pin
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseScale, { toValue: 1.6, duration: 800, useNativeDriver: true }),
        Animated.timing(pulseScale, { toValue: 1, duration: 800, useNativeDriver: true }),
      ])
    ).start();
  }, [showRider, variant]);

  return (
    <View style={[styles.mapContainer, { height }, style]}>
      {/* Map background tiles (simulated) */}
      <View style={styles.mapBg} />

      {/* Road grid */}
      <View style={[styles.road, styles.roadH, { top: '30%' }]} />
      <View style={[styles.road, styles.roadH, { top: '55%' }]} />
      <View style={[styles.road, styles.roadH, { top: '75%' }]} />
      <View style={[styles.road, styles.roadV, { left: '20%' }]} />
      <View style={[styles.road, styles.roadV, { left: '50%' }]} />
      <View style={[styles.road, styles.roadV, { left: '75%' }]} />
      <View style={[styles.roadMinor, styles.roadH, { top: '42%' }]} />
      <View style={[styles.roadMinor, styles.roadV, { left: '36%' }]} />

      {/* Route line (dotted) */}
      {(variant === 'pickup' || variant === 'enroute') && (
        <View style={styles.routeLine} />
      )}

      {/* Destination pin (drop location) */}
      {(variant === 'enroute' || variant === 'dropoff') && (
        <View style={[styles.destPin, { top: '55%', left: '72%' }]}>
          <View style={styles.destPinHead} />
          <View style={styles.destPinTail} />
        </View>
      )}

      {/* User location pin (pulsing) */}
      <View style={[styles.pinWrapper, { top: '42%', left: '44%' }]}>
        <Animated.View style={[styles.pulseRing, { transform: [{ scale: pulseScale }] }]} />
        <View style={styles.userPin} />
      </View>

      {/* Rider dot (animated) */}
      {showRider && (
        <Animated.View
          style={[
            styles.riderDot,
            {
              left: riderX.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }),
              top: riderY.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }),
            },
          ]}
        >
          <Text style={styles.riderIcon}>{variant === 'enroute' ? '🚗' : '🛺'}</Text>
        </Animated.View>
      )}

      {/* Arrived overlay */}
      {variant === 'arrived' && (
        <View style={styles.arrivedOverlay}>
          <Text style={styles.arrivedText}>Rider is here</Text>
        </View>
      )}

      {/* Map attribution label */}
      <View style={styles.mapLabel}>
        <Text style={styles.mapLabelText}>Mock Map View</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  mapContainer: { width: '100%', borderRadius: Radius.lg, overflow: 'hidden', position: 'relative' },
  mapBg: { ...StyleSheet.absoluteFillObject, backgroundColor: '#E8F0D8' },
  road: { position: 'absolute', backgroundColor: '#FFFFFF' },
  roadH: { left: 0, right: 0, height: 8 },
  roadV: { top: 0, bottom: 0, width: 8 },
  roadMinor: { backgroundColor: '#F5F2EC' },
  routeLine: { position: 'absolute', top: '44%', left: '24%', width: '25%', height: 3, backgroundColor: Colors.blue, borderRadius: 2, opacity: 0.7 },
  pinWrapper: { position: 'absolute', alignItems: 'center', justifyContent: 'center' },
  pulseRing: { position: 'absolute', width: 24, height: 24, borderRadius: 12, backgroundColor: 'rgba(55,138,221,0.25)' },
  userPin: { width: 14, height: 14, borderRadius: 7, backgroundColor: Colors.blue, borderWidth: 2, borderColor: '#FFFFFF' },
  destPin: { position: 'absolute', alignItems: 'center' },
  destPinHead: { width: 18, height: 18, borderRadius: 9, backgroundColor: Colors.red, borderWidth: 2, borderColor: '#FFFFFF' },
  destPinTail: { width: 2, height: 6, backgroundColor: Colors.red, marginTop: -2 },
  riderDot: { position: 'absolute', zIndex: 10 },
  riderIcon: { fontSize: 20 },
  arrivedOverlay: { position: 'absolute', bottom: 12, left: 12, right: 12, backgroundColor: 'rgba(255,255,255,0.92)', borderRadius: Radius.md, padding: 8, alignItems: 'center', borderWidth: 0.5, borderColor: Colors.borderSuccess },
  arrivedText: { fontSize: 13, fontWeight: '500', color: Colors.textSuccess },
  mapLabel: { position: 'absolute', bottom: 6, right: 8 },
  mapLabelText: { fontSize: 9, color: Colors.textTertiary },
});
