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
import api from '../../../config/api';

type ChatMessage = {
  id: string;
  sender: 'user' | 'rider';
  text: string;
  time: string;
};

const ChatScreen = () => {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const {riderName, rideId} = route.params || {
    riderName: 'Rider',
    rideId: null,
  };

  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const scrollViewRef = useRef<any>();

  const mapMessage = (m: any): ChatMessage => ({
    id: String(m.id),
    sender: m.fromMe ? 'user' : 'rider',
    text: m.message || '',
    time: m.createdAt
      ? new Date(m.createdAt).toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        })
      : '',
  });

  const loadMessages = async (silent = false) => {
    if (!rideId) {
      setLoading(false);
      return;
    }
    if (!silent) {
      setLoading(true);
    }
    try {
      const response = await api.get(`/chat/booking/${rideId}`);
      const list = Array.isArray(response.data) ? response.data : [];
      setMessages(list.map(mapMessage));
    } catch {
      // ignore transient failures
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
  }, [rideId]);

  const sendMessage = async () => {
    const text = message.trim();
    if (!text || !rideId || sending) {
      return;
    }
    setSending(true);
    try {
      await api.post(`/chat/booking/${rideId}`, {message: text});
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
    <SafeAreaView className="flex-1 bg-white">
      <View className="px-6 py-4 flex-row items-center justify-between border-b border-gray-100">
        <View className="flex-row items-center">
          <TouchableOpacity onPress={() => navigation.goBack()} className="mr-4">
            <ArrowLeft size={24} color="black" />
          </TouchableOpacity>
          <View className="relative">
            <View className="w-10 h-10 bg-gray-100 rounded-full items-center justify-center">
              <User size={24} color="#9CA3AF" />
            </View>
          </View>
          <View className="ml-3">
            <Text className="text-base font-black text-black">{riderName}</Text>
            <Text className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
              Ride Chat
            </Text>
          </View>
        </View>
        <TouchableOpacity className="bg-gray-50 p-2.5 rounded-xl border border-gray-100">
          <Phone size={20} color="black" />
        </TouchableOpacity>
      </View>

      <ScrollView
        ref={scrollViewRef}
        className="flex-1 px-6 pt-6"
        showsVerticalScrollIndicator={false}
        onContentSizeChange={() =>
          scrollViewRef.current?.scrollToEnd({animated: true})
        }>
        {loading ? (
          <View className="mt-12 items-center">
            <ActivityIndicator size="small" color="#111" />
            <Text className="text-xs font-bold text-gray-400 mt-3">Loading chat...</Text>
          </View>
        ) : null}

        {!loading && messages.length === 0 && (
          <View className="mt-8 items-center">
            <Text className="text-xs font-bold text-gray-400 uppercase tracking-widest">
              No messages yet
            </Text>
            <Text className="text-sm font-semibold text-gray-500 mt-2 text-center">
              Start chat with your rider
            </Text>
          </View>
        )}

        {messages.map(msg => (
          <View
            key={msg.id}
            className={`mb-6 max-w-[80%] ${
              msg.sender === 'user' ? 'self-end items-end' : 'self-start items-start'
            }`}>
            <View
              className={`px-5 py-4 rounded-[24px] ${
                msg.sender === 'user'
                  ? 'bg-yellow-400 rounded-tr-none'
                  : 'bg-gray-100 rounded-tl-none'
              }`}>
              <Text className="text-black text-sm font-bold leading-5">{msg.text}</Text>
            </View>
            <Text className="text-[10px] font-bold text-gray-400 mt-2 uppercase tracking-tighter">
              {msg.time}
            </Text>
          </View>
        ))}
      </ScrollView>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}>
        <View className="p-6 bg-white border-t border-gray-100 flex-row items-center">
          <View className="flex-1 flex-row items-center bg-gray-50 rounded-[32px] px-6 py-2 border border-gray-100">
            <TextInput
              className="flex-1 py-3 text-black font-bold text-base"
              placeholder="Message your rider..."
              placeholderTextColor="#9CA3AF"
              value={message}
              onChangeText={setMessage}
              multiline
            />
          </View>
          <TouchableOpacity
            onPress={sendMessage}
            disabled={sending}
            className="ml-4 bg-black w-14 h-14 rounded-full items-center justify-center shadow-lg shadow-black/20">
            {sending ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <Send size={20} color="white" strokeWidth={2.5} />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default ChatScreen;
