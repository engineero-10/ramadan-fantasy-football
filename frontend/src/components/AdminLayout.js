import React, { useState } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const AdminLayout = () => {
  const { user, logout, isOwner } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { path: '/admin', label: 'لوحة التحكم', icon: '📊', exact: true },
    // Only show "Manage Admins" for Owner
    ...(isOwner ? [{ path: '/admin/admins', label: 'إدارة العملاء', icon: '👥' }] : []),
    { path: '/admin/leagues', label: 'إدارة الدوريات', icon: '🏆' },
    { path: '/admin/member-teams', label: 'فرق الأعضاء', icon: '👤' }
  ];

  const isActive = (path, exact = false) => {
    if (exact) return location.pathname === path;
    return location.pathname.startsWith(path);
  };

  return (
    <div className="min-h-screen bg-gray-100 flex">
      {/* Sidebar */}
      <aside className={`${sidebarOpen ? 'w-64' : 'w-20'} bg-gray-900 text-white transition-all duration-300 flex flex-col`}>
        {/* Logo */}
        <div className="p-4 border-b border-gray-700">
          <Link to="/admin" className="flex items-center gap-3">
            <span className="text-2xl">⚙️</span>
            {sidebarOpen && <span className="font-bold">لوحة التحكم</span>}
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg mb-2 transition-colors
                ${isActive(item.path, item.exact) 
                  ? 'bg-primary-600' 
                  : 'hover:bg-gray-800'}`}
            >
              <span className="text-xl">{item.icon}</span>
              {sidebarOpen && <span>{item.label}</span>}
            </Link>
          ))}

          <div className="mt-8 pt-4 border-t border-gray-700">
            <Link
              to="/dashboard"
              className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-800 transition-colors"
            >
              <span className="text-xl">🏠</span>
              {sidebarOpen && <span>العودة للموقع</span>}
            </Link>
          </div>
        </nav>

        {/* Toggle Button */}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-4 border-t border-gray-700 hover:bg-gray-800 transition-colors"
        >
          {sidebarOpen ? '→' : '←'}
        </button>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-white shadow-sm">
          <div className="px-6 py-4 flex items-center justify-between">
            <h1 className="text-xl font-bold text-gray-800">
              {location.pathname === '/admin' && 'لوحة التحكم'}
              {location.pathname === '/admin/admins' && 'إدارة العملاء'}
              {location.pathname === '/admin/leagues' && 'إدارة الدوريات'}
              {location.pathname === '/admin/member-teams' && 'فرق الأعضاء'}
              {location.pathname.includes('/admin/teams') && 'إدارة الفرق'}
              {location.pathname.includes('/admin/players') && 'إدارة اللاعبين'}
              {location.pathname.includes('/admin/rounds') && 'إدارة الجولات'}
              {location.pathname.includes('/admin/matches') && 'إدارة المباريات'}
              {location.pathname.includes('/admin/match-stats') && 'إحصائيات المباراة'}
            </h1>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center font-bold">
                  {user?.name?.charAt(0)}
                </div>
                <div className="text-sm">
                  <p className="font-medium text-gray-800">{user?.name}</p>
                  <p className="text-gray-500">{isOwner ? 'مالك النظام' : 'مشرف'}</p>
                </div>
              </div>
              
              <button
                onClick={handleLogout}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
              >
                خروج
              </button>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-6 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
