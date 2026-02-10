import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const user = await login(email, password);
      toast.success(`مرحباً ${user.name}!`);
      navigate(user.role === 'ADMIN' ? '/admin' : '/dashboard');
    } catch (error) {
      toast.error(error.response?.data?.message || 'خطأ في تسجيل الدخول');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen ramadan-gradient flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-6 sm:mb-8">
          <div className="text-5xl sm:text-6xl mb-3 sm:mb-4">⚽</div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white">فانتازي رمضان</h1>
          <p className="text-gray-400 mt-2 text-sm sm:text-base">منصة الدوري الخيالي لبطولات رمضان</p>
        </div>

        {/* Login Form */}
        <div className="bg-white rounded-xl sm:rounded-2xl shadow-xl p-5 sm:p-8">
          <h2 className="text-xl sm:text-2xl font-bold text-center mb-4 sm:mb-6">تسجيل الدخول</h2>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                البريد الإلكتروني
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input"
                placeholder="example@email.com"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                كلمة المرور
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input"
                placeholder="••••••••"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="animate-spin">⏳</span>
                  جاري تسجيل الدخول...
                </span>
              ) : (
                'تسجيل الدخول'
              )}
            </button>
          </form>

          <div className="mt-4 sm:mt-6 text-center">
            <p className="text-gray-600 text-sm sm:text-base">
              ليس لديك حساب؟{' '}
              <Link to="/register" className="text-primary-600 font-medium hover:underline">
                إنشاء حساب جديد
              </Link>
            </p>
          </div>
        </div>

        {/* Demo Credentials */}
        <div className="mt-6 bg-white/10 rounded-xl p-4 text-white text-sm">
          <p className="font-medium mb-2">🔐 بيانات تجريبية:</p>
          <p>المشرف: admin@ramadan-fantasy.com / admin123</p>
          <p>المستخدم: user@ramadan-fantasy.com / user123</p>
        </div>
      </div>
    </div>
  );
};

export default Login;
