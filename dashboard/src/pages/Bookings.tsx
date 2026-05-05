import React, { useEffect, useState } from 'react';
import { RefreshCw, Search, MapPin, Navigation, User } from 'lucide-react';
import api from '../lib/api';
import toast from 'react-hot-toast';

interface Booking {
  id: number;
  serviceType: string;
  status: string;
  pickupAddress: string;
  dropAddress: string;
  estimatedFare: number;
  finalFare?: number;
  estimatedDistance: number;
  createdAt: string;
  user?: { fullName: string; mobileNumber: string };
  rider?: { user: { fullName: string }; vehicleRegistrationNumber: string };
}

const statusColors: Record<string, string> = {
  IN_PROGRESS: 'bg-green-100 text-green-700',
  COMPLETED: 'bg-blue-100 text-blue-700',
  ACCEPTED: 'bg-indigo-100 text-indigo-700',
  BIDDING: 'bg-yellow-100 text-yellow-700',
  RIDER_ARRIVED: 'bg-purple-100 text-purple-700',
  CANCELLED_BY_USER: 'bg-red-100 text-red-700',
  CANCELLED_BY_RIDER: 'bg-orange-100 text-orange-700',
};

const Bookings = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [filtered, setFiltered] = useState<Booking[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/bookings/active');
      setBookings(res.data);
      setFiltered(res.data);
    } catch {
      toast.error('Failed to fetch bookings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchBookings(); }, []);

  useEffect(() => {
    const q = search.toLowerCase();
    setFiltered(
      bookings.filter(b =>
        String(b.id).includes(q) ||
        b.pickupAddress?.toLowerCase().includes(q) ||
        b.dropAddress?.toLowerCase().includes(q) ||
        b.user?.fullName?.toLowerCase().includes(q)
      )
    );
  }, [search, bookings]);

  if (loading) return <div className="flex items-center justify-center h-screen text-gray-600">Loading...</div>;

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Bookings</h1>
          <p className="text-gray-500 mt-1">{filtered.length} active booking{filtered.length !== 1 ? 's' : ''}</p>
        </div>
        <button
          onClick={fetchBookings}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          <RefreshCw size={16} className="mr-2" />
          Refresh
        </button>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Search by booking ID, address, or user..."
          className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white rounded-xl shadow p-12 text-center">
          <div className="text-6xl mb-4">📋</div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">No bookings found</h2>
          <p className="text-gray-500">No active bookings at the moment.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((booking) => (
            <div key={booking.id} className="bg-white rounded-xl shadow border border-gray-100 p-5">
              <div className="flex items-start justify-between flex-wrap gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <span className="font-mono text-gray-400 text-sm">#{booking.id}</span>
                    <span className="text-xs font-bold bg-blue-600 text-white px-2 py-0.5 rounded">{booking.serviceType}</span>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${statusColors[booking.status] || 'bg-gray-100 text-gray-600'}`}>
                      {booking.status.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center">
                      <MapPin size={13} className="text-green-500 mr-2 flex-shrink-0" />
                      <p className="text-sm text-gray-700 truncate">{booking.pickupAddress}</p>
                    </div>
                    <div className="flex items-center">
                      <Navigation size={13} className="text-red-500 mr-2 flex-shrink-0" />
                      <p className="text-sm text-gray-700 truncate">{booking.dropAddress}</p>
                    </div>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-xl font-bold text-blue-600">₹{(booking.finalFare ?? booking.estimatedFare)?.toFixed(0)}</p>
                  <p className="text-xs text-gray-500">{booking.estimatedDistance?.toFixed(1)} km</p>
                  <p className="text-xs text-gray-400 mt-1">{new Date(booking.createdAt).toLocaleTimeString()}</p>
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-gray-100 flex justify-between items-center text-xs text-gray-500">
                <span className="flex items-center">
                  <User size={12} className="mr-1" />
                  {booking.user?.fullName || 'Unknown'}
                  {booking.user?.mobileNumber ? ` · ${booking.user.mobileNumber}` : ''}
                </span>
                {booking.rider ? (
                  <span>🏍️ {booking.rider.user?.fullName} · {booking.rider.vehicleRegistrationNumber}</span>
                ) : (
                  <span className="text-yellow-600">Awaiting rider</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Bookings;
