import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, TextInput, Alert, SafeAreaView, ScrollView, Animated, ActivityIndicator } from 'react-native';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import api from '../config/api';
import { Star, MessageSquare, ArrowLeft, Send, CheckCircle2, Bike } from 'lucide-react-native';

const RatingScreen = ({ navigation, route }: any) => {
  const { bookingId } = route.params || {};
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [selectedReason, setSelectedReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const { currentBooking } = useSelector((state: RootState) => state.booking);
  
  const complaintReasons = [
    'Rude behavior',
    'Unsafe driving',
    'Vehicle condition',
    'Wrong route taken',
    'Late arrival',
    'Other'
  ];
  
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();
  }, []);

  const handleSubmitRating = async () => {
    if (rating === 0) {
      Alert.alert('Error', 'Please select a rating');
      return;
    }

    if (rating < 5 && !selectedReason && !comment) {
      Alert.alert('Feedback Required', 'Please select a reason or add a comment for ratings below 5 stars');
      return;
    }

    setSubmitting(true);
    try {
      const finalBookingId = bookingId || currentBooking?.id;
      if (finalBookingId) {
        const reviewText = rating < 5 && selectedReason 
          ? `${selectedReason}${comment ? ': ' + comment : ''}` 
          : comment;
        
        await api.post(`/bookings/${finalBookingId}/rate`, null, {
          params: {
            userRating: rating,
            userReview: reviewText || undefined
          }
        });
      }
      setSubmitted(true);
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to submit rating');
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <SafeAreaView className="flex-1 bg-white items-center justify-center px-10">
        <View className="bg-green-50 p-10 rounded-[50px] mb-8 border border-green-100">
          <CheckCircle2 size={64} color="#22C55E" strokeWidth={2.5} />
        </View>
        <Text className="text-3xl font-black text-black text-center mb-4">Feedback Sent!</Text>
        <Text className="text-gray-400 font-bold text-center leading-6 mb-12">
          Your feedback helps us keep the BYKE community safe and reliable.
        </Text>
        <TouchableOpacity
          onPress={() => navigation.navigate('UserHome')}
          className="bg-black w-full py-6 rounded-3xl items-center shadow-xl shadow-black/20"
        >
          <Text className="text-white font-black uppercase tracking-widest">Back to Home</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="px-6 pt-4 pb-10">
          <TouchableOpacity 
            onPress={() => navigation.goBack()}
            className="bg-gray-50 p-2.5 rounded-xl border border-gray-100 self-start mb-10"
          >
            <ArrowLeft size={24} color="black" strokeWidth={2.5} />
          </TouchableOpacity>

          <View className="items-center mb-12">
            <View className="bg-yellow-400 p-6 rounded-[40px] shadow-2xl shadow-yellow-400/30 mb-8">
              <Bike size={48} color="black" strokeWidth={2.5} />
            </View>
            <Text className="text-4xl font-black text-black text-center">Rate Your Trip</Text>
            <Text className="text-gray-400 font-bold mt-2">How was your journey with us?</Text>
          </View>

          <View className="bg-gray-50 rounded-[40px] p-8 border border-gray-100 mb-8">
            <Text className="text-xs font-black text-gray-400 uppercase tracking-[4px] text-center mb-8">Tap to Rate</Text>
            
            <View className="flex-row justify-center space-x-4 mb-10">
              {[1, 2, 3, 4, 5].map((s) => (
                <TouchableOpacity 
                  key={s} 
                  onPress={() => setRating(s)}
                  className="mx-1"
                >
                  <Star 
                    size={42} 
                    color={s <= rating ? '#EAB308' : '#D1D5DB'} 
                    fill={s <= rating ? '#EAB308' : 'transparent'} 
                    strokeWidth={2.5}
                  />
                </TouchableOpacity>
              ))}
            </View>

            {rating > 0 && rating < 5 && (
              <View className="mb-6">
                <Text className="text-xs font-black text-gray-400 uppercase tracking-[4px] mb-4">What went wrong?</Text>
                <View className="flex-row flex-wrap gap-2">
                  {complaintReasons.map((reason) => (
                    <TouchableOpacity
                      key={reason}
                      onPress={() => setSelectedReason(reason === selectedReason ? '' : reason)}
                      className={`px-4 py-3 rounded-2xl border-2 ${
                        selectedReason === reason 
                          ? 'bg-red-50 border-red-400' 
                          : 'bg-white border-gray-200'
                      }`}
                    >
                      <Text className={`text-sm font-bold ${
                        selectedReason === reason ? 'text-red-600' : 'text-gray-600'
                      }`}>
                        {reason}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            <View className="flex-row items-start bg-white border border-gray-100 rounded-[32px] px-6 py-5 shadow-sm">
              <MessageSquare size={20} color="#9CA3AF" className="mt-1" />
              <TextInput
                className="flex-1 ml-4 text-base font-bold text-black min-h-[100px]"
                placeholder={rating < 5 ? "Add more details (optional)" : "Share your experience (optional)"}
                placeholderTextColor="#D1D5DB"
                value={comment}
                onChangeText={setComment}
                multiline
                textAlignVertical="top"
              />
            </View>
          </View>

          <TouchableOpacity
            activeOpacity={0.9}
            onPress={handleSubmitRating}
            disabled={submitting}
            className={`rounded-3xl py-6 flex-row items-center justify-center shadow-xl ${
              submitting ? 'bg-gray-200' : 'bg-yellow-400 shadow-yellow-400/20'
            }`}
          >
            {submitting ? (
              <ActivityIndicator color="black" />
            ) : (
              <>
                <Text className="text-black text-lg font-black uppercase tracking-widest mr-3">Submit Review</Text>
                <Send size={20} color="black" strokeWidth={3} />
              </>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default RatingScreen;
