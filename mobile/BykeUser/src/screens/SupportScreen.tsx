import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  FlatList,
} from 'react-native';
import api from '../config/api';
import {ArrowLeft, MessageCircle, AlertCircle, PlusCircle, X} from 'lucide-react-native';

const CATEGORIES = [
  'RIDE_ISSUE',
  'PAYMENT_ISSUE',
  'USER_COMPLAINT',
  'TECHNICAL_ISSUE',
  'OTHER',
];

const SupportScreen = ({navigation}: any) => {
  const [loading, setLoading] = useState(true);
  const [tickets, setTickets] = useState<any[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  const fetchTickets = async () => {
    try {
      setLoading(true);
      const response = await api.get('/support/my-tickets');
      setTickets(response.data || []);
    } catch (e) {
      console.log('Error fetching tickets', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  const handleCreateTicket = async () => {
    if (!title || !description) {
      Alert.alert('Error', 'Please fill all fields');
      return;
    }
    try {
      setLoading(true);
      await api.post('/support/create', {category, title, description});
      Alert.alert('Success', 'Support ticket created successfully');
      setShowCreate(false);
      setTitle('');
      setDescription('');
      fetchTickets();
    } catch (e) {
      Alert.alert('Error', 'Failed to create ticket');
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'OPEN': return '#EF4444';
      case 'IN_PROGRESS': return '#F59E0B';
      case 'RESOLVED': return '#10B981';
      case 'CLOSED': return '#6B7280';
      default: return '#6B7280';
    }
  };

  const renderTicket = ({item}: any) => (
    <View style={styles.ticketCard}>
      <View style={styles.ticketHeader}>
        <Text style={styles.ticketId}>{item.ticketId}</Text>
        <View style={[styles.statusBadge, {backgroundColor: getStatusColor(item.status)}]}>
          <Text style={styles.statusText}>{item.status}</Text>
        </View>
      </View>
      <Text style={styles.ticketTitle}>{item.title}</Text>
      <Text style={styles.ticketCategory}>{item.category.replace('_', ' ')}</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <ArrowLeft size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Help & Support</Text>
        {!showCreate ? (
          <TouchableOpacity onPress={() => setShowCreate(true)} style={styles.newBtn}>
            <PlusCircle size={24} color="#10B981" />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity onPress={() => setShowCreate(false)} style={styles.newBtn}>
            <X size={24} color="#EF4444" />
          </TouchableOpacity>
        )}
      </View>

      {showCreate ? (
        <ScrollView style={styles.createContainer}>
          <Text style={styles.label}>Category</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
            {CATEGORIES.map(c => (
              <TouchableOpacity
                key={c}
                style={[styles.catBtn, category === c && styles.catBtnActive]}
                onPress={() => setCategory(c)}>
                <Text style={[styles.catText, category === c && styles.catTextActive]}>
                  {c.replace('_', ' ')}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <Text style={styles.label}>Issue Title</Text>
          <TextInput
            style={styles.input}
            placeholder="Brief description of the problem"
            value={title}
            onChangeText={setTitle}
          />

          <Text style={styles.label}>Details</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Please provide more details..."
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={4}
          />

          <TouchableOpacity style={styles.submitBtn} onPress={handleCreateTicket} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitBtnText}>Submit Issue</Text>}
          </TouchableOpacity>
        </ScrollView>
      ) : (
        <View style={styles.listContainer}>
          {loading ? (
            <ActivityIndicator size="large" color="#10B981" style={{marginTop: 40}} />
          ) : tickets.length === 0 ? (
            <View style={styles.emptyContainer}>
              <AlertCircle size={48} color="#D1D5DB" />
              <Text style={styles.emptyText}>No support tickets found.</Text>
            </View>
          ) : (
            <FlatList
              data={tickets}
              keyExtractor={item => item.id.toString()}
              renderItem={renderTicket}
              contentContainerStyle={{paddingBottom: 20}}
            />
          )}
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#F9FAFB'},
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  backBtn: {padding: 8, marginLeft: -8},
  newBtn: {padding: 8, marginRight: -8},
  headerTitle: {fontSize: 20, fontWeight: '900', color: '#000'},
  createContainer: {padding: 20},
  label: {fontSize: 14, fontWeight: '700', color: '#374151', marginBottom: 8, marginTop: 16},
  categoryScroll: {marginBottom: 16},
  catBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    marginRight: 8,
  },
  catBtnActive: {backgroundColor: '#111827'},
  catText: {fontSize: 12, fontWeight: '700', color: '#4B5563'},
  catTextActive: {color: '#fff'},
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#111827',
  },
  textArea: {height: 120, textAlignVertical: 'top'},
  submitBtn: {
    backgroundColor: '#10B981',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    marginTop: 32,
  },
  submitBtnText: {color: '#fff', fontSize: 16, fontWeight: '800'},
  listContainer: {flex: 1, padding: 20},
  ticketCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  ticketHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  ticketId: {fontSize: 12, fontWeight: '800', color: '#6B7280'},
  statusBadge: {paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8},
  statusText: {fontSize: 10, fontWeight: '800', color: '#fff'},
  ticketTitle: {fontSize: 16, fontWeight: '800', color: '#111827', marginBottom: 4},
  ticketCategory: {fontSize: 12, fontWeight: '600', color: '#9CA3AF'},
  emptyContainer: {alignItems: 'center', justifyContent: 'center', marginTop: 80},
  emptyText: {marginTop: 16, fontSize: 16, fontWeight: '600', color: '#9CA3AF'},
});

export default SupportScreen;
