import React, { useEffect, useState } from 'react';
import { MapPin, RefreshCw, Clock, User, Navigation } from 'lucide-react';
import api from '../lib/api';

interface Booking {
  id: number;
  serviceType: string;
  status: string;
  pickupAddress: string;
  dropAddress: string;
  estimatedFare: number;
  estimatedDistance: number;
  createdAt: string;
  user?: { fullName: string; mobileNumber: string };
  rider?: { user: { fullName: string }; vehicleRegistrationNumber: string };
}

const statusColors: Record<string, string> = {
  IN_PROGRESS: 'bg-green-100 text-green-800',
  ACCEPTED: 'bg-blue-100 text-blue-800',
  BIDDING: 'bg-yellow-100 text-yellow-800',
  RIDER_ARRIVED: 'bg-purple-100 text-purple-800',
};

const LiveMonitoring = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  const fetchActiveBookings = async () => {
    try {
      const response = await api.get('/admin/bookings/active');
      setBookings(response.data);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Failed to fetch active bookings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActiveBookings();
    const interval = setInterval(fetchActiveBookings, 10000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-gray-600">Loading live bookings...</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Live Monitoring</h1>
          <p className="text-gray-500 mt-1 flex items-center">
            <Clock size={14} className="mr-1" />
            Last updated: {lastUpdated.toLocaleTimeString()} · Auto-refreshes every 10s
          </p>
        </div>
        <button
          onClick={fetchActiveBookings}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          <RefreshCw size={16} className="mr-2" />
          Refresh
        </button>
      </div>

      {/* Summary row */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
          <p className="text-3xl font-bold text-green-700">{bookings.filter(b => b.status === 'IN_PROGRESS').length}</p>
          <p className="text-green-600 text-sm mt-1">In Progress</p>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-center">
          <p className="text-3xl font-bold text-blue-700">{bookings.filter(b => b.status === 'ACCEPTED').length}</p>
          <p className="text-blue-600 text-sm mt-1">Accepted / En Route</p>
        </div>
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-center">
          <p className="text-3xl font-bold text-yellow-700">{bookings.filter(b => b.status === 'BIDDING').length}</p>
          <p className="text-yellow-600 text-sm mt-1">Bidding Open</p>
        </div>
      </div>

      {bookings.length === 0 ? (
        <div className="bg-white rounded-xl shadow p-12 text-center">
          <div className="text-6xl mb-4">🏍️</div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">No active rides</h2>
          <p className="text-gray-500">All rides are completed. Monitoring for new activity...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {bookings.map((booking) => (
            <div key={booking.id} className="bg-white rounded-xl shadow border border-gray-100 p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-mono text-gray-400">#{booking.id}</span>
                <span className={`text-xs font-semibold px-2 py-1 rounded-full ${statusColors[booking.status] || 'bg-gray-100 text-gray-600'}`}>
                  {booking.status.replace(/_/g, ' ')}
                </span>
              </div>
              <div className="flex items-center mb-1">
                <span className="text-xs font-semibold bg-blue-600 text-white px-2 py-0.5 rounded mr-2">{booking.serviceType}</span>
                <span className="text-gray-500 text-sm">₹{booking.estimatedFare?.toFixed(0)} · {booking.estimatedDistance?.toFixed(1)} km</span>
              </div>
              <div className="mt-3 space-y-1">
                <div className="flex items-start">
                  <MapPin size={14} className="text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-gray-700 truncate">{booking.pickupAddress}</p>
                </div>
                <div className="flex items-start">
                  <Navigation size={14} className="text-red-500 mr-2 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-gray-700 truncate">{booking.dropAddress}</p>
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-gray-100 flex justify-between">
                <div className="flex items-center">
                  <User size={13} className="text-gray-400 mr-1" />
                  <span className="text-xs text-gray-600">{booking.user?.fullName || 'Unknown User'}</span>
                </div>
                {booking.rider && (
                  <span className="text-xs text-gray-500">🏍️ {booking.rider.user?.fullName}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default LiveMonitoring;
