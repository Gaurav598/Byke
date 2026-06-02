import React, {useState} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import {useDispatch} from 'react-redux';
import {rateBooking} from '../store/slices/bookingSlice';
import {AppDispatch} from '../store';

const RatingScreen = ({route, navigation}: any) => {
  const {bookingId} = route.params;
  const dispatch = useDispatch<AppDispatch>();

  const [rating, setRating] = useState(5);
  const [review, setReview] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmitRating = async () => {
    if (rating === 0) {
      Alert.alert('Error', 'Please select a rating');
      return;
    }

    setLoading(true);
    try {
      await dispatch(rateBooking({bookingId, rating, review})).unwrap();
      Alert.alert('Success', 'Thank you for your feedback!', [
        {text: 'OK', onPress: () => navigation.navigate('Home')},
      ]);
    } catch (error: any) {
      Alert.alert('Error', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="flex-1 bg-white p-6">
      <Text className="text-2xl font-bold text-gray-900 mb-2">
        Rate Your Ride
      </Text>
      <Text className="text-gray-600 mb-8">
        How was your experience with the rider?
      </Text>

      <View className="items-center mb-8">
        <View className="flex-row space-x-4">
          {[1, 2, 3, 4, 5].map(star => (
            <TouchableOpacity key={star} onPress={() => setRating(star)}>
              <Text className="text-5xl">{star <= rating ? '⭐' : '☆'}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <Text className="text-gray-600 mt-4 text-lg">
          {rating === 5 && 'Excellent!'}
          {rating === 4 && 'Very Good'}
          {rating === 3 && 'Good'}
          {rating === 2 && 'Fair'}
          {rating === 1 && 'Poor'}
        </Text>
      </View>

      <Text className="text-gray-900 font-semibold mb-2">
        Share your experience (optional)
      </Text>
      <TextInput
        className="border border-gray-300 rounded-lg px-4 py-3 mb-6 h-32"
        placeholder="Tell us more about your ride..."
        multiline
        numberOfLines={5}
        textAlignVertical="top"
        value={review}
        onChangeText={setReview}
      />

      <TouchableOpacity
        className="bg-blue-600 rounded-lg py-4 items-center"
        onPress={handleSubmitRating}
        disabled={loading}>
        {loading ? (
          <ActivityIndicator color="white" />
        ) : (
          <Text className="text-white font-semibold text-base">
            Submit Rating
          </Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        className="mt-4 py-3 items-center"
        onPress={() => navigation.navigate('Home')}>
        <Text className="text-gray-600">Skip for now</Text>
      </TouchableOpacity>
    </View>
  );
};

export default RatingScreen;
