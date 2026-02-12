import React, { useState } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Layout = () => {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // عناصر التنقل للمستخدم العادي فقط (الأدمن لا يشارك كلاعب)
  const userNavItems = [
    { path: '/dashboard', label: 'الرئيسية', icon: '🏠' },
    { path: '/my-team', label: 'فريقي', icon: '⭐' },
    { path: '/rounds', label: 'الجولات', icon: '📅' },
    { path: '/transfers', label: 'الانتقالات', icon: '🔄' },
    { path: '/matches', label: 'المباريات', icon: '⚽' },
    { path: '/leaderboard', label: 'الترتيب', icon: '🏆' },
    { path: '/join-league', label: 'انضم لدوري', icon: '🎯' }
  ];

  // عناصر التنقل للأدمن (للعرض فقط بدون مشاركة)
  const adminNavItems = [
    { path: '/rounds', label: 'الجولات', icon: '📅' },
    { path: '/matches', label: 'المباريات', icon: '⚽' },
    { path: '/leaderboard', label: 'الترتيب', icon: '🏆' }
  ];

  const navItems = isAdmin ? adminNavItems : userNavItems;

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-gradient-to-l from-primary-800 to-primary-600 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/dashboard" className="flex items-center gap-3">
              <span className="text-2xl">⚽</span>
              <span className="font-bold text-lg  sm:block">فانتازي رمضان</span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-6">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors
                    ${location.pathname === item.path 
                      ? 'bg-white/20' 
                      : 'hover:bg-white/10'}`}
                >
                  <span>{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              ))}
              
              {isAdmin && (
                <Link
                  to="/admin"
                  className="flex items-center gap-2 px-3 py-2 rounded-lg bg-yellow-500 hover:bg-yellow-400 transition-colors"
                >
                  <span>⚙️</span>
                  <span>لوحة التحكم</span>
                </Link>
              )}
            </nav>

            {/* User Menu */}
            <div className="flex items-center gap-4">
              <div className="hidden sm:flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                  {user?.name?.charAt(0)}
                </div>
                <span className="text-sm">{user?.name}</span>
              </div>
              
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors text-sm"
              >
                خروج
              </button>

              {/* Mobile Menu Button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>
          </div>

          {/* Mobile Navigation */}
          {mobileMenuOpen && (
            <nav className="md:hidden py-4 border-t border-white/20">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-2 px-3 py-3 rounded-lg transition-colors
                    ${location.pathname === item.path 
                      ? 'bg-white/20' 
                      : 'hover:bg-white/10'}`}
                >
                  <span>{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              ))}
              
              {isAdmin && (
                <Link
                  to="/admin"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2 px-3 py-3 mt-2 rounded-lg bg-yellow-500 hover:bg-yellow-400 transition-colors"
                >
                  <span>⚙️</span>
                  <span>لوحة التحكم</span>
                </Link>
              )}
            </nav>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-6">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-gray-800 text-gray-400 py-6 mt-auto">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p>فانتازي رمضان © {new Date().getFullYear()} - جميع الحقوق محفوظة</p>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
