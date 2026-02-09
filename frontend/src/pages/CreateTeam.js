import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { leagueAPI, playerAPI, fantasyTeamAPI } from '../services/api';
import toast from 'react-hot-toast';

// تصنيف اللاعبين حسب المركز
const POSITIONS = {
  GK: { name: 'حارس مرمى', icon: '🧤', max: 1 },
  DEF: { name: 'مدافع', icon: '🛡️', max: 4 },
  MID: { name: 'وسط', icon: '🎯', max: 4 },
  FWD: { name: 'مهاجم', icon: '⚽', max: 2 },
};

const CreateTeam = () => {
  const [step, setStep] = useState(1); // 1: اختيار الدوري، 2: تسمية الفريق، 3: اختيار اللاعبين
  const [leagues, setLeagues] = useState([]);
  const [selectedLeague, setSelectedLeague] = useState(null);
  const [teamName, setTeamName] = useState('');
  const [players, setPlayers] = useState([]);
  const [selectedPlayers, setSelectedPlayers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [positionFilter, setPositionFilter] = useState('');
  const navigate = useNavigate();

  // جلب الدوريات المشترك بها
  useEffect(() => {
    fetchLeagues();
  }, []);

  // جلب اللاعبين عند اختيار الدوري
  useEffect(() => {
    if (selectedLeague) {
      fetchPlayers();
    }
  }, [selectedLeague]);

  const fetchLeagues = async () => {
    try {
      const response = await leagueAPI.getAll();
      setLeagues(response.data.leagues || []);
    } catch (error) {
      toast.error('خطأ في جلب الدوريات');
    }
  };

  const fetchPlayers = async () => {
    setLoading(true);
    try {
      const response = await playerAPI.getAll({ leagueId: selectedLeague.id });
      setPlayers(response.data.players || []);
    } catch (error) {
      toast.error('خطأ في جلب اللاعبين');
    } finally {
      setLoading(false);
    }
  };

  // حساب عدد اللاعبين المختارين لكل مركز
  const getPositionCount = (position) => {
    return selectedPlayers.filter(p => p.position === position).length;
  };

  // التحقق من إمكانية إضافة لاعب
  const canAddPlayer = (player) => {
    if (selectedPlayers.find(p => p.id === player.id)) return false;
    if (selectedPlayers.length >= 11) return false;
    if (getPositionCount(player.position) >= POSITIONS[player.position].max) return false;
    return true;
  };

  // إضافة/إزالة لاعب
  const togglePlayer = (player) => {
    if (selectedPlayers.find(p => p.id === player.id)) {
      setSelectedPlayers(selectedPlayers.filter(p => p.id !== player.id));
    } else if (canAddPlayer(player)) {
      setSelectedPlayers([...selectedPlayers, player]);
    } else {
      toast.error('لا يمكن إضافة هذا اللاعب');
    }
  };

  // تصفية اللاعبين
  const filteredPlayers = players.filter(player => {
    const matchesSearch = player.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          player.team?.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesPosition = !positionFilter || player.position === positionFilter;
    return matchesSearch && matchesPosition;
  });

  // إنشاء الفريق
  const handleCreateTeam = async () => {
    if (selectedPlayers.length !== 11) {
      toast.error('يجب اختيار 11 لاعب');
      return;
    }

    setLoading(true);
    try {
      await fantasyTeamAPI.create({
        name: teamName,
        leagueId: selectedLeague.id,
        playerIds: selectedPlayers.map(p => p.id),
      });
      toast.success('تم إنشاء الفريق بنجاح!');
      navigate('/my-team');
    } catch (error) {
      toast.error(error.response?.data?.message || 'خطأ في إنشاء الفريق');
    } finally {
      setLoading(false);
    }
  };

  // الخطوة 1: اختيار الدوري
  if (step === 1) {
    return (
      <div className="max-w-lg mx-auto">
        <div className="card">
          <div className="text-center mb-6">
            <div className="text-5xl mb-4">🏆</div>
            <h1 className="text-2xl font-bold">إنشاء فريق خيالي</h1>
            <p className="text-gray-600 mt-2">الخطوة 1: اختر الدوري</p>
          </div>

          {leagues.length > 0 ? (
            <div className="space-y-3">
              {leagues.map((league) => (
                <button
                  key={league.id}
                  onClick={() => {
                    setSelectedLeague(league);
                    setStep(2);
                  }}
                  className="w-full bg-gray-50 hover:bg-primary-50 rounded-xl p-4 text-right transition border-2 border-transparent hover:border-primary-500"
                >
                  <p className="font-medium">{league.name}</p>
                  <p className="text-sm text-gray-500">كود: {league.code}</p>
                </button>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-600 mb-4">لم تنضم لأي دوري بعد</p>
              <button
                onClick={() => navigate('/join-league')}
                className="btn-primary"
              >
                انضم لدوري أولاً
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // الخطوة 2: تسمية الفريق
  if (step === 2) {
    return (
      <div className="max-w-lg mx-auto">
        <div className="card">
          <div className="text-center mb-6">
            <div className="text-5xl mb-4">✏️</div>
            <h1 className="text-2xl font-bold">إنشاء فريق خيالي</h1>
            <p className="text-gray-600 mt-2">الخطوة 2: اسم الفريق</p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                اسم فريقك الخيالي
              </label>
              <input
                type="text"
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                className="input"
                placeholder="مثال: نجوم رمضان"
                maxLength={50}
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setStep(1)}
                className="btn-secondary flex-1"
              >
                رجوع
              </button>
              <button
                onClick={() => setStep(3)}
                disabled={!teamName.trim()}
                className="btn-primary flex-1"
              >
                التالي
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // الخطوة 3: اختيار اللاعبين
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="card">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold">اختيار اللاعبين</h1>
            <p className="text-gray-600">فريق: {teamName} | دوري: {selectedLeague?.name}</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-2xl">{selectedPlayers.length}/11</span>
            <span className="text-gray-600">لاعب</span>
          </div>
        </div>
      </div>

      {/* Position Progress */}
      <div className="card">
        <div className="grid grid-cols-4 gap-4">
          {Object.entries(POSITIONS).map(([key, { name, icon, max }]) => (
            <div
              key={key}
              className={`text-center p-3 rounded-xl ${
                getPositionCount(key) === max ? 'bg-green-100' : 'bg-gray-50'
              }`}
            >
              <div className="text-2xl">{icon}</div>
              <p className="text-xs text-gray-600">{name}</p>
              <p className="font-bold">
                {getPositionCount(key)}/{max}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Players List */}
        <div className="lg:col-span-2 card">
          <div className="flex flex-col sm:flex-row gap-3 mb-4">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input flex-1"
              placeholder="بحث عن لاعب..."
            />
            <select
              value={positionFilter}
              onChange={(e) => setPositionFilter(e.target.value)}
              className="input w-full sm:w-40"
            >
              <option value="">كل المراكز</option>
              {Object.entries(POSITIONS).map(([key, { name }]) => (
                <option key={key} value={key}>{name}</option>
              ))}
            </select>
          </div>

          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin text-4xl">⚽</div>
            </div>
          ) : (
            <div className="max-h-[400px] overflow-y-auto space-y-2">
              {filteredPlayers.map((player) => {
                const isSelected = selectedPlayers.find(p => p.id === player.id);
                const canAdd = canAddPlayer(player);
                
                return (
                  <div
                    key={player.id}
                    onClick={() => togglePlayer(player)}
                    className={`flex items-center justify-between p-3 rounded-xl cursor-pointer transition ${
                      isSelected 
                        ? 'bg-primary-100 border-2 border-primary-500' 
                        : canAdd 
                          ? 'bg-gray-50 hover:bg-gray-100' 
                          : 'bg-gray-50 opacity-50 cursor-not-allowed'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{POSITIONS[player.position]?.icon}</span>
                      <div>
                        <p className="font-medium">{player.name}</p>
                        <p className="text-xs text-gray-500">{player.team?.name}</p>
                      </div>
                    </div>
                    <div className="text-left">
                      <p className="text-xs text-gray-500">{POSITIONS[player.position]?.name}</p>
                      {isSelected && <span className="text-green-600">✓</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Selected Players */}
        <div className="card">
          <h3 className="font-bold mb-4">الفريق المختار ({selectedPlayers.length}/11)</h3>
          
          {selectedPlayers.length > 0 ? (
            <div className="space-y-2 mb-4">
              {selectedPlayers.map((player) => (
                <div
                  key={player.id}
                  className="flex items-center justify-between bg-gray-50 p-2 rounded-lg"
                >
                  <div className="flex items-center gap-2">
                    <span>{POSITIONS[player.position]?.icon}</span>
                    <span className="text-sm font-medium">{player.name}</span>
                  </div>
                  <button
                    onClick={() => togglePlayer(player)}
                    className="text-red-500 hover:text-red-700"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">لم تختر أي لاعب بعد</p>
          )}

          <div className="space-y-2">
            <button
              onClick={() => setStep(2)}
              className="btn-secondary w-full"
            >
              رجوع
            </button>
            <button
              onClick={handleCreateTeam}
              disabled={selectedPlayers.length !== 11 || loading}
              className="btn-primary w-full"
            >
              {loading ? '⏳ جاري الإنشاء...' : '🎉 إنشاء الفريق'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateTeam;
