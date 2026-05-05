import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import api from '../../config/api';

interface BookingState {
  currentBooking: any | null;
  bookings: any[];
  bids: any[];
  loading: boolean;
  error: string | null;
}

const initialState: BookingState = {
  currentBooking: null,
  bookings: [],
  bids: [],
  loading: false,
  error: null,
};

export const createBooking = createAsyncThunk(
  'booking/create',
  async (bookingData: any, { rejectWithValue }) => {
    try {
      const response = await api.post('/bookings', bookingData);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create booking');
    }
  }
);

export const fetchMyBookings = createAsyncThunk(
  'booking/fetchMy',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/bookings/user/my-bookings');
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch bookings');
    }
  }
);

export const fetchBookingBids = createAsyncThunk(
  'booking/fetchBids',
  async (bookingId: number, { rejectWithValue }) => {
    try {
      const response = await api.get(`/bids/booking/${bookingId}`);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch bids');
    }
  }
);

export const acceptBid = createAsyncThunk(
  'booking/acceptBid',
  async (bidId: number, { rejectWithValue }) => {
    try {
      const response = await api.post(`/bids/${bidId}/accept`);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to accept bid');
    }
  }
);

export const cancelBooking = createAsyncThunk(
  'booking/cancel',
  async ({ bookingId, reason }: { bookingId: number; reason: string }, { rejectWithValue }) => {
    try {
      const response = await api.post(`/bookings/${bookingId}/cancel`, null, {
        params: { reason, byUser: true },
      });
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to cancel booking');
    }
  }
);

export const rateBooking = createAsyncThunk(
  'booking/rate',
  async (
    { bookingId, rating, review }: { bookingId: number; rating: number; review?: string },
    { rejectWithValue }
  ) => {
    try {
      const response = await api.post(`/bookings/${bookingId}/rate`, null, {
        params: { userRating: rating, userReview: review },
      });
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to rate booking');
    }
  }
);

const bookingSlice = createSlice({
  name: 'booking',
  initialState,
  reducers: {
    setCurrentBooking: (state, action: PayloadAction<any>) => {
      state.currentBooking = action.payload;
    },
    addBid: (state, action: PayloadAction<any>) => {
      state.bids.push(action.payload);
    },
    clearBids: (state) => {
      state.bids = [];
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(createBooking.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createBooking.fulfilled, (state, action) => {
        state.loading = false;
        state.currentBooking = action.payload;
      })
      .addCase(createBooking.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(fetchMyBookings.fulfilled, (state, action) => {
        state.bookings = action.payload;
      })
      .addCase(fetchBookingBids.fulfilled, (state, action) => {
        state.bids = action.payload;
      })
      .addCase(acceptBid.fulfilled, (state) => {
        state.bids = [];
      })
      .addCase(cancelBooking.fulfilled, (state) => {
        state.currentBooking = null;
      });
  },
});

export const { setCurrentBooking, addBid, clearBids, clearError } = bookingSlice.actions;
export default bookingSlice.reducer;
