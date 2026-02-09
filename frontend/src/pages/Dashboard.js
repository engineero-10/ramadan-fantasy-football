import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { leagueAPI, fantasyTeamAPI, leaderboardAPI } from '../services/api';
import toast from 'react-hot-toast';

const Dashboard = () => {
  const { user } = useAuth();
  const [leagues, setLeagues] = useState([]);
  const [fantasyTeam, setFantasyTeam] = useState(null);
  const [myRank, setMyRank] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch user's leagues
      const leaguesRes = await leagueAPI.getAll();
      setLeagues(leaguesRes.data.leagues || []);

      // Try to fetch fantasy team
      try {
        const teamRes = await fantasyTeamAPI.getMyTeam();
        setFantasyTeam(teamRes.data.fantasyTeam);
        
        // Get rank if team exists
        if (teamRes.data.fantasyTeam) {
          const rankRes = await leaderboardAPI.getMyRank(teamRes.data.fantasyTeam.leagueId);
          setMyRank(rankRes.data);
        }
      } catch (e) {
        // No fantasy team yet
      }
    } catch (error) {
      toast.error('خطأ في تحميل البيانات');
    } finally {
      setLoading(false);
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
      {/* Welcome Section */}
      <div className="bg-gradient-to-l from-primary-600 to-secondary-600 rounded-2xl p-6 text-white">
        <h1 className="text-2xl font-bold mb-2">أهلاً {user?.name}! 🌙</h1>
        <p className="text-white/80">رمضان كريم! استعد للمنافسة في بطولات رمضان</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <span className="text-2xl">🏆</span>
            </div>
            <div>
              <p className="text-sm text-gray-500">الدوريات المشترك بها</p>
              <p className="text-2xl font-bold">{leagues.length}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
              <span className="text-2xl">⭐</span>
            </div>
            <div>
              <p className="text-sm text-gray-500">إجمالي النقاط</p>
              <p className="text-2xl font-bold">{fantasyTeam?.totalPoints || 0}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
              <span className="text-2xl">📊</span>
            </div>
            <div>
              <p className="text-sm text-gray-500">ترتيبك</p>
              <p className="text-2xl font-bold">
                {myRank?.rank ? `#${myRank.rank}` : '-'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Fantasy Team Status */}
        <div className="card">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
            <span>⚽</span> فريقك الخيالي
          </h2>
          
          {fantasyTeam ? (
            <div className="space-y-4">
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="font-medium text-lg">{fantasyTeam.name}</p>
                <p className="text-sm text-gray-500">
                  {fantasyTeam.players?.length || 0} لاعب في الفريق
                </p>
              </div>
              <Link to="/my-team" className="btn-primary block text-center">
                إدارة الفريق
              </Link>
            </div>
          ) : (
            <div className="text-center py-6">
              <div className="text-4xl mb-4">🎯</div>
              <p className="text-gray-600 mb-4">لم تنشئ فريقك الخيالي بعد</p>
              <Link to="/create-team" className="btn-primary">
                إنشاء فريق جديد
              </Link>
            </div>
          )}
        </div>

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
