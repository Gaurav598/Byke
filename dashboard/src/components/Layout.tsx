import React from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Bike,
  Activity,
  MessageSquare,
  Settings,
  LogOut,
  CheckCircle,
} from 'lucide-react';

const Layout = () => {
  const menuItems = [
    { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/riders/verification', icon: CheckCircle, label: 'Rider Verification' },
    { path: '/monitoring', icon: Activity, label: 'Live Monitoring' },
    { path: '/users', icon: Users, label: 'Users' },
    { path: '/bookings', icon: Bike, label: 'Bookings' },
    { path: '/complaints', icon: MessageSquare, label: 'Complaints' },
    { path: '/settings', icon: Settings, label: 'Settings' },
  ];

  return (
    <div className="flex h-screen bg-gray-100">
      <aside className="w-64 bg-white shadow-lg">
        <div className="p-6 border-b">
          <h1 className="text-2xl font-bold text-blue-600">BYKE Admin</h1>
          <p className="text-sm text-gray-600 mt-1">Management Dashboard</p>
        </div>
        
        <nav className="p-4">
          {menuItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center px-4 py-3 mb-2 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                }`
              }
            >
              <item.icon size={20} className="mr-3" />
              <span className="font-medium">{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="absolute bottom-0 w-64 p-4 border-t">
          <button className="flex items-center px-4 py-3 w-full text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
            <LogOut size={20} className="mr-3" />
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;
