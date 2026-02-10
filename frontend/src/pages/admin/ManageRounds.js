import React, { useState, useEffect } from 'react';
import { roundAPI, leagueAPI } from '../../services/api';
import toast from 'react-hot-toast';

const ManageRounds = ({ fixedLeagueId }) => {
  const [rounds, setRounds] = useState([]);
  const [leagues, setLeagues] = useState([]);
  const [selectedLeague, setSelectedLeague] = useState(fixedLeagueId || '');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [statsLoading, setStatsLoading] = useState(false);
  const [roundStats, setRoundStats] = useState(null);
  const [editingRound, setEditingRound] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    roundNumber: '',
    leagueId: fixedLeagueId || '',
    startDate: '',
    endDate: '',
    lockTime: '',
  });

  useEffect(() => {
    if (!fixedLeagueId) {
      fetchLeagues();
    } else {
      // جلب بيانات الدوري المحدد لعرضه في الـ form
      fetchLeagueData();
      setSelectedLeague(fixedLeagueId);
    }
  }, [fixedLeagueId]);

  useEffect(() => {
    if (selectedLeague) {
      fetchRounds();
    }
  }, [selectedLeague]);

  const fetchLeagueData = async () => {
    try {
      const response = await leagueAPI.getById(fixedLeagueId);
      const league = response.data.league || response.data;
      setLeagues([league]);
    } catch (error) {
      console.error('Error fetching league:', error);
    }
  };

  const fetchLeagues = async () => {
    try {
      const response = await leagueAPI.getAll();
      setLeagues(response.data.leagues || []);
      if (response.data.leagues?.length > 0) {
        setSelectedLeague(response.data.leagues[0].id);
      }
    } catch (error) {
      toast.error('خطأ في جلب الدوريات');
    }
  };

  const fetchRounds = async () => {
    setLoading(true);
    try {
      const response = await roundAPI.getAll(selectedLeague);
      setRounds(response.data.rounds || []);
    } catch (error) {
      toast.error('خطأ في جلب الجولات');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = {
        ...formData,
        roundNumber: parseInt(formData.roundNumber),
        startDate: formData.startDate ? new Date(formData.startDate).toISOString() : null,
        endDate: formData.endDate ? new Date(formData.endDate).toISOString() : null,
        lockTime: formData.lockTime ? new Date(formData.lockTime).toISOString() : null,
      };
      
      if (editingRound) {
        await roundAPI.update(editingRound.id, data);
        toast.success('تم تحديث الجولة بنجاح');
      } else {
        await roundAPI.create(data);
        toast.success('تم إنشاء الجولة بنجاح');
      }
      setShowModal(false);
      resetForm();
      fetchRounds();
    } catch (error) {
      toast.error(error.response?.data?.message || 'حدث خطأ');
    }
  };

  const handleEdit = (round) => {
    setEditingRound(round);
    setFormData({
      name: round.name,
      roundNumber: round.roundNumber,
      leagueId: round.leagueId,
      startDate: round.startDate ? new Date(round.startDate).toISOString().slice(0, 16) : '',
      endDate: round.endDate ? new Date(round.endDate).toISOString().slice(0, 16) : '',
      lockTime: round.lockTime ? new Date(round.lockTime).toISOString().slice(0, 16) : '',
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('هل أنت متأكد من حذف هذه الجولة؟')) return;
    
    try {
      await roundAPI.delete(id);
      toast.success('تم حذف الجولة');
      fetchRounds();
    } catch (error) {
      toast.error(error.response?.data?.message || 'خطأ في الحذف');
    }
  };

  const toggleTransfers = async (roundId, currentState) => {
    try {
      await roundAPI.toggleTransfers(roundId, !currentState);
      toast.success(currentState ? 'تم إغلاق الانتقالات' : 'تم فتح الانتقالات');
      fetchRounds();
    } catch (error) {
      toast.error('خطأ في تغيير حالة الانتقالات');
    }
  };

  const completeRound = async (roundId) => {
    if (!window.confirm('هل أنت متأكد من إنهاء هذه الجولة؟ سيتم احتساب النقاط للجميع.')) return;
    
    try {
      await roundAPI.complete(roundId);
      toast.success('تم إنهاء الجولة واحتساب النقاط');
      fetchRounds();
    } catch (error) {
      toast.error('خطأ في إنهاء الجولة');
    }
  };

  const viewRoundStats = async (roundId) => {
    setStatsLoading(true);
    setShowStatsModal(true);
    try {
      const response = await roundAPI.getStats(roundId);
      setRoundStats(response.data);
    } catch (error) {
      toast.error('خطأ في جلب إحصائيات الجولة');
      setShowStatsModal(false);
    } finally {
      setStatsLoading(false);
    }
  };

  const resetForm = () => {
    setEditingRound(null);
    setFormData({
      name: '',
      roundNumber: '',
      leagueId: selectedLeague || '',
      startDate: '',
      endDate: '',
      lockTime: '',
    });
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('ar-SA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">📅 إدارة الجولات</h1>
          <p className="text-gray-600 text-sm sm:text-base">إنشاء وإدارة جولات البطولة</p>
        </div>
        <div className="flex gap-2 sm:gap-3">
          {!fixedLeagueId && (
            <select
              value={selectedLeague}
              onChange={(e) => setSelectedLeague(e.target.value)}
              className="input text-sm sm:text-base flex-1 sm:flex-none width-55"
            >
              {leagues.map((league) => (
                <option key={league.id} value={league.id}>
                  {league.name}
                </option>
              ))}
            </select>
          )}
          <button
            onClick={() => {
              resetForm();
              setShowModal(true);
            }}
            className="btn-primary text-sm sm:text-base whitespace-nowrap" 
          >
            <span className="hidden sm:inline">➕ إنشاء جولة</span>
            <span className="sm:hidden">➕ إنشاء</span>
          </button>
        </div>
      </div>

      {/* Rounds List */}
      <div className="card p-3 sm:p-6">
        {loading ? (
          <div className="text-center py-6 sm:py-8">
            <div className="animate-spin text-3xl sm:text-4xl">⚙️</div>
          </div>
        ) : rounds.length > 0 ? (
          <div className="space-y-3 sm:space-y-4">
            {rounds.map((round, index) => (
              <div
                key={round.id}
                className={`bg-gray-50 rounded-lg sm:rounded-xl p-3 sm:p-4 ${round.isActive ? 'ring-2 ring-primary-500' : ''}`}
              >
                <div className="flex flex-col gap-3 sm:gap-4">
                  {/* Round Header */}
                  <div className="flex items-center gap-2 sm:gap-4">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white rounded-full flex items-center justify-center text-lg sm:text-xl font-bold shadow flex-shrink-0">
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-sm sm:text-base truncate">{round.name}</h3>
                      <div className="flex flex-wrap gap-1 sm:gap-2 mt-1">
                        {round.isActive && (
                          <span className="bg-green-100 text-green-700 text-[10px] sm:text-xs px-1 sm:px-2 py-0.5 sm:py-1 rounded">
                            🟢 نشطة
                          </span>
                        )}
                        {round.isCompleted && (
                          <span className="bg-gray-200 text-gray-700 text-[10px] sm:text-xs px-1 sm:px-2 py-0.5 sm:py-1 rounded">
                            ✅ مكتملة
                          </span>
                        )}
                        <span className={`text-[10px] sm:text-xs px-1 sm:px-2 py-0.5 sm:py-1 rounded ${round.transfersOpen ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-700'}`}>
                          {round.transfersOpen ? '🔓 مفتوحة' : '🔒 مغلقة'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-wrap gap-1 sm:gap-2">
                    <button
                      onClick={() => viewRoundStats(round.id)}
                      className="text-[10px] sm:text-sm px-2 sm:px-3 py-1 rounded bg-amber-100 text-amber-700 hover:bg-amber-200"
                    >
                      📊
                    </button>
                    <button
                      onClick={() => toggleTransfers(round.id, round.transfersOpen)}
                      className={`text-[10px] sm:text-sm px-2 sm:px-3 py-1 rounded ${round.transfersOpen ? 'bg-red-100 text-red-700 hover:bg-red-200' : 'bg-green-100 text-green-700 hover:bg-green-200'}`}
                    >
                      {round.transfersOpen ? '🔒' : '🔓'}
                      <span className="hidden sm:inline"> {round.transfersOpen ? 'إغلاق' : 'فتح'}</span>
                    </button>
                    {!round.isCompleted && (
                      <button
                        onClick={() => completeRound(round.id)}
                        className="text-[10px] sm:text-sm px-2 sm:px-3 py-1 rounded bg-purple-100 text-purple-700 hover:bg-purple-200"
                      >
                        ✅<span className="hidden sm:inline"> إنهاء</span>
                      </button>
                    )}
                    <button
                      onClick={() => handleEdit(round)}
                      className="text-[10px] sm:text-sm px-2 sm:px-3 py-1 rounded bg-blue-100 text-blue-700 hover:bg-blue-200"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => handleDelete(round.id)}
                      className="text-[10px] sm:text-sm px-2 sm:px-3 py-1 rounded bg-red-100 text-red-700 hover:bg-red-200"
                    >
                      🗑️
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4 mt-3 sm:mt-4 pt-3 sm:pt-4 border-t">
                  <div>
                    <p className="text-[10px] sm:text-xs text-gray-500">بداية الجولة</p>
                    <p className="text-xs sm:text-sm">{formatDate(round.startDate)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] sm:text-xs text-gray-500">نهاية الجولة</p>
                    <p className="text-xs sm:text-sm">{formatDate(round.endDate)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] sm:text-xs text-gray-500">إغلاق الانتقالات</p>
                    <p className="text-xs sm:text-sm">{formatDate(round.lockTime)}</p>
                  </div>
                </div>

                <div className="flex gap-4 mt-2 sm:mt-3 text-xs sm:text-sm text-gray-600">
                  <span>📅 {round._count?.matches || 0} مباراة</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 sm:py-12">
            <div className="text-4xl sm:text-5xl mb-4">📅</div>
            <p className="text-gray-600 text-sm sm:text-base">لا توجد جولات بعد</p>
            <button
              onClick={() => {
                resetForm();
                setShowModal(true);
              }}
              className="btn-primary mt-4 text-sm sm:text-base"
            >
              إنشاء أول جولة
            </button>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-2 sm:p-4 z-50">
          <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 w-full max-w-md max-h-[95vh] overflow-y-auto">
            <h2 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4">
              {editingRound ? 'تعديل الجولة' : 'إنشاء جولة جديدة'}
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                  اسم الجولة *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="input text-sm sm:text-base"
                  placeholder="مثال: الجولة الأولى"
                  required
                />
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                  رقم الجولة *
                </label>
                <input
                  type="number"
                  value={formData.roundNumber}
                  onChange={(e) => setFormData({ ...formData, roundNumber: e.target.value })}
                  className="input text-sm sm:text-base"
                  placeholder="مثال: 1"
                  required
                  min="1"
                />
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                  الدوري *
                </label>
                <select
                  value={formData.leagueId}
                  onChange={(e) => setFormData({ ...formData, leagueId: e.target.value })}
                  className="input text-sm sm:text-base"
                  required
                >
                  <option value="">اختر الدوري</option>
                  {leagues.map((league) => (
                    <option key={league.id} value={league.id}>
                      {league.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                  بداية الجولة
                </label>
                <input
                  type="datetime-local"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  className="input text-sm sm:text-base"
                />
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                  نهاية الجولة
                </label>
                <input
                  type="datetime-local"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  className="input text-sm sm:text-base"
                />
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                  موعد إغلاق الانتقالات
                </label>
                <input
                  type="datetime-local"
                  value={formData.lockTime}
                  onChange={(e) => setFormData({ ...formData, lockTime: e.target.value })}
                  className="input text-sm sm:text-base"
                />
              </div>

              <div className="flex gap-2 sm:gap-3 pt-3 sm:pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    resetForm();
                  }}
                  className="btn-secondary flex-1 text-sm sm:text-base"
                >
                  إلغاء
                </button>
                <button type="submit" className="btn-primary flex-1 text-sm sm:text-base">
                  {editingRound ? 'تحديث' : 'إنشاء'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Stats Modal */}
      {showStatsModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-2 sm:p-4 z-50">
          <div className="bg-white rounded-xl sm:rounded-2xl p-3 sm:p-6 w-full max-w-4xl max-h-[95vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <h2 className="text-base sm:text-xl font-bold truncate flex-1 ml-2">
                📊 إحصائيات {roundStats?.round?.name || 'الجولة'}
              </h2>
              <button
                onClick={() => {
                  setShowStatsModal(false);
                  setRoundStats(null);
                }}
                className="text-gray-500 hover:text-gray-700 text-xl sm:text-2xl w-8 h-8 flex items-center justify-center flex-shrink-0"
              >
                ✕
              </button>
            </div>

            {statsLoading ? (
              <div className="text-center py-8 sm:py-12">
                <div className="animate-spin text-3xl sm:text-4xl">⚙️</div>
                <p className="mt-2 text-gray-600 text-sm">جاري تحميل الإحصائيات...</p>
              </div>
            ) : roundStats ? (
              <div className="space-y-4 sm:space-y-6">
                {/* Summary Stats */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4">
                  <div className="bg-blue-50 rounded-lg sm:rounded-xl p-2 sm:p-4 text-center">
                    <p className="text-xl sm:text-3xl font-bold text-blue-600">{roundStats.statistics?.totalParticipants || 0}</p>
                    <p className="text-[10px] sm:text-sm text-gray-600">المشاركين</p>
                  </div>
                  <div className="bg-green-50 rounded-lg sm:rounded-xl p-2 sm:p-4 text-center">
                    <p className="text-xl sm:text-3xl font-bold text-green-600">{roundStats.statistics?.highestPoints || 0}</p>
                    <p className="text-[10px] sm:text-sm text-gray-600">أعلى نقاط</p>
                  </div>
                  <div className="bg-amber-50 rounded-lg sm:rounded-xl p-2 sm:p-4 text-center">
                    <p className="text-xl sm:text-3xl font-bold text-amber-600">{roundStats.statistics?.averagePoints || 0}</p>
                    <p className="text-[10px] sm:text-sm text-gray-600">المتوسط</p>
                  </div>
                  <div className="bg-red-50 rounded-lg sm:rounded-xl p-2 sm:p-4 text-center">
                    <p className="text-xl sm:text-3xl font-bold text-red-600">{roundStats.statistics?.lowestPoints || 0}</p>
                    <p className="text-[10px] sm:text-sm text-gray-600">أقل نقاط</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                  {/* User Rankings */}
                  <div className="bg-gray-50 rounded-lg sm:rounded-xl p-3 sm:p-4">
                    <h3 className="font-bold text-sm sm:text-lg mb-3 sm:mb-4 flex items-center gap-2">
                      🏆 ترتيب المستخدمين
                    </h3>
                    {roundStats.userRankings?.length > 0 ? (
                      <div className="space-y-2 max-h-60 sm:max-h-80 overflow-y-auto">
                        {roundStats.userRankings.map((user, index) => (
                          <div
                            key={user.userId}
                            className={`flex items-center justify-between p-2 sm:p-3 rounded-lg ${
                              index === 0 ? 'bg-yellow-100' :
                              index === 1 ? 'bg-gray-200' :
                              index === 2 ? 'bg-amber-100' : 'bg-white'
                            }`}
                          >
                            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                              <span className={`w-6 h-6 sm:w-8 sm:h-8 flex items-center justify-center rounded-full font-bold text-xs sm:text-sm ${
                                index === 0 ? 'bg-yellow-400 text-white' :
                                index === 1 ? 'bg-gray-400 text-white' :
                                index === 2 ? 'bg-amber-600 text-white' : 'bg-gray-300'
                              }`}>
                                {user.rank}
                              </span>
                              <div className="min-w-0">
                                <p className="font-medium text-xs sm:text-sm truncate">{user.userName}</p>
                                <p className="text-[10px] sm:text-xs text-gray-500 truncate">{user.teamName}</p>
                              </div>
                            </div>
                            <div className="text-left flex-shrink-0">
                              <p className="font-bold text-sm sm:text-lg">{user.points}</p>
                              <p className="text-[10px] sm:text-xs text-gray-500">نقطة</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-center text-gray-500 py-6 sm:py-8 text-sm">لا توجد بيانات بعد</p>
                    )}
                  </div>

                  {/* Top 10 Players */}
                  <div className="bg-gray-50 rounded-lg sm:rounded-xl p-3 sm:p-4">
                    <h3 className="font-bold text-sm sm:text-lg mb-3 sm:mb-4 flex items-center gap-2">
                      ⭐ أعلى 10 لاعبين
                    </h3>
                    {roundStats.topPlayers?.length > 0 ? (
                      <div className="space-y-2 max-h-60 sm:max-h-80 overflow-y-auto">
                        {roundStats.topPlayers.map((player, index) => (
                          <div
                            key={`${player.playerId}-${index}`}
                            className={`p-2 sm:p-3 rounded-lg ${
                              index === 0 ? 'bg-yellow-100' :
                              index === 1 ? 'bg-gray-200' :
                              index === 2 ? 'bg-amber-100' : 'bg-white'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                                <span className={`w-6 h-6 sm:w-8 sm:h-8 flex items-center justify-center rounded-full font-bold text-xs sm:text-sm ${
                                  index === 0 ? 'bg-yellow-400 text-white' :
                                  index === 1 ? 'bg-gray-400 text-white' :
                                  index === 2 ? 'bg-amber-600 text-white' : 'bg-gray-300'
                                }`}>
                                  {player.rank}
                                </span>
                                <div className="min-w-0">
                                  <p className="font-medium text-xs sm:text-sm truncate">{player.playerName}</p>
                                  <p className="text-[10px] sm:text-xs text-gray-500 truncate">
                                    {player.teamShortName || player.teamName} • {
                                      player.position === 'GOALKEEPER' ? 'حارس' :
                                      player.position === 'DEFENDER' ? 'مدافع' :
                                      player.position === 'MIDFIELDER' ? 'وسط' : 'مهاجم'
                                    }
                                  </p>
                                </div>
                              </div>
                              <div className="text-left flex-shrink-0">
                                <p className="font-bold text-sm sm:text-lg">{player.points}</p>
                                <p className="text-[10px] sm:text-xs text-gray-500">نقطة</p>
                              </div>
                            </div>
                            <div className="flex flex-wrap gap-2 sm:gap-3 mt-1 sm:mt-2 text-[10px] sm:text-xs text-gray-600">
                              {player.goals > 0 && <span>⚽ {player.goals}</span>}
                              {player.assists > 0 && <span>👟 {player.assists}</span>}
                              {player.cleanSheet && <span>🧤</span>}
                              {player.bonusPoints > 0 && <span>✨ +{player.bonusPoints}</span>}
                            </div>
                            <p className="text-[10px] sm:text-xs text-gray-400 mt-1 truncate">{player.matchInfo}</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-center text-gray-500 py-6 sm:py-8 text-sm">لا توجد بيانات بعد</p>
                    )}
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageRounds;
