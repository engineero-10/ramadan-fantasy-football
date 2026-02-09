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
import Transfers from './pages/Transfers';
import Matches from './pages/Matches';
import MatchDetails from './pages/MatchDetails';
import Leaderboard from './pages/Leaderboard';
import PlayerDetails from './pages/PlayerDetails';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import ManageLeagues from './pages/admin/ManageLeagues';
import ManageTeams from './pages/admin/ManageTeams';
import ManagePlayers from './pages/admin/ManagePlayers';
import ManageRounds from './pages/admin/ManageRounds';
import ManageMatches from './pages/admin/ManageMatches';
import MatchStats from './pages/admin/MatchStats';

// Protected Route Component
const ProtectedRoute = ({ children, adminOnly = false }) => {
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

  if (adminOnly && user.role !== 'ADMIN') {
    return <Navigate to="/dashboard" replace />;
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
          <Route path="join-league" element={<JoinLeague />} />
          <Route path="create-team/:leagueId" element={<CreateTeam />} />
          <Route path="my-team/:leagueId" element={<MyTeam />} />
          <Route path="transfers/:leagueId" element={<Transfers />} />
          <Route path="matches/:leagueId" element={<Matches />} />
          <Route path="match/:matchId" element={<MatchDetails />} />
          <Route path="leaderboard/:leagueId" element={<Leaderboard />} />
          <Route path="player/:playerId" element={<PlayerDetails />} />
        </Route>

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
          <Route path="leagues" element={<ManageLeagues />} />
          <Route path="teams/:leagueId" element={<ManageTeams />} />
          <Route path="players/:leagueId" element={<ManagePlayers />} />
          <Route path="rounds/:leagueId" element={<ManageRounds />} />
          <Route path="matches/:leagueId" element={<ManageMatches />} />
          <Route path="match-stats/:matchId" element={<MatchStats />} />
        </Route>

        {/* 404 */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
