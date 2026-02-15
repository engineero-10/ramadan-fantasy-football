import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';

// Layout
import Layout from './components/Layout';
import AdminLayout from './components/AdminLayout';

// Public Pages
import Login from './pages/Login';
import Register from './pages/Register';

// User Pages
import Dashboard from './pages/Dashboard';
import JoinLeague from './pages/JoinLeague';
import CreateTeam from './pages/CreateTeam';
import MyTeam from './pages/MyTeam';
import RoundHistory from './pages/RoundHistory';
import Transfers from './pages/Transfers';
import Rounds from './pages/Rounds';
import Matches from './pages/Matches';
import MatchDetails from './pages/MatchDetails';
import Leaderboard from './pages/Leaderboard';
import PlayerDetails from './pages/PlayerDetails';
import LeagueManagement from './pages/LeagueManagement';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import ManageLeagues from './pages/admin/ManageLeagues';
import ManageTeams from './pages/admin/ManageTeams';
import ManagePlayers from './pages/admin/ManagePlayers';
import ManageRounds from './pages/admin/ManageRounds';
import ManageMatches from './pages/admin/ManageMatches';
import MatchStats from './pages/admin/MatchStats';
import ManageAdmins from './pages/admin/ManageAdmins';
import ViewMemberTeams from './pages/admin/ViewMemberTeams';

// Protected Route Component
const ProtectedRoute = ({ children, adminOnly = false, ownerOnly = false, userOnly = false }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Owner-only pages (like manage admins)
  if (ownerOnly && user.role !== 'OWNER') {
    return <Navigate to="/admin" replace />;
  }

  // Admin or Owner can access admin pages
  if (adminOnly && user.role !== 'ADMIN' && user.role !== 'OWNER') {
    return <Navigate to="/dashboard" replace />;
  }

  // منع الأدمن من الوصول لصفحات المستخدمين (الأدمن للإدارة فقط)
  if (userOnly && (user.role === 'ADMIN' || user.role === 'OWNER')) {
    return <Navigate to="/admin" replace />;
  }

  return children;
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* User Routes */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          {/* صفحات المستخدم فقط - الأدمن لا يمكنه الوصول إليها */}
          <Route path="join-league" element={<ProtectedRoute userOnly><JoinLeague /></ProtectedRoute>} />
          <Route path="create-team" element={<ProtectedRoute userOnly><CreateTeam /></ProtectedRoute>} />
          <Route path="create-team/:leagueId" element={<ProtectedRoute userOnly><CreateTeam /></ProtectedRoute>} />
          <Route path="my-team" element={<ProtectedRoute userOnly><MyTeam /></ProtectedRoute>} />
          <Route path="my-team/:leagueId" element={<ProtectedRoute userOnly><MyTeam /></ProtectedRoute>} />
          <Route path="round-history" element={<ProtectedRoute userOnly><RoundHistory /></ProtectedRoute>} />
          <Route path="transfers" element={<ProtectedRoute userOnly><Transfers /></ProtectedRoute>} />
          <Route path="transfers/:leagueId" element={<ProtectedRoute userOnly><Transfers /></ProtectedRoute>} />
          {/* صفحات عامة للمستخدم والأدمن */}
          <Route path="rounds" element={<Rounds />} />
          <Route path="matches" element={<Matches />} />
          <Route path="matches/:leagueId" element={<Matches />} />
          <Route path="match/:matchId" element={<MatchDetails />} />
          <Route path="leaderboard" element={<Leaderboard />} />
          <Route path="leaderboard/:leagueId" element={<Leaderboard />} />
          <Route path="player/:playerId" element={<PlayerDetails />} />
        </Route>

        {/* League Admin Routes - للمستخدمين المُعينين كأدمن للدوري */}
        <Route
          path="/manage-league/:leagueId/*"
          element={
            <ProtectedRoute>
              <LeagueManagement />
            </ProtectedRoute>
          }
        />

        {/* Admin Routes */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute adminOnly>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<AdminDashboard />} />
          <Route path="admins" element={<ProtectedRoute ownerOnly><ManageAdmins /></ProtectedRoute>} />
          <Route path="leagues" element={<ManageLeagues />} />
          <Route path="teams" element={<ManageTeams />} />
          <Route path="players" element={<ManagePlayers />} />
          <Route path="rounds" element={<ManageRounds />} />
          <Route path="matches" element={<ManageMatches />} />
          <Route path="match-stats/:id" element={<MatchStats />} />
          <Route path="member-teams" element={<ViewMemberTeams />} />
        </Route>

        {/* 404 */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
