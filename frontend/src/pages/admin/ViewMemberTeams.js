import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { leagueAPI, fantasyTeamAPI } from '../../services/api';
import toast from 'react-hot-toast';

const POSITIONS = {
  GOALKEEPER: { name: 'حارس مرمى', icon: '🧤', color: 'bg-yellow-500' },
  DEFENDER: { name: 'مدافع', icon: '🛡️', color: 'bg-blue-500' },
  MIDFIELDER: { name: 'وسط', icon: '🎯', color: 'bg-green-500' },
  FORWARD: { name: 'مهاجم', icon: '⚽', color: 'bg-red-500' },
};

const ViewMemberTeams = () => {
  const [searchParams] = useSearchParams();
  const leagueIdParam = searchParams.get('leagueId');

  const [leagues, setLeagues] = useState([]);
  const [selectedLeagueId, setSelectedLeagueId] = useState(leagueIdParam ? parseInt(leagueIdParam) : null);
  const [fantasyTeams, setFantasyTeams] = useState([]);
  // const [selectedTeam, setSelectedTeam] = useState(null);
  const [loading, setLoading] = useState(true);
  // Round history modal state
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyData, setHistoryData] = useState(null);
  const [selectedHistoryRound, setSelectedHistoryRound] = useState(null);
  const [historyTeam, setHistoryTeam] = useState(null);
  // Open round history modal for a team
  const openHistoryModal = async (team) => {
    setHistoryLoading(true);
    setShowHistoryModal(true);
    setHistoryTeam(team);
    setHistoryData(null);
    setSelectedHistoryRound(null);
    try {
      const res = await fantasyTeamAPI.getHistory(team.id);
      setHistoryData(res.data);
      if (res.data.history && res.data.history.length > 0) {
        setSelectedHistoryRound(res.data.history[res.data.history.length - 1]);
      }
    } catch (error) {
      toast.error('خطأ في جلب سجل الجولات');
    } finally {
      setHistoryLoading(false);
    }
  };

  const closeHistoryModal = () => {
    setShowHistoryModal(false);
    setHistoryData(null);
    setSelectedHistoryRound(null);
    setHistoryTeam(null);
  };

  useEffect(() => {
    const loadLeagues = async () => {
      try {
        const response = await leagueAPI.getAll();
        const leaguesList = response.data.leagues || [];
        setLeagues(leaguesList);
        
        if (leaguesList.length > 0 && !leagueIdParam) {
          setSelectedLeagueId(leaguesList[0].id);
        }
      } catch (error) {
        toast.error('خطأ في جلب الدوريات');
      } finally {
        setLoading(false);
      }
    };
    loadLeagues();
  }, [leagueIdParam]);


  useEffect(() => {
    if (selectedLeagueId) {
      fetchTeamsWithLastRoundPoints();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedLeagueId]);

  // جلب الفرق مع نقاط آخر جولة منتهية
  const fetchTeamsWithLastRoundPoints = async () => {
    try {
      const response = await leagueAPI.getFantasyTeams(selectedLeagueId);
      let teams = response.data.fantasyTeams || [];
      // جلب سجل الجولات لكل فريق
      const histories = await Promise.all(
        teams.map(team =>
          fantasyTeamAPI.getHistory(team.id)
            .then(res => res.data?.history || [])
            .catch(() => [])
        )
      );
      // استخراج نقاط آخر جولة منتهية
      teams = teams.map((team, idx) => {
        const history = histories[idx];
        const lastFinished = [...history].reverse().find(r => r.isCompleted);
        return {
          ...team,
          lastFinishedRoundPoints: lastFinished ? lastFinished.roundPoints : null
        };
      });
      setFantasyTeams(teams);
    } catch (error) {
      toast.error('خطأ في جلب الفرق أو نقاط آخر جولة');
    }
  };



  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="text-4xl animate-bounce mb-4">⚽</div>
          <p className="text-gray-600">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-l from-indigo-600 to-purple-600 rounded-2xl p-6 text-white">
        <h1 className="text-2xl font-bold mb-2">عرض فرق الأعضاء 👥</h1>
        <p className="text-white/80">اختر دوري لعرض تشكيلات فرق الأعضاء مع النقاط الإجمالية</p>
      </div>

      {/* League Selector */}
      <div className="card">
        <label className="block text-sm font-medium text-gray-700 mb-2">اختر الدوري:</label>
        <select
          value={selectedLeagueId || ''}
          onChange={(e) => setSelectedLeagueId(parseInt(e.target.value))}
          className="input w-full"
        >
          {leagues.map(league => (
            <option key={league.id} value={league.id}>
              {league.name} - {league._count?.members || 0} عضو
            </option>
          ))}
        </select>
      </div>

      {/* Fantasy Teams List */}
      <div className="card">
        <h2 className="text-lg font-bold mb-4">فرق الفانتازي ({fantasyTeams.length})</h2>
        
        {fantasyTeams.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <span className="text-4xl">📭</span>
            <p className="mt-2">لا توجد فرق في هذا الدوري</p>
          </div>
        ) : (
          <div className="space-y-3">
            {fantasyTeams.map((team, index) => (
              <div 
                key={team.id}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition"
              >
                <div className="flex items-center gap-4">
                  {/* الترتيب */}
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                    index === 0 ? 'bg-yellow-500 text-white' :
                    index === 1 ? 'bg-gray-400 text-white' :
                    index === 2 ? 'bg-amber-600 text-white' :
                    'bg-gray-200 text-gray-700'
                  }`}>
                    {index + 1}
                  </div>
                  
                  {/* معلومات الفريق */}
                  <div>
                    <h3 className="font-bold text-lg">{team.name}</h3>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <span>👤 {team.user?.name}</span>
                      <span>•</span>
                      <span>📧 {team.user?.email}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-6">
                  {/* نقاط آخر جولة منتهية */}
                  <div className="text-center">
                    <p className="text-2xl font-bold text-green-600">{team.lastFinishedRoundPoints ?? '--'}</p>
                    <p className="text-xs text-gray-500">نقاط آخر جولة منتهية</p>
                  </div>
                  {/* إجمالي النقاط */}
                  <div className="text-center">
                    <p className="text-2xl font-bold text-primary-600">{team.totalPoints || 0}</p>
                    <p className="text-xs text-gray-500">إجمالي النقاط</p>
                  </div>
                  {/* زر سجل الجولات */}
                  <button
                    onClick={() => openHistoryModal(team)}
                    className="btn-secondary text-sm"
                  >
                    🗒️ سجل الجولات
                  </button>
                      {/* Round History Modal */}
                      {showHistoryModal && (
                        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-auto">
                          <div className="bg-white rounded-2xl w-full max-w-5xl max-h-[95vh] overflow-auto">
                            {/* Modal Header */}
                            <div className="sticky top-0 bg-gradient-to-l from-primary-600 to-secondary-600 text-white p-4 sm:p-6 rounded-t-2xl z-10 flex items-center justify-between">
                              <div>
                                <h2 className="text-xl sm:text-2xl font-bold">سجل الجولات - {historyTeam?.name}</h2>
                                <p className="text-white/80 text-sm sm:text-base">👤 {historyTeam?.user?.name} • 📧 {historyTeam?.user?.email}</p>
                              </div>
                              <button
                                onClick={closeHistoryModal}
                                className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30"
                              >✕</button>
                            </div>
                            {/* Modal Content */}
                            <div className="p-4 sm:p-6">
                              {historyLoading ? (
                                <div className="flex items-center justify-center min-h-[200px]">
                                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
                                </div>
                              ) : historyData && historyData.history && historyData.history.length > 0 ? (
                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                  {/* Rounds Sidebar */}
                                  <div className="lg:col-span-1">
                                    <div className="bg-white rounded-xl shadow-sm p-4">
                                      <h3 className="text-lg font-bold mb-4">الجولات</h3>
                                      <div className="space-y-2 max-h-96 overflow-y-auto">
                                        {historyData.history.map((round) => (
                                          <button
                                            key={round.roundId}
                                            onClick={() => setSelectedHistoryRound(round)}
                                            className={`w-full text-right p-3 rounded-lg transition ${
                                              selectedHistoryRound?.roundId === round.roundId
                                                ? 'bg-primary-100 border-2 border-primary-500'
                                                : 'bg-gray-50 hover:bg-gray-100 border-2 border-transparent'
                                            }`}
                                          >
                                            <div className="flex justify-between items-center">
                                              <span className={`text-sm px-2 py-1 rounded ${
                                                round.isCompleted 
                                                  ? 'bg-gray-200 text-gray-600' 
                                                  : 'bg-green-100 text-green-700'
                                              }`}>
                                                {round.isCompleted ? 'مكتملة' : 'جارية'}
                                              </span>
                                              <span className="font-bold">{round.roundName}</span>
                                            </div>
                                            <div className="flex justify-between items-center mt-2 text-sm text-gray-600">
                                              <span>#{round.rank || '-'} / {round.totalTeams}</span>
                                              <span className="font-bold text-primary-600">{round.roundPoints} نقطة</span>
                                            </div>
                                            <div className="text-xs text-gray-400 mt-1">
                                              {new Date(round.startDate).toLocaleDateString('ar-EG', { year: 'numeric', month: 'short', day: 'numeric' })}
                                            </div>
                                          </button>
                                        ))}
                                      </div>
                                    </div>
                                  </div>
                                  {/* Round Details */}
                                  <div className="lg:col-span-2">
                                    {selectedHistoryRound ? (
                                      <div className="bg-white rounded-xl shadow-sm p-6">
                                        {/* Round Header */}
                                        <div className="flex justify-between items-center mb-6 pb-4 border-b">
                                          <div>
                                            <h3 className="text-xl font-bold">{selectedHistoryRound.roundName}</h3>
                                            <p className="text-sm text-gray-500">
                                              {new Date(selectedHistoryRound.startDate).toLocaleDateString('ar-EG', { year: 'numeric', month: 'short', day: 'numeric' })}
                                              {' - '}
                                              {new Date(selectedHistoryRound.endDate).toLocaleDateString('ar-EG', { year: 'numeric', month: 'short', day: 'numeric' })}
                                            </p>
                                          </div>
                                          <div className="text-center">
                                            <span className={`px-3 py-1 rounded-full text-sm ${
                                              selectedHistoryRound.isCompleted
                                                ? 'bg-gray-100 text-gray-600'
                                                : 'bg-green-100 text-green-700'
                                            }`}>
                                              {selectedHistoryRound.isCompleted ? '✅ مكتملة' : '▶️ جارية'}
                                            </span>
                                          </div>
                                        </div>
                                        {/* Stats Summary */}
                                        <div className="grid grid-cols-3 gap-4 mb-6">
                                          <div className="bg-primary-50 rounded-lg p-4 text-center">
                                            <p className="text-2xl font-bold text-primary-600">{selectedHistoryRound.roundPoints}</p>
                                            <p className="text-sm text-gray-600">نقاط الجولة</p>
                                          </div>
                                          <div className="bg-yellow-50 rounded-lg p-4 text-center">
                                            <p className="text-2xl font-bold text-yellow-600">#{selectedHistoryRound.rank || '-'}</p>
                                            <p className="text-sm text-gray-600">ترتيب الجولة</p>
                                          </div>
                                          <div className="bg-gray-50 rounded-lg p-4 text-center">
                                            <p className="text-2xl font-bold text-gray-600">{selectedHistoryRound.totalTeams}</p>
                                            <p className="text-sm text-gray-600">إجمالي الفرق</p>
                                          </div>
                                        </div>
                                        {/* Lineup */}
                                        <div>
                                          <h4 className="font-bold text-lg mb-4">⚽ تشكيلة الجولة</h4>
                                          {selectedHistoryRound.lineup && selectedHistoryRound.lineup.length > 0 ? (
                                            <div className="space-y-2">
                                              {['GOALKEEPER', 'DEFENDER', 'MIDFIELDER', 'FORWARD'].map((pos) => {
                                                const posPlayers = selectedHistoryRound.lineup.filter(p => p.position === pos);
                                                if (posPlayers.length === 0) return null;
                                                return (
                                                  <div key={pos} className="mb-4">
                                                    <div className={`flex items-center gap-2 mb-2 px-2 py-1 rounded ${POSITIONS[pos].color} text-white text-sm`}>
                                                      <span>{POSITIONS[pos].icon}</span>
                                                      <span>{POSITIONS[pos].name}</span>
                                                    </div>
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                                      {posPlayers.map((player) => (
                                                        <div
                                                          key={player.playerId}
                                                          className={`flex items-center justify-between p-3 rounded-lg ${
                                                            player.captainType === 'TRIPLE_CAPTAIN' 
                                                              ? 'bg-purple-50 border border-purple-200' 
                                                              : player.captainType === 'CAPTAIN'
                                                                ? 'bg-yellow-50 border border-yellow-200'
                                                                : 'bg-gray-50'
                                                          }`}
                                                        >
                                                          <div className="flex items-center gap-3">
                                                            {/* شارة الكابتن */}
                                                            {player.captainType && player.captainType !== 'NONE' && (
                                                              <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                                                                player.captainType === 'TRIPLE_CAPTAIN' 
                                                                  ? 'bg-purple-500 text-white' 
                                                                  : 'bg-yellow-500 text-white'
                                                              }`}>
                                                                {player.captainType === 'TRIPLE_CAPTAIN' ? '3x' : 'C'}
                                                              </span>
                                                            )}
                                                            <span className="font-medium">{player.playerName}</span>
                                                            <span className="text-xs text-gray-500">{player.team?.shortName || player.team?.name}</span>
                                                          </div>
                                                          <div className="flex items-center gap-2">
                                                            {player.stats && (
                                                              <div className="flex gap-1 text-xs">
                                                                {player.stats.goals > 0 && (
                                                                  <span className="px-1 bg-green-100 text-green-700 rounded">⚽{player.stats.goals}</span>
                                                                )}
                                                                {player.stats.assists > 0 && (
                                                                  <span className="px-1 bg-blue-100 text-blue-700 rounded">👟{player.stats.assists}</span>
                                                                )}
                                                                {player.stats.cleanSheet && (
                                                                  <span className="px-1 bg-purple-100 text-purple-700 rounded">🧤</span>
                                                                )}
                                                                {player.stats.yellowCards > 0 && (
                                                                  <span className="px-1 bg-yellow-100 text-yellow-700 rounded">🟨</span>
                                                                )}
                                                                {player.stats.redCards > 0 && (
                                                                  <span className="px-1 bg-red-100 text-red-700 rounded">🟥</span>
                                                                )}
                                                              </div>
                                                            )}
                                                            <div className="flex flex-col items-end">
                                                              {player.multiplier > 1 && (
                                                                <span className="text-xs text-gray-500">{player.basePoints} × {player.multiplier}</span>
                                                              )}
                                                              <span className={`font-bold px-2 py-1 rounded ${
                                                                player.points > 0 
                                                                  ? player.multiplier > 1 
                                                                    ? 'bg-green-200 text-green-800' 
                                                                    : 'bg-green-100 text-green-700' 
                                                                  : player.points < 0
                                                                    ? 'bg-red-100 text-red-700'
                                                                    : 'bg-gray-100 text-gray-600'
                                                              }`}>
                                                                {player.points}
                                                              </span>
                                                            </div>
                                                          </div>
                                                        </div>
                                                      ))}
                                                    </div>
                                                  </div>
                                                );
                                              })}
                                            </div>
                                          ) : (
                                            <div className="text-center py-8 text-gray-500">
                                              <div className="text-4xl mb-2">📋</div>
                                              <p>لا توجد تشكيلة لهذه الجولة</p>
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    ) : (
                                      <div className="bg-white rounded-xl shadow-sm p-6 text-center">
                                        <div className="text-4xl mb-4">📊</div>
                                        <p className="text-gray-500">اختر جولة لعرض التفاصيل</p>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              ) : (
                                <div className="flex items-center justify-center min-h-[200px]">
                                  <div className="text-4xl mb-2">📋</div>
                                  <p className="text-gray-500">لا يوجد سجل جولات متاح لهذا الفريق</p>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Team Details Modal */}

    </div>
  );
};



export default ViewMemberTeams;
