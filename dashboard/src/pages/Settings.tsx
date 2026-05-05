import React, { useState } from 'react';
import { Save, Server, Bell, Shield } from 'lucide-react';
import toast from 'react-hot-toast';

const Settings = () => {
  const [apiUrl, setApiUrl] = useState(import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    // In production this would persist to a backend config
    setTimeout(() => {
      toast.success('Settings saved');
      setSaving(false);
    }, 800);
  };

  return (
    <div className="p-6 max-w-2xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-500 mt-1">Dashboard configuration and preferences</p>
      </div>

      <div className="space-y-6">
        {/* API Config */}
        <div className="bg-white rounded-xl shadow p-6">
          <div className="flex items-center mb-4">
            <Server size={18} className="text-blue-600 mr-2" />
            <h2 className="text-lg font-semibold text-gray-900">API Configuration</h2>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Backend API URL</label>
            <input
              type="text"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              value={apiUrl}
              onChange={e => setApiUrl(e.target.value)}
            />
            <p className="text-xs text-gray-400 mt-1">Current: {import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api'}</p>
          </div>
        </div>

        {/* Notifications */}
        <div className="bg-white rounded-xl shadow p-6">
          <div className="flex items-center mb-4">
            <Bell size={18} className="text-blue-600 mr-2" />
            <h2 className="text-lg font-semibold text-gray-900">Notifications</h2>
          </div>
          <div className="space-y-3">
            {['New rider applications', 'New complaints', 'System alerts'].map(label => (
              <label key={label} className="flex items-center cursor-pointer">
                <input type="checkbox" defaultChecked className="mr-3 accent-blue-600" />
                <span className="text-sm text-gray-700">{label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Security info */}
        <div className="bg-white rounded-xl shadow p-6">
          <div className="flex items-center mb-4">
            <Shield size={18} className="text-blue-600 mr-2" />
            <h2 className="text-lg font-semibold text-gray-900">Security</h2>
          </div>
          <div className="bg-blue-50 rounded-lg p-4 text-sm text-blue-800">
            <p className="font-semibold mb-1">Admin Session</p>
            <p>You are logged in as an admin. Session token is stored in localStorage and sent as a Bearer token on every request.</p>
          </div>
          <button
            onClick={() => { localStorage.removeItem('adminToken'); window.location.href = '/login'; }}
            className="mt-4 px-4 py-2 bg-red-50 text-red-600 border border-red-200 rounded-lg text-sm hover:bg-red-100 transition"
          >
            Sign Out
          </button>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
        >
          <Save size={16} className="mr-2" />
          {saving ? 'Saving...' : 'Save Settings'}
        </button>
      </div>
    </div>
  );
};

export default Settings;
