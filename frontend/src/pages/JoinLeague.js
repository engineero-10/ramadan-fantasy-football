import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { leagueAPI } from '../services/api';
import toast from 'react-hot-toast';

const JoinLeague = () => {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [leagueInfo, setLeagueInfo] = useState(null);
  const navigate = useNavigate();

  // البحث عن الدوري بالكود
  const handleSearch = async () => {
    if (!code.trim()) {
      toast.error('أدخل كود الدوري');
      return;
    }

    setLoading(true);
    try {
      const response = await leagueAPI.getByCode(code.trim().toUpperCase());
      setLeagueInfo(response.data.league);
      toast.success('تم العثور على الدوري!');
    } catch (error) {
      setLeagueInfo(null);
      toast.error(error.response?.data?.message || 'لم يتم العثور على الدوري');
    } finally {
      setLoading(false);
    }
  };

  // الانضمام للدوري
  const handleJoin = async () => {
    setLoading(true);
    try {
      await leagueAPI.join(code.trim().toUpperCase());
      toast.success('تم الانضمام للدوري بنجاح!');
      navigate('/create-team');
    } catch (error) {
      toast.error(error.response?.data?.message || 'خطأ في الانضمام للدوري');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto">
      <div className="card">
        <div className="text-center mb-6">
          <div className="text-5xl mb-4">🔗</div>
          <h1 className="text-2xl font-bold">الانضمام لدوري</h1>
          <p className="text-gray-600 mt-2">أدخل كود الدوري للانضمام</p>
        </div>

        {/* Search Form */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              كود الدوري
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                className="input flex-1 text-center text-lg tracking-widest font-mono"
                placeholder="XXXX0000"
                maxLength={10}
              />
              <button
                onClick={handleSearch}
                disabled={loading || !code.trim()}
                className="btn-primary px-6"
              >
                {loading ? '⏳' : 'بحث'}
              </button>
            </div>
          </div>

          {/* League Info */}
          {leagueInfo && (
            <div className="mt-6 bg-gradient-to-l from-primary-50 to-secondary-50 rounded-xl p-6">
              <h3 className="font-bold text-lg mb-4 text-center">معلومات الدوري</h3>
              
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">اسم الدوري:</span>
                  <span className="font-medium">{leagueInfo.name}</span>
                </div>
                
                {leagueInfo.description && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">الوصف:</span>
                    <span className="font-medium">{leagueInfo.description}</span>
                  </div>
                )}
                
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">عدد الأعضاء:</span>
                  <span className="font-medium">{leagueInfo._count?.members || 0} عضو</span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-gray-600">تاريخ الإنشاء:</span>
                  <span className="font-medium">
                    {new Date(leagueInfo.createdAt).toLocaleDateString('ar-SA')}
                  </span>
                </div>
              </div>

              <button
                onClick={handleJoin}
                disabled={loading}
                className="btn-primary w-full mt-6"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="animate-spin">⏳</span>
                    جاري الانضمام...
                  </span>
                ) : (
                  '🎉 انضم للدوري'
                )}
              </button>
            </div>
          )}
        </div>

        {/* Instructions */}
        <div className="mt-6 bg-gray-50 rounded-xl p-4">
          <h4 className="font-medium mb-2 flex items-center gap-2">
            <span>💡</span> كيف تحصل على كود الدوري؟
          </h4>
          <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside">
            <li>اطلب الكود من منظم البطولة</li>
            <li>الكود يتكون من أحرف وأرقام (مثال: RMDN2024)</li>
            <li>الكود غير حساس لحالة الأحرف</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default JoinLeague;
