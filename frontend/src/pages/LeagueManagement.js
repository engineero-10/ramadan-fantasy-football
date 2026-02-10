import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link, Routes, Route } from 'react-router-dom';
import { leagueAPI, teamAPI, playerAPI, roundAPI, matchAPI } from '../services/api';

// Import management components
import ManageTeams from './admin/ManageTeams';
import ManagePlayers from './admin/ManagePlayers';
import ManageRounds from './admin/ManageRounds';
import ManageMatches from './admin/ManageMatches';
import MatchStats from './admin/MatchStats';

const LeagueManagement = () => {
  const { leagueId } = useParams();
  const [league, setLeague] = useState(null);
  const [hasAccess, setHasAccess] = useState(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    teams: 0,
    players: 0,
    rounds: 0,
    matches: 0,
    members: 0
  });

  const checkAccessAndLoadData = useCallback(async () => {
    try {
      setLoading(true);
      
      // التحقق من صلاحية الوصول
      const adminLeaguesRes = await leagueAPI.getMyAdminLeagues();
      const adminLeagues = adminLeaguesRes.data.leagues || [];
      const isAdmin = adminLeagues.some(l => l.id === parseInt(leagueId));
      
      if (!isAdmin) {
        setHasAccess(false);
        setLoading(false);
        return;
      }

      setHasAccess(true);

      // جلب بيانات الدوري
      const leagueRes = await leagueAPI.getById(leagueId);
      setLeague(leagueRes.data.league || leagueRes.data);

      // جلب الإحصائيات
      const [teamsRes, playersRes, roundsRes, matchesRes, membersRes] = await Promise.all([
        teamAPI.getAll({ leagueId }),
        playerAPI.getAll({ leagueId }),
        roundAPI.getAll(leagueId),
        matchAPI.getAll({ leagueId }),
        leagueAPI.getMembers(leagueId)
      ]);

      setStats({
        teams: teamsRes.data.pagination?.total || teamsRes.data.teams?.length || 0,
        players: playersRes.data.pagination?.total || playersRes.data.players?.length || 0,
        rounds: roundsRes.data.rounds?.length || 0,
        matches: matchesRes.data.pagination?.total || matchesRes.data.matches?.length || 0,
        members: membersRes.data.members?.length || 0
      });
    } catch (error) {
      console.error('Error loading league data:', error);
      setHasAccess(false);
    } finally {
      setLoading(false);
    }
  }, [leagueId]);

  useEffect(() => {
    checkAccessAndLoadData();
  }, [checkAccessAndLoadData]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (hasAccess === false) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <div className="text-xl text-red-600 mb-4">ليس لديك صلاحية الوصول لإدارة هذا الدوري</div>
        <Link to="/dashboard" className="text-primary-600 hover:underline">
          العودة للرئيسية
        </Link>
      </div>
    );
  }

  const menuItems = [
    { path: '', label: 'الإحصائيات', icon: '📊' },
    { path: 'teams', label: 'إدارة الفرق', icon: '👥' },
    { path: 'players', label: 'إدارة اللاعبين', icon: '⚽' },
    { path: 'rounds', label: 'إدارة الجولات', icon: '📅' },
    { path: 'matches', label: 'إدارة المباريات', icon: '🏟️' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-l from-primary-600 to-primary-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">إدارة الدوري</h1>
              <p className="text-primary-200">{league?.name}</p>
            </div>
            <Link 
              to="/dashboard"
              className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg transition"
            >
              العودة للرئيسية
            </Link>
          </div>
        </div>

        {/* Navigation */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-reverse space-x-4 overflow-x-auto pb-4">
            {menuItems.map((item) => (
              <Link
                key={item.path}
                to={`/manage-league/${leagueId}${item.path ? `/${item.path}` : ''}`}
                className="flex items-center px-4 py-2 rounded-lg whitespace-nowrap bg-white/10 hover:bg-white/20 transition"
              >
                <span className="ml-2">{item.icon}</span>
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Routes>
          <Route index element={
            <LeagueDashboard stats={stats} league={league} />
          } />
          <Route path="teams" element={
            <ManageTeams fixedLeagueId={leagueId} />
          } />
          <Route path="players" element={
            <ManagePlayers fixedLeagueId={leagueId} />
          } />
          <Route path="rounds" element={
            <ManageRounds fixedLeagueId={leagueId} />
          } />
          <Route path="matches" element={
            <ManageMatches fixedLeagueId={leagueId} />
          } />
          <Route path="match-stats/:id" element={
            <MatchStats />
          } />
        </Routes>
      </div>
    </div>
  );
};

// League Dashboard Component
const LeagueDashboard = ({ stats, league }) => {
  const statCards = [
    { label: 'عدد الأعضاء', value: stats.members, icon: '👤', color: 'bg-blue-500' },
    { label: 'الفرق الحقيقية', value: stats.teams, icon: '👥', color: 'bg-green-500' },
    { label: 'اللاعبين', value: stats.players, icon: '⚽', color: 'bg-purple-500' },
    { label: 'الجولات', value: stats.rounds, icon: '📅', color: 'bg-yellow-500' },
    { label: 'المباريات', value: stats.matches, icon: '🏟️', color: 'bg-red-500' },
  ];

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">لوحة التحكم</h2>
      
      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
        {statCards.map((stat, index) => (
          <div key={index} className="bg-white rounded-xl shadow-sm p-6">
            <div className={`w-12 h-12 ${stat.color} rounded-lg flex items-center justify-center text-2xl mb-4`}>
              {stat.icon}
            </div>
            <div className="text-3xl font-bold text-gray-900">{stat.value}</div>
            <div className="text-gray-500">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* League Info */}
      {league && (
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">معلومات الدوري</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <span className="text-gray-500">كود الدوري:</span>
              <span className="font-mono font-bold text-primary-600 mr-2">{league.code}</span>
            </div>
            <div>
              <span className="text-gray-500">الميزانية:</span>
              <span className="font-bold mr-2">{league.budget} مليون</span>
            </div>
            <div>
              <span className="text-gray-500">لاعبين الفريق:</span>
              <span className="font-bold mr-2">{league.playersPerTeam}</span>
            </div>
            <div>
              <span className="text-gray-500">الانتقالات/جولة:</span>
              <span className="font-bold mr-2">{league.maxTransfersPerRound}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LeagueManagement;
