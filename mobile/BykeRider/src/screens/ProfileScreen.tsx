import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
  SafeAreaView,
  StyleSheet,
  Modal,
  TextInput,
  Linking,
} from 'react-native';
import {useSelector, useDispatch} from 'react-redux';
import {RootState, AppDispatch} from '../store';
import {logout} from '../store/slices/authSlice';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  CreditCard,
  Bell,
  HelpCircle,
  LogOut,
  ChevronRight,
  FileText,
  Bike,
  ShieldCheck,
  Edit3,
  CheckCircle2,
} from 'lucide-react-native';
import {useNavigation} from '@react-navigation/native';
import api from '../config/api';

const ProfileScreen = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigation = useNavigation<any>();
  const {user} = useSelector((state: RootState) => state.auth);

  const [profile, setProfile] = useState<any>(null);
  const [editVisible, setEditVisible] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    fullName: '',
    vehicleType: '',
    vehicleModel: '',
    vehicleRegistrationNumber: '',
  });

  const loadProfile = async () => {
    try {
      const response = await api.get('/rider/profile');
      const rider = response.data;
      setProfile(rider);
      setForm({
        fullName: rider?.user?.fullName || user?.fullName || '',
        vehicleType: rider?.vehicleType || '',
        vehicleModel: rider?.vehicleModel || '',
        vehicleRegistrationNumber: rider?.vehicleRegistrationNumber || '',
      });
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout from Captain account?', [
      {text: 'Cancel', style: 'cancel'},
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          await AsyncStorage.clear();
          dispatch(logout());
        },
      },
    ]);
  };

  const handleSaveProfile = async () => {
    if (!form.fullName.trim()) {
      Alert.alert('Error', 'Name is required');
      return;
    }
    setSaving(true);
    try {
      await api.patch('/rider/profile', {
        fullName: form.fullName,
        vehicleType: form.vehicleType,
        vehicleModel: form.vehicleModel,
        vehicleRegistrationNumber: form.vehicleRegistrationNumber,
      });
      setEditVisible(false);
      await loadProfile();
      Alert.alert('Success', 'Profile updated successfully');
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const menuItems = [
    {
      icon: Bike,
      label: 'Vehicle & KYC Documents',
      color: '#EAB308',
      screen: 'Documents',
    },
    {
      icon: CreditCard,
      label: 'Earnings & Payouts',
      color: '#10B981',
      screen: 'Earnings',
    },
    {
      icon: Bell,
      label: 'Notifications',
      color: '#F59E0B',
      screen: 'Notifications',
    },
    {
      icon: HelpCircle,
      label: 'Help & Support',
      color: '#8B5CF6',
      screen: null,
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={styles.avatarWrapper}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {(profile?.user?.fullName || user?.fullName || 'C').charAt(0).toUpperCase()}
              </Text>
            </View>
            <View style={styles.verifiedBadge}>
              <ShieldCheck size={16} color="black" />
            </View>
          </View>

          <Text style={styles.name}>{profile?.user?.fullName || user?.fullName || 'BYKE Captain'}</Text>
          <Text style={styles.phoneText}>{profile?.user?.mobileNumber || user?.mobileNumber || ''}</Text>

          <View style={styles.vehicleCard}>
            <Text style={styles.vehicleTitle}>Vehicle Details</Text>
            <Text style={styles.vehicleLine}>{profile?.vehicleType || 'Type not set'}</Text>
            <Text style={styles.vehicleLine}>{profile?.vehicleModel || 'Model not set'}</Text>
            <Text style={styles.vehicleLine}>{profile?.vehicleRegistrationNumber || 'Registration not set'}</Text>
          </View>

          <TouchableOpacity style={styles.editBtn} onPress={() => setEditVisible(true)}>
            <Edit3 size={16} color="white" />
            <Text style={styles.editBtnText}>Edit Profile</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.menuSection}>
          <Text style={styles.sectionTitle}>Account Settings</Text>

          {menuItems.map((item, index) => (
            <TouchableOpacity
              key={index}
              activeOpacity={0.7}
              onPress={async () => {
                if (item.screen) {
                  navigation.navigate(item.screen);
                  return;
                }
                const mail = 'mailto:support@byke.app?subject=BYKE Rider Support';
                const canOpen = await Linking.canOpenURL(mail);
                if (canOpen) {
                  await Linking.openURL(mail);
                } else {
                  Alert.alert('Support', 'Email support@byke.app');
                }
              }}
              style={styles.menuItem}>
              <View style={[styles.menuIcon, {backgroundColor: `${item.color}15`}]}>
                <item.icon size={20} color={item.color} strokeWidth={2.5} />
              </View>
              <Text style={styles.menuLabel}>{item.label}</Text>
              <ChevronRight size={18} color="#D1D5DB" strokeWidth={3} />
            </TouchableOpacity>
          ))}

          <TouchableOpacity activeOpacity={0.7} onPress={handleLogout} style={styles.logoutBtn}>
            <View style={styles.logoutIcon}>
              <LogOut size={20} color="#EF4444" strokeWidth={2.5} />
            </View>
            <Text style={styles.logoutText}>Sign Out</Text>
            <ChevronRight size={18} color="#FCA5A5" strokeWidth={3} />
          </TouchableOpacity>
        </View>
      </ScrollView>

      <Modal visible={editVisible} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Edit Rider Profile</Text>
            <TextInput
              style={styles.input}
              value={form.fullName}
              onChangeText={fullName => setForm(prev => ({...prev, fullName}))}
              placeholder="Full name"
              placeholderTextColor="#9CA3AF"
            />
            <TextInput
              style={styles.input}
              value={form.vehicleType}
              onChangeText={vehicleType => setForm(prev => ({...prev, vehicleType}))}
              placeholder="Vehicle type"
              placeholderTextColor="#9CA3AF"
            />
            <TextInput
              style={styles.input}
              value={form.vehicleModel}
              onChangeText={vehicleModel => setForm(prev => ({...prev, vehicleModel}))}
              placeholder="Vehicle model"
              placeholderTextColor="#9CA3AF"
            />
            <TextInput
              style={styles.input}
              value={form.vehicleRegistrationNumber}
              onChangeText={vehicleRegistrationNumber =>
                setForm(prev => ({...prev, vehicleRegistrationNumber}))
              }
              placeholder="Registration number"
              autoCapitalize="characters"
              placeholderTextColor="#9CA3AF"
            />
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setEditVisible(false)}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={handleSaveProfile}>
                {saving ? <CheckCircle2 size={16} color="white" /> : <Text style={styles.saveBtnText}>Save</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#fff'},
  content: {flex: 1},
  header: {
    alignItems: 'center',
    paddingTop: 32,
    paddingBottom: 24,
    backgroundColor: '#F9FAFB',
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  avatarWrapper: {position: 'relative', marginBottom: 14},
  avatar: {
    width: 90,
    height: 90,
    borderRadius: 30,
    backgroundColor: '#111827',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {fontSize: 36, fontWeight: '900', color: '#EAB308'},
  verifiedBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    backgroundColor: '#EAB308',
    padding: 5,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#fff',
  },
  name: {fontSize: 24, fontWeight: '900', color: '#111827'},
  phoneText: {fontSize: 12, fontWeight: '700', color: '#6B7280', marginTop: 5},
  vehicleCard: {
    marginTop: 12,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    minWidth: '78%',
  },
  vehicleTitle: {fontSize: 11, fontWeight: '900', color: '#9CA3AF', textTransform: 'uppercase'},
  vehicleLine: {fontSize: 13, fontWeight: '700', color: '#111827', marginTop: 2},
  editBtn: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#111827',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  editBtnText: {marginLeft: 6, color: '#fff', fontWeight: '800'},
  menuSection: {paddingHorizontal: 18, marginTop: 20, marginBottom: 34},
  sectionTitle: {fontSize: 12, fontWeight: '900', color: '#9CA3AF', marginBottom: 14},
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 14,
    borderRadius: 18,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  menuIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  menuLabel: {flex: 1, fontSize: 15, fontWeight: '800', color: '#374151'},
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    padding: 14,
    borderRadius: 18,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#FEE2E2',
  },
  logoutIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  logoutText: {flex: 1, fontSize: 15, fontWeight: '800', color: '#EF4444'},
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  modalCard: {backgroundColor: 'white', borderRadius: 14, padding: 16},
  modalTitle: {fontSize: 18, fontWeight: '900', color: '#111827', marginBottom: 10},
  input: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 11,
    marginTop: 10,
    color: '#111827',
    fontWeight: '700',
  },
  modalActions: {flexDirection: 'row', justifyContent: 'flex-end', marginTop: 14},
  cancelBtn: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#F3F4F6',
    marginRight: 8,
  },
  cancelBtnText: {fontWeight: '800', color: '#111827'},
  saveBtn: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#111827',
    minWidth: 68,
    alignItems: 'center',
  },
  saveBtnText: {fontWeight: '800', color: '#fff'},
});

export default ProfileScreen;
