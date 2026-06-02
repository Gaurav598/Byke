import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  RefreshControl,
  SafeAreaView,
  StyleSheet,
} from 'react-native';
import api from '../config/api';
import {
  Clock,
  ChevronRight,
  ArrowLeft,
  Bike,
  ShoppingBag,
  Package,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Timer,
} from 'lucide-react-native';

const MyBidsScreen = ({navigation}: any) => {
  const [bids, setBids] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeBookingId, setActiveBookingId] = useState<string | null>(null);

  const fetchMyBids = async () => {
    setLoading(true);
    try {
      const [bidsResponse, activeResponse] = await Promise.allSettled([
        api.get('/rider/my-bids'),
        api.get('/bookings/rider/active'),
      ]);

      if (bidsResponse.status === 'fulfilled') {
        setBids(bidsResponse.value.data);
      }

      if (
        activeResponse.status === 'fulfilled' &&
        activeResponse.value?.data?.id
      ) {
        setActiveBookingId(String(activeResponse.value.data.id));
      } else {
        setActiveBookingId(null);
      }
    } catch (error) {
      console.log('Error fetching bids:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyBids();
  }, []);

  const getServiceInfo = (type: string) => {
    switch (type?.toLowerCase()) {
      case 'ride':
        return {icon: Bike, color: '#EAB308', label: 'Ride'};
      case 'errand':
        return {icon: ShoppingBag, color: '#10B981', label: 'Errand'};
      case 'parcel':
        return {icon: Package, color: '#3B82F6', label: 'Parcel'};
      default:
        return {icon: Bike, color: '#6B7280', label: type || 'Ride'};
    }
  };

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'ACCEPTED':
        return {
          color: '#10B981',
          bg: '#D1FAE5',
          icon: CheckCircle2,
          text: 'Accepted',
        };
      case 'REJECTED':
        return {
          color: '#EF4444',
          bg: '#FEE2E2',
          icon: XCircle,
          text: 'Rejected',
        };
      case 'EXPIRED':
        return {color: '#6B7280', bg: '#F3F4F6', icon: Clock, text: 'Expired'};
      default:
        return {color: '#3B82F6', bg: '#DBEAFE', icon: Timer, text: 'Pending'};
    }
  };

  const renderBid = ({item}: any) => {
    const service = getServiceInfo(item.booking?.serviceType);
    const status = getStatusInfo(item.status);

    return (
      <TouchableOpacity
        activeOpacity={0.8}
        style={styles.bidCard}
        onPress={() => {
          const isActiveAccepted =
            item.status === 'ACCEPTED' &&
            (!activeBookingId || String(item.booking?.id) === activeBookingId);
          if (isActiveAccepted) {
            navigation.navigate('RideTracking', {bookingId: item.booking.id});
          } else if (item.status === 'ACCEPTED') {
            alert('Complete your current active ride before opening another accepted offer.');
          }
        }}>
        <View style={styles.cardHeader}>
          <View style={styles.headerLeft}>
            <View
              style={[
                styles.iconContainer,
                {backgroundColor: `${service.color}15`},
              ]}>
              <service.icon size={20} color={service.color} strokeWidth={2.5} />
            </View>
            <View>
              <Text style={styles.serviceLabel}>{service.label}</Text>
              <Text style={styles.bidAmount}>₹{item.bidAmount}</Text>
            </View>
          </View>
          <View style={[styles.statusBadge, {backgroundColor: status.bg}]}>
            <status.icon size={12} color={status.color} strokeWidth={3} />
            <Text style={[styles.statusText, {color: status.color}]}>
              {status.text}
            </Text>
          </View>
        </View>

        <View style={styles.locationContainer}>
          <View style={styles.locationRow}>
            <View style={[styles.dot, {backgroundColor: '#10B981'}]} />
            <Text style={styles.locationText} numberOfLines={1}>
              {item.booking?.pickupAddress || 'Pickup Location'}
            </Text>
          </View>
          <View style={styles.line} />
          <View style={styles.locationRow}>
            <View style={[styles.dot, {backgroundColor: '#EF4444'}]} />
            <Text style={styles.locationText} numberOfLines={1}>
              {item.booking?.dropAddress || 'Drop Location'}
            </Text>
          </View>
        </View>

        <View style={styles.cardFooter}>
          <View style={styles.timeContainer}>
            <Clock size={12} color="#9CA3AF" />
            <Text style={styles.timeText}>
              Placed{' '}
              {new Date(item.createdAt).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </Text>
          </View>
          {item.status === 'ACCEPTED' && (
            <View style={styles.actionPrompt}>
              <Text style={styles.actionText}>
                {activeBookingId && String(item.booking?.id) !== activeBookingId
                  ? 'Locked'
                  : 'Start Ride'}
              </Text>
              <ChevronRight size={16} color="#10B981" strokeWidth={3} />
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}>
          <ArrowLeft size={24} color="black" strokeWidth={2.5} />
        </TouchableOpacity>
        <View>
          <Text style={styles.headerTitle}>Active Bids</Text>
          <Text style={styles.headerSubtitle}>Manage your offers</Text>
        </View>
      </View>

      <FlatList
        data={bids}
        renderItem={renderBid}
        keyExtractor={(item: any) => item.id.toString()}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={fetchMyBids}
            tintColor="#000"
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconContainer}>
              <AlertCircle size={64} color="#D1D5DB" strokeWidth={1.5} />
            </View>
            <Text style={styles.emptyTitle}>No active bids</Text>
            <Text style={styles.emptySubtitle}>
              You haven't placed any bids yet. Check "New Requests" to find work
              near you.
            </Text>
            <TouchableOpacity
              onPress={() => navigation.navigate('AvailableBookings')}
              style={styles.browseBtn}>
              <Text style={styles.browseBtnText}>Browse Requests</Text>
            </TouchableOpacity>
          </View>
        }
        contentContainerStyle={styles.listContent}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#F9FAFB',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: 'black',
  },
  headerSubtitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#9CA3AF',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  listContent: {
    padding: 20,
    paddingBottom: 40,
  },
  bidCard: {
    backgroundColor: 'white',
    borderRadius: 28,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  serviceLabel: {
    fontSize: 10,
    fontWeight: '900',
    color: '#9CA3AF',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  bidAmount: {
    fontSize: 20,
    fontWeight: '900',
    color: 'black',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '900',
    marginLeft: 4,
    textTransform: 'uppercase',
  },
  locationContainer: {
    marginBottom: 20,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 12,
  },
  locationText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#4B5563',
    flex: 1,
  },
  line: {
    width: 2,
    height: 16,
    backgroundColor: '#F3F4F6',
    marginLeft: 3,
    marginVertical: 4,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#F9FAFB',
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#9CA3AF',
    marginLeft: 6,
    textTransform: 'uppercase',
  },
  actionPrompt: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionText: {
    fontSize: 12,
    fontWeight: '900',
    color: '#10B981',
    marginRight: 4,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 60,
    paddingHorizontal: 40,
  },
  emptyIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#F9FAFB',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: 'black',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 30,
  },
  browseBtn: {
    backgroundColor: 'black',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  browseBtnText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  itemRight: {
    alignItems: 'flex-end',
  },
});

export default MyBidsScreen;
