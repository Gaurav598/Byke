import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '../lib/api';
import { Search, Filter, CheckCircle, XCircle, Ban, PlayCircle } from 'lucide-react';

export default function RidersPage() {
  const [statusFilter, setStatusFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const queryClient = useQueryClient();

  const { data: riders, isLoading } = useQuery({
    queryKey: ['riders', statusFilter, searchQuery],
    queryFn: () => adminApi.getRiders({ status: statusFilter, search: searchQuery }),
  });

  const approveMutation = useMutation({
    mutationFn: (id: number) => adminApi.approveRider(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['riders'] });
      alert('Rider approved successfully');
    },
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }: { id: number; reason: string }) => adminApi.rejectRider(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['riders'] });
      alert('Rider rejected');
    },
  });

  const suspendMutation = useMutation({
    mutationFn: ({ id, reason }: { id: number; reason: string }) => adminApi.suspendRider(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['riders'] });
      alert('Rider suspended');
    },
  });

  const activateMutation = useMutation({
    mutationFn: (id: number) => adminApi.activateRider(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['riders'] });
      alert('Rider activated');
    },
  });

  const handleAction = (action: string, riderId: number) => {
    if (action === 'approve') {
      approveMutation.mutate(riderId);
    } else if (action === 'reject') {
      const reason = prompt('Enter rejection reason:');
      if (reason) rejectMutation.mutate({ id: riderId, reason });
    } else if (action === 'suspend') {
      const reason = prompt('Enter suspension reason:');
      if (reason) suspendMutation.mutate({ id: riderId, reason });
    } else if (action === 'activate') {
      activateMutation.mutate(riderId);
    }
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      PENDING: 'bg-yellow-100 text-yellow-800',
      ACTIVE: 'bg-green-100 text-green-800',
      SUSPENDED: 'bg-red-100 text-red-800',
      REJECTED: 'bg-gray-100 text-gray-800',
    };
    return styles[status as keyof typeof styles] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-gray-800 mb-8">Rider Management</h1>

      <div className="bg-white rounded-lg shadow mb-6 p-4">
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search by name, phone, vehicle..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="pl-10 pr-8 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Status</option>
              <option value="PENDING">Pending</option>
              <option value="ACTIVE">Active</option>
              <option value="SUSPENDED">Suspended</option>
              <option value="REJECTED">Rejected</option>
            </select>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-12">
          <div className="text-xl text-gray-600">Loading riders...</div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rider</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vehicle</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rating</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rides</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {riders?.data?.map((rider: any) => (
                <tr key={rider.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{rider.user?.fullName}</div>
                      <div className="text-sm text-gray-500">{rider.user?.mobileNumber}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{rider.vehicleType} - {rider.vehicleModel}</div>
                    <div className="text-sm text-gray-500">{rider.vehicleRegistrationNumber}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadge(rider.approvalStatus)}`}>
                      {rider.approvalStatus}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ⭐ {rider.averageRating?.toFixed(1) || 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {rider.totalRides || 0}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex gap-2">
                      {rider.approvalStatus === 'PENDING' && (
                        <>
                          <button
                            onClick={() => handleAction('approve', rider.id)}
                            className="text-green-600 hover:text-green-900"
                            title="Approve"
                          >
                            <CheckCircle className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => handleAction('reject', rider.id)}
                            className="text-red-600 hover:text-red-900"
                            title="Reject"
                          >
                            <XCircle className="w-5 h-5" />
                          </button>
                        </>
                      )}
                      {rider.approvalStatus === 'ACTIVE' && (
                        <button
                          onClick={() => handleAction('suspend', rider.id)}
                          className="text-orange-600 hover:text-orange-900"
                          title="Suspend"
                        >
                          <Ban className="w-5 h-5" />
                        </button>
                      )}
                      {rider.approvalStatus === 'SUSPENDED' && (
                        <button
                          onClick={() => handleAction('activate', rider.id)}
                          className="text-blue-600 hover:text-blue-900"
                          title="Activate"
                        >
                          <PlayCircle className="w-5 h-5" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
