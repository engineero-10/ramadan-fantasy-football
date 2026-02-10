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
    rounds: 0,
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

      // حساب عدد اللاعبين من كل الدوريات
      let totalPlayers = 0;
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
      }

      setStats({
        leagues: leagues.length,
        teams: teamsRes.data.teams?.length || 0,
        players: totalPlayers,
        matches: matchesRes.data.matches?.length || 0,
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
    { name: 'الدوريات', value: stats.leagues, color: '#8b5cf6' },
    { name: 'الفرق', value: stats.teams, color: '#06b6d4' },
    { name: 'اللاعبين', value: stats.players, color: '#10b981' },
    { name: 'المباريات', value: stats.matches, color: '#f59e0b' },
  ];

  const COLORS = ['#8b5cf6', '#06b6d4', '#10b981', '#f59e0b'];

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
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-l from-primary-600 to-secondary-600 rounded-2xl p-6 text-white">
        <h1 className="text-2xl font-bold mb-2">لوحة التحكم 🎛️</h1>
        <p className="text-white/80">مرحباً بك في لوحة تحكم المشرف</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Link to="/admin/leagues" className="card hover:shadow-lg transition">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
              <span className="text-2xl">🏆</span>
            </div>
            <div>
              <p className="text-sm text-gray-500">الدوريات</p>
              <p className="text-2xl font-bold">{stats.leagues}</p>
            </div>
          </div>
        </Link>

        <Link to="/admin/teams" className="card hover:shadow-lg transition">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-cyan-100 rounded-xl flex items-center justify-center">
              <span className="text-2xl">⚽</span>
            </div>
            <div>
              <p className="text-sm text-gray-500">الفرق</p>
              <p className="text-2xl font-bold">{stats.teams}</p>
            </div>
          </div>
        </Link>

        <Link to="/admin/players" className="card hover:shadow-lg transition">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
              <span className="text-2xl">👤</span>
            </div>
            <div>
              <p className="text-sm text-gray-500">اللاعبين</p>
              <p className="text-2xl font-bold">{stats.players}</p>
            </div>
          </div>
        </Link>

        <Link to="/admin/matches" className="card hover:shadow-lg transition">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
              <span className="text-2xl">📅</span>
            </div>
            <div>
              <p className="text-sm text-gray-500">المباريات</p>
              <p className="text-2xl font-bold">{stats.matches}</p>
            </div>
          </div>
        </Link>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bar Chart */}
        <div className="card">
          <h2 className="font-bold text-lg mb-4">إحصائيات عامة</h2>
          <div className="h-64">
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
        <div className="card">
          <h2 className="font-bold text-lg mb-4">توزيع البيانات</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}`}
                  outerRadius={80}
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
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-lg">آخر المباريات</h2>
          <Link to="/admin/matches" className="text-primary-600 text-sm hover:underline">
            عرض الكل
          </Link>
        </div>
        
        {recentMatches.length > 0 ? (
          <div className="space-y-3">
            {recentMatches.map((match) => (
              <div key={match.id} className="bg-gray-50 rounded-xl p-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <span className="font-medium">{match.homeTeam?.name}</span>
                  <span className="bg-gray-200 px-3 py-1 rounded">
                    {match.status === 'COMPLETED' 
                      ? `${match.homeScore} - ${match.awayScore}`
                      : 'vs'
                    }
                  </span>
                  <span className="font-medium">{match.awayTeam?.name}</span>
                </div>
                <Link 
                  to={`/admin/match-stats/${match.id}`}
                  className="btn-secondary text-sm"
                >
                  تفاصيل
                </Link>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center text-gray-500 py-4">لا توجد مباريات</p>
        )}
      </div>

      {/* Quick Actions */}
      <div className="card">
        <h2 className="font-bold text-lg mb-4">إجراءات سريعة</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Link to="/admin/leagues" className="bg-purple-50 hover:bg-purple-100 rounded-xl p-4 text-center transition">
            <span className="text-3xl">➕</span>
            <p className="font-medium mt-2">إنشاء دوري</p>
          </Link>
          <Link to="/admin/teams" className="bg-cyan-50 hover:bg-cyan-100 rounded-xl p-4 text-center transition">
            <span className="text-3xl">➕</span>
            <p className="font-medium mt-2">إضافة فريق</p>
          </Link>
          <Link to="/admin/players" className="bg-green-50 hover:bg-green-100 rounded-xl p-4 text-center transition">
            <span className="text-3xl">➕</span>
            <p className="font-medium mt-2">إضافة لاعب</p>
          </Link>
          <Link to="/admin/rounds" className="bg-yellow-50 hover:bg-yellow-100 rounded-xl p-4 text-center transition">
            <span className="text-3xl">➕</span>
            <p className="font-medium mt-2">إنشاء جولة</p>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
