import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { matchAPI, playerAPI } from '../../services/api';
import toast from 'react-hot-toast';

const POSITIONS = {
  GK: { name: 'حارس', icon: '🧤' },
  DEF: { name: 'مدافع', icon: '🛡️' },
  MID: { name: 'وسط', icon: '🎯' },
  FWD: { name: 'مهاجم', icon: '⚽' },
};

const MatchStats = () => {
  const { id } = useParams();
  const [match, setMatch] = useState(null);
  const [homePlayers, setHomePlayers] = useState([]);
  const [awayPlayers, setAwayPlayers] = useState([]);
  const [existingStats, setExistingStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingStats, setSavingStats] = useState(false);
  const [activeTab, setActiveTab] = useState('home');
  
  // Stats form
  const [statsForm, setStatsForm] = useState({});

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      // جلب تفاصيل المباراة
      const matchRes = await matchAPI.getOne(id);
      setMatch(matchRes.data.match);
      setExistingStats(matchRes.data.match.stats || []);

      // تحويل الإحصائيات الموجودة لـ form state
      const statsMap = {};
      (matchRes.data.match.stats || []).forEach(stat => {
        statsMap[stat.playerId] = {
          id: stat.id,
          goals: stat.goals || 0,
          assists: stat.assists || 0,
          yellowCards: stat.yellowCards || 0,
          redCards: stat.redCards || 0,
          cleanSheet: stat.cleanSheet || false,
          penaltySaved: stat.penaltySaved || 0,
          minutesPlayed: stat.minutesPlayed || 0,
        };
      });
      setStatsForm(statsMap);

      // جلب لاعبي الفريقين
      if (matchRes.data.match.homeTeamId) {
        const homePlayersRes = await playerAPI.getAll({ teamId: matchRes.data.match.homeTeamId });
        setHomePlayers(homePlayersRes.data.players || []);
      }
      if (matchRes.data.match.awayTeamId) {
        const awayPlayersRes = await playerAPI.getAll({ teamId: matchRes.data.match.awayTeamId });
        setAwayPlayers(awayPlayersRes.data.players || []);
      }
    } catch (error) {
      toast.error('خطأ في جلب البيانات');
    } finally {
      setLoading(false);
    }
  };

  const handleStatChange = (playerId, field, value) => {
    setStatsForm(prev => ({
      ...prev,
      [playerId]: {
        ...prev[playerId],
        [field]: value,
      },
    }));
  };

  const handleSaveStats = async () => {
    setSavingStats(true);
    try {
      // تحويل الإحصائيات للتنسيق المطلوب
      const stats = Object.entries(statsForm).map(([playerId, stat]) => ({
        playerId: parseInt(playerId),
        ...stat,
      })).filter(stat => 
        stat.goals > 0 || 
        stat.assists > 0 || 
        stat.yellowCards > 0 || 
        stat.redCards > 0 || 
        stat.cleanSheet || 
        stat.penaltySaved > 0 || 
        stat.minutesPlayed > 0
      );

      await matchAPI.updateStats(id, { stats });
      toast.success('تم حفظ الإحصائيات بنجاح');
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'خطأ في حفظ الإحصائيات');
    } finally {
      setSavingStats(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="text-4xl animate-bounce mb-4">📊</div>
          <p className="text-gray-600">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  if (!match) {
    return (
      <div className="card text-center py-12">
        <div className="text-5xl mb-4">❌</div>
        <p className="text-gray-600">المباراة غير موجودة</p>
        <Link to="/admin/matches" className="btn-primary mt-4 inline-block">
          العودة للمباريات
        </Link>
      </div>
    );
  }

  const currentPlayers = activeTab === 'home' ? homePlayers : awayPlayers;
  const currentTeam = activeTab === 'home' ? match.homeTeam : match.awayTeam;

  return (
    <div className="space-y-6">
      {/* Match Header */}
      <div className="card bg-gradient-to-l from-primary-600 to-secondary-600 text-white">
        <div className="text-center">
          <h1 className="text-xl font-bold mb-2">إحصائيات المباراة</h1>
          <div className="flex items-center justify-center gap-6">
            <div>
              <p className="text-2xl font-bold">{match.homeTeam?.name}</p>
            </div>
            <div className="text-3xl font-bold">
              {match.homeScore} - {match.awayScore}
            </div>
            <div>
              <p className="text-2xl font-bold">{match.awayTeam?.name}</p>
            </div>
          </div>
          <p className="text-white/80 mt-2">
            {new Date(match.matchDate).toLocaleDateString('ar-SA')} | {match.round?.name}
          </p>
        </div>
      </div>

      {/* Points Guide */}
      <div className="card bg-yellow-50 border border-yellow-200">
        <h3 className="font-bold mb-3">📝 نظام النقاط</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
          <div className="flex justify-between">
            <span>⚽ هدف:</span>
            <span className="font-bold text-green-600">+5</span>
          </div>
          <div className="flex justify-between">
            <span>👟 تمريرة:</span>
            <span className="font-bold text-green-600">+3</span>
          </div>
          <div className="flex justify-between">
            <span>✅ مشاركة:</span>
            <span className="font-bold text-green-600">+1</span>
          </div>
          <div className="flex justify-between">
            <span>🟨 صفراء:</span>
            <span className="font-bold text-red-600">-1</span>
          </div>
          <div className="flex justify-between">
            <span>🟥 حمراء:</span>
            <span className="font-bold text-red-600">-4</span>
          </div>
          <div className="flex justify-between">
            <span>🛡️ شباك نظيفة:</span>
            <span className="font-bold text-green-600">+5</span>
          </div>
          <div className="flex justify-between">
            <span>🧤 صد ركلة:</span>
            <span className="font-bold text-green-600">+5</span>
          </div>
        </div>
      </div>

      {/* Team Tabs */}
      <div className="card">
        <div className="flex border-b mb-4">
          <button
            onClick={() => setActiveTab('home')}
            className={`flex-1 py-3 text-center font-medium transition ${
              activeTab === 'home'
                ? 'border-b-2 border-primary-500 text-primary-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {match.homeTeam?.name}
          </button>
          <button
            onClick={() => setActiveTab('away')}
            className={`flex-1 py-3 text-center font-medium transition ${
              activeTab === 'away'
                ? 'border-b-2 border-primary-500 text-primary-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {match.awayTeam?.name}
          </button>
        </div>

        {/* Players Stats Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-gray-50">
                <th className="text-right py-3 px-2">اللاعب</th>
                <th className="text-center py-3 px-1">⚽</th>
                <th className="text-center py-3 px-1">👟</th>
                <th className="text-center py-3 px-1">🟨</th>
                <th className="text-center py-3 px-1">🟥</th>
                <th className="text-center py-3 px-1">🛡️</th>
                <th className="text-center py-3 px-1">🧤</th>
                <th className="text-center py-3 px-1">⏱️</th>
              </tr>
            </thead>
            <tbody>
              {currentPlayers.map((player) => {
                const playerStats = statsForm[player.id] || {};
                const posInfo = POSITIONS[player.position] || {};
                
                return (
                  <tr key={player.id} className="border-b hover:bg-gray-50">
                    <td className="py-2 px-2">
                      <div className="flex items-center gap-2">
                        <span>{posInfo.icon}</span>
                        <div>
                          <p className="font-medium">{player.name}</p>
                          <p className="text-xs text-gray-500">{posInfo.name}</p>
                        </div>
                      </div>
                    </td>
                    <td className="text-center px-1">
                      <input
                        type="number"
                        value={playerStats.goals || 0}
                        onChange={(e) => handleStatChange(player.id, 'goals', parseInt(e.target.value) || 0)}
                        className="w-12 text-center border rounded py-1"
                        min={0}
                      />
                    </td>
                    <td className="text-center px-1">
                      <input
                        type="number"
                        value={playerStats.assists || 0}
                        onChange={(e) => handleStatChange(player.id, 'assists', parseInt(e.target.value) || 0)}
                        className="w-12 text-center border rounded py-1"
                        min={0}
                      />
                    </td>
                    <td className="text-center px-1">
                      <input
                        type="number"
                        value={playerStats.yellowCards || 0}
                        onChange={(e) => handleStatChange(player.id, 'yellowCards', parseInt(e.target.value) || 0)}
                        className="w-12 text-center border rounded py-1"
                        min={0}
                        max={2}
                      />
                    </td>
                    <td className="text-center px-1">
                      <input
                        type="number"
                        value={playerStats.redCards || 0}
                        onChange={(e) => handleStatChange(player.id, 'redCards', parseInt(e.target.value) || 0)}
                        className="w-12 text-center border rounded py-1"
                        min={0}
                        max={1}
                      />
                    </td>
                    <td className="text-center px-1">
                      {player.position === 'GK' ? (
                        <input
                          type="checkbox"
                          checked={playerStats.cleanSheet || false}
                          onChange={(e) => handleStatChange(player.id, 'cleanSheet', e.target.checked)}
                          className="w-5 h-5"
                        />
                      ) : (
                        <span className="text-gray-300">-</span>
                      )}
                    </td>
                    <td className="text-center px-1">
                      {player.position === 'GK' ? (
                        <input
                          type="number"
                          value={playerStats.penaltySaved || 0}
                          onChange={(e) => handleStatChange(player.id, 'penaltySaved', parseInt(e.target.value) || 0)}
                          className="w-12 text-center border rounded py-1"
                          min={0}
                        />
                      ) : (
                        <span className="text-gray-300">-</span>
                      )}
                    </td>
                    <td className="text-center px-1">
                      <input
                        type="number"
                        value={playerStats.minutesPlayed || 0}
                        onChange={(e) => handleStatChange(player.id, 'minutesPlayed', parseInt(e.target.value) || 0)}
                        className="w-14 text-center border rounded py-1"
                        min={0}
                        max={120}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {currentPlayers.length === 0 && (
          <p className="text-center text-gray-500 py-8">لا يوجد لاعبون في هذا الفريق</p>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-4">
        <Link to="/admin/matches" className="btn-secondary flex-1">
          ← العودة للمباريات
        </Link>
        <button
          onClick={handleSaveStats}
          disabled={savingStats}
          className="btn-primary flex-1"
        >
          {savingStats ? '⏳ جاري الحفظ...' : '💾 حفظ الإحصائيات'}
        </button>
      </div>
    </div>
  );
};

export default MatchStats;
