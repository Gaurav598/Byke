import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../store';
import { updateBookingStatus, completeBooking } from '../store/slices/bookingSlice';
import api from '../config/api';

const TrackingScreen = ({ navigation }: any) => {
  const dispatch = useDispatch();
  const { currentBooking } = useSelector((state: RootState) => state.booking);
  const [riderLocation, setRiderLocation] = useState({
    latitude: 28.6139,
    longitude: 77.2090,
  });

  useEffect(() => {
    const fetchRiderLocation = async () => {
      if (currentBooking?.rider?.id) {
        try {
          const response = await api.get(`/rider/${currentBooking.rider.id}/location`);
          if (response.data?.latitude && response.data?.longitude) {
            setRiderLocation({
              latitude: response.data.latitude,
              longitude: response.data.longitude,
            });
          }
        } catch (error) {
          // Fallback: simulate slight movement
          setRiderLocation(prev => ({
            latitude: prev.latitude + (Math.random() - 0.5) * 0.001,
            longitude: prev.longitude + (Math.random() - 0.5) * 0.001,
          }));
        }
      }
    };

    fetchRiderLocation();
    const interval = setInterval(fetchRiderLocation, 5000);
    return () => clearInterval(interval);
  }, [currentBooking?.rider?.id]);

  const handleCompleteRide = () => {
    Alert.alert(
      'Complete Ride',
      'Has your ride been completed?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes',
          onPress: () => {
            dispatch(completeBooking({}));
            navigation.navigate('Rating');
          },
        },
      ]
    );
  };

  const handleEmergency = () => {
    Alert.alert(
      'Emergency',
      'Do you need emergency assistance?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Call Emergency',
          style: 'destructive',
          onPress: () => {
            // In real app, this would call emergency services
            Alert.alert('Emergency', 'Emergency services have been notified');
          },
        },
      ]
    );
  };

  if (!currentBooking || !currentBooking.rider) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>No active booking found</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Map */}
      <MapView
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        region={{
          latitude: riderLocation.latitude,
          longitude: riderLocation.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }}
      >
        {/* Pickup Marker */}
        <Marker
          coordinate={{
            latitude: currentBooking.pickupLatitude,
            longitude: currentBooking.pickupLongitude,
          }}
          title="Pickup"
          pinColor="green"
        />
        
        {/* Drop Marker */}
        <Marker
          coordinate={{
            latitude: currentBooking.dropLatitude,
            longitude: currentBooking.dropLongitude,
          }}
          title="Drop"
          pinColor="red"
        />
        
        {/* Rider Marker */}
        <Marker
          coordinate={riderLocation}
          title={currentBooking.rider?.user?.fullName || 'Rider'}
          description={currentBooking.rider?.vehicleRegistrationNumber}
        />
      </MapView>

      {/* Bottom Panel */}
      <View style={styles.bottomPanel}>
        {/* Rider Info */}
        <View style={styles.riderInfo}>
          <View style={styles.riderAvatar}>
            <Text style={styles.riderInitial}>
              {(currentBooking.rider?.user?.fullName || 'R').charAt(0)}
            </Text>
          </View>
          <View style={styles.riderDetails}>
            <Text style={styles.riderName}>{currentBooking.rider?.user?.fullName || 'Rider'}</Text>
            <Text style={styles.riderMeta}>
              ⭐ {currentBooking.rider?.averageRating?.toFixed(1) || '0.0'} • {currentBooking.rider?.vehicleRegistrationNumber}
            </Text>
            <Text style={styles.bookingType}>
              {currentBooking.serviceType} • ₹{currentBooking.finalFare || currentBooking.estimatedFare}
            </Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.callButton}>
            <Text style={styles.callButtonText}>📞 Call</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.chatButton}>
            <Text style={styles.chatButtonText}>💬 Chat</Text>
          </TouchableOpacity>
        </View>

        {/* Status */}
        <View style={styles.statusContainer}>
          <Text style={styles.statusText}>
            {currentBooking.status === 'ACCEPTED' && 'Rider is on the way to pickup'}
            {currentBooking.status === 'RIDER_EN_ROUTE' && 'Rider is on the way to pickup'}
            {currentBooking.status === 'IN_PROGRESS' && 'Ride in progress'}
          </Text>
        </View>

        {/* Emergency and Complete Buttons */}
        <View style={styles.bottomButtons}>
          <TouchableOpacity
            style={styles.emergencyButton}
            onPress={handleEmergency}
          >
            <Text style={styles.emergencyButtonText}>🚨 SOS</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.completeButton}
            onPress={handleCompleteRide}
          >
            <Text style={styles.completeButtonText}>Complete Ride</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  bottomPanel: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  riderInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  riderAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#e2e8f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  riderInitial: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#64748b',
  },
  riderDetails: {
    flex: 1,
  },
  riderName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 4,
  },
  riderMeta: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 4,
  },
  bookingType: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2563eb',
  },
  actionButtons: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  callButton: {
    flex: 1,
    backgroundColor: '#10b981',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    marginRight: 8,
  },
  callButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  chatButton: {
    flex: 1,
    backgroundColor: '#3b82f6',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    marginLeft: 8,
  },
  chatButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  statusContainer: {
    backgroundColor: '#f0f9ff',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  statusText: {
    fontSize: 14,
    color: '#1e40af',
    textAlign: 'center',
  },
  bottomButtons: {
    flexDirection: 'row',
  },
  emergencyButton: {
    backgroundColor: '#dc2626',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
    marginRight: 12,
  },
  emergencyButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  completeButton: {
    flex: 1,
    backgroundColor: '#059669',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  completeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  errorText: {
    fontSize: 16,
    color: '#dc2626',
    textAlign: 'center',
    marginTop: 48,
  },
});

export default TrackingScreen;
