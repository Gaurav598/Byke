import React, {useState} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
  SafeAreaView,
  Dimensions,
} from 'react-native';
import MapView, {Marker, PROVIDER_GOOGLE} from 'react-native-maps';
import MapViewDirections from 'react-native-maps-directions';
import {GOOGLE_PLACES_API_KEY} from '../../../config/env';
import {VEHICLE_TYPES} from '../../../data/mockData';
import {ArrowLeft, Navigation, Clock, Bike, Car, CarTaxiFront, Bus} from 'lucide-react-native';

const {height} = Dimensions.get('window');

const SelectRideScreen = ({navigation, route}: any) => {
  const {pickup, drop, distanceKm, pickupCoords, dropCoords} = route.params;
  const [selectedVehicle, setSelectedVehicle] = useState('auto');

  const getBaseFareForVehicle = (v: any) => {
    if (!v) {
      return Math.round(15 * distanceKm);
    }
    const perKm = Number(v.baseMin) / 18;
    return Math.max(Math.round(perKm * distanceKm), 30);
  };

  const getVehicleIcon = (vehicleId: string, active: boolean) => {
    const color = active ? '#111827' : '#6B7280';
    switch (vehicleId) {
      case 'bike':
        return <Bike size={30} color={color} strokeWidth={2.5} />;
      case 'auto':
        return <CarTaxiFront size={30} color={color} strokeWidth={2.5} />;
      case 'cab':
        return <Car size={30} color={color} strokeWidth={2.5} />;
      case 'share':
        return <Bus size={30} color={color} strokeWidth={2.5} />;
      default:
        return <Car size={30} color={color} strokeWidth={2.5} />;
    }
  };

  const vehicle = VEHICLE_TYPES.find(v => v.id === selectedVehicle);
  const baseFare = getBaseFareForVehicle(vehicle);
  const maxFare = baseFare + 80;

  const handleVehicleSelect = (v: any) => {
    setSelectedVehicle(v.id);
    navigation.navigate('SetPrice', {
      pickup,
      drop,
      distanceKm,
      pickupCoords,
      dropCoords,
      vehicle: v,
      maxFare: getBaseFareForVehicle(v) + 80,
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.mapContainer}>
        {pickupCoords && dropCoords ? (
          <MapView
            provider={PROVIDER_GOOGLE}
            style={StyleSheet.absoluteFill}
            initialRegion={{
              latitude: (pickupCoords.latitude + dropCoords.latitude) / 2,
              longitude: (pickupCoords.longitude + dropCoords.longitude) / 2,
              latitudeDelta:
                Math.abs(pickupCoords.latitude - dropCoords.latitude) * 1.8,
              longitudeDelta:
                Math.abs(pickupCoords.longitude - dropCoords.longitude) * 1.8,
            }}
            customMapStyle={[]}>
            <Marker coordinate={pickupCoords} title="Pickup">
              <View style={styles.pickupMarker}>
                <View style={styles.pickupMarkerDot} />
              </View>
            </Marker>
            <Marker coordinate={dropCoords} title="Drop">
              <View style={styles.dropMarker}>
                <View style={styles.dropMarkerDot} />
              </View>
            </Marker>
            <MapViewDirections
              origin={pickupCoords}
              destination={dropCoords}
              apikey={GOOGLE_PLACES_API_KEY}
              strokeWidth={5}
              strokeColor="#EAB308"
              optimizeWaypoints={true}
            />
          </MapView>
        ) : (
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="large" color="#EAB308" />
          </View>
        )}
      </View>

      <SafeAreaView style={styles.headerOverlay}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}>
          <ArrowLeft size={24} color="black" />
        </TouchableOpacity>
      </SafeAreaView>

      <View style={styles.overlayContainer}>
        <ScrollView
          style={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{paddingBottom: 40}}>
          <View style={styles.sheet}>
            <View style={styles.sheetHandle} />

            <Text style={styles.sheetTitle}>Confirm Ride</Text>

            <View style={styles.routeCard}>
              <View style={styles.routeRow}>
                <View style={[styles.routeDot, {backgroundColor: '#22C55E'}]} />
                <Text style={styles.routeText} numberOfLines={1}>
                  {pickup}
                </Text>
              </View>
              <View style={styles.routeLine} />
              <View style={styles.routeRow}>
                <View style={[styles.routeDot, {backgroundColor: '#EF4444'}]} />
                <Text style={styles.routeText} numberOfLines={1}>
                  {drop}
                </Text>
              </View>

              <View style={styles.routeStats}>
                <Navigation size={14} color="#EAB308" />
                <Text style={styles.statText}>{distanceKm} km</Text>
                <View style={styles.statDivider} />
                <Clock size={14} color="#EAB308" />
                <Text style={styles.statText}>
                  ~{Math.round(distanceKm * 1.4)} min
                </Text>
              </View>
            </View>

            <Text style={styles.sectionLabel}>Vehicle Type</Text>
            <View style={styles.vehicleGrid}>
              {VEHICLE_TYPES.map(v => (
                <TouchableOpacity
                  key={v.id}
                  activeOpacity={0.85}
                  onPress={() => handleVehicleSelect(v)}
                  style={[
                    styles.vehicleCard,
                    selectedVehicle === v.id
                      ? styles.vehicleCardActive
                      : styles.vehicleCardInactive,
                  ]}>
                  <View
                    style={[
                      styles.vehicleIconContainer,
                      selectedVehicle === v.id
                        ? {backgroundColor: '#EAB308'}
                        : {backgroundColor: '#F3F4F6'},
                    ]}>
                    {getVehicleIcon(v.id, selectedVehicle === v.id)}
                  </View>
                  <Text style={styles.vehicleLabel}>{v.label}</Text>
                  <Text style={styles.vehicleDesc}>{v.desc}</Text>
                  <Text style={styles.vehiclePrice}>
                    ₹{getBaseFareForVehicle(v)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </ScrollView>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {flex: 1, position: 'relative'},
  mapContainer: {...StyleSheet.absoluteFillObject},
  loaderContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F3F4F6',
  },
  headerOverlay: {position: 'absolute', top: 0, left: 20, zIndex: 10},
  backButton: {
    backgroundColor: 'white',
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.2,
    shadowRadius: 8,
    marginTop: 20,
  },
  overlayContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: height * 0.65,
    zIndex: 5,
  },
  scrollContent: {flex: 1, backgroundColor: 'transparent'},
  sheet: {
    backgroundColor: 'white',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: 24,
    paddingTop: 20,
    elevation: 20,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: -10},
    shadowOpacity: 0.15,
    shadowRadius: 20,
    flex: 1,
  },
  sheetHandle: {
    width: 48,
    height: 6,
    backgroundColor: '#E5E7EB',
    borderRadius: 3,
    alignSelf: 'center',
    marginBottom: 20,
  },
  sheetTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: 'black',
    marginBottom: 24,
  },
  routeCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    marginBottom: 24,
  },
  routeRow: {flexDirection: 'row', alignItems: 'center'},
  routeDot: {width: 10, height: 10, borderRadius: 5, marginRight: 16},
  routeText: {flex: 1, fontSize: 16, fontWeight: '700', color: '#1F2937'},
  routeLine: {
    width: 2,
    height: 20,
    backgroundColor: '#E5E7EB',
    marginLeft: 4,
    marginVertical: 4,
  },
  routeStats: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    marginTop: 16,
  },
  statText: {marginLeft: 8, fontSize: 13, fontWeight: '900', color: '#4B5563'},
  statDivider: {
    width: 1,
    height: 12,
    backgroundColor: '#E5E7EB',
    marginHorizontal: 12,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '900',
    color: '#9CA3AF',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom: 12,
    marginLeft: 4,
  },
  vehicleGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 32,
  },
  vehicleCard: {
    width: '48%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 24,
    borderWidth: 2,
  },
  vehicleCardActive: {backgroundColor: '#FFFBEB', borderColor: '#EAB308'},
  vehicleCardInactive: {backgroundColor: 'white', borderColor: '#F3F4F6'},
  vehicleIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  vehicleLabel: {
    fontSize: 16,
    fontWeight: '900',
    color: 'black',
    textAlign: 'center',
  },
  vehicleDesc: {
    fontSize: 11,
    color: '#9CA3AF',
    fontWeight: '600',
    marginTop: 2,
    textAlign: 'center',
  },
  vehiclePrice: {fontSize: 16, fontWeight: '900', color: 'black', marginTop: 4},
  pickupMarker: {
    backgroundColor: '#22C55E',
    padding: 4,
    borderRadius: 10,
    borderWidth: 3,
    borderColor: 'white',
  },
  pickupMarkerDot: {
    width: 6,
    height: 6,
    backgroundColor: 'white',
    borderRadius: 3,
  },
  dropMarker: {
    backgroundColor: '#EF4444',
    padding: 4,
    borderRadius: 10,
    borderWidth: 3,
    borderColor: 'white',
  },
  dropMarkerDot: {
    width: 6,
    height: 6,
    backgroundColor: 'white',
    borderRadius: 3,
  },
});

export default SelectRideScreen;
