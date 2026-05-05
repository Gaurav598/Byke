import React from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  ScrollView, 
  Alert, 
  SafeAreaView, 
  StyleSheet,
  Dimensions,
  Platform
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../store';
import { logout } from '../store/slices/authSlice';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { 
  User, CreditCard, Bell, HelpCircle, 
  LogOut, ChevronRight, Settings, FileText, 
  Bike, ShieldCheck, Star, Clock, MapPin
} from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';

const { width } = Dimensions.get('window');

const ProfileScreen = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigation = useNavigation<any>();
  const { user: rider } = useSelector((state: RootState) => state.auth);

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout from Captain account?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            await AsyncStorage.clear();
            dispatch(logout());
          },
        },
      ]
    );
  };

  const menuItems = [
    { icon: Bike, label: 'Vehicle Details', color: '#EAB308', screen: 'Documents' },
    { icon: FileText, label: 'KYC Documents', color: '#3B82F6', screen: 'Documents' },
    { icon: CreditCard, label: 'Earnings & Payouts', color: '#10B981', screen: 'Earnings' },
    { icon: Bell, label: 'Notifications', color: '#F59E0B', screen: 'Notifications' },
    { icon: HelpCircle, label: 'Help & Support', color: '#8B5CF6', screen: 'Profile' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Profile Header */}
        <View style={styles.header}>
          <View style={styles.avatarWrapper}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {rider?.fullName?.charAt(0).toUpperCase() || 'C'}
              </Text>
            </View>
            <View style={styles.verifiedBadge}>
              <ShieldCheck size={16} color="black" />
            </View>
          </View>
          
          <Text style={styles.name}>{rider?.fullName || 'BYKE Captain'}</Text>
          <View style={styles.phoneBadge}>
            <Text style={styles.phoneText}>{rider?.mobileNumber || '+91 00000 00000'}</Text>
            <View style={styles.activeDot} />
          </View>
        </View>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Star size={18} color="#EAB308" fill="#EAB308" />
            <Text style={styles.statValue}>4.8</Text>
            <Text style={styles.statLabel}>Rating</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Clock size={18} color="#3B82F6" />
            <Text style={styles.statValue}>142</Text>
            <Text style={styles.statLabel}>Trips</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <MapPin size={18} color="#10B981" />
            <Text style={styles.statValue}>2.4k</Text>
            <Text style={styles.statLabel}>Kms</Text>
          </View>
        </View>

        {/* Menu Section */}
        <View style={styles.menuSection}>
          <Text style={styles.sectionTitle}>Account Settings</Text>
          
          {menuItems.map((item, index) => (
            <TouchableOpacity
              key={index}
              activeOpacity={0.7}
              onPress={() => navigation.navigate(item.screen)}
              style={styles.menuItem}
            >
              <View style={[styles.menuIcon, { backgroundColor: `${item.color}15` }]}>
                <item.icon size={20} color={item.color} strokeWidth={2.5} />
              </View>
              <Text style={styles.menuLabel}>{item.label}</Text>
              <ChevronRight size={18} color="#D1D5DB" strokeWidth={3} />
            </TouchableOpacity>
          ))}

          <TouchableOpacity
            activeOpacity={0.7}
            onPress={handleLogout}
            style={styles.logoutBtn}
          >
            <View style={styles.logoutIcon}>
              <LogOut size={20} color="#EF4444" strokeWidth={2.5} />
            </View>
            <Text style={styles.logoutText}>Sign Out</Text>
            <ChevronRight size={18} color="#FCA5A5" strokeWidth={3} />
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={styles.versionText}>BYKE CAPTAIN v1.0.1</Text>
          <Text style={styles.copyrightText}>© 2024 BYKE Platform</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
  },
  header: {
    alignItems: 'center',
    paddingTop: 40,
    paddingBottom: 30,
    backgroundColor: '#F9FAFB',
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
  },
  avatarWrapper: {
    position: 'relative',
    marginBottom: 20,
  },
  avatar: {
    width: 100,
    height: 100,
    backgroundColor: 'black',
    borderRadius: 35,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 15,
    elevation: 8,
  },
  avatarText: {
    fontSize: 40,
    fontWeight: '900',
    color: '#EAB308',
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: -5,
    right: -5,
    backgroundColor: '#EAB308',
    padding: 6,
    borderRadius: 12,
    borderWidth: 3,
    borderColor: '#fff',
  },
  name: {
    fontSize: 26,
    fontWeight: '900',
    color: 'black',
  },
  phoneBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  phoneText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#9CA3AF',
    letterSpacing: 0.5,
    marginRight: 6,
  },
  activeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 30,
    marginTop: -25,
    marginBottom: 30,
  },
  statItem: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 20,
    alignItems: 'center',
    width: (width - 80) / 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 4,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '900',
    color: 'black',
    marginTop: 5,
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#9CA3AF',
    textTransform: 'uppercase',
  },
  statDivider: {
    width: 1,
    height: '100%',
    backgroundColor: 'transparent',
  },
  menuSection: {
    paddingHorizontal: 20,
    marginBottom: 40,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '900',
    color: '#9CA3AF',
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginBottom: 20,
    marginLeft: 5,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 24,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#F9FAFB',
  },
  menuIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 15,
  },
  menuLabel: {
    flex: 1,
    fontSize: 16,
    fontWeight: '800',
    color: '#374151',
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    padding: 16,
    borderRadius: 24,
    marginTop: 20,
    borderWidth: 1,
    borderColor: '#FEE2E2',
  },
  logoutIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 15,
  },
  logoutText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '800',
    color: '#EF4444',
  },
  footer: {
    alignItems: 'center',
    paddingBottom: 40,
  },
  versionText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#D1D5DB',
    letterSpacing: 3,
  },
  copyrightText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#E5E7EB',
    marginTop: 5,
  },
});

export default ProfileScreen;
