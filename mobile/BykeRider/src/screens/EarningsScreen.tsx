import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  RefreshControl,
  StyleSheet,
  Platform,
} from 'react-native';
import api from '../config/api';
import {
  ArrowLeft,
  Wallet,
  TrendingUp,
  Calendar,
  IndianRupee,
  ArrowUpRight,
  ArrowDownLeft,
  CreditCard,
  PieChart,
  Target,
  Activity,
  CheckCircle,
} from 'lucide-react-native';

interface EarningsSummary {
  totalEarnings: number;
  completedTrips: number;
  averageFare: number;
  subscriptionCost: number;
  netEarnings: number;
}

const EarningsScreen = ({ navigation }: any) => {
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<'today' | 'week' | 'month' | 'summary'>('today');
  const [earnings, setEarnings] = useState<EarningsSummary>({
    totalEarnings: 0,
    completedTrips: 0,
    averageFare: 0,
    subscriptionCost: 0,
    netEarnings: 0,
  });
  const [quickStats, setQuickStats] = useState({
    week: 0,
    month: 0,
  });
  const [transactions, setTransactions] = useState<any[]>([]);

  const fetchEarnings = async () => {
    setLoading(true);
    try {
      // Fetch selected filter earnings
      const response = await api.get(`/rider/earnings/${filter}`);
      setEarnings({
        totalEarnings: response.data.totalEarnings || 0,
        completedTrips: response.data.completedTrips || 0,
        averageFare: response.data.averageFare || 0,
        subscriptionCost: response.data.subscriptionCost || 0,
        netEarnings: response.data.netEarnings || 0,
      });

      // Fetch quick stats for weekly/monthly cards to keep them populated regardless of filter
      const [weekRes, monthRes] = await Promise.all([
        api.get('/rider/earnings/week'),
        api.get('/rider/earnings/month')
      ]);
      setQuickStats({
        week: weekRes.data.netEarnings || 0,
        month: monthRes.data.netEarnings || 0,
      });

      // Fetch transaction history
      const transactionsResponse = await api.get('/rider/earnings/transactions');
      setTransactions(transactionsResponse.data || []);
    } catch (error) {
      console.log('Error fetching earnings:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEarnings();
  }, [filter]);

  const FilterButton = ({ label, value }: { label: string; value: typeof filter }) => (
    <TouchableOpacity
      style={[styles.filterBtn, filter === value && styles.filterBtnActive]}
      onPress={() => setFilter(value)}>
      <Text style={[styles.filterText, filter === value && styles.filterTextActive]}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  // Mock data for Bar Chart based on current earnings to simulate trend
  const chartData = [0.4, 0.6, 0.8, 1.0, 0.5, 0.7, 0.9].map(m => m * earnings.netEarnings);
  const maxChartVal = Math.max(...chartData, 1);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}>
          <ArrowLeft size={24} color="black" strokeWidth={2.5} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Financials</Text>
        <TouchableOpacity style={styles.payoutBtn}>
          <IndianRupee size={18} color="black" strokeWidth={3} />
        </TouchableOpacity>
      </View>

      <View style={styles.filterContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <FilterButton label="Today" value="today" />
          <FilterButton label="This Week" value="week" />
          <FilterButton label="This Month" value="month" />
          <FilterButton label="All Time" value="summary" />
        </ScrollView>
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={fetchEarnings}
            tintColor="#000"
          />
        }>
        
        {/* Balance Card (Merged with Net Earnings) */}
        <View style={styles.balanceCard}>
          <View style={styles.balanceHeader}>
            <View style={styles.walletIcon}>
              <Wallet size={20} color="white" />
            </View>
            <Text style={styles.balanceLabel}>Net Earnings ({filter})</Text>
          </View>

          <Text style={styles.balanceAmount}>₹{earnings.netEarnings.toFixed(2)}</Text>

          {/* Breakdown for Analytics & Subscription Costs */}
          <View style={styles.breakdownRow}>
            <Text style={styles.breakdownText}>Revenue: ₹{earnings.totalEarnings.toFixed(2)}</Text>
            {earnings.subscriptionCost > 0 && filter === 'month' && (
              <Text style={styles.breakdownRed}>- Fees: ₹{earnings.subscriptionCost.toFixed(2)}</Text>
            )}
          </View>

          <View style={styles.balanceFooter}>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Total Trips</Text>
              <Text style={styles.statValue}>{earnings.completedTrips}</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Avg Fare</Text>
              <Text style={styles.statValue}>₹{earnings.averageFare.toFixed(0)}</Text>
            </View>
            <TouchableOpacity style={styles.withdrawBtn}>
              <Text style={styles.withdrawText}>Withdraw</Text>
              <ArrowUpRight size={16} color="black" strokeWidth={3} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Real Chart Implementation (Bar Chart using Views) */}
        <View style={styles.chartContainer}>
          <Text style={styles.chartTitle}>Analytics Trend</Text>
          <View style={styles.chartWrapper}>
            {chartData.map((val, idx) => {
              const heightPct = (val / maxChartVal) * 100;
              return (
                <View key={idx} style={styles.barContainer}>
                  <View style={[styles.barFill, { height: `${heightPct}%` }]} />
                  <Text style={styles.barLabel}>{['M','T','W','T','F','S','S'][idx]}</Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* Quick Stats (Preserved Weekly/Monthly cards) */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <View
              style={[
                styles.statIconContainer,
                { backgroundColor: '#3B82F615' },
              ]}>
              <Calendar size={18} color="#3B82F6" />
            </View>
            <Text style={styles.statCardLabel}>Weekly Net</Text>
            <Text style={styles.statCardValue}>₹{quickStats.week.toFixed(0)}</Text>
            <View style={styles.trendBadge}>
              <TrendingUp size={10} color="#10B981" />
              <Text style={styles.trendText}>+8%</Text>
            </View>
          </View>

          <View style={styles.statCard}>
            <View
              style={[
                styles.statIconContainer,
                { backgroundColor: '#10B98115' },
              ]}>
              <PieChart size={18} color="#10B981" />
            </View>
            <Text style={styles.statCardLabel}>Monthly Net</Text>
            <Text style={styles.statCardValue}>₹{quickStats.month.toFixed(0)}</Text>
            <View style={styles.trendBadge}>
              <TrendingUp size={10} color="#10B981" />
              <Text style={styles.trendText}>+12%</Text>
            </View>
          </View>
        </View>

        {/* Transactions (Preserved & Populated) */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          <TouchableOpacity>
            <Text style={styles.seeAllText}>See All</Text>
          </TouchableOpacity>
        </View>

        {transactions.length > 0 ? (
          transactions.map((item: any) => (
            <View key={item.id} style={styles.transactionItem}>
              <View
                style={[
                  styles.itemIcon,
                  {
                    backgroundColor:
                      item.type === 'credit' ? '#D1FAE5' : '#FEE2E2',
                  },
                ]}>
                {item.type === 'credit' ? (
                  <ArrowDownLeft size={20} color="#10B981" strokeWidth={2.5} />
                ) : (
                  <CreditCard size={20} color="#EF4444" strokeWidth={2.5} />
                )}
              </View>
              <View style={styles.itemInfo}>
                <Text style={styles.itemTitle}>
                  {item.title || item.description}
                </Text>
                <Text style={styles.itemSubtitle}>
                  {item.subtitle || `Booking #${item.bookingId}`}
                </Text>
              </View>
              <View style={styles.itemRight}>
                <Text
                  style={[
                    styles.itemAmount,
                    { color: item.type === 'credit' ? '#10B981' : '#111827' },
                  ]}>
                  {item.type === 'credit' ? '+' : '-'} ₹{Math.abs(item.amount).toFixed(2)}
                </Text>
                <Text style={styles.itemTime}>
                  {new Date(item.createdAt).toLocaleTimeString('en-IN', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </Text>
              </View>
            </View>
          ))
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No transactions found for {filter}.</Text>
          </View>
        )}

        <View style={{ height: Platform.OS === 'ios' ? 100 : 90 }} />
      </ScrollView>
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
    justifyContent: 'space-between',
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
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: 'black',
  },
  payoutBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#EAB308',
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterContainer: {
    backgroundColor: '#fff',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  filterBtn: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    marginRight: 12,
  },
  filterBtnActive: {
    backgroundColor: '#111827',
  },
  filterText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#4B5563',
  },
  filterTextActive: {
    color: '#fff',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  balanceCard: {
    backgroundColor: 'black',
    borderRadius: 32,
    padding: 30,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 8,
  },
  balanceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  walletIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  balanceLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: 'rgba(255,255,255,0.6)',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  balanceAmount: {
    fontSize: 48,
    fontWeight: '900',
    color: 'white',
    marginBottom: 10,
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  breakdownText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.8)',
  },
  breakdownRed: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FCA5A5',
  },
  balanceFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  statItem: {
    marginRight: 16,
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.4)',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '900',
    color: 'white',
  },
  withdrawBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EAB308',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 16,
    marginLeft: 'auto',
  },
  withdrawText: {
    fontSize: 14,
    fontWeight: '900',
    color: 'black',
    marginRight: 6,
  },
  chartContainer: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#111827',
    marginBottom: 20,
  },
  chartWrapper: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 120,
    paddingHorizontal: 10,
  },
  barContainer: {
    alignItems: 'center',
    justifyContent: 'flex-end',
    flex: 1,
    height: '100%',
  },
  barFill: {
    width: 24,
    backgroundColor: '#10B981',
    borderRadius: 8,
    minHeight: 4,
  },
  barLabel: {
    marginTop: 8,
    fontSize: 12,
    fontWeight: '700',
    color: '#9CA3AF',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  statCard: {
    width: '47%',
    backgroundColor: '#F9FAFB',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  statIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  statCardLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#9CA3AF',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  statCardValue: {
    fontSize: 20,
    fontWeight: '900',
    color: 'black',
    marginBottom: 10,
  },
  trendBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#D1FAE5',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  trendText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#10B981',
    marginLeft: 4,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: 'black',
  },
  seeAllText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#3B82F6',
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 24,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#F9FAFB',
  },
  itemIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  itemInfo: {
    flex: 1,
  },
  itemTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1F2937',
  },
  itemSubtitle: {
    fontSize: 11,
    fontWeight: '600',
    color: '#9CA3AF',
    textTransform: 'uppercase',
    marginTop: 2,
  },
  itemRight: {
    alignItems: 'flex-end',
  },
  itemAmount: {
    fontSize: 16,
    fontWeight: '900',
  },
  itemTime: {
    fontSize: 10,
    fontWeight: '700',
    color: '#9CA3AF',
    marginTop: 2,
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#9CA3AF',
  },
});

export default EarningsScreen;
