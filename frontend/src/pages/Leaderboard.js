import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { leaderboardAPI, leagueAPI, roundAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const Leaderboard = () => {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [leaderboard, setLeaderboard] = useState([]);
  const [leagues, setLeagues] = useState([]);
  const [rounds, setRounds] = useState([]);
  const [selectedLeague, setSelectedLeague] = useState(searchParams.get('league') || '');
  const [selectedRound, setSelectedRound] = useState('');
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeagues();
  }, []);

  useEffect(() => {
    if (selectedLeague) {
      fetchRounds();
      fetchLeaderboard();
      fetchStats();
    }
  }, [selectedLeague, selectedRound]);

  const fetchLeagues = async () => {
    try {
      const response = await leagueAPI.getAll();
      setLeagues(response.data.leagues || []);
      if (!selectedLeague && response.data.leagues?.length > 0) {
        setSelectedLeague(response.data.leagues[0].id);
      }
    } catch (error) {
      toast.error('خطأ في جلب الدوريات');
    }
  };

  const fetchRounds = async () => {
    try {
      const response = await roundAPI.getAll(selectedLeague);
      setRounds(response.data.rounds || []);
    } catch (error) {
      console.error('خطأ في جلب الجولات');
    }
  };

  const fetchLeaderboard = async () => {
    setLoading(true);
    try {
      let response;
      if (selectedRound) {
        response = await leaderboardAPI.getRound(selectedLeague, selectedRound);
      } else {
        response = await leaderboardAPI.get(selectedLeague);
      }
      setLeaderboard(response.data.leaderboard || []);
    } catch (error) {
      toast.error('خطأ في جلب الترتيب');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await leaderboardAPI.getStats(selectedLeague);
      setStats(response.data);
    } catch (error) {
      console.error('خطأ في جلب الإحصائيات');
    }
  };

  // تحديد لون الترتيب
  const getRankColor = (rank) => {
    if (rank === 1) return 'bg-yellow-400 text-yellow-900';
    if (rank === 2) return 'bg-gray-300 text-gray-800';
    if (rank === 3) return 'bg-amber-600 text-white';
    return 'bg-gray-100 text-gray-600';
  };

  // تحديد أيقونة الترتيب
  const getRankIcon = (rank) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return rank;
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="card p-3 sm:p-6">
        <div className="flex flex-col gap-3 sm:gap-4">
          <div>
            <h1 className="text-lg sm:text-2xl font-bold">📊 جدول الترتيب</h1>
            <p className="text-sm text-gray-600">ترتيب الفرق الخيالية</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
            <select
              value={selectedLeague}
              onChange={(e) => {
                setSelectedLeague(e.target.value);
                setSelectedRound('');
              }}
              className="input text-sm flex-1"
            >
              {leagues.map((league) => (
                <option key={league.id} value={league.id}>
                  {league.name}
                </option>
              ))}
            </select>
            <select
              value={selectedRound}
              onChange={(e) => setSelectedRound(e.target.value)}
              className="input text-sm flex-1"
            >
              <option value="">الترتيب العام</option>
              {rounds.map((round) => (
                <option key={round.id} value={round.id}>
                  {round.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      {stats && !selectedRound && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4">
          <div className="card bg-yellow-50 p-3 sm:p-6">
            <div className="text-center">
              <p className="text-2xl sm:text-3xl mb-1 sm:mb-2">🥇</p>
              <p className="text-[10px] sm:text-sm text-gray-600">المتصدر</p>
              <p className="font-bold text-xs sm:text-base truncate">{stats.topTeam?.name || '-'}</p>
              <p className="text-[10px] sm:text-xs text-gray-500">{stats.topTeam?.totalPoints || 0} نقطة</p>
            </div>
          </div>
          <div className="card bg-blue-50 p-3 sm:p-6">
            <div className="text-center">
              <p className="text-2xl sm:text-3xl mb-1 sm:mb-2">📈</p>
              <p className="text-[10px] sm:text-sm text-gray-600">أعلى جولة</p>
              <p className="font-bold text-xs sm:text-base">{stats.highestRoundPoints || 0}</p>
              <p className="text-[10px] sm:text-xs text-gray-500">نقطة</p>
            </div>
          </div>
          <div className="card bg-green-50 p-3 sm:p-6">
            <div className="text-center">
              <p className="text-2xl sm:text-3xl mb-1 sm:mb-2">📊</p>
              <p className="text-[10px] sm:text-sm text-gray-600">المتوسط</p>
              <p className="font-bold text-xs sm:text-base">{parseFloat(stats.averagePoints || 0).toFixed(1)}</p>
              <p className="text-[10px] sm:text-xs text-gray-500">نقطة</p>
            </div>
          </div>
          <div className="card bg-purple-50 p-3 sm:p-6">
            <div className="text-center">
              <p className="text-2xl sm:text-3xl mb-1 sm:mb-2">👥</p>
              <p className="text-[10px] sm:text-sm text-gray-600">الفرق</p>
              <p className="font-bold text-xs sm:text-base">{stats.totalTeams || 0}</p>
              <p className="text-[10px] sm:text-xs text-gray-500">فريق</p>
            </div>
          </div>
        </div>
      )}

      {/* Leaderboard Table */}
      <div className="card p-3 sm:p-6">
        {loading ? (
          <div className="flex items-center justify-center min-h-[200px]">
            <div className="text-center">
              <div className="text-4xl animate-bounce mb-4">📊</div>
              <p className="text-gray-600">جاري التحميل...</p>
            </div>
          </div>
        ) : leaderboard.length > 0 ? (
          <div className="overflow-x-auto -mx-3 sm:mx-0">
            <table className="w-full min-w-[300px]">
              <thead>
                <tr className="border-b">
                  <th className="text-right py-2 sm:py-3 px-2 text-xs sm:text-sm">#</th>
                  <th className="text-right py-2 sm:py-3 text-xs sm:text-sm">الفريق</th>
                  <th className="text-right py-2 sm:py-3 text-xs sm:text-sm hidden sm:table-cell">المالك</th>
                  <th className="text-center py-2 sm:py-3 text-xs sm:text-sm">النقاط</th>
                </tr>
              </thead>
              <tbody>
                {leaderboard.map((team, index) => {
                  const rank = index + 1;
                  const isCurrentUser = team.userId === user?.id;
                  
                  return (
                    <tr 
                      key={team.id} 
                      className={`border-b transition ${isCurrentUser ? 'bg-primary-50' : 'hover:bg-gray-50'}`}
                    >
                      <td className="py-2 sm:py-4 px-2">
                        <span className={`inline-flex items-center justify-center w-6 h-6 sm:w-8 sm:h-8 rounded-full font-bold text-xs sm:text-sm ${getRankColor(rank)}`}>
                          {getRankIcon(rank)}
                        </span>
                      </td>
                      <td className="py-2 sm:py-4">
                        <div className="min-w-0">
                          <p className="font-medium text-xs sm:text-sm truncate">{team.name}</p>
                          <p className="text-[10px] sm:hidden text-gray-500">{team.user?.name || '-'}</p>
                          {isCurrentUser && (
                            <span className="text-[10px] sm:text-xs text-primary-600">فريقك</span>
                          )}
                        </div>
                      </td>
                      <td className="py-2 sm:py-4 text-xs sm:text-sm text-gray-600 hidden sm:table-cell">
                        {team.user?.name || '-'}
                      </td>
                      <td className="py-2 sm:py-4 text-center">
                        <span className="font-bold text-sm sm:text-lg">
                          {selectedRound ? team.roundPoints : team.totalPoints}
                        </span>
                        <span className="text-[10px] sm:text-xs text-gray-500 mr-0.5 sm:mr-1">ن</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="text-5xl mb-4">📭</div>
            <p className="text-gray-600">لا توجد فرق في هذا الدوري</p>
          </div>
        )}
      </div>

      {/* Top 3 Podium (for overall standings) */}
      {!selectedRound && !loading && leaderboard.length >= 3 && (
        <div className="card p-3 sm:p-6">
          <h2 className="font-bold text-base sm:text-lg mb-4 sm:mb-6 text-center">🏆 المنصة</h2>
          <div className="flex items-end justify-center gap-2 sm:gap-4 max-w-md mx-auto">
            {/* 2nd Place */}
            <div className="flex-1 text-center">
              <div className="bg-gray-200 rounded-t-lg sm:rounded-t-xl p-2 sm:p-4" style={{ height: '90px' }}>
                <span className="text-2xl sm:text-4xl">🥈</span>
                <p className="font-medium mt-1 sm:mt-2 text-[10px] sm:text-sm truncate">{leaderboard[1]?.name}</p>
                <p className="text-[9px] sm:text-xs text-gray-600">{leaderboard[1]?.totalPoints} ن</p>
              </div>
              <div className="bg-gray-300 py-1 sm:py-2 font-bold text-sm sm:text-xl">2</div>
            </div>
            
            {/* 1st Place */}
            <div className="flex-1 text-center">
              <div className="bg-yellow-100 rounded-t-lg sm:rounded-t-xl p-2 sm:p-4" style={{ height: '110px' }}>
                <span className="text-3xl sm:text-5xl">🥇</span>
                <p className="font-bold mt-1 sm:mt-2 text-xs sm:text-base truncate">{leaderboard[0]?.name}</p>
                <p className="text-[10px] sm:text-sm text-gray-600">{leaderboard[0]?.totalPoints} ن</p>
              </div>
              <div className="bg-yellow-400 py-1 sm:py-2 font-bold text-sm sm:text-xl">1</div>
            </div>
            
            {/* 3rd Place */}
            <div className="flex-1 text-center">
              <div className="bg-amber-100 rounded-t-lg sm:rounded-t-xl p-2 sm:p-4" style={{ height: '75px' }}>
                <span className="text-xl sm:text-3xl">🥉</span>
                <p className="font-medium mt-1 sm:mt-2 text-[10px] sm:text-sm truncate">{leaderboard[2]?.name}</p>
                <p className="text-[9px] sm:text-xs text-gray-600">{leaderboard[2]?.totalPoints} ن</p>
              </div>
              <div className="bg-amber-600 text-white py-1 sm:py-2 font-bold text-sm sm:text-xl">3</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Leaderboard;
