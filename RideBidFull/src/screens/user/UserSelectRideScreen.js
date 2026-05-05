import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Colors, Spacing, Radius } from '../../styles/tokens';
import { Card, LocationRoute, PrimaryBtn, StatusBar, NavBar } from '../../components/SharedComponents';
import MockMap from '../../components/MockMap';
import { VEHICLE_TYPES } from '../../data/mockData';

const FARE_STEPS = [0, 25, 50, 75, 100]; // percent extra over base

export default function UserSelectRideScreen({ navigation, route }) {
  const { from, fromShort, to, toShort, distanceKm } = route.params;
  const [selectedVehicle, setSelectedVehicle] = useState('auto');
  const [fareStep, setFareStep] = useState(2); // middle step

  const vehicle = VEHICLE_TYPES.find(v => v.id === selectedVehicle);
  const fareRange = vehicle ? vehicle.baseMax + Math.round((vehicle.baseMax * FARE_STEPS[fareStep]) / 100) : 220;
  const maxFare = Math.round(fareRange * (distanceKm / 18)); // scale by distance

  return (
    <View style={styles.container}>
      <StatusBar />
      <NavBar title="Choose ride" showBack onBack={() => navigation.goBack()} />

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Mini map */}
        <MockMap height={160} variant="enroute" style={{ borderRadius: 0 }} />

        <View style={styles.content}>
          {/* Route summary */}
          <Card style={styles.routeCard}>
            <LocationRoute from={fromShort} to={toShort} />
            <View style={styles.routeMeta}>
              <Text style={styles.routeMetaText}>{distanceKm} km · ~{Math.round(distanceKm * 1.4)} min</Text>
            </View>
          </Card>

          {/* Vehicle type selector */}
          <Text style={styles.sectionLabel}>Select vehicle type</Text>
          <View style={styles.vehicleGrid}>
            {VEHICLE_TYPES.map(v => (
              <TouchableOpacity
                key={v.id}
                style={[styles.vehicleCard, selectedVehicle === v.id && styles.vehicleCardActive]}
                onPress={() => setSelectedVehicle(v.id)}
                activeOpacity={0.8}
              >
                <Text style={styles.vehicleIcon}>{v.icon}</Text>
                <Text style={[styles.vehicleLabel, selectedVehicle === v.id && styles.vehicleLabelActive]}>{v.label}</Text>
                <Text style={styles.vehicleDesc}>{v.desc}</Text>
                <Text style={[styles.vehiclePrice, selectedVehicle === v.id && styles.vehiclePriceActive]}>
                  ₹{Math.round(v.baseMin * distanceKm / 18)}–{Math.round(v.baseMax * distanceKm / 18)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Max fare slider */}
          <Card style={styles.fareCard}>
            <Text style={styles.fareTitle}>Set your max fare</Text>
            <Text style={styles.fareSubtitle}>Riders will bid below this amount</Text>
            <View style={styles.fareDisplay}>
              <Text style={styles.fareAmount}>₹{maxFare}</Text>
              <Text style={styles.fareSave}>Riders will compete to beat this</Text>
            </View>
            {/* Fare steps */}
            <View style={styles.fareSteps}>
              {FARE_STEPS.map((step, idx) => (
                <TouchableOpacity
                  key={idx}
                  style={[styles.fareStepBtn, fareStep === idx && styles.fareStepActive]}
                  onPress={() => setFareStep(idx)}
                >
                  <Text style={[styles.fareStepText, fareStep === idx && styles.fareStepTextActive]}>
                    {idx === 0 ? 'Low' : idx === 4 ? 'High' : idx === 2 ? 'Fair' : `+${step}%`}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={styles.fareNote}>
              💡 Lower max = fewer bids but bigger savings · Higher max = more riders, faster pickup
            </Text>
          </Card>

          {/* Find riders CTA */}
          <PrimaryBtn
            label={`Find riders for ₹${maxFare} max →`}
            onPress={() => navigation.navigate('UserBids', {
              from: fromShort, to: toShort, maxFare, vehicleType: vehicle.label, distanceKm
            })}
            style={styles.findBtn}
          />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bgTertiary },
  content: { padding: Spacing.md, gap: Spacing.md },
  routeCard: { padding: Spacing.md },
  routeMeta: { marginTop: 8, paddingTop: 8, borderTopWidth: 0.5, borderTopColor: Colors.borderTertiary },
  routeMetaText: { fontSize: 12, color: Colors.textSecondary },
  sectionLabel: { fontSize: 11, fontWeight: '500', color: Colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5 },
  vehicleGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  vehicleCard: { width: '47%', backgroundColor: Colors.bgPrimary, borderRadius: Radius.lg, borderWidth: 1, borderColor: Colors.borderTertiary, padding: Spacing.md, alignItems: 'center' },
  vehicleCardActive: { borderColor: Colors.borderInfo, borderWidth: 2, backgroundColor: Colors.bgInfo },
  vehicleIcon: { fontSize: 28, marginBottom: 6 },
  vehicleLabel: { fontSize: 14, fontWeight: '500', color: Colors.textPrimary },
  vehicleLabelActive: { color: Colors.textInfo },
  vehicleDesc: { fontSize: 11, color: Colors.textTertiary, marginTop: 2 },
  vehiclePrice: { fontSize: 13, fontWeight: '500', color: Colors.textSecondary, marginTop: 4 },
  vehiclePriceActive: { color: Colors.textInfo },
  fareCard: {},
  fareTitle: { fontSize: 15, fontWeight: '500', color: Colors.textPrimary },
  fareSubtitle: { fontSize: 12, color: Colors.textSecondary, marginTop: 2, marginBottom: Spacing.md },
  fareDisplay: { backgroundColor: Colors.bgSuccess, borderRadius: Radius.md, padding: Spacing.md, alignItems: 'center', marginBottom: Spacing.md },
  fareAmount: { fontSize: 36, fontWeight: '700', color: Colors.textSuccess },
  fareSave: { fontSize: 11, color: Colors.textSuccess, marginTop: 2 },
  fareSteps: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.sm },
  fareStepBtn: { flex: 1, backgroundColor: Colors.bgSecondary, borderRadius: Radius.md, paddingVertical: 8, alignItems: 'center', borderWidth: 0.5, borderColor: Colors.borderTertiary },
  fareStepActive: { backgroundColor: Colors.bgSuccess, borderColor: Colors.borderSuccess },
  fareStepText: { fontSize: 11, color: Colors.textSecondary, fontWeight: '500' },
  fareStepTextActive: { color: Colors.textSuccess },
  fareNote: { fontSize: 11, color: Colors.textTertiary, lineHeight: 16 },
  findBtn: { marginBottom: Spacing.xl },
});
