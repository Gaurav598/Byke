import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, ScrollView, TextInput, KeyboardAvoidingView, Platform, SafeAreaView, ActivityIndicator } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { ArrowLeft, Send, Phone, User, MoreVertical } from 'lucide-react-native';

const ChatScreen = () => {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const { riderName, rideId } = route.params || { riderName: 'Captain', rideId: '123' };
  
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([
    { id: '1', text: 'Hello! I have reached your location.', sender: 'rider', time: '10:00 AM' },
    { id: '2', text: 'Okay, I am coming down in 2 minutes.', sender: 'user', time: '10:01 AM' },
  ]);

  const scrollViewRef = useRef<any>();

  const sendMessage = () => {
    if (message.trim().length === 0) return;
    
    const newMessage = {
      id: Date.now().toString(),
      text: message,
      sender: 'user',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    
    setMessages([...messages, newMessage]);
    setMessage('');
    
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* Header */}
      <View className="px-6 py-4 flex-row items-center justify-between border-b border-gray-100">
        <View className="flex-row items-center">
          <TouchableOpacity onPress={() => navigation.goBack()} className="mr-4">
            <ArrowLeft size={24} color="black" />
          </TouchableOpacity>
          <View className="relative">
            <View className="w-10 h-10 bg-gray-100 rounded-full items-center justify-center">
              <User size={24} color="#9CA3AF" />
            </View>
            <View className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
          </View>
          <View className="ml-3">
            <Text className="text-base font-black text-black">{riderName}</Text>
            <Text className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Online</Text>
          </View>
        </View>
        <TouchableOpacity className="bg-gray-50 p-2.5 rounded-xl border border-gray-100">
          <Phone size={20} color="black" />
        </TouchableOpacity>
      </View>

      {/* Messages */}
      <ScrollView 
        ref={scrollViewRef}
        className="flex-1 px-6 pt-6"
        showsVerticalScrollIndicator={false}
        onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
      >
        {messages.map((msg) => (
          <View 
            key={msg.id}
            className={`mb-6 max-w-[80%] ${msg.sender === 'user' ? 'self-end items-end' : 'self-start items-start'}`}
          >
            <View className={`px-5 py-4 rounded-[24px] ${
              msg.sender === 'user' ? 'bg-yellow-400 rounded-tr-none' : 'bg-gray-100 rounded-tl-none'
            }`}>
              <Text className="text-black text-sm font-bold leading-5">{msg.text}</Text>
            </View>
            <Text className="text-[10px] font-bold text-gray-400 mt-2 uppercase tracking-tighter">{msg.time}</Text>
          </View>
        ))}
      </ScrollView>

      {/* Input */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <View className="p-6 bg-white border-t border-gray-100 flex-row items-center">
          <View className="flex-1 flex-row items-center bg-gray-50 rounded-[32px] px-6 py-2 border border-gray-100">
            <TextInput
              className="flex-1 py-3 text-black font-bold text-base"
              placeholder="Message your Captain..."
              placeholderTextColor="#9CA3AF"
              value={message}
              onChangeText={setMessage}
              multiline
            />
          </View>
          <TouchableOpacity 
            onPress={sendMessage}
            className="ml-4 bg-black w-14 h-14 rounded-full items-center justify-center shadow-lg shadow-black/20"
          >
            <Send size={20} color="white" strokeWidth={2.5} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default ChatScreen;
