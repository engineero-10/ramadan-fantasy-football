import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { leagueAPI, playerAPI, fantasyTeamAPI } from '../services/api';
import toast from 'react-hot-toast';

// تصنيف اللاعبين حسب المركز
const POSITIONS = {
  GOALKEEPER: { name: 'حارس مرمى', icon: '🧤' },
  DEFENDER: { name: 'مدافع', icon: '🛡️' },
  MIDFIELDER: { name: 'وسط', icon: '🎯' },
  FORWARD: { name: 'مهاجم', icon: '⚽' },
};

// القواعد الافتراضية (تأتي من الدوري)
const DEFAULT_RULES = {
  totalPlayers: 12,       // إجمالي اللاعبين
  starters: 8,            // الأساسيين
  substitutes: 4,         // البدلاء
  maxPerTeam: 2,          // الحد الأقصى من نفس الفريق
  budget: 100,            // الميزانية
};

const CreateTeam = () => {
  const [step, setStep] = useState(1); // 1: اختيار الدوري، 2: تسمية الفريق، 3: اختيار اللاعبين
  const [leagues, setLeagues] = useState([]);
  const [selectedLeague, setSelectedLeague] = useState(null);
  const [teamName, setTeamName] = useState('');
  const [players, setPlayers] = useState([]);
  const [selectedPlayers, setSelectedPlayers] = useState([]); // {player, isStarter}
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [positionFilter, setPositionFilter] = useState('');
  const [teamFilter, setTeamFilter] = useState('');
  const navigate = useNavigate();

  // الحصول على قواعد الدوري
  const leagueRules = selectedLeague ? {
    totalPlayers: selectedLeague.startingPlayers + selectedLeague.substitutes,
    starters: selectedLeague.startingPlayers,
    substitutes: selectedLeague.substitutes,
    maxPerTeam: selectedLeague.maxPlayersPerRealTeam,
    budget: parseFloat(selectedLeague.budget),
  } : DEFAULT_RULES;

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
      // جلب الدوريات المشترك فيها فقط
      const response = await leagueAPI.getAll({ myLeagues: 'true' });
      setLeagues(response.data.leagues || []);
    } catch (error) {
      toast.error('خطأ في جلب الدوريات');
    }
  };

  const fetchPlayers = async () => {
    setLoading(true);
    try {
      // جلب كل اللاعبين (limit=1000 لتجاوز الـ pagination)
      const response = await playerAPI.getAll({ leagueId: selectedLeague.id, limit: 1000 });
      setPlayers(response.data.players || []);
    } catch (error) {
      toast.error('خطأ في جلب اللاعبين');
    } finally {
      setLoading(false);
    }
  };

  // حساب الميزانية المستخدمة
  const budgetUsed = selectedPlayers.reduce((sum, sp) => sum + parseFloat(sp.player.price || 0), 0);
  const budgetRemaining = leagueRules.budget - budgetUsed;

  // حساب عدد اللاعبين من كل فريق
  const getTeamPlayerCount = (teamId) => {
    return selectedPlayers.filter(sp => sp.player.teamId === teamId).length;
  };

  // حساب عدد الأساسيين والبدلاء
  const startersCount = selectedPlayers.filter(sp => sp.isStarter).length;
  const substitutesCount = selectedPlayers.filter(sp => !sp.isStarter).length;

  // التحقق من إمكانية إضافة لاعب
  const canAddPlayer = (player, asStarter) => {
    if (!player || !player.position) return false;
    // لاعب موجود بالفعل
    if (selectedPlayers.find(sp => sp.player.id === player.id)) return false;
    // وصلنا للحد الأقصى
    if (selectedPlayers.length >= leagueRules.totalPlayers) return false;
    // تجاوز الميزانية
    if (budgetUsed + parseFloat(player.price || 0) > leagueRules.budget) return false;
    // تجاوز الحد الأقصى من نفس الفريق
    if (getTeamPlayerCount(player.teamId) >= leagueRules.maxPerTeam) return false;
    // التحقق من عدد الأساسيين/البدلاء
    if (asStarter && startersCount >= leagueRules.starters) return false;
    if (!asStarter && substitutesCount >= leagueRules.substitutes) return false;
    return true;
  };

  // إضافة لاعب
  const addPlayer = (player, isStarter) => {
    if (canAddPlayer(player, isStarter)) {
      setSelectedPlayers([...selectedPlayers, { player, isStarter }]);
    } else {
      // محاولة إضافة كبديل إذا لم يمكن كأساسي
      if (isStarter && canAddPlayer(player, false)) {
        setSelectedPlayers([...selectedPlayers, { player, isStarter: false }]);
        toast.success('تمت إضافة اللاعب كبديل');
      } else if (!isStarter && canAddPlayer(player, true)) {
        setSelectedPlayers([...selectedPlayers, { player, isStarter: true }]);
        toast.success('تمت إضافة اللاعب كأساسي');
      } else {
        // عرض سبب المنع
        if (budgetUsed + parseFloat(player.price || 0) > leagueRules.budget) {
          toast.error('الميزانية غير كافية');
        } else if (getTeamPlayerCount(player.teamId) >= leagueRules.maxPerTeam) {
          toast.error(`لا يمكن اختيار أكثر من ${leagueRules.maxPerTeam} لاعبين من نفس الفريق`);
        } else {
          toast.error('لا يمكن إضافة هذا اللاعب');
        }
      }
    }
  };

  // إزالة لاعب
  const removePlayer = (playerId) => {
    setSelectedPlayers(selectedPlayers.filter(sp => sp.player.id !== playerId));
  };

  // تغيير حالة اللاعب (أساسي/بديل)
  const toggleStarterStatus = (playerId) => {
    setSelectedPlayers(selectedPlayers.map(sp => {
      if (sp.player.id === playerId) {
        const newIsStarter = !sp.isStarter;
        // التحقق من الحدود
        if (newIsStarter && startersCount >= leagueRules.starters) {
          toast.error('وصلت للحد الأقصى من الأساسيين');
          return sp;
        }
        if (!newIsStarter && substitutesCount >= leagueRules.substitutes) {
          toast.error('وصلت للحد الأقصى من البدلاء');
          return sp;
        }
        return { ...sp, isStarter: newIsStarter };
      }
      return sp;
    }));
  };

  // الحصول على الفرق المتاحة
  const availableTeams = [...new Set(players.map(p => p.team?.name).filter(Boolean))];

  // تصفية اللاعبين
  const filteredPlayers = players.filter(player => {
    const matchesSearch = player.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          player.team?.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesPosition = !positionFilter || player.position === positionFilter;
    const matchesTeam = !teamFilter || player.team?.name === teamFilter;
    return matchesSearch && matchesPosition && matchesTeam;
  });

  // إنشاء الفريق
  const handleCreateTeam = async () => {
    if (selectedPlayers.length !== leagueRules.totalPlayers) {
      toast.error(`يجب اختيار ${leagueRules.totalPlayers} لاعب`);
      return;
    }
    if (startersCount !== leagueRules.starters) {
      toast.error(`يجب اختيار ${leagueRules.starters} أساسيين`);
      return;
    }
    if (substitutesCount !== leagueRules.substitutes) {
      toast.error(`يجب اختيار ${leagueRules.substitutes} بدلاء`);
      return;
    }

    setLoading(true);
    try {
      await fantasyTeamAPI.create({
        name: teamName,
        leagueId: selectedLeague.id,
        players: selectedPlayers.map(sp => ({
          playerId: sp.player.id,
          isStarter: sp.isStarter
        })),
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
      {/* Header with Budget & Rules */}
      <div className="card">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold">اختيار اللاعبين</h1>
            <p className="text-gray-600">فريق: {teamName} | دوري: {selectedLeague?.name}</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-center bg-gray-50 px-4 py-2 rounded-xl">
              <p className="text-2xl font-bold">{selectedPlayers.length}/{leagueRules.totalPlayers}</p>
              <p className="text-xs text-gray-600">لاعب</p>
            </div>
            <div className={`text-center px-4 py-2 rounded-xl ${budgetRemaining < 0 ? 'bg-red-100' : 'bg-green-100'}`}>
              <p className="text-2xl font-bold">{budgetRemaining.toFixed(1)}$</p>
              <p className="text-xs text-gray-600">متبقي من {leagueRules.budget}$</p>
            </div>
          </div>
        </div>
      </div>

      {/* Rules Summary */}
      <div className="card bg-blue-50">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div>
            <p className="text-2xl font-bold text-green-600">{startersCount}/{leagueRules.starters}</p>
            <p className="text-xs">أساسي</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-yellow-600">{substitutesCount}/{leagueRules.substitutes}</p>
            <p className="text-xs">بديل</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-blue-600">{leagueRules.maxPerTeam}</p>
            <p className="text-xs">أقصى من فريق واحد</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-purple-600">{budgetUsed.toFixed(1)}$</p>
            <p className="text-xs">مستخدم</p>
          </div>
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
              className="input w-full sm:w-32"
            >
              <option value="">كل المراكز</option>
              {Object.entries(POSITIONS).map(([key, { name }]) => (
                <option key={key} value={key}>{name}</option>
              ))}
            </select>
            <select
              value={teamFilter}
              onChange={(e) => setTeamFilter(e.target.value)}
              className="input w-full sm:w-40"
            >
              <option value="">كل الفرق</option>
              {availableTeams.map((team) => (
                <option key={team} value={team}>{team}</option>
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
                const isSelected = selectedPlayers.find(sp => sp.player.id === player.id);
                const teamCount = getTeamPlayerCount(player.teamId);
                const canAfford = budgetUsed + parseFloat(player.price || 0) <= leagueRules.budget;
                const teamLimitOk = teamCount < leagueRules.maxPerTeam;
                const canAddStarter = canAddPlayer(player, true);
                const canAddSub = canAddPlayer(player, false);
                
                return (
                  <div
                    key={player.id}
                    className={`flex items-center justify-between p-3 rounded-xl transition ${
                      isSelected 
                        ? 'bg-primary-100 border-2 border-primary-500' 
                        : 'bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{POSITIONS[player.position]?.icon}</span>
                      <div>
                        <p className="font-medium">{player.name}</p>
                        <p className="text-xs text-gray-500">
                          {player.team?.name} 
                          {teamCount > 0 && <span className="text-orange-500 mr-1">({teamCount}/{leagueRules.maxPerTeam})</span>}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-green-600">{parseFloat(player.price || 0).toFixed(1)}$</span>
                      {isSelected ? (
                        <button
                          onClick={() => removePlayer(player.id)}
                          className="px-3 py-1 bg-red-500 text-white rounded-lg text-sm hover:bg-red-600"
                        >
                          إزالة
                        </button>
                      ) : (
                        <div className="flex gap-1">
                          <button
                            onClick={() => addPlayer(player, true)}
                            disabled={!canAddStarter}
                            className={`px-2 py-1 rounded-lg text-xs ${
                              canAddStarter 
                                ? 'bg-green-500 text-white hover:bg-green-600' 
                                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                            }`}
                            title="إضافة كأساسي"
                          >
                            أساسي
                          </button>
                          <button
                            onClick={() => addPlayer(player, false)}
                            disabled={!canAddSub}
                            className={`px-2 py-1 rounded-lg text-xs ${
                              canAddSub 
                                ? 'bg-yellow-500 text-white hover:bg-yellow-600' 
                                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                            }`}
                            title="إضافة كبديل"
                          >
                            بديل
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Selected Players */}
        <div className="card">
          <h3 className="font-bold mb-4">الفريق المختار</h3>
          
          {/* الأساسيين */}
          <div className="mb-4">
            <h4 className="text-sm font-medium text-green-600 mb-2">⭐ الأساسيين ({startersCount}/{leagueRules.starters})</h4>
            {selectedPlayers.filter(sp => sp.isStarter).length > 0 ? (
              <div className="space-y-2">
                {selectedPlayers.filter(sp => sp.isStarter).map((sp) => (
                  <div
                    key={sp.player.id}
                    className="flex items-center justify-between bg-green-50 p-2 rounded-lg"
                  >
                    <div className="flex items-center gap-2">
                      <span>{POSITIONS[sp.player.position]?.icon}</span>
                      <div>
                        <span className="text-sm font-medium">{sp.player.name}</span>
                        <span className="text-xs text-gray-500 mr-1">({sp.player.price}$)</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => toggleStarterStatus(sp.player.id)}
                        className="text-yellow-500 hover:text-yellow-700 text-xs"
                        title="تحويل لبديل"
                      >
                        ↓
                      </button>
                      <button
                        onClick={() => removePlayer(sp.player.id)}
                        className="text-red-500 hover:text-red-700"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-400 text-sm text-center py-2">لا يوجد أساسيين</p>
            )}
          </div>

          {/* البدلاء */}
          <div className="mb-4">
            <h4 className="text-sm font-medium text-yellow-600 mb-2">📋 البدلاء ({substitutesCount}/{leagueRules.substitutes})</h4>
            {selectedPlayers.filter(sp => !sp.isStarter).length > 0 ? (
              <div className="space-y-2">
                {selectedPlayers.filter(sp => !sp.isStarter).map((sp) => (
                  <div
                    key={sp.player.id}
                    className="flex items-center justify-between bg-yellow-50 p-2 rounded-lg"
                  >
                    <div className="flex items-center gap-2">
                      <span>{POSITIONS[sp.player.position]?.icon}</span>
                      <div>
                        <span className="text-sm font-medium">{sp.player.name}</span>
                        <span className="text-xs text-gray-500 mr-1">({sp.player.price}$)</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => toggleStarterStatus(sp.player.id)}
                        className="text-green-500 hover:text-green-700 text-xs"
                        title="تحويل لأساسي"
                      >
                        ↑
                      </button>
                      <button
                        onClick={() => removePlayer(sp.player.id)}
                        className="text-red-500 hover:text-red-700"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-400 text-sm text-center py-2">لا يوجد بدلاء</p>
            )}
          </div>

          <div className="space-y-2">
            <button
              onClick={() => setStep(2)}
              className="btn-secondary w-full"
            >
              رجوع
            </button>
            <button
              onClick={handleCreateTeam}
              disabled={selectedPlayers.length !== leagueRules.totalPlayers || startersCount !== leagueRules.starters || loading}
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
