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
  const handleSearchByCode = async () => {
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
      // الانتقال لإنشاء فريق مع تمرير الدوري
      navigate(`/create-team?leagueId=${leagueInfo.id}`);
    } catch (error) {
      toast.error(error.response?.data?.message || 'خطأ في الانضمام للدوري');
    } finally {
      setLoading(false);
    }
  };

  // Handle Enter key
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && code.trim()) {
      handleSearchByCode();
    }
  };

  return (
    <div className="max-w-md mx-auto px-2 sm:px-0">
      <div className="card p-4 sm:p-6">
        <div className="text-center mb-4 sm:mb-6">
          <div className="text-4xl sm:text-5xl mb-3 sm:mb-4">🔗</div>
          <h1 className="text-xl sm:text-2xl font-bold">الانضمام لدوري</h1>
          <p className="text-gray-600 mt-1 sm:mt-2 text-sm sm:text-base">أدخل كود الدوري للانضمام</p>
        </div>

        {/* Search by Code */}
        <div className="space-y-3 sm:space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              🔑 كود الدوري
            </label>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              onKeyPress={handleKeyPress}
              className="input w-full text-center text-lg sm:text-xl tracking-widest font-mono"
              placeholder="XXXXXXXX"
              maxLength={20}
              autoFocus
            />
          </div>
          
          <button
            onClick={handleSearchByCode}
            disabled={loading || !code.trim()}
            className="btn-primary w-full py-2.5 sm:py-3 text-sm sm:text-base"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="animate-spin">⏳</span>
                جاري البحث...
              </span>
            ) : (
              '🔍 بحث عن الدوري'
            )}
          </button>
        </div>

        {/* League Info */}
        {leagueInfo && (
          <div className="mt-4 sm:mt-6 bg-gradient-to-l from-primary-50 to-secondary-50 rounded-lg sm:rounded-xl p-4 sm:p-6">
            <h3 className="font-bold text-sm sm:text-lg mb-3 sm:mb-4 text-center">🏆 هل تريد الانضمام لهذا الدوري؟</h3>
            
            <div className="space-y-2 sm:space-y-3">
              <div className="flex justify-between items-center text-sm sm:text-base">
                <span className="text-gray-600">اسم الدوري:</span>
                <span className="font-medium truncate max-w-[50%]">{leagueInfo.name}</span>
              </div>
              
              {leagueInfo.description && (
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-600">الوصف:</span>
                  <span className="font-medium text-xs sm:text-sm truncate max-w-[50%]">{leagueInfo.description}</span>
                </div>
              )}

              <div className="flex justify-between items-center text-sm sm:text-base">
                <span className="text-gray-600">الكود:</span>
                <span className="font-mono bg-gray-100 px-2 py-1 rounded text-xs sm:text-sm">{leagueInfo.code}</span>
              </div>
              
              <div className="flex justify-between items-center text-sm sm:text-base">
                <span className="text-gray-600">عدد الأعضاء:</span>
                <span className="font-medium">{leagueInfo._count?.members || 0} عضو</span>
              </div>

              <div className="flex justify-between items-center text-sm sm:text-base">
                <span className="text-gray-600">الميزانية:</span>
                <span className="font-medium">{leagueInfo.budget || 100}$</span>
              </div>

              <div className="flex justify-between items-center text-sm sm:text-base">
                <span className="text-gray-600">اللاعبين:</span>
                <span className="font-medium text-xs sm:text-sm">{leagueInfo.startingPlayers || 8} أساسي + {leagueInfo.substitutes || 4} بديل</span>
              </div>
            </div>

            <div className="flex gap-2 sm:gap-3 mt-4 sm:mt-6">
              <button
                onClick={() => setLeagueInfo(null)}
                className="btn-secondary flex-1 text-sm sm:text-base py-2 sm:py-2.5"
              >
                إلغاء
              </button>
              <button
                onClick={handleJoin}
                disabled={loading}
                className="btn-primary flex-1 text-sm sm:text-base py-2 sm:py-2.5"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="animate-spin">⏳</span>
                    جاري الانضمام...
                  </span>
                ) : (
                  '✅ نعم، انضم'
                )}
              </button>
            </div>
          </div>
        )}

        {/* Instructions */}
        {!leagueInfo && (
          <div className="mt-4 sm:mt-6 bg-gray-50 rounded-lg sm:rounded-xl p-3 sm:p-4">
            <h4 className="font-medium mb-2 flex items-center gap-2 text-sm sm:text-base">
              <span>💡</span> كيفية الحصول على الكود
            </h4>
            <ul className="text-xs sm:text-sm text-gray-600 space-y-1 list-disc list-inside">
              <li>اطلب كود الدوري من مشرف الدوري</li>
              <li>الكود يتكون من حروف وأرقام</li>
              <li>بعد الانضمام يمكنك إنشاء فريقك الخيالي</li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default JoinLeague;
