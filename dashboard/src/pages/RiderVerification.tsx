import React, { useEffect, useState } from 'react';
import { Check, X, Eye, Download } from 'lucide-react';
import api from '../lib/api';
import toast from 'react-hot-toast';

interface Rider {
  id: number;
  user: {
    fullName: string;
    mobileNumber: string;
  };
  vehicleType: string;
  vehicleMake: string;
  vehicleModel: string;
  vehicleRegistrationNumber: string;
  drivingLicenseUrl: string;
  aadharCardUrl: string;
  panCardUrl: string;
  vehicleRcUrl: string;
  vehicleInsuranceUrl: string;
  vehiclePucUrl: string;
  vehiclePhotoUrl: string;
  selfieWithVehicleUrl: string;
  createdAt: string;
}

const RiderVerification = () => {
  const [riders, setRiders] = useState<Rider[]>([]);
  const [selectedRider, setSelectedRider] = useState<Rider | null>(null);
  const [loading, setLoading] = useState(true);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);

  useEffect(() => {
    fetchPendingRiders();
  }, []);

  const fetchPendingRiders = async () => {
    try {
      const response = await api.get('/admin/riders/pending');
      setRiders(response.data);
    } catch (error) {
      toast.error('Failed to fetch pending riders');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (riderId: number) => {
    try {
      await api.post(`/admin/riders/${riderId}/approve`);
      toast.success('Rider approved successfully');
      setRiders(riders.filter(r => r.id !== riderId));
      setSelectedRider(null);
    } catch (error) {
      toast.error('Failed to approve rider');
    }
  };

  const handleReject = async () => {
    if (!selectedRider || !rejectionReason.trim()) {
      toast.error('Please provide a rejection reason');
      return;
    }

    try {
      await api.post(`/admin/riders/${selectedRider.id}/reject`, null, {
        params: { reason: rejectionReason },
      });
      toast.success('Rider rejected');
      setRiders(riders.filter(r => r.id !== selectedRider.id));
      setSelectedRider(null);
      setShowRejectModal(false);
      setRejectionReason('');
    } catch (error) {
      toast.error('Failed to reject rider');
    }
  };

  const documents = [
    { key: 'drivingLicenseUrl', label: 'Driving License' },
    { key: 'aadharCardUrl', label: 'Aadhar Card' },
    { key: 'panCardUrl', label: 'PAN Card' },
    { key: 'vehicleRcUrl', label: 'Vehicle RC' },
    { key: 'vehicleInsuranceUrl', label: 'Vehicle Insurance' },
    { key: 'vehiclePucUrl', label: 'PUC Certificate' },
    { key: 'vehiclePhotoUrl', label: 'Vehicle Photo' },
    { key: 'selfieWithVehicleUrl', label: 'Selfie with Vehicle' },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Rider Verification</h1>
        <p className="text-gray-600 mt-1">{riders.length} applications pending review</p>
      </div>

      {riders.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <div className="text-6xl mb-4">✅</div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">All caught up!</h2>
          <p className="text-gray-600">No pending rider applications at the moment</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow">
              <div className="p-4 border-b">
                <h2 className="font-semibold text-gray-900">Pending Applications</h2>
              </div>
              <div className="divide-y max-h-[calc(100vh-250px)] overflow-y-auto">
                {riders.map((rider) => (
                  <div
                    key={rider.id}
                    className={`p-4 cursor-pointer hover:bg-gray-50 ${
                      selectedRider?.id === rider.id ? 'bg-blue-50' : ''
                    }`}
                    onClick={() => setSelectedRider(rider)}
                  >
                    <h3 className="font-semibold text-gray-900">{rider.user.fullName}</h3>
                    <p className="text-sm text-gray-600">{rider.user.mobileNumber}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {rider.vehicleMake} {rider.vehicleModel}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      {new Date(rider.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="lg:col-span-2">
            {selectedRider ? (
              <div className="bg-white rounded-lg shadow">
                <div className="p-6 border-b">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900">
                        {selectedRider.user.fullName}
                      </h2>
                      <p className="text-gray-600">{selectedRider.user.mobileNumber}</p>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleApprove(selectedRider.id)}
                        className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                      >
                        <Check size={18} className="mr-2" />
                        Approve
                      </button>
                      <button
                        onClick={() => setShowRejectModal(true)}
                        className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                      >
                        <X size={18} className="mr-2" />
                        Reject
                      </button>
                    </div>
                  </div>
                </div>

                <div className="p-6">
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Vehicle Details</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-600">Type</p>
                        <p className="font-medium">{selectedRider.vehicleType}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Make & Model</p>
                        <p className="font-medium">
                          {selectedRider.vehicleMake} {selectedRider.vehicleModel}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Registration Number</p>
                        <p className="font-medium">{selectedRider.vehicleRegistrationNumber}</p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Documents</h3>
                    <div className="grid grid-cols-2 gap-4">
                      {documents.map((doc) => (
                        <div key={doc.key} className="border rounded-lg p-4">
                          <p className="text-sm font-medium text-gray-900 mb-2">{doc.label}</p>
                          {selectedRider[doc.key as keyof Rider] ? (
                            <div>
                              <img
                                src={selectedRider[doc.key as keyof Rider] as string}
                                alt={doc.label}
                                className="w-full h-32 object-cover rounded mb-2"
                              />
                              <div className="flex space-x-2">
                                <a
                                  href={selectedRider[doc.key as keyof Rider] as string}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex-1 flex items-center justify-center px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                                >
                                  <Eye size={14} className="mr-1" />
                                  View
                                </a>
                                <a
                                  href={selectedRider[doc.key as keyof Rider] as string}
                                  download
                                  className="flex-1 flex items-center justify-center px-3 py-1 bg-gray-600 text-white text-sm rounded hover:bg-gray-700"
                                >
                                  <Download size={14} className="mr-1" />
                                  Download
                                </a>
                              </div>
                            </div>
                          ) : (
                            <p className="text-sm text-red-600">Not uploaded</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow p-12 text-center">
                <div className="text-6xl mb-4">👈</div>
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                  Select an application
                </h2>
                <p className="text-gray-600">Choose a rider from the list to review their application</p>
              </div>
            )}
          </div>
        </div>
      )}

      {showRejectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Reject Application</h2>
            <p className="text-gray-600 mb-4">
              Please provide a reason for rejecting this application:
            </p>
            <textarea
              className="w-full border border-gray-300 rounded-lg p-3 mb-4 h-32"
              placeholder="Enter rejection reason..."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
            />
            <div className="flex space-x-3">
              <button
                onClick={handleReject}
                className="flex-1 bg-red-600 text-white py-2 rounded-lg hover:bg-red-700"
              >
                Reject
              </button>
              <button
                onClick={() => {
                  setShowRejectModal(false);
                  setRejectionReason('');
                }}
                className="flex-1 bg-gray-200 text-gray-900 py-2 rounded-lg hover:bg-gray-300"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RiderVerification;
