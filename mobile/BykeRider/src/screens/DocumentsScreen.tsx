import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  ScrollView, 
  SafeAreaView, 
  Alert, 
  ActivityIndicator,
  StyleSheet,
  Dimensions,
  Platform
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import api from '../config/api';
import { 
  ArrowLeft, FileText, CheckCircle2, 
  AlertCircle, Upload, ChevronRight, 
  Shield, Clock, Info, Camera,
  Briefcase, Landmark, CreditCard
} from 'lucide-react-native';

const { width } = Dimensions.get('window');

const DocumentsScreen = () => {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(true);
  const [riderProfile, setRiderProfile] = useState<any>(null);
  const [docs, setDocs] = useState<any[]>([]);

  useEffect(() => {
    fetchRiderProfile();
  }, []);

  const fetchRiderProfile = async () => {
    try {
      setLoading(true);
      const response = await api.get('/rider/profile');
      const rider = response.data;
      setRiderProfile(rider);
      
      // Map rider documents to UI state
      const documentsList = [
        { 
          id: 'dl', 
          label: 'Driving License', 
          status: rider.drivingLicenseUrl ? 'verified' : 'missing', 
          icon: Briefcase, 
          color: '#3B82F6',
          url: rider.drivingLicenseUrl
        },
        { 
          id: 'rc', 
          label: 'Vehicle RC', 
          status: rider.vehicleRcUrl ? 'verified' : 'missing', 
          icon: FileText, 
          color: '#EAB308',
          url: rider.vehicleRcUrl
        },
        { 
          id: 'aadhar', 
          label: 'Aadhaar Card', 
          status: rider.aadharUrl ? 'verified' : 'missing', 
          icon: Landmark, 
          color: '#10B981',
          url: rider.aadharUrl
        },
        { 
          id: 'pan', 
          label: 'PAN Card', 
          status: rider.panUrl ? 'verified' : 'missing', 
          icon: CreditCard, 
          color: '#8B5CF6',
          url: rider.panUrl
        },
        { 
          id: 'ins', 
          label: 'Insurance Policy', 
          status: rider.insuranceUrl ? 'verified' : 'missing', 
          icon: Shield, 
          color: '#EF4444',
          url: rider.insuranceUrl
        },
      ];
      setDocs(documentsList);
    } catch (error) {
      console.log('Error fetching rider profile:', error);
      Alert.alert('Error', 'Failed to load documents');
    } finally {
      setLoading(false);
    }
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'verified': 
        return { 
          bg: '#D1FAE5', 
          text: '#10B981', 
          icon: CheckCircle2, 
          label: 'Verified' 
        };
      case 'pending': 
        return { 
          bg: '#FEF3C7', 
          text: '#F59E0B', 
          icon: Clock, 
          label: 'In Review' 
        };
      case 'missing': 
        return { 
          bg: '#FEE2E2', 
          text: '#EF4444', 
          icon: AlertCircle, 
          label: 'Missing' 
        };
      default: 
        return { 
          bg: '#F3F4F6', 
          text: '#6B7280', 
          icon: Info, 
          label: status 
        };
    }
  };

  const handleUpload = (label: string) => {
    Alert.alert(
      'Upload Document',
      `Choose source for your ${label}`,
      [
        { text: 'Camera', onPress: () => console.log('Camera') },
        { text: 'Gallery', onPress: () => console.log('Gallery') },
        { text: 'Cancel', style: 'cancel' }
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#000" />
        <Text style={styles.loadingText}>Loading documents...</Text>
      </View>
    );
  }

  const verifiedCount = docs.filter(d => d.status === 'verified').length;
  const totalDocs = docs.length;
  const verificationScore = Math.round((verifiedCount / totalDocs) * 100);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
        >
          <ArrowLeft size={24} color="black" strokeWidth={2.5} />
        </TouchableOpacity>
        <View>
          <Text style={styles.headerTitle}>Compliance</Text>
          <Text style={styles.headerSubtitle}>Legal & Verification</Text>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Progress Card */}
        <View style={styles.progressCard}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressLabel}>Verification Score</Text>
            <Text style={styles.progressValue}>{verificationScore}%</Text>
          </View>
          <View style={styles.progressBarBg}>
            <View style={[styles.progressBarFill, { width: `${verificationScore}%` }]} />
          </View>
          <Text style={styles.progressHint}>
            {verificationScore === 100 
              ? 'All documents verified! You can accept all ride types.' 
              : `Upload ${totalDocs - verifiedCount} more document${totalDocs - verifiedCount > 1 ? 's' : ''} to reach 100%.`}
          </Text>
        </View>

        <Text style={styles.sectionTitle}>Required Documents</Text>

        {docs.map((doc) => {
          const status = getStatusStyle(doc.status);
          return (
            <TouchableOpacity
              key={doc.id}
              activeOpacity={0.7}
              onPress={() => doc.status !== 'verified' && handleUpload(doc.label)}
              style={styles.docCard}
            >
              <View style={[styles.docIcon, { backgroundColor: `${doc.color}15` }]}>
                <doc.icon size={22} color={doc.color} strokeWidth={2.5} />
              </View>
              
              <View style={styles.docInfo}>
                <Text style={styles.docLabel}>{doc.label}</Text>
                <View style={[styles.statusBadge, { backgroundColor: status.bg }]}>
                  <status.icon size={10} color={status.text} strokeWidth={3} />
                  <Text style={[styles.statusText, { color: status.text }]}>
                    {status.label}
                  </Text>
                </View>
              </View>

              {doc.status !== 'verified' ? (
                <View style={styles.uploadBtn}>
                  <Camera size={18} color="white" strokeWidth={2.5} />
                </View>
              ) : (
                <View style={styles.verifiedCheck}>
                  <CheckCircle2 size={20} color="#10B981" strokeWidth={2.5} />
                </View>
              )}
            </TouchableOpacity>
          );
        })}

        <View style={styles.helpBox}>
          <View style={styles.helpIcon}>
            <Info size={20} color="#3B82F6" />
          </View>
          <View style={styles.helpTextContainer}>
            <Text style={styles.helpTitle}>Verification Process</Text>
            <Text style={styles.helpSubtitle}>
              Our team reviews documents within 24 hours. Make sure photos are clear and details are legible.
            </Text>
          </View>
        </View>
        
        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
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
  content: {
    flex: 1,
    padding: 20,
  },
  progressCard: {
    backgroundColor: 'black',
    borderRadius: 32,
    padding: 24,
    marginBottom: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 8,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  progressLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: 'rgba(255,255,255,0.6)',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  progressValue: {
    fontSize: 24,
    fontWeight: '900',
    color: '#EAB308',
  },
  progressBarBg: {
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 4,
    marginBottom: 15,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#EAB308',
    borderRadius: 4,
  },
  progressHint: {
    fontSize: 11,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.5)',
    lineHeight: 16,
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
  docCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 24,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#F9FAFB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 10,
    elevation: 2,
  },
  docIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 15,
  },
  docInfo: {
    flex: 1,
  },
  docLabel: {
    fontSize: 16,
    fontWeight: '800',
    color: '#374151',
    marginBottom: 4,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 9,
    fontWeight: '900',
    textTransform: 'uppercase',
    marginLeft: 4,
    letterSpacing: 0.5,
  },
  uploadBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'black',
    alignItems: 'center',
    justifyContent: 'center',
  },
  verifiedCheck: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  helpBox: {
    flexDirection: 'row',
    backgroundColor: '#EFF6FF',
    padding: 20,
    borderRadius: 24,
    marginTop: 20,
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  helpIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 15,
  },
  helpTextContainer: {
    flex: 1,
  },
  helpTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: '#1E40AF',
    marginBottom: 4,
  },
  helpSubtitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#3B82F6',
    lineHeight: 18,
  },
});

export default DocumentsScreen;
