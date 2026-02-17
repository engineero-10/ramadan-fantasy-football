import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { roundAPI, fantasyTeamAPI } from '../services/api';
import toast from 'react-hot-toast';

// تحديد حالة الجولة (يتحكم فيها الأدمن)
const getRoundStatus = (round) => {
  if (round.isCompleted) {
    return { 
      status: 'completed', 
      label: 'مكتملة', 
      icon: '✅',
      color: 'bg-gray-100 border-gray-300 text-gray-700' 
    };
  }
  if (round.transfersOpen) {
    return { 
      status: 'open', 
      label: 'مفتوحة للتعديل', 
      icon: '✏️',
      color: 'bg-green-100 border-green-300 text-green-700' 
    };
  }
  return { 
    status: 'locked', 
    label: 'مغلقة', 
    icon: '🔒',
    color: 'bg-orange-100 border-orange-300 text-orange-700' 
  };
};

const positionNames = {
  GOALKEEPER: 'حارس',
  DEFENDER: 'مدافع',
  MIDFIELDER: 'وسط',
  FORWARD: 'مهاجم'
};

const Rounds = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const leagueIdParam = searchParams.get('leagueId');

  const [fantasyTeams, setFantasyTeams] = useState([]);
  const [selectedLeagueId, setSelectedLeagueId] = useState(leagueIdParam ? parseInt(leagueIdParam) : null);
  const [rounds, setRounds] = useState([]);
  const [fantasyTeam, setFantasyTeam] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [statsLoading, setStatsLoading] = useState(false);
  const [roundStats, setRoundStats] = useState(null);
  const [activeTab, setActiveTab] = useState('myPlayers');

  // جلب كل الفرق أولاً
  useEffect(() => {
    fetchAllTeams();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // عند تغيير الدوري المحدد، جلب بيانات الجولات
  useEffect(() => {
    if (selectedLeagueId) {
      fetchRoundsData(selectedLeagueId);
    }
  }, [selectedLeagueId]);

  const fetchAllTeams = async () => {
    try {
      const teamsRes = await fantasyTeamAPI.getMyTeams();
      const teams = teamsRes.data.fantasyTeams || [];
      setFantasyTeams(teams);
      
      if (teams.length > 0) {
        if (leagueIdParam) {
          const team = teams.find(t => t.leagueId === parseInt(leagueIdParam));
          if (team) {
            setSelectedLeagueId(parseInt(leagueIdParam));
            setFantasyTeam(team);
          } else {
            setSelectedLeagueId(teams[0].leagueId);
            setFantasyTeam(teams[0]);
          }
        } else {
          setSelectedLeagueId(teams[0].leagueId);
          setFantasyTeam(teams[0]);
        }
      }
    } catch (error) {
      // No fantasy teams
    } finally {
      setLoading(false);
    }
  };

  const fetchRoundsData = async (leagueId) => {
    try {
      // جلب جميع الجولات
      const roundsRes = await roundAPI.getAll(leagueId);
      setRounds(roundsRes.data.rounds || []);
    } catch (error) {
      toast.error('خطأ في تحميل البيانات');
    }
  };

  // تغيير الدوري
  const handleLeagueChange = (newLeagueId) => {
    setSelectedLeagueId(newLeagueId);
    setSearchParams({ leagueId: newLeagueId });
    const team = fantasyTeams.find(t => t.leagueId === newLeagueId);
    setFantasyTeam(team);
  };

  const viewRoundStats = async (roundId) => {
    setStatsLoading(true);
    setShowStatsModal(true);
    setActiveTab('myPlayers');
    try {
      const response = await roundAPI.getMyStats(roundId);
      setRoundStats(response.data);
    } catch (error) {
      toast.error('خطأ في جلب إحصائيات الجولة');
      setShowStatsModal(false);
    } finally {
      setStatsLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="text-4xl animate-bounce mb-4">📅</div>
          <p className="text-gray-600">جاري تحميل الجولات...</p>
        </div>
      </div>
    );
  }

  if (!fantasyTeam && fantasyTeams.length === 0) {
    return (
      <div className="max-w-lg mx-auto card text-center">
        <div className="text-5xl mb-4">🎯</div>
        <h1 className="text-2xl font-bold mb-2">لا يوجد فريق</h1>
        <p className="text-gray-600 mb-4">يجب إنشاء فريق أولاً لمشاهدة جدول الجولات</p>
        <Link to="/create-team" className="btn-primary">
          إنشاء فريق
        </Link>
      </div>
    );
  }

  // تصنيف الجولات
  const completedRounds = rounds.filter(r => getRoundStatus(r).status === 'completed');
  const openRounds = rounds.filter(r => getRoundStatus(r).status === 'open');
  const lockedRounds = rounds.filter(r => getRoundStatus(r).status === 'locked');

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* League/Team Selector */}
      {fantasyTeams.length > 1 && (
        <div className="card p-3 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
            <label className="font-medium text-gray-700 text-sm sm:text-base">اختر الفريق:</label>
            <select
              value={selectedLeagueId || ''}
              onChange={(e) => handleLeagueChange(parseInt(e.target.value))}
              className="input flex-1 text-sm"
            >
              {fantasyTeams.map((team) => (
                <option key={team.id} value={team.leagueId}>
                  {team.name} - {team.league?.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="card bg-gradient-to-l from-primary-600 to-secondary-600 text-white p-3 sm:p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg sm:text-2xl font-bold">📅 جدول الجولات</h1>
            <p className="text-sm text-white/80">{fantasyTeam?.league?.name}</p>
          </div>
          <div className="text-center">
            <p className="text-2xl sm:text-3xl font-bold text-primary">{rounds.length}</p>
            <p className="text-xs sm:text-sm text-white/80 text-primary">جولة</p>
          </div>
        </div>
      </div>

      {/* ملخص سريع */}
      <div className="grid grid-cols-3 gap-2 sm:gap-4">
        <div className="card p-3 sm:p-6 text-center bg-green-50 border border-green-200">
          <span className="text-2xl sm:text-3xl">✏️</span>
          <p className="text-xl sm:text-2xl font-bold text-green-600">{openRounds.length}</p>
          <p className="text-[10px] sm:text-sm text-gray-600">مفتوحة</p>
        </div>
        <div className="card p-3 sm:p-6 text-center bg-orange-50 border border-orange-200">
          <span className="text-2xl sm:text-3xl">🔒</span>
          <p className="text-xl sm:text-2xl font-bold text-orange-600">{lockedRounds.length}</p>
          <p className="text-[10px] sm:text-sm text-gray-600">مغلقة</p>
        </div>
        <div className="card p-3 sm:p-6 text-center bg-gray-50 border border-gray-200">
          <span className="text-2xl sm:text-3xl">✅</span>
          <p className="text-xl sm:text-2xl font-bold text-gray-600">{completedRounds.length}</p>
          <p className="text-[10px] sm:text-sm text-gray-600">مكتملة</p>
        </div>
      </div>

      {rounds.length === 0 ? (
        <div className="card text-center py-12">
          <span className="text-5xl mb-4 block">📅</span>
          <h3 className="text-xl font-bold mb-2">لا توجد جولات بعد</h3>
          <p className="text-gray-600">سيتم إضافة الجولات من قبل المشرف قريباً</p>
        </div>
      ) : (
        <div className="space-y-3 sm:space-y-4">
          {rounds.map((round) => {
            const status = getRoundStatus(round);
            const canEdit = round.transfersOpen && !round.isCompleted;
            return (
              <div 
                key={round.id} 
                className={`card p-3 sm:p-6 border-2 ${status.color} transition-all hover:shadow-lg`}
              >
                <div className="flex flex-col gap-3 sm:gap-4">
                  {/* Round Info */}
                  <div className="flex items-center gap-3 sm:gap-4">
                    <div className="bg-white rounded-full w-10 h-10 sm:w-14 sm:h-14 flex items-center justify-center shadow flex-shrink-0">
                      <span className="text-lg sm:text-2xl font-bold text-primary-600">{round.roundNumber}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-sm sm:text-lg truncate">{round.name}</h3>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`px-1.5 sm:px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-medium ${status.color}`}>
                          {status.icon} {status.label}
                        </span>
                      </div>
                      <p className="text-[10px] sm:text-sm text-gray-600 mt-1 truncate">
                        📆 {new Date(round.startDate).toLocaleDateString('ar-SA')}
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                    {/* عدد المباريات */}
                    <div className="bg-white rounded-md sm:rounded-lg px-2 sm:px-3 py-1 sm:py-2 text-center shadow-sm">
                      <p className="text-[9px] sm:text-xs text-gray-500">⚽ المباريات</p>
                      <p className="font-bold text-sm sm:text-base">{round._count?.matches || 0}</p>
                    </div>

                    {/* أزرار الإجراءات */}
                    <div className="flex gap-1.5 sm:gap-2 flex-wrap flex-1 justify-end">
                      <button
                        onClick={() => viewRoundStats(round.id)}
                        className="bg-amber-100 text-amber-700 hover:bg-amber-200 text-[10px] sm:text-sm py-1 px-2 sm:px-3 rounded-md sm:rounded-lg"
                      >
                        📊 إحصائيات
                      </button>
                      <Link 
                        to={`/matches?round=${round.id}`} 
                        className="btn-secondary text-[10px] sm:text-sm py-1 px-2 sm:px-3"
                      >
                        المباريات
                      </Link>
                      {canEdit && (
                        <Link 
                          to="/transfers" 
                          className="btn-primary text-[10px] sm:text-sm py-1 px-2 sm:px-3"
                        >
                          🔄 انتقالات
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Stats Modal */}
      {showStatsModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-2 sm:p-4 z-50">
          <div className="bg-white rounded-xl sm:rounded-2xl p-3 sm:p-6 w-full max-w-4xl max-h-[95vh] sm:max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
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
                {/* My Stats Summary */}
                {roundStats.myStats && (
                  <div className="bg-gradient-to-l from-primary-500 to-secondary-500 rounded-lg sm:rounded-xl p-3 sm:p-4 text-white">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-white/80 text-[10px] sm:text-sm">ترتيبك في هذه الجولة</p>
                        <p className="text-xl sm:text-3xl font-bold">
                          #{roundStats.myStats.rank || '-'}
                          <span className="text-sm sm:text-lg mr-1 sm:mr-2">من {roundStats.statistics?.totalParticipants || 0}</span>
                        </p>
                      </div>
                      <div className="text-left">
                        <p className="text-white/80 text-[10px] sm:text-sm">نقاطك</p>
                        <p className="text-xl sm:text-3xl font-bold">{roundStats.myStats.points || 0}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Summary Stats */}
                <div className="grid grid-cols-4 gap-1.5 sm:gap-3">
                  <div className="bg-blue-50 rounded-lg sm:rounded-xl p-2 sm:p-3 text-center">
                    <p className="text-lg sm:text-2xl font-bold text-blue-600">{roundStats.statistics?.totalParticipants || 0}</p>
                    <p className="text-[9px] sm:text-xs text-gray-600">مشارك</p>
                  </div>
                  <div className="bg-green-50 rounded-lg sm:rounded-xl p-2 sm:p-3 text-center">
                    <p className="text-lg sm:text-2xl font-bold text-green-600">{roundStats.statistics?.highestPoints || 0}</p>
                    <p className="text-[9px] sm:text-xs text-gray-600">أعلى</p>
                  </div>
                  <div className="bg-amber-50 rounded-lg sm:rounded-xl p-2 sm:p-3 text-center">
                    <p className="text-lg sm:text-2xl font-bold text-amber-600">{roundStats.statistics?.averagePoints || 0}</p>
                    <p className="text-[9px] sm:text-xs text-gray-600">متوسط</p>
                  </div>
                  <div className="bg-red-50 rounded-lg sm:rounded-xl p-2 sm:p-3 text-center">
                    <p className="text-lg sm:text-2xl font-bold text-red-600">{roundStats.statistics?.lowestPoints || 0}</p>
                    <p className="text-[9px] sm:text-xs text-gray-600">أقل</p>
                  </div>
                </div>

                {/* Tabs */}
                <div className="flex gap-1 sm:gap-2 border-b overflow-x-auto">
                  <button
                    onClick={() => setActiveTab('myPlayers')}
                    className={`px-2 sm:px-4 py-1.5 sm:py-2 font-medium transition-colors text-xs sm:text-base whitespace-nowrap ${
                      activeTab === 'myPlayers'
                        ? 'border-b-2 border-primary-500 text-primary-600'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    👤 لاعبيي
                  </button>
                  <button
                    onClick={() => setActiveTab('rankings')}
                    className={`px-2 sm:px-4 py-1.5 sm:py-2 font-medium transition-colors text-xs sm:text-base whitespace-nowrap ${
                      activeTab === 'rankings'
                        ? 'border-b-2 border-primary-500 text-primary-600'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    🏆 الترتيب
                  </button>
                  <button
                    onClick={() => setActiveTab('topPlayers')}
                    className={`px-2 sm:px-4 py-1.5 sm:py-2 font-medium transition-colors text-xs sm:text-base whitespace-nowrap ${
                      activeTab === 'topPlayers'
                        ? 'border-b-2 border-primary-500 text-primary-600'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    ⭐ أفضل 10
                  </button>
                </div>

                {/* Tab Content */}
                <div className="min-h-[200px] sm:min-h-[300px]">
                  {/* My Players Tab */}
                  {activeTab === 'myPlayers' && (
                    <div className="space-y-2">
                      <h3 className="font-bold text-sm sm:text-lg mb-2 sm:mb-3">👤 لاعبيي في هذه الجولة</h3>
                      {roundStats.myPlayers?.length > 0 ? (
                        <div className="space-y-2 max-h-60 sm:max-h-80 overflow-y-auto">
                          {roundStats.myPlayers.map((player, index) => (
                            <div
                              key={player.playerId}
                              className={`p-2 sm:p-3 rounded-lg ${
                                player.isStarter ? 'bg-green-50 border border-green-200' : 'bg-gray-50 border border-gray-200'
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                                  <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-white text-xs sm:text-sm flex-shrink-0 ${
                                    player.position === 'GOALKEEPER' ? 'bg-yellow-500' :
                                    player.position === 'DEFENDER' ? 'bg-blue-500' :
                                    player.position === 'MIDFIELDER' ? 'bg-green-500' : 'bg-red-500'
                                  }`}>
                                    {positionNames[player.position]?.charAt(0) || '?'}
                                  </div>
                                  <div className="min-w-0">
                                    <p className="font-medium text-xs sm:text-base truncate">{player.playerName}</p>
                                    <p className="text-[10px] sm:text-xs text-gray-500 truncate">
                                      {player.teamShortName || player.teamName}
                                      {!player.isStarter && <span className="text-orange-600 mr-1"> • بديل</span>}
                                    </p>
                                  </div>
                                </div>
                                <div className="text-left flex-shrink-0">
                                  <p className={`text-base sm:text-xl font-bold ${player.points > 0 ? 'text-green-600' : 'text-gray-400'}`}>
                                    {player.points}
                                  </p>
                                </div>
                              </div>
                              {player.played && (
                                <div className="flex gap-2 sm:gap-3 mt-1.5 sm:mt-2 text-[10px] sm:text-xs text-gray-600 flex-wrap">
                                  {player.goals > 0 && <span>⚽{player.goals}</span>}
                                  {player.assists > 0 && <span>👟{player.assists}</span>}
                                  {player.cleanSheet && <span>🧤</span>}
                                  {player.yellowCards > 0 && <span>🟨{player.yellowCards}</span>}
                                  {player.redCards > 0 && <span>🟥{player.redCards}</span>}
                                  {player.bonusPoints > 0 && <span>✨+{player.bonusPoints}</span>}
                                  <span>⏱️{player.minutesPlayed}د</span>
                                </div>
                              )}
                              {!player.played && (
                                <p className="text-[10px] sm:text-xs text-gray-400 mt-1 sm:mt-2">لم يشارك</p>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-center text-gray-500 py-6 sm:py-8 text-sm">لا توجد بيانات</p>
                      )}
                    </div>
                  )}

                  {/* Rankings Tab */}
                  {activeTab === 'rankings' && (
                    <div className="space-y-2">
                      <h3 className="font-bold text-sm sm:text-lg mb-2 sm:mb-3">🏆 ترتيب المستخدمين</h3>
                      {roundStats.userRankings?.length > 0 ? (
                        <div className="space-y-2 max-h-60 sm:max-h-80 overflow-y-auto">
                          {roundStats.userRankings.map((user, index) => (
                            <div
                              key={user.userId}
                              className={`flex items-center justify-between p-2 sm:p-3 rounded-lg ${
                                user.isMe ? 'bg-primary-100 border-2 border-primary-400' :
                                index === 0 ? 'bg-yellow-100' :
                                index === 1 ? 'bg-gray-200' :
                                index === 2 ? 'bg-amber-100' : 'bg-white border border-gray-100'
                              }`}
                            >
                              <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                                <span className={`w-6 h-6 sm:w-8 sm:h-8 flex items-center justify-center rounded-full font-bold text-xs sm:text-sm flex-shrink-0 ${
                                  index === 0 ? 'bg-yellow-400 text-white' :
                                  index === 1 ? 'bg-gray-400 text-white' :
                                  index === 2 ? 'bg-amber-600 text-white' : 'bg-gray-200'
                                }`}>
                                  {user.rank}
                                </span>
                                <div className="min-w-0">
                                  <p className="font-medium text-xs sm:text-base truncate">
                                    {user.userName}
                                    {user.isMe && <span className="text-primary-600 mr-1">(أنت)</span>}
                                  </p>
                                  <p className="text-[10px] sm:text-xs text-gray-500 truncate">{user.teamName}</p>
                                </div>
                              </div>
                              <div className="text-left flex-shrink-0">
                                <p className="font-bold text-base sm:text-lg">{user.points}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-center text-gray-500 py-6 sm:py-8 text-sm">لا توجد بيانات</p>
                      )}
                    </div>
                  )}

                  {/* Top Players Tab */}
                  {activeTab === 'topPlayers' && (
                    <div className="space-y-2">
                      <h3 className="font-bold text-sm sm:text-lg mb-2 sm:mb-3">⭐ أعلى 10 لاعبين</h3>
                      {roundStats.topPlayers?.length > 0 ? (
                        <div className="space-y-2 max-h-60 sm:max-h-80 overflow-y-auto">
                          {roundStats.topPlayers.map((player, index) => (
                            <div
                              key={`${player.playerId}-${index}`}
                              className={`p-2 sm:p-3 rounded-lg ${
                                index === 0 ? 'bg-yellow-100' :
                                index === 1 ? 'bg-gray-200' :
                                index === 2 ? 'bg-amber-100' : 'bg-white border border-gray-100'
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                                  <span className={`w-6 h-6 sm:w-8 sm:h-8 flex items-center justify-center rounded-full font-bold text-xs sm:text-sm flex-shrink-0 ${
                                    index === 0 ? 'bg-yellow-400 text-white' :
                                    index === 1 ? 'bg-gray-400 text-white' :
                                    index === 2 ? 'bg-amber-600 text-white' : 'bg-gray-200'
                                  }`}>
                                    {player.rank}
                                  </span>
                                  <div className="min-w-0">
                                    <p className="font-medium text-xs sm:text-base truncate">{player.playerName}</p>
                                    <p className="text-[10px] sm:text-xs text-gray-500 truncate">
                                      {player.teamShortName || player.teamName}
                                    </p>
                                  </div>
                                </div>
                                <div className="text-left flex-shrink-0">
                                  <p className="font-bold text-base sm:text-lg">{player.points}</p>
                                </div>
                              </div>
                              <div className="flex gap-2 sm:gap-3 mt-1.5 sm:mt-2 text-[10px] sm:text-xs text-gray-600">
                                {player.goals > 0 && <span>⚽{player.goals}</span>}
                                {player.assists > 0 && <span>👟{player.assists}</span>}
                                {player.cleanSheet && <span>🧤</span>}
                                {player.bonusPoints > 0 && <span>✨+{player.bonusPoints}</span>}
                              </div>
                              <p className="text-[10px] sm:text-xs text-gray-400 mt-1 truncate">{player.matchInfo}</p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-center text-gray-500 py-6 sm:py-8 text-sm">لا توجد بيانات</p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
};

export default Rounds;
