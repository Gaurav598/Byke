import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Image,
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../store';
import { addBid, acceptBid, setBiddingTimeLeft } from '../store/slices/bookingSlice';
import api from '../config/api';

const BiddingScreen = ({ navigation }: any) => {
  const dispatch = useDispatch();
  const { currentBooking, bids, biddingTimeLeft } = useSelector((state: RootState) => state.booking) as any;
  const [sortBy, setSortBy] = useState<'price' | 'rating' | 'distance'>('price');

  useEffect(() => {
    // Start countdown timer
    const timer = setInterval(() => {
      dispatch(setBiddingTimeLeft(Math.max(0, biddingTimeLeft - 1)));
    }, 1000);

    // Fetch real bids from backend
    const fetchBids = async () => {
      if (currentBooking?.id) {
        try {
          const response = await api.get(`/bids/booking/${currentBooking.id}`);
          const bids = response.data;
          bids.forEach((bid: any) => dispatch(addBid(bid)));
        } catch (error) {
          console.log('Error fetching bids:', error);
        }
      }
    };

    fetchBids();
    
    // Poll for new bids every 3 seconds
    const bidTimer = setInterval(fetchBids, 3000);

    return () => {
      clearInterval(timer);
      clearInterval(bidTimer);
    };
  }, [dispatch, biddingTimeLeft, currentBooking?.id]);

  useEffect(() => {
    if (biddingTimeLeft === 0 && bids.length === 0) {
      Alert.alert(
        'No Bids Received',
        'No riders are available right now. Would you like to try again?',
        [
          { text: 'Cancel', onPress: () => navigation.goBack() },
          { text: 'Try Again', onPress: () => dispatch(setBiddingTimeLeft(60)) },
        ]
      );
    }
  }, [biddingTimeLeft, bids.length, navigation, dispatch]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const sortedBids = [...bids].sort((a, b) => {
    switch (sortBy) {
      case 'price':
        return a.bidAmount - b.bidAmount;
      case 'rating':
        return (b.rider?.averageRating || 0) - (a.rider?.averageRating || 0);
      case 'distance':
        return 0;
      default:
        return 0;
    }
  });

  const handleAcceptBid = async (bid: any) => {
    Alert.alert(
      'Confirm Selection',
      `Accept bid from ${bid.rider?.user?.fullName || 'Rider'} for ₹${bid.bidAmount}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Accept',
          onPress: async () => {
            try {
              await api.post(`/bids/${bid.id}/accept`);
              dispatch(acceptBid({ bidId: bid.id, rider: bid.rider }));
              navigation.navigate('RiderApproaching', { bookingId: currentBooking.id });
            } catch (error: any) {
              Alert.alert('Error', 'Failed to accept bid');
            }
          },
        },
      ]
    );
  };

  if (!currentBooking) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>No active booking found</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Choose Your Rider</Text>
        <View style={styles.timerContainer}>
          <Text style={styles.timerLabel}>Time Left:</Text>
          <Text style={[styles.timer, biddingTimeLeft < 10 && styles.timerUrgent]}>
            {formatTime(biddingTimeLeft)}
          </Text>
        </View>
      </View>

      {/* Booking Info */}
      <View style={styles.bookingInfo}>
        <Text style={styles.bookingType}>{currentBooking.serviceType}</Text>
        <Text style={styles.route}>
          {currentBooking.pickupAddress} → {currentBooking.dropAddress}
        </Text>
      </View>

      {/* Sort Options */}
      <View style={styles.sortContainer}>
        <Text style={styles.sortLabel}>Sort by:</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {[
            { key: 'price', label: 'Lowest Price' },
            { key: 'rating', label: 'Highest Rating' },
            { key: 'distance', label: 'Nearest' },
          ].map((option) => (
            <TouchableOpacity
              key={option.key}
              style={[
                styles.sortButton,
                sortBy === option.key && styles.sortButtonActive,
              ]}
              onPress={() => setSortBy(option.key as any)}
            >
              <Text
                style={[
                  styles.sortButtonText,
                  sortBy === option.key && styles.sortButtonTextActive,
                ]}
              >
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Bids List */}
      <ScrollView style={styles.bidsList}>
        {sortedBids.length === 0 ? (
          <View style={styles.noBidsContainer}>
            <Text style={styles.noBidsText}>Waiting for riders to bid...</Text>
            <Text style={styles.noBidsSubtext}>
              Riders in your area will see your request and submit their bids
            </Text>
          </View>
        ) : (
          sortedBids.map((bid) => (
            <View key={bid.id} style={styles.bidCard}>
              <View style={styles.riderInfo}>
                <View style={styles.riderAvatar}>
                  <Text style={styles.riderInitial}>
                    {(bid.rider?.user?.fullName || 'R').charAt(0)}
                  </Text>
                </View>
                <View style={styles.riderDetails}>
                  <Text style={styles.riderName}>{bid.rider?.user?.fullName || 'Rider'}</Text>
                  <View style={styles.riderMeta}>
                    <Text style={styles.rating}>⭐ {bid.rider?.averageRating?.toFixed(1) || '0.0'}</Text>
                    <Text style={styles.rides}>• {bid.rider?.totalRides || 0} rides</Text>
                  </View>
                  <Text style={styles.vehicle}>
                    {bid.rider?.vehicleType} • {bid.rider?.vehicleRegistrationNumber}
                  </Text>
                </View>
              </View>
              
              <View style={styles.bidAmount}>
                <Text style={styles.amount}>₹{bid.bidAmount}</Text>
                <TouchableOpacity
                  style={styles.acceptButton}
                  onPress={() => handleAcceptBid(bid)}
                  disabled={biddingTimeLeft === 0}
                >
                  <Text style={styles.acceptButtonText}>Accept</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      {biddingTimeLeft === 0 && bids.length > 0 && (
        <View style={styles.timeUpContainer}>
          <Text style={styles.timeUpText}>Bidding time is up!</Text>
          <Text style={styles.timeUpSubtext}>Choose a rider to continue</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  timerContainer: {
    alignItems: 'center',
  },
  timerLabel: {
    fontSize: 12,
    color: '#64748b',
  },
  timer: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2563eb',
  },
  timerUrgent: {
    color: '#dc2626',
  },
  bookingInfo: {
    backgroundColor: '#fff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  bookingType: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2563eb',
    marginBottom: 4,
  },
  route: {
    fontSize: 16,
    color: '#374151',
  },
  sortContainer: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  sortLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  sortButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f1f5f9',
    marginRight: 8,
  },
  sortButtonActive: {
    backgroundColor: '#2563eb',
  },
  sortButtonText: {
    fontSize: 14,
    color: '#64748b',
  },
  sortButtonTextActive: {
    color: '#fff',
  },
  bidsList: {
    flex: 1,
    padding: 16,
  },
  noBidsContainer: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  noBidsText: {
    fontSize: 18,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  noBidsSubtext: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  bidCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  riderInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  riderAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#e2e8f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  riderInitial: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#64748b',
  },
  riderDetails: {
    flex: 1,
  },
  riderName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 4,
  },
  riderMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  rating: {
    fontSize: 14,
    color: '#f59e0b',
  },
  rides: {
    fontSize: 14,
    color: '#64748b',
  },
  vehicle: {
    fontSize: 12,
    color: '#64748b',
  },
  bidAmount: {
    alignItems: 'center',
  },
  amount: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#059669',
    marginBottom: 8,
  },
  acceptButton: {
    backgroundColor: '#2563eb',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
  },
  acceptButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  timeUpContainer: {
    backgroundColor: '#fef3c7',
    padding: 16,
    alignItems: 'center',
  },
  timeUpText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#92400e',
  },
  timeUpSubtext: {
    fontSize: 14,
    color: '#92400e',
  },
  errorText: {
    fontSize: 16,
    color: '#dc2626',
    textAlign: 'center',
    marginTop: 48,
  },
});

export default BiddingScreen;
