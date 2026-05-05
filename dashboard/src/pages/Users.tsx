import React, { useEffect, useState } from 'react';
import { Search, RefreshCw, User, Phone, Star, CheckCircle2 } from 'lucide-react';
import api from '../lib/api';
import toast from 'react-hot-toast';

interface Rider {
  id: number;
  status: string;
  vehicleType: string;
  vehicleMake: string;
  vehicleModel: string;
  vehicleRegistrationNumber: string;
  averageRating: number;
  totalRides: number;
  subscriptionActive: boolean;
  subscriptionEndDate: string;
  user: { fullName: string; mobileNumber: string; createdAt?: string };
}

const statusColors: Record<string, string> = {
  ACTIVE: 'bg-green-100 text-green-700',
  PENDING: 'bg-yellow-100 text-yellow-700',
  BANNED: 'bg-red-100 text-red-700',
  APPROVED: 'bg-blue-100 text-blue-700',
};

const Users = () => {
  const [riders, setRiders] = useState<Rider[]>([]);
  const [filtered, setFiltered] = useState<Rider[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchRiders = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/riders/active');
      setRiders(res.data);
      setFiltered(res.data);
    } catch {
      toast.error('Failed to fetch riders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchRiders(); }, []);

  useEffect(() => {
    const q = search.toLowerCase();
    setFiltered(
      riders.filter(r =>
        r.user.fullName.toLowerCase().includes(q) ||
        r.user.mobileNumber.includes(q) ||
        r.vehicleRegistrationNumber?.toLowerCase().includes(q)
      )
    );
  }, [search, riders]);

  if (loading) return <div className="flex items-center justify-center h-screen text-gray-600">Loading...</div>;

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Riders</h1>
          <p className="text-gray-500 mt-1">{filtered.length} active rider{filtered.length !== 1 ? 's' : ''}</p>
        </div>
        <button
          onClick={fetchRiders}
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
          placeholder="Search by name, phone or vehicle number..."
          className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white rounded-xl shadow p-12 text-center">
          <div className="text-6xl mb-4">🔍</div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">No riders found</h2>
          <p className="text-gray-500">Try adjusting your search.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-600 text-xs uppercase">
              <tr>
                <th className="px-5 py-3 text-left">Rider</th>
                <th className="px-5 py-3 text-left">Vehicle</th>
                <th className="px-5 py-3 text-right">Rating</th>
                <th className="px-5 py-3 text-right">Rides</th>
                <th className="px-5 py-3 text-center">Subscription</th>
                <th className="px-5 py-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((rider) => (
                <tr key={rider.id} className="hover:bg-gray-50 transition">
                  <td className="px-5 py-4">
                    <div className="flex items-center">
                      <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center mr-3 flex-shrink-0">
                        <User size={16} className="text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{rider.user.fullName}</p>
                        <p className="text-gray-500 flex items-center text-xs mt-0.5">
                          <Phone size={11} className="mr-1" />{rider.user.mobileNumber}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <p className="text-gray-800">{rider.vehicleMake} {rider.vehicleModel}</p>
                    <p className="text-gray-500 text-xs">{rider.vehicleRegistrationNumber}</p>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <span className="flex items-center justify-end text-yellow-600 font-semibold">
                      <Star size={13} className="mr-1 fill-yellow-400 text-yellow-400" />
                      {rider.averageRating?.toFixed(1) || '5.0'}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-right text-gray-700 font-medium">{rider.totalRides || 0}</td>
                  <td className="px-5 py-4 text-center">
                    {rider.subscriptionActive ? (
                      <span className="flex items-center justify-center text-green-600 text-xs">
                        <CheckCircle2 size={13} className="mr-1" /> Active
                      </span>
                    ) : (
                      <span className="text-red-500 text-xs">Inactive</span>
                    )}
                  </td>
                  <td className="px-5 py-4 text-center">
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${statusColors[rider.status] || 'bg-gray-100 text-gray-600'}`}>
                      {rider.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default Users;
