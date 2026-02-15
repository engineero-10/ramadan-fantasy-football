import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { fantasyTeamAPI } from '../services/api';
import toast from 'react-hot-toast';

const POSITIONS = {
  GOALKEEPER: { name: 'حارس مرمى', icon: '🧤', color: 'bg-yellow-500' },
  DEFENDER: { name: 'مدافع', icon: '🛡️', color: 'bg-blue-500' },
  MIDFIELDER: { name: 'وسط', icon: '🎯', color: 'bg-green-500' },
  FORWARD: { name: 'مهاجم', icon: '⚽', color: 'bg-red-500' },
};

const RoundHistory = () => {
  const [searchParams] = useSearchParams();
  const leagueIdParam = searchParams.get('leagueId');

  const [fantasyTeams, setFantasyTeams] = useState([]);
  const [selectedTeamId, setSelectedTeamId] = useState(null);
  const [history, setHistory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedRound, setSelectedRound] = useState(null);

  useEffect(() => {
    fetchAllTeams();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (selectedTeamId) {
      fetchHistory(selectedTeamId);
    }
  }, [selectedTeamId]);

  const fetchAllTeams = async () => {
    try {
      const teamsRes = await fantasyTeamAPI.getMyTeams();
      const teams = teamsRes.data.fantasyTeams || [];
      setFantasyTeams(teams);

      if (teams.length > 0) {
        if (leagueIdParam) {
          const team = teams.find(t => t.leagueId === parseInt(leagueIdParam));
          if (team) {
            setSelectedTeamId(team.id);
          } else {
            setSelectedTeamId(teams[0].id);
          }
        } else {
          setSelectedTeamId(teams[0].id);
        }
      }
    } catch (error) {
      toast.error('خطأ في جلب الفرق');
    } finally {
      setLoading(false);
    }
  };

  const fetchHistory = async (teamId) => {
    try {
      setLoading(true);
      const res = await fantasyTeamAPI.getHistory(teamId);
      setHistory(res.data);
      
      // اختيار أول جولة متاحة
      if (res.data.history && res.data.history.length > 0) {
        const latestRound = res.data.history[res.data.history.length - 1];
        setSelectedRound(latestRound);
      }
    } catch (error) {
      toast.error('خطأ في جلب سجل الجولات');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('ar-EG', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (fantasyTeams.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">📊</div>
        <h2 className="text-2xl font-bold mb-4">لا يوجد فريق خيالي</h2>
        <p className="text-gray-600 mb-6">قم بإنشاء فريق خيالي أولاً لعرض سجل الجولات</p>
        <Link
          to="/join-league"
          className="inline-block bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700"
        >
          انضم لدوري
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
          <div>
            <h1 className="text-2xl font-bold">📊 سجل الجولات</h1>
            <p className="text-gray-600">عرض إحصائيات فريقك في كل جولة</p>
          </div>
          <Link
            to={`/my-team${leagueIdParam ? `?leagueId=${leagueIdParam}` : ''}`}
            className="inline-flex items-center px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200"
          >
            → العودة لفريقي
          </Link>
        </div>

        {/* League/Team Selector */}
        {fantasyTeams.length > 1 && (
          <div className="mb-4">
            <label className="block text-sm text-gray-600 mb-2">اختر الفريق:</label>
            <select
              value={selectedTeamId || ''}
              onChange={(e) => setSelectedTeamId(parseInt(e.target.value))}
              className="w-full md:w-64 px-4 py-2 border rounded-lg"
            >
              {fantasyTeams.map((team) => (
                <option key={team.id} value={team.id}>
                  {team.name} - {team.league?.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Team Info */}
      {history && (
        <div className="bg-gradient-to-r from-primary-600 to-primary-800 text-white rounded-xl p-6 mb-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold">{history.teamName}</h2>
              <p className="text-white/80">دوري: {history.league?.name}</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold">{history.totalPoints || 0}</p>
              <p className="text-sm text-white/80">إجمالي النقاط</p>
            </div>
          </div>
        </div>
      )}

      {/* Rounds List */}
      {history && history.history && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Rounds Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm p-4">
              <h3 className="text-lg font-bold mb-4">الجولات</h3>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {history.history.map((round) => (
                  <button
                    key={round.roundId}
                    onClick={() => setSelectedRound(round)}
                    className={`w-full text-right p-3 rounded-lg transition ${
                      selectedRound?.roundId === round.roundId
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
                      {formatDate(round.startDate)}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Round Details */}
          <div className="lg:col-span-2">
            {selectedRound ? (
              <div className="bg-white rounded-xl shadow-sm p-6">
                {/* Round Header */}
                <div className="flex justify-between items-center mb-6 pb-4 border-b">
                  <div>
                    <h3 className="text-xl font-bold">{selectedRound.roundName}</h3>
                    <p className="text-sm text-gray-500">
                      {formatDate(selectedRound.startDate)} - {formatDate(selectedRound.endDate)}
                    </p>
                  </div>
                  <div className="text-center">
                    <span className={`px-3 py-1 rounded-full text-sm ${
                      selectedRound.isCompleted
                        ? 'bg-gray-100 text-gray-600'
                        : 'bg-green-100 text-green-700'
                    }`}>
                      {selectedRound.isCompleted ? '✅ مكتملة' : '▶️ جارية'}
                    </span>
                  </div>
                </div>

                {/* Stats Summary */}
                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="bg-primary-50 rounded-lg p-4 text-center">
                    <p className="text-2xl font-bold text-primary-600">{selectedRound.roundPoints}</p>
                    <p className="text-sm text-gray-600">نقاط الجولة</p>
                  </div>
                  <div className="bg-yellow-50 rounded-lg p-4 text-center">
                    <p className="text-2xl font-bold text-yellow-600">
                      #{selectedRound.rank || '-'}
                    </p>
                    <p className="text-sm text-gray-600">ترتيب الجولة</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4 text-center">
                    <p className="text-2xl font-bold text-gray-600">{selectedRound.totalTeams}</p>
                    <p className="text-sm text-gray-600">إجمالي الفرق</p>
                  </div>
                </div>

                {/* Lineup */}
                <div>
                  <h4 className="font-bold text-lg mb-4">⚽ تشكيلة الجولة</h4>
                  {selectedRound.lineup && selectedRound.lineup.length > 0 ? (
                    <div className="space-y-2">
                      {/* Group by position */}
                      {['GOALKEEPER', 'DEFENDER', 'MIDFIELDER', 'FORWARD'].map((pos) => {
                        const posPlayers = selectedRound.lineup.filter(p => p.position === pos);
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
                                    <Link
                                      to={`/player/${player.playerId}`}
                                      className="font-medium hover:text-primary-600"
                                    >
                                      {player.playerName}
                                    </Link>
                                    <span className="text-xs text-gray-500">
                                      {player.team?.shortName || player.team?.name}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    {player.stats && (
                                      <div className="flex gap-1 text-xs">
                                        {player.stats.goals > 0 && (
                                          <span className="px-1 bg-green-100 text-green-700 rounded">
                                            ⚽{player.stats.goals}
                                          </span>
                                        )}
                                        {player.stats.assists > 0 && (
                                          <span className="px-1 bg-blue-100 text-blue-700 rounded">
                                            👟{player.stats.assists}
                                          </span>
                                        )}
                                        {player.stats.cleanSheet && (
                                          <span className="px-1 bg-purple-100 text-purple-700 rounded">
                                            🧤
                                          </span>
                                        )}
                                        {player.stats.yellowCards > 0 && (
                                          <span className="px-1 bg-yellow-100 text-yellow-700 rounded">
                                            🟨
                                          </span>
                                        )}
                                        {player.stats.redCards > 0 && (
                                          <span className="px-1 bg-red-100 text-red-700 rounded">
                                            🟥
                                          </span>
                                        )}
                                      </div>
                                    )}
                                    <div className="flex flex-col items-end">
                                      {player.multiplier > 1 && (
                                        <span className="text-xs text-gray-500">
                                          {player.basePoints} × {player.multiplier}
                                        </span>
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
      )}
    </div>
  );
};

export default RoundHistory;
