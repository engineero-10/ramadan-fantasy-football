import React, { useState, useEffect } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const AdminLayout = () => {
  const { user, logout, isOwner } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { path: '/admin', label: 'لوحة التحكم', icon: '📊', exact: true },
    ...(isOwner ? [{ path: '/admin/admins', label: 'إدارة العملاء', icon: '👥' }] : []),
    { path: '/admin/leagues', label: 'إدارة الدوريات', icon: '🏆' },
    { path: '/admin/member-teams', label: 'فرق الأعضاء', icon: '👤' }
  ];

  const isActive = (path, exact = false) => {
    if (exact) return location.pathname === path;
    return location.pathname.startsWith(path);
  };

  // إغلاق قائمة الموبايل عند تغيير الصفحة
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const pageTitle =
    (location.pathname === '/admin' && 'لوحة التحكم') ||
    (location.pathname === '/admin/admins' && 'إدارة العملاء') ||
    (location.pathname === '/admin/leagues' && 'إدارة الدوريات') ||
    (location.pathname === '/admin/member-teams' && 'فرق الأعضاء') ||
    (location.pathname.includes('/admin/teams') && 'إدارة الفرق') ||
    (location.pathname.includes('/admin/players') && 'إدارة اللاعبين') ||
    (location.pathname.includes('/admin/rounds') && 'إدارة الجولات') ||
    (location.pathname.includes('/admin/matches') && 'إدارة المباريات') ||
    (location.pathname.includes('/admin/match-stats') && 'إحصائيات المباراة') ||
    'لوحة التحكم';

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col md:flex-row">
      {/* Mobile overlay when sidebar open */}
      {mobileMenuOpen && (
        <button
          type="button"
          aria-label="إغلاق القائمة"
          onClick={() => setMobileMenuOpen(false)}
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
        />
      )}

      {/* Sidebar: drawer on mobile, normal on md+ */}
      <aside
        className={`
          fixed md:relative inset-y-0 right-0 z-50
          w-72 md:w-64 bg-gray-900 text-white transition-transform duration-300 flex flex-col
          ${mobileMenuOpen ? 'translate-x-0' : 'translate-x-full md:translate-x-0'}
          ${sidebarOpen ? 'md:w-64' : 'md:w-20'}
        `}
      >
        <div className="p-4 border-b border-gray-700 flex items-center justify-between">
          <Link to="/admin" className="flex items-center gap-3" onClick={() => setMobileMenuOpen(false)}>
            <span className="text-2xl">⚙️</span>
            {(sidebarOpen || mobileMenuOpen) && <span className="font-bold">لوحة التحكم</span>}
          </Link>
          <button
            type="button"
            onClick={() => setMobileMenuOpen(false)}
            className="md:hidden w-10 h-10 flex items-center justify-center rounded-lg hover:bg-gray-800 text-2xl"
            aria-label="إغلاق القائمة"
          >
            ✕
          </button>
        </div>

        <nav className="flex-1 p-4 overflow-y-auto">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setMobileMenuOpen(false)}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg mb-2 transition-colors
                ${isActive(item.path, item.exact) ? 'bg-primary-600' : 'hover:bg-gray-800'}`}
            >
              <span className="text-xl">{item.icon}</span>
              {(sidebarOpen || mobileMenuOpen) && <span>{item.label}</span>}
            </Link>
          ))}

          <div className="mt-8 pt-4 border-t border-gray-700">
            <Link
              to="/dashboard"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-800 transition-colors"
            >
              <span className="text-xl">🏠</span>
              {(sidebarOpen || mobileMenuOpen) && <span>العودة للموقع</span>}
            </Link>
          </div>
        </nav>

        <button
          type="button"
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="hidden md:flex p-4 border-t border-gray-700 hover:bg-gray-800 transition-colors"
          aria-label={sidebarOpen ? 'تصغير القائمة' : 'توسيع القائمة'}
        >
          {sidebarOpen ? '→' : '←'}
        </button>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-white shadow-sm sticky top-0 z-30">
          <div className="px-3 sm:px-6 py-3 sm:py-4 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
              <button
                type="button"
                onClick={() => setMobileMenuOpen(true)}
                className="md:hidden w-10 h-10 flex items-center justify-center rounded-lg hover:bg-gray-100 text-xl"
                aria-label="فتح القائمة"
              >
                ☰
              </button>
              <h1 className="text-base sm:text-xl font-bold text-gray-800 truncate">
                {pageTitle}
              </h1>
            </div>

            <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
              <div className="hidden sm:flex items-center gap-2">
                <div className="w-9 h-9 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center font-bold text-sm">
                  {user?.name?.charAt(0)}
                </div>
                <div className="text-sm">
                  <p className="font-medium text-gray-800 truncate max-w-[100px]">{user?.name}</p>
                  <p className="text-gray-500 text-xs">{isOwner ? 'مالك النظام' : 'مشرف'}</p>
                </div>
              </div>
              <div className="sm:hidden w-9 h-9 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center font-bold text-sm">
                {user?.name?.charAt(0)}
              </div>
              <button
                onClick={handleLogout}
                className="px-3 sm:px-4 py-1.5 sm:py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors text-sm sm:text-base"
              >
                خروج
              </button>
            </div>
          </div>
        </header>

        <main className="flex-1 p-3 sm:p-6 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
