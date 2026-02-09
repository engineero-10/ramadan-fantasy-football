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
    <div className="space-y-6">
      {/* Header */}
      <div className="card">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">📊 جدول الترتيب</h1>
            <p className="text-gray-600">ترتيب الفرق الخيالية</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <select
              value={selectedLeague}
              onChange={(e) => {
                setSelectedLeague(e.target.value);
                setSelectedRound('');
              }}
              className="input"
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
              className="input"
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
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="card bg-yellow-50">
            <div className="text-center">
              <p className="text-3xl mb-2">🥇</p>
              <p className="text-sm text-gray-600">المتصدر</p>
              <p className="font-bold truncate">{stats.topTeam?.name || '-'}</p>
              <p className="text-xs text-gray-500">{stats.topTeam?.totalPoints || 0} نقطة</p>
            </div>
          </div>
          <div className="card bg-blue-50">
            <div className="text-center">
              <p className="text-3xl mb-2">📈</p>
              <p className="text-sm text-gray-600">أعلى نقاط جولة</p>
              <p className="font-bold">{stats.highestRoundPoints || 0}</p>
              <p className="text-xs text-gray-500">نقطة</p>
            </div>
          </div>
          <div className="card bg-green-50">
            <div className="text-center">
              <p className="text-3xl mb-2">📊</p>
              <p className="text-sm text-gray-600">متوسط النقاط</p>
              <p className="font-bold">{stats.averagePoints?.toFixed(1) || 0}</p>
              <p className="text-xs text-gray-500">نقطة</p>
            </div>
          </div>
          <div className="card bg-purple-50">
            <div className="text-center">
              <p className="text-3xl mb-2">👥</p>
              <p className="text-sm text-gray-600">عدد الفرق</p>
              <p className="font-bold">{stats.totalTeams || 0}</p>
              <p className="text-xs text-gray-500">فريق</p>
            </div>
          </div>
        </div>
      )}

      {/* Leaderboard Table */}
      <div className="card">
        {loading ? (
          <div className="flex items-center justify-center min-h-[200px]">
            <div className="text-center">
              <div className="text-4xl animate-bounce mb-4">📊</div>
              <p className="text-gray-600">جاري التحميل...</p>
            </div>
          </div>
        ) : leaderboard.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-right py-3 px-2">#</th>
                  <th className="text-right py-3">الفريق</th>
                  <th className="text-right py-3">المالك</th>
                  <th className="text-center py-3">النقاط</th>
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
                      <td className="py-4 px-2">
                        <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm ${getRankColor(rank)}`}>
                          {getRankIcon(rank)}
                        </span>
                      </td>
                      <td className="py-4">
                        <div>
                          <p className="font-medium">{team.name}</p>
                          {isCurrentUser && (
                            <span className="text-xs text-primary-600">فريقك</span>
                          )}
                        </div>
                      </td>
                      <td className="py-4 text-sm text-gray-600">
                        {team.user?.name || '-'}
                      </td>
                      <td className="py-4 text-center">
                        <span className="font-bold text-lg">
                          {selectedRound ? team.roundPoints : team.totalPoints}
                        </span>
                        <span className="text-xs text-gray-500 mr-1">نقطة</span>
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
        <div className="card">
          <h2 className="font-bold text-lg mb-6 text-center">🏆 المنصة</h2>
          <div className="flex items-end justify-center gap-4 max-w-md mx-auto">
            {/* 2nd Place */}
            <div className="flex-1 text-center">
              <div className="bg-gray-200 rounded-t-xl p-4" style={{ height: '120px' }}>
                <span className="text-4xl">🥈</span>
                <p className="font-medium mt-2 text-sm truncate">{leaderboard[1]?.name}</p>
                <p className="text-xs text-gray-600">{leaderboard[1]?.totalPoints} نقطة</p>
              </div>
              <div className="bg-gray-300 py-2 font-bold text-xl">2</div>
            </div>
            
            {/* 1st Place */}
            <div className="flex-1 text-center">
              <div className="bg-yellow-100 rounded-t-xl p-4" style={{ height: '150px' }}>
                <span className="text-5xl">🥇</span>
                <p className="font-bold mt-2 truncate">{leaderboard[0]?.name}</p>
                <p className="text-sm text-gray-600">{leaderboard[0]?.totalPoints} نقطة</p>
              </div>
              <div className="bg-yellow-400 py-2 font-bold text-xl">1</div>
            </div>
            
            {/* 3rd Place */}
            <div className="flex-1 text-center">
              <div className="bg-amber-100 rounded-t-xl p-4" style={{ height: '100px' }}>
                <span className="text-3xl">🥉</span>
                <p className="font-medium mt-2 text-sm truncate">{leaderboard[2]?.name}</p>
                <p className="text-xs text-gray-600">{leaderboard[2]?.totalPoints} نقطة</p>
              </div>
              <div className="bg-amber-600 text-white py-2 font-bold text-xl">3</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Leaderboard;
