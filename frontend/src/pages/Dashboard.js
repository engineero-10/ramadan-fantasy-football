import React, { useState, useEffect } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { leagueAPI, fantasyTeamAPI } from '../services/api';
import toast from 'react-hot-toast';

const Dashboard = () => {
  const { user, isAdmin } = useAuth();
  const [leagues, setLeagues] = useState([]);
  const [adminLeagues, setAdminLeagues] = useState([]);
  const [fantasyTeams, setFantasyTeams] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // لا نحتاج لجلب البيانات إذا كان أدمن
    if (!isAdmin) {
      fetchData();
    }
  }, [isAdmin]);

  const fetchData = async () => {
    try {
      // Fetch user's leagues
      const leaguesRes = await leagueAPI.getAll();
      setLeagues(leaguesRes.data.leagues || []);

      // Fetch leagues where user is admin
      try {
        const adminLeaguesRes = await leagueAPI.getMyAdminLeagues();
        setAdminLeagues(adminLeaguesRes.data.leagues || []);
      } catch (e) {
        // Not a league admin
      }

      // Fetch all fantasy teams
      try {
        const teamsRes = await fantasyTeamAPI.getMyTeams();
        const teams = teamsRes.data.fantasyTeams || [];
        setFantasyTeams(teams);
      } catch (e) {
        // No fantasy teams yet
      }
    } catch (error) {
      toast.error('خطأ في تحميل البيانات');
    } finally {
      setLoading(false);
    }
  };

  // توجيه الأدمن مباشرة للوحة التحكم
  if (isAdmin) {
    return <Navigate to="/admin" replace />;
  }

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
    <div className="space-y-4 sm:space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-l from-primary-600 to-secondary-600 rounded-xl sm:rounded-2xl p-4 sm:p-6 text-white">
        <h1 className="text-xl sm:text-2xl font-bold mb-1 sm:mb-2">أهلاً {user?.name}! 🌙</h1>
        <p className="text-sm sm:text-base text-white/80">رمضان كريم! استعد للمنافسة في بطولات رمضان</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-2 sm:gap-4">
        <div className="card p-3 sm:p-6">
          <div className="flex flex-col sm:flex-row items-center sm:gap-4">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 rounded-lg sm:rounded-xl flex items-center justify-center mb-2 sm:mb-0">
              <span className="text-xl sm:text-2xl">🏆</span>
            </div>
            <div className="text-center sm:text-right">
              <p className="text-[10px] sm:text-sm text-gray-500">الدوريات</p>
              <p className="text-xl sm:text-2xl font-bold">{leagues.length}</p>
            </div>
          </div>
        </div>

        <div className="card p-3 sm:p-6">
          <div className="flex flex-col sm:flex-row items-center sm:gap-4">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-100 rounded-lg sm:rounded-xl flex items-center justify-center mb-2 sm:mb-0">
              <span className="text-xl sm:text-2xl">⚽</span>
            </div>
            <div className="text-center sm:text-right">
              <p className="text-[10px] sm:text-sm text-gray-500">الفرق</p>
              <p className="text-xl sm:text-2xl font-bold">{fantasyTeams.length}</p>
            </div>
          </div>
        </div>

        <div className="card p-3 sm:p-6">
          <div className="flex flex-col sm:flex-row items-center sm:gap-4">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-yellow-100 rounded-lg sm:rounded-xl flex items-center justify-center mb-2 sm:mb-0">
              <span className="text-xl sm:text-2xl">⭐</span>
            </div>
            <div className="text-center sm:text-right">
              <p className="text-[10px] sm:text-sm text-gray-500">النقاط</p>
              <p className="text-xl sm:text-2xl font-bold">{fantasyTeams.reduce((sum, t) => sum + (t.totalPoints || 0), 0)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* League Admin Section */}
      {adminLeagues.length > 0 && (
        <div className="card bg-gradient-to-l from-amber-50 to-orange-50 border border-amber-200">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2 text-amber-800">
            <span>👑</span> أنت مشرف في الدوريات التالية
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {adminLeagues.map((league) => (
              <div key={league.id} className="bg-white rounded-xl p-4 flex items-center justify-between shadow-sm">
                <div>
                  <p className="font-medium">{league.name}</p>
                  <p className="text-xs text-gray-500">{league._count?.members || 0} عضو</p>
                </div>
                <Link 
                  to={`/manage-league/${league.id}`}
                  className="bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-lg text-sm transition"
                >
                  إدارة الدوري
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Fantasy Teams Section */}
      <div className="card">
        <h2 className="text-base sm:text-lg font-bold mb-3 sm:mb-4 flex items-center gap-2">
          <span>⚽</span> فرقي الخيالية
        </h2>
        
        {fantasyTeams.length > 0 ? (
          <div className="space-y-2 sm:space-y-3">
            {fantasyTeams.map((team) => (
              <div key={team.id} className="bg-gray-50 rounded-lg sm:rounded-xl p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4">
                <div className="flex-1">
                  <p className="font-medium text-sm sm:text-lg">{team.name}</p>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs sm:text-sm text-gray-500">
                    <span>🏆 {team.league?.name}</span>
                    <span>⭐ {team.totalPoints || 0} نقطة</span>
                    <span>👥 {team.players?.length || 0} لاعب</span>
                  </div>
                </div>
                <Link 
                  to={`/my-team?leagueId=${team.leagueId}`}
                  className="btn-primary text-xs sm:text-sm px-3 sm:px-4 py-2 w-full sm:w-auto text-center"
                >
                  إدارة الفريق
                </Link>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-6">
            <div className="text-4xl mb-4">🎯</div>
            <p className="text-gray-600 mb-4">لم تنشئ أي فريق خيالي بعد</p>
            <Link to="/create-team" className="btn-primary">
              إنشاء فريق جديد
            </Link>
          </div>
        )}
        
        {fantasyTeams.length > 0 && leagues.length > fantasyTeams.length && (
          <Link to="/create-team" className="btn-secondary block text-center mt-4">
            إنشاء فريق في دوري آخر
          </Link>
        )}
      </div>

      {/* Main Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Leagues */}
        <div className="card">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
            <span>🏆</span> الدوريات
          </h2>
          
          {leagues.length > 0 ? (
            <div className="space-y-3">
              {leagues.slice(0, 3).map((league) => (
                <div key={league.id} className="bg-gray-50 rounded-xl p-3 flex items-center justify-between">
                  <div>
                    <p className="font-medium">{league.name}</p>
                    <p className="text-xs text-gray-500">كود: {league.code}</p>
                  </div>
                  <Link 
                    to={`/leaderboard?league=${league.id}`}
                    className="text-primary-600 text-sm hover:underline"
                  >
                    الترتيب
                  </Link>
                </div>
              ))}
              {leagues.length > 3 && (
                <p className="text-sm text-gray-500 text-center">
                  +{leagues.length - 3} دوريات أخرى
                </p>
              )}
            </div>
          ) : (
            <div className="text-center py-6">
              <div className="text-4xl mb-4">🔗</div>
              <p className="text-gray-600 mb-4">لم تنضم لأي دوري بعد</p>
            </div>
          )}
          
          <Link 
            to="/join-league" 
            className="btn-secondary block text-center mt-4"
          >
            الانضمام لدوري
          </Link>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card">
        <h2 className="text-lg font-bold mb-4">روابط سريعة</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Link to="/matches" className="bg-gray-50 hover:bg-gray-100 rounded-xl p-4 text-center transition">
            <div className="text-3xl mb-2">📅</div>
            <p className="text-sm font-medium">المباريات</p>
          </Link>
          <Link to="/transfers" className="bg-gray-50 hover:bg-gray-100 rounded-xl p-4 text-center transition">
            <div className="text-3xl mb-2">🔄</div>
            <p className="text-sm font-medium">الانتقالات</p>
          </Link>
          <Link to="/leaderboard" className="bg-gray-50 hover:bg-gray-100 rounded-xl p-4 text-center transition">
            <div className="text-3xl mb-2">📊</div>
            <p className="text-sm font-medium">الترتيب</p>
          </Link>
          <Link to="/my-team" className="bg-gray-50 hover:bg-gray-100 rounded-xl p-4 text-center transition">
            <div className="text-3xl mb-2">👥</div>
            <p className="text-sm font-medium">فريقي</p>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
