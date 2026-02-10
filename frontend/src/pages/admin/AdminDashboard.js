import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { leagueAPI, teamAPI, playerAPI, matchAPI, roundAPI } from '../../services/api';
import toast from 'react-hot-toast';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    leagues: 0,
    teams: 0,
    players: 0,
    matches: 0,
    members: 0,
  });
  const [recentMatches, setRecentMatches] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const [leaguesRes, teamsRes, matchesRes] = await Promise.all([
        leagueAPI.getAll(),
        teamAPI.getAll(),
        matchAPI.getAll({}),
      ]);

      // حساب عدد اللاعبين وعدد الأعضاء من كل الدوريات
      let totalPlayers = 0;
      let totalMembers = 0;
      const leagues = leaguesRes.data.leagues || [];
      if (leagues.length > 0) {
        const playerCounts = await Promise.all(
          leagues.map(league => 
            playerAPI.getAll({ leagueId: league.id, limit: 1 })
              .then(res => res.data.pagination?.total || 0)
              .catch(() => 0)
          )
        );
        totalPlayers = playerCounts.reduce((sum, count) => sum + count, 0);
        // حساب عدد الأعضاء من _count
        totalMembers = leagues.reduce((sum, league) => sum + (league._count?.members || 0), 0);
      }

      setStats({
        leagues: leagues.length,
        teams: teamsRes.data.teams?.length || 0,
        players: totalPlayers,
        matches: matchesRes.data.matches?.length || 0,
        members: totalMembers,
      });

      // آخر 5 مباريات
      setRecentMatches(matchesRes.data.matches?.slice(0, 5) || []);
    } catch (error) {
      toast.error('خطأ في تحميل البيانات');
    } finally {
      setLoading(false);
    }
  };

  // بيانات الرسم البياني
  const chartData = [
    { name: 'الأعضاء', value: stats.members, color: '#ec4899' },
    { name: 'الفرق', value: stats.teams, color: '#06b6d4' },
    { name: 'اللاعبين', value: stats.players, color: '#10b981' },
    { name: 'المباريات', value: stats.matches, color: '#f59e0b' },
  ];

  const COLORS = ['#ec4899', '#06b6d4', '#10b981', '#f59e0b'];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="text-4xl animate-bounce mb-4">⚙️</div>
          <p className="text-gray-600">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-l from-primary-600 to-secondary-600 rounded-xl sm:rounded-2xl p-4 sm:p-6 text-white">
        <h1 className="text-xl sm:text-2xl font-bold mb-1 sm:mb-2">لوحة التحكم 🎛️</h1>
        <p className="text-white/80 text-sm sm:text-base">مرحباً بك في لوحة تحكم المشرف</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4">
        <Link to="/admin/leagues" className="card p-3 sm:p-6 hover:shadow-lg transition">
          <div className="flex items-center gap-2 sm:gap-4">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-pink-100 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0">
              <span className="text-xl sm:text-2xl">👥</span>
            </div>
            <div className="min-w-0">
              <p className="text-[10px] sm:text-sm text-gray-500 truncate">أعضاء الدوري</p>
              <p className="text-lg sm:text-2xl font-bold">{stats.members}</p>
            </div>
          </div>
        </Link>

        <Link to="/admin/teams" className="card p-3 sm:p-6 hover:shadow-lg transition">
          <div className="flex items-center gap-2 sm:gap-4">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-cyan-100 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0">
              <span className="text-xl sm:text-2xl">⚽</span>
            </div>
            <div className="min-w-0">
              <p className="text-[10px] sm:text-sm text-gray-500">الفرق</p>
              <p className="text-lg sm:text-2xl font-bold">{stats.teams}</p>
            </div>
          </div>
        </Link>

        <Link to="/admin/players" className="card p-3 sm:p-6 hover:shadow-lg transition">
          <div className="flex items-center gap-2 sm:gap-4">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-100 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0">
              <span className="text-xl sm:text-2xl">👤</span>
            </div>
            <div className="min-w-0">
              <p className="text-[10px] sm:text-sm text-gray-500">اللاعبين</p>
              <p className="text-lg sm:text-2xl font-bold">{stats.players}</p>
            </div>
          </div>
        </Link>

        <Link to="/admin/matches" className="card p-3 sm:p-6 hover:shadow-lg transition">
          <div className="flex items-center gap-2 sm:gap-4">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-yellow-100 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0">
              <span className="text-xl sm:text-2xl">📅</span>
            </div>
            <div className="min-w-0">
              <p className="text-[10px] sm:text-sm text-gray-500">المباريات</p>
              <p className="text-lg sm:text-2xl font-bold">{stats.matches}</p>
            </div>
          </div>
        </Link>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Bar Chart */}
        <div className="card p-3 sm:p-6">
          <h2 className="font-bold text-sm sm:text-lg mb-3 sm:mb-4">إحصائيات عامة</h2>
          <div className="h-48 sm:h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#8b5cf6" radius={[4, 4, 0, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Pie Chart */}
        <div className="card p-3 sm:p-6">
          <h2 className="font-bold text-sm sm:text-lg mb-3 sm:mb-4">توزيع البيانات</h2>
          <div className="h-48 sm:h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}`}
                  outerRadius={60}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Recent Matches */}
      <div className="card p-3 sm:p-6">
        <div className="flex items-center justify-between mb-3 sm:mb-4">
          <h2 className="font-bold text-sm sm:text-lg">آخر المباريات</h2>
          <Link to="/admin/matches" className="text-primary-600 text-xs sm:text-sm hover:underline">
            عرض الكل
          </Link>
        </div>
        
        {recentMatches.length > 0 ? (
          <div className="space-y-2 sm:space-y-3">
            {recentMatches.map((match) => (
              <div key={match.id} className="bg-gray-50 rounded-lg sm:rounded-xl p-2 sm:p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-4">
                <div className="flex items-center gap-2 sm:gap-4 flex-wrap w-full sm:w-auto justify-center sm:justify-start">
                  <span className="font-medium text-xs sm:text-base truncate max-w-[80px] sm:max-w-none">{match.homeTeam?.name}</span>
                  <span className="bg-gray-200 px-2 sm:px-3 py-0.5 sm:py-1 rounded text-xs sm:text-sm">
                    {match.status === 'COMPLETED' 
                      ? `${match.homeScore} - ${match.awayScore}`
                      : 'vs'
                    }
                  </span>
                  <span className="font-medium text-xs sm:text-base truncate max-w-[80px] sm:max-w-none">{match.awayTeam?.name}</span>
                </div>
                <Link 
                  to={`/admin/match-stats/${match.id}`}
                  className="btn-secondary text-xs sm:text-sm py-1 px-2 sm:px-3 w-full sm:w-auto text-center"
                >
                  تفاصيل
                </Link>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center text-gray-500 py-4 text-sm">لا توجد مباريات</p>
        )}
      </div>

      {/* Quick Actions */}
      <div className="card p-3 sm:p-6">
        <h2 className="font-bold text-sm sm:text-lg mb-3 sm:mb-4">إجراءات سريعة</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4">
          <Link to="/admin/leagues" className="bg-purple-50 hover:bg-purple-100 rounded-lg sm:rounded-xl p-3 sm:p-4 text-center transition">
            <span className="text-2xl sm:text-3xl">➕</span>
            <p className="font-medium mt-1 sm:mt-2 text-xs sm:text-base">إنشاء دوري</p>
          </Link>
          <Link to="/admin/teams" className="bg-cyan-50 hover:bg-cyan-100 rounded-lg sm:rounded-xl p-3 sm:p-4 text-center transition">
            <span className="text-2xl sm:text-3xl">➕</span>
            <p className="font-medium mt-1 sm:mt-2 text-xs sm:text-base">إضافة فريق</p>
          </Link>
          <Link to="/admin/players" className="bg-green-50 hover:bg-green-100 rounded-lg sm:rounded-xl p-3 sm:p-4 text-center transition">
            <span className="text-2xl sm:text-3xl">➕</span>
            <p className="font-medium mt-1 sm:mt-2 text-xs sm:text-base">إضافة لاعب</p>
          </Link>
          <Link to="/admin/rounds" className="bg-yellow-50 hover:bg-yellow-100 rounded-lg sm:rounded-xl p-3 sm:p-4 text-center transition">
            <span className="text-2xl sm:text-3xl">➕</span>
            <p className="font-medium mt-1 sm:mt-2 text-xs sm:text-base">إنشاء جولة</p>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
