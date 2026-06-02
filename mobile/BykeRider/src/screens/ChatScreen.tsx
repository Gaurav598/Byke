import React, {useEffect, useRef, useState} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import {useRoute, useNavigation} from '@react-navigation/native';
import {ArrowLeft, Send, Phone, User} from 'lucide-react-native';
import api from '../config/api';

type ChatMessage = {
  id: string;
  sender: 'rider' | 'user';
  text: string;
  time: string;
};

const ChatScreen = () => {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const {userName, bookingId} = route.params || {
    userName: 'User',
    bookingId: null,
  };

  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const scrollViewRef = useRef<any>();

  const mapMessage = (m: any): ChatMessage => ({
    id: String(m.id),
    sender: m.fromMe ? 'rider' : 'user',
    text: m.message || '',
    time: m.createdAt
      ? new Date(m.createdAt).toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        })
      : '',
  });

  const loadMessages = async (silent = false) => {
    if (!bookingId) {
      setLoading(false);
      return;
    }
    if (!silent) {
      setLoading(true);
    }
    try {
      const response = await api.get(`/chat/booking/${bookingId}`);
      const list = Array.isArray(response.data) ? response.data : [];
      setMessages(list.map(mapMessage));
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    loadMessages();
    const interval = setInterval(() => loadMessages(true), 4000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookingId]);

  const sendMessage = async () => {
    const text = message.trim();
    if (!text || !bookingId || sending) {
      return;
    }
    setSending(true);
    try {
      await api.post(`/chat/booking/${bookingId}`, {message: text});
      setMessage('');
      await loadMessages(true);
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({animated: true});
      }, 80);
    } finally {
      setSending(false);
    }
  };

  return (
    <SafeAreaView style={{flex: 1, backgroundColor: '#fff'}}>
      <View style={{paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#F3F4F6', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'}}>
        <View style={{flexDirection: 'row', alignItems: 'center'}}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={{marginRight: 12}}>
            <ArrowLeft size={24} color="black" />
          </TouchableOpacity>
          <View style={{width: 40, height: 40, borderRadius: 20, backgroundColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center'}}>
            <User size={20} color="#9CA3AF" />
          </View>
          <View style={{marginLeft: 10}}>
            <Text style={{fontSize: 16, fontWeight: '800', color: '#111'}}>{userName}</Text>
            <Text style={{fontSize: 10, fontWeight: '700', color: '#9CA3AF'}}>Ride Chat</Text>
          </View>
        </View>
        <TouchableOpacity style={{backgroundColor: '#F9FAFB', padding: 10, borderRadius: 10}}>
          <Phone size={20} color="black" />
        </TouchableOpacity>
      </View>

      <ScrollView
        ref={scrollViewRef}
        style={{flex: 1, paddingHorizontal: 18, paddingTop: 16}}
        onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({animated: true})}>
        {loading ? (
          <View style={{marginTop: 40, alignItems: 'center'}}>
            <ActivityIndicator size="small" color="#111" />
            <Text style={{marginTop: 8, color: '#9CA3AF', fontWeight: '700'}}>Loading chat...</Text>
          </View>
        ) : null}

        {!loading && messages.length === 0 ? (
          <View style={{marginTop: 40, alignItems: 'center'}}>
            <Text style={{color: '#9CA3AF', fontWeight: '700'}}>No messages yet</Text>
          </View>
        ) : null}

        {messages.map(msg => (
          <View
            key={msg.id}
            style={{
              marginBottom: 16,
              maxWidth: '80%',
              alignSelf: msg.sender === 'rider' ? 'flex-end' : 'flex-start',
            }}>
            <View
              style={{
                backgroundColor: msg.sender === 'rider' ? '#111827' : '#F3F4F6',
                borderRadius: 18,
                paddingHorizontal: 14,
                paddingVertical: 10,
              }}>
              <Text style={{color: msg.sender === 'rider' ? '#fff' : '#111', fontWeight: '700'}}>
                {msg.text}
              </Text>
            </View>
            <Text style={{fontSize: 10, color: '#9CA3AF', marginTop: 4}}>{msg.time}</Text>
          </View>
        ))}
      </ScrollView>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={{padding: 14, borderTopWidth: 1, borderTopColor: '#F3F4F6', flexDirection: 'row', alignItems: 'center'}}>
          <View style={{flex: 1, backgroundColor: '#F9FAFB', borderRadius: 24, paddingHorizontal: 14}}>
            <TextInput
              value={message}
              onChangeText={setMessage}
              placeholder="Type message..."
              placeholderTextColor="#9CA3AF"
              style={{paddingVertical: 11, color: '#111', fontWeight: '600'}}
            />
          </View>
          <TouchableOpacity
            onPress={sendMessage}
            disabled={sending}
            style={{marginLeft: 10, width: 46, height: 46, borderRadius: 23, backgroundColor: '#111', alignItems: 'center', justifyContent: 'center'}}>
            {sending ? <ActivityIndicator size="small" color="#fff" /> : <Send size={18} color="#fff" />}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default ChatScreen;
