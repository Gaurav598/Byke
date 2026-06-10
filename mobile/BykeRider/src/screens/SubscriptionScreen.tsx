import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import api from '../config/api';
import {ArrowLeft, CreditCard, ShieldCheck, AlertTriangle} from 'lucide-react-native';

const SubscriptionScreen = ({navigation}: any) => {
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<any>(null);
  const [renewing, setRenewing] = useState(false);

  const fetchStatus = async () => {
    try {
      setLoading(true);
      const response = await api.get('/subscription/status');
      setStatus(response.data);
    } catch (e) {
      console.log('Error fetching subscription status', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const handleRenew = async () => {
    try {
      setRenewing(true);
      await api.post('/subscription/renew');
      Alert.alert('Success', 'Subscription renewed successfully!');
      fetchStatus();
    } catch (e) {
      Alert.alert('Error', 'Failed to renew subscription');
    } finally {
      setRenewing(false);
    }
  };

  const handleToggleAutoRenew = async () => {
    try {
      if (status?.active) {
        await api.post('/subscription/cancel');
        Alert.alert('Success', 'Auto-renewal cancelled');
      } else {
        await api.post('/subscription/reactivate');
        Alert.alert('Success', 'Auto-renewal reactivated');
      }
      fetchStatus();
    } catch (e) {
      Alert.alert('Error', 'Failed to update settings');
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#10B981" />
      </View>
    );
  }

  const daysLeft = status?.remainingDays || 0;
  let statusColor = '#10B981';
  let warningMessage = null;

  if (daysLeft === 0) {
    statusColor = '#EF4444';
    warningMessage = 'Your subscription has expired. You cannot receive ride requests.';
  } else if (daysLeft <= 3) {
    statusColor = '#EF4444';
    warningMessage = `Your subscription expires in ${daysLeft} days! Renew now.`;
  } else if (daysLeft <= 7) {
    statusColor = '#F59E0B';
    warningMessage = `Your subscription expires in ${daysLeft} days.`;
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <ArrowLeft size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Subscription</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {warningMessage && (
          <View style={[styles.warningBanner, {backgroundColor: statusColor === '#EF4444' ? '#FEE2E2' : '#FEF3C7'}]}>
            <AlertTriangle size={24} color={statusColor} />
            <Text style={[styles.warningText, {color: statusColor === '#EF4444' ? '#991B1B' : '#B45309'}]}>
              {warningMessage}
            </Text>
          </View>
        )}

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={[styles.iconBox, {backgroundColor: statusColor + '20'}]}>
              <ShieldCheck size={32} color={statusColor} />
            </View>
            <View style={[styles.statusBadge, {backgroundColor: statusColor}]}>
              <Text style={styles.statusText}>{status?.active ? 'ACTIVE' : 'INACTIVE'}</Text>
            </View>
          </View>
          
          <Text style={styles.planTitle}>Premium Rider Plan</Text>
          <Text style={styles.planDesc}>Unlimited access to ride requests and premium support.</Text>

          <View style={styles.detailsRow}>
            <Text style={styles.detailsLabel}>Valid Until</Text>
            <Text style={styles.detailsValue}>
              {status?.endDate ? new Date(status.endDate).toLocaleDateString() : 'N/A'}
            </Text>
          </View>
          <View style={styles.detailsRow}>
            <Text style={styles.detailsLabel}>Remaining Days</Text>
            <Text style={[styles.detailsValue, {color: statusColor}]}>{daysLeft} Days</Text>
          </View>
        </View>

        <TouchableOpacity 
          style={styles.renewBtn} 
          onPress={handleRenew} 
          disabled={renewing}
        >
          {renewing ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <CreditCard size={20} color="#fff" style={{marginRight: 8}} />
              <Text style={styles.renewBtnText}>Renew Plan (₹100/mo)</Text>
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity style={styles.toggleBtn} onPress={handleToggleAutoRenew}>
          <Text style={styles.toggleBtnText}>
            {status?.active ? 'Cancel Auto-Renewal' : 'Turn On Auto-Renewal'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#F9FAFB'},
  loadingContainer: {flex: 1, justifyContent: 'center', alignItems: 'center'},
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  backBtn: {padding: 8, marginLeft: -8, marginRight: 8},
  headerTitle: {fontSize: 20, fontWeight: '900', color: '#000'},
  content: {padding: 20},
  warningBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  warningText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 14,
    fontWeight: '700',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 24,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  iconBox: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1,
  },
  planTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: '#111827',
    marginBottom: 8,
  },
  planDesc: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
    marginBottom: 24,
  },
  detailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  detailsLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4B5563',
  },
  detailsValue: {
    fontSize: 14,
    fontWeight: '800',
    color: '#111827',
  },
  renewBtn: {
    backgroundColor: '#111827',
    flexDirection: 'row',
    borderRadius: 16,
    padding: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  renewBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
  },
  toggleBtn: {
    padding: 16,
    alignItems: 'center',
  },
  toggleBtnText: {
    color: '#EF4444',
    fontSize: 14,
    fontWeight: '700',
  },
});

export default SubscriptionScreen;
