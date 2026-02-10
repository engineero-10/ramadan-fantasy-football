import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { leagueAPI } from '../services/api';
import toast from 'react-hot-toast';

const JoinLeague = () => {
  const [code, setCode] = useState('');
  const [searchName, setSearchName] = useState('');
  const [loading, setLoading] = useState(false);
  const [leagueInfo, setLeagueInfo] = useState(null);
  const [allLeagues, setAllLeagues] = useState([]);
  const [searchMode, setSearchMode] = useState('code'); // 'code' or 'name'
  const navigate = useNavigate();

  // جلب كل الدوريات المتاحة
  useEffect(() => {
    fetchAllLeagues();
  }, []);

  const fetchAllLeagues = async () => {
    try {
      const response = await leagueAPI.getAll({ limit: 100 });
      setAllLeagues(response.data.leagues || []);
    } catch (error) {
      console.error('Error fetching leagues:', error);
    }
  };

  // تصفية الدوريات بالاسم
  const filteredLeagues = allLeagues.filter(league =>
    league.name.toLowerCase().includes(searchName.toLowerCase())
  );

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

  // اختيار دوري من القائمة
  const selectLeague = (league) => {
    setLeagueInfo(league);
    setCode(league.code);
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
    <div className="max-w-2xl mx-auto">
      <div className="card">
        <div className="text-center mb-6">
          <div className="text-5xl mb-4">🔗</div>
          <h1 className="text-2xl font-bold">الانضمام لدوري</h1>
          <p className="text-gray-600 mt-2">ابحث عن دوري بالكود أو الاسم</p>
        </div>

        {/* Search Mode Toggle */}
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => { setSearchMode('code'); setLeagueInfo(null); }}
            className={`flex-1 py-2 px-4 rounded-lg font-medium transition ${
              searchMode === 'code' 
                ? 'bg-primary-500 text-white' 
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            🔑 بالكود
          </button>
          <button
            onClick={() => { setSearchMode('name'); setLeagueInfo(null); }}
            className={`flex-1 py-2 px-4 rounded-lg font-medium transition ${
              searchMode === 'name' 
                ? 'bg-primary-500 text-white' 
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            🔍 بالاسم
          </button>
        </div>

        {/* Search by Code */}
        {searchMode === 'code' && (
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
                  onClick={handleSearchByCode}
                  disabled={loading || !code.trim()}
                  className="btn-primary px-6"
                >
                  {loading ? '⏳' : 'بحث'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Search by Name */}
        {searchMode === 'name' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                اسم الدوري
              </label>
              <input
                type="text"
                value={searchName}
                onChange={(e) => setSearchName(e.target.value)}
                className="input w-full"
                placeholder="ابحث عن دوري..."
              />
            </div>

            {/* Leagues List */}
            <div className="max-h-[300px] overflow-y-auto space-y-2">
              {filteredLeagues.length > 0 ? (
                filteredLeagues.map((league) => (
                  <button
                    key={league.id}
                    onClick={() => selectLeague(league)}
                    className={`w-full flex items-center justify-between p-4 rounded-xl transition ${
                      leagueInfo?.id === league.id
                        ? 'bg-primary-100 border-2 border-primary-500'
                        : 'bg-gray-50 hover:bg-gray-100'
                    }`}
                  >
                    <div className="text-right">
                      <p className="font-medium">{league.name}</p>
                      <p className="text-xs text-gray-500">
                        {league._count?.members || 0} عضو • {league._count?.teams || 0} فريق
                      </p>
                    </div>
                    <div className="text-left">
                      <span className="text-xs bg-gray-200 px-2 py-1 rounded font-mono">
                        {league.code}
                      </span>
                    </div>
                  </button>
                ))
              ) : (
                <p className="text-center text-gray-500 py-4">
                  {searchName ? 'لا توجد نتائج' : 'اكتب للبحث عن دوري'}
                </p>
              )}
            </div>
          </div>
        )}

        {/* League Info */}
        {leagueInfo && (
          <div className="mt-6 bg-gradient-to-l from-primary-50 to-secondary-50 rounded-xl p-6">
            <h3 className="font-bold text-lg mb-4 text-center">🏆 هل تريد الانضمام لهذا الدوري؟</h3>
            
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
                <span className="text-gray-600">الكود:</span>
                <span className="font-mono bg-gray-100 px-2 py-1 rounded">{leagueInfo.code}</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-gray-600">عدد الأعضاء:</span>
                <span className="font-medium">{leagueInfo._count?.members || 0} عضو</span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-gray-600">الميزانية:</span>
                <span className="font-medium">{leagueInfo.budget || 100}$</span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-gray-600">اللاعبين:</span>
                <span className="font-medium">{leagueInfo.startingPlayers || 8} أساسي + {leagueInfo.substitutes || 4} بديل</span>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setLeagueInfo(null)}
                className="btn-secondary flex-1"
              >
                إلغاء
              </button>
              <button
                onClick={handleJoin}
                disabled={loading}
                className="btn-primary flex-1"
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
          <div className="mt-6 bg-gray-50 rounded-xl p-4">
            <h4 className="font-medium mb-2 flex items-center gap-2">
              <span>💡</span> نصائح
            </h4>
            <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside">
              <li>يمكنك البحث بالكود مباشرة إذا كان لديك</li>
              <li>أو ابحث بالاسم لعرض الدوريات المتاحة</li>
              <li>بعد الانضمام يمكنك إنشاء فريقك الخيالي</li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default JoinLeague;
