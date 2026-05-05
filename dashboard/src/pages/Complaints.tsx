import React, { useEffect, useState } from 'react';
import { CheckCircle, AlertCircle, MessageSquare } from 'lucide-react';
import api from '../lib/api';
import toast from 'react-hot-toast';

interface Complaint {
  id: number;
  complaintType: string;
  description: string;
  status: string;
  resolution?: string;
  createdAt: string;
  user?: { fullName: string; mobileNumber: string };
}

const Complaints = () => {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Complaint | null>(null);
  const [resolution, setResolution] = useState('');
  const [resolving, setResolving] = useState(false);

  const fetchComplaints = async () => {
    try {
      const res = await api.get('/complaints/open');
      setComplaints(res.data);
    } catch {
      toast.error('Failed to fetch complaints');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchComplaints(); }, []);

  const handleResolve = async () => {
    if (!selected || !resolution.trim()) {
      toast.error('Please enter a resolution');
      return;
    }
    setResolving(true);
    try {
      await api.post(`/complaints/${selected.id}/resolve`, null, { params: { resolution } });
      toast.success('Complaint resolved!');
      setComplaints(complaints.filter(c => c.id !== selected.id));
      setSelected(null);
      setResolution('');
    } catch {
      toast.error('Failed to resolve complaint');
    } finally {
      setResolving(false);
    }
  };

  if (loading) return <div className="flex items-center justify-center h-screen text-gray-600">Loading...</div>;

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Complaints</h1>
        <p className="text-gray-500 mt-1">{complaints.length} open complaint{complaints.length !== 1 ? 's' : ''}</p>
      </div>

      {complaints.length === 0 ? (
        <div className="bg-white rounded-xl shadow p-12 text-center">
          <div className="text-6xl mb-4">😊</div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">No open complaints</h2>
          <p className="text-gray-500">All complaints have been resolved.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* List */}
          <div className="bg-white rounded-xl shadow overflow-hidden">
            <div className="p-4 border-b bg-gray-50">
              <h2 className="font-semibold text-gray-800">Open Complaints</h2>
            </div>
            <div className="divide-y max-h-[calc(100vh-260px)] overflow-y-auto">
              {complaints.map((c) => (
                <div
                  key={c.id}
                  className={`p-4 cursor-pointer hover:bg-gray-50 transition ${selected?.id === c.id ? 'bg-blue-50 border-l-4 border-blue-500' : ''}`}
                  onClick={() => { setSelected(c); setResolution(''); }}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold bg-red-100 text-red-700 px-2 py-0.5 rounded">{c.complaintType}</span>
                    <span className="text-xs text-gray-400">{new Date(c.createdAt).toLocaleDateString()}</span>
                  </div>
                  <p className="text-sm text-gray-800 font-medium">{c.user?.fullName || 'Unknown User'}</p>
                  <p className="text-xs text-gray-500 mt-1 truncate">{c.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Detail panel */}
          <div className="lg:col-span-2">
            {selected ? (
              <div className="bg-white rounded-xl shadow p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">{selected.user?.fullName || 'Unknown User'}</h2>
                    <p className="text-gray-500 text-sm">{selected.user?.mobileNumber}</p>
                  </div>
                  <span className="bg-red-100 text-red-700 text-xs font-semibold px-3 py-1 rounded-full flex items-center">
                    <AlertCircle size={12} className="mr-1" /> {selected.complaintType}
                  </span>
                </div>

                <div className="bg-gray-50 rounded-lg p-4 mb-6">
                  <div className="flex items-center mb-2">
                    <MessageSquare size={15} className="text-gray-500 mr-2" />
                    <span className="text-sm font-semibold text-gray-700">Complaint Description</span>
                  </div>
                  <p className="text-gray-700 text-sm leading-relaxed">{selected.description}</p>
                  <p className="text-gray-400 text-xs mt-3">Submitted: {new Date(selected.createdAt).toLocaleString()}</p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Resolution</label>
                  <textarea
                    className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none"
                    rows={4}
                    placeholder="Enter your resolution or action taken..."
                    value={resolution}
                    onChange={(e) => setResolution(e.target.value)}
                  />
                  <button
                    onClick={handleResolve}
                    disabled={resolving}
                    className="mt-3 flex items-center px-5 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50"
                  >
                    <CheckCircle size={16} className="mr-2" />
                    {resolving ? 'Resolving...' : 'Mark as Resolved'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow p-12 text-center">
                <div className="text-6xl mb-4">👈</div>
                <h2 className="text-xl font-semibold text-gray-900 mb-2">Select a complaint</h2>
                <p className="text-gray-500">Choose a complaint from the list to view details and resolve it.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Complaints;
