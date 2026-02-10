import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { matchAPI, playerAPI } from '../../services/api';
import toast from 'react-hot-toast';

const POSITIONS = {
  GOALKEEPER: { name: 'حارس', icon: '🧤' },
  DEFENDER: { name: 'مدافع', icon: '🛡️' },
  MIDFIELDER: { name: 'وسط', icon: '🎯' },
  FORWARD: { name: 'مهاجم', icon: '⚽' },
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
      const matchRes = await matchAPI.getById(id);
      const matchData = matchRes.data.match;
      setMatch(matchData);
      setExistingStats(matchData.matchStats || []);

      // تحويل الإحصائيات الموجودة لـ form state
      const statsMap = {};
      (matchData.matchStats || []).forEach(stat => {
        statsMap[stat.playerId] = {
          id: stat.id,
          goals: stat.goals || 0,
          assists: stat.assists || 0,
          yellowCards: stat.yellowCards || 0,
          redCards: stat.redCards || 0,
          cleanSheet: stat.cleanSheet || false,
          penaltySaves: stat.penaltySaves || 0,
          minutesPlayed: stat.minutesPlayed || 0,
          bonusPoints: stat.bonusPoints || 0,
        };
      });
      setStatsForm(statsMap);

      // جلب لاعبي الفريقين (limit=100 لجلب كل لاعبي الفريق)
      if (matchData.homeTeamId) {
        const homePlayersRes = await playerAPI.getAll({ teamId: matchData.homeTeamId, limit: 100 });
        setHomePlayers(homePlayersRes.data.players || []);
      }
      if (matchData.awayTeamId) {
        const awayPlayersRes = await playerAPI.getAll({ teamId: matchData.awayTeamId, limit: 100 });
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
        stat.penaltySaves > 0 || 
        stat.minutesPlayed > 0 ||
        stat.bonusPoints !== 0
      );

      await matchAPI.updateStats(id, stats);
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
          <div className="text-3xl sm:text-4xl animate-bounce mb-4">📊</div>
          <p className="text-gray-600 text-sm sm:text-base">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  if (!match) {
    return (
      <div className="card text-center py-8 sm:py-12">
        <div className="text-4xl sm:text-5xl mb-4">❌</div>
        <p className="text-gray-600 text-sm sm:text-base">المباراة غير موجودة</p>
        <Link to="/admin/matches" className="btn-primary mt-4 inline-block text-sm sm:text-base">
          العودة للمباريات
        </Link>
      </div>
    );
  }

  const currentPlayers = activeTab === 'home' ? homePlayers : awayPlayers;
  const currentTeam = activeTab === 'home' ? match.homeTeam : match.awayTeam;

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Match Header */}
      <div className="card bg-gradient-to-l from-primary-600 to-secondary-600 text-white p-3 sm:p-6">
        <div className="text-center">
          <h1 className="text-base sm:text-xl font-bold mb-2">إحصائيات المباراة</h1>
          <div className="flex items-center justify-center gap-2 sm:gap-6">
            <div className="flex-1 min-w-0">
              <p className="text-sm sm:text-2xl font-bold truncate">{match.homeTeam?.name}</p>
            </div>
            <div className="text-xl sm:text-3xl font-bold flex-shrink-0">
              {match.homeScore} - {match.awayScore}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm sm:text-2xl font-bold truncate">{match.awayTeam?.name}</p>
            </div>
          </div>
          <p className="text-white/80 mt-2 text-xs sm:text-base">
            {new Date(match.matchDate).toLocaleDateString('ar-SA')} | {match.round?.name}
          </p>
        </div>
      </div>

      {/* Points Guide */}
      <div className="card bg-yellow-50 border border-yellow-200 p-3 sm:p-6">
        <h3 className="font-bold mb-2 sm:mb-3 text-sm sm:text-base">📝 نظام النقاط</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 text-xs sm:text-sm">
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
      <div className="card p-3 sm:p-6">
        <div className="flex border-b mb-3 sm:mb-4">
          <button
            onClick={() => setActiveTab('home')}
            className={`flex-1 py-2 sm:py-3 text-center font-medium transition text-xs sm:text-base truncate ${
              activeTab === 'home'
                ? 'border-b-2 border-primary-500 text-primary-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {match.homeTeam?.name}
          </button>
          <button
            onClick={() => setActiveTab('away')}
            className={`flex-1 py-2 sm:py-3 text-center font-medium transition text-xs sm:text-base truncate ${
              activeTab === 'away'
                ? 'border-b-2 border-primary-500 text-primary-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {match.awayTeam?.name}
          </button>
        </div>

        {/* Players Stats Table */}
        <div className="overflow-x-auto -mx-3 sm:mx-0">
          <table className="w-full text-[10px] sm:text-sm min-w-[500px]">
            <thead>
              <tr className="border-b bg-gray-50">
                <th className="text-right py-2 sm:py-3 px-1 sm:px-2">اللاعب</th>
                <th className="text-center py-2 sm:py-3 px-0.5 sm:px-1">⚽</th>
                <th className="text-center py-2 sm:py-3 px-0.5 sm:px-1">👟</th>
                <th className="text-center py-2 sm:py-3 px-0.5 sm:px-1">🟨</th>
                <th className="text-center py-2 sm:py-3 px-0.5 sm:px-1">🟥</th>
                <th className="text-center py-2 sm:py-3 px-0.5 sm:px-1">🛡️</th>
                <th className="text-center py-2 sm:py-3 px-0.5 sm:px-1">🧤</th>
                <th className="text-center py-2 sm:py-3 px-0.5 sm:px-1">⏱️</th>
                <th className="text-center py-2 sm:py-3 px-0.5 sm:px-1" title="نقاط إضافية">➕</th>
              </tr>
            </thead>
            <tbody>
              {currentPlayers.map((player) => {
                const playerStats = statsForm[player.id] || {};
                const posInfo = POSITIONS[player.position] || {};
                
                return (
                  <tr key={player.id} className="border-b hover:bg-gray-50">
                    <td className="py-1.5 sm:py-2 px-1 sm:px-2">
                      <div className="flex items-center gap-1 sm:gap-2">
                        <span className="text-sm sm:text-base">{posInfo.icon}</span>
                        <div className="min-w-0">
                          <p className="font-medium text-[10px] sm:text-sm truncate max-w-[70px] sm:max-w-none">{player.name}</p>
                          <p className="text-[9px] sm:text-xs text-gray-500 hidden sm:block">{posInfo.name}</p>
                        </div>
                      </div>
                    </td>
                    <td className="text-center px-0.5 sm:px-1">
                      <input
                        type="number"
                        value={playerStats.goals || 0}
                        onChange={(e) => handleStatChange(player.id, 'goals', parseInt(e.target.value) || 0)}
                        className="w-8 sm:w-12 text-center border rounded py-0.5 sm:py-1 text-[10px] sm:text-sm"
                        min={0}
                      />
                    </td>
                    <td className="text-center px-0.5 sm:px-1">
                      <input
                        type="number"
                        value={playerStats.assists || 0}
                        onChange={(e) => handleStatChange(player.id, 'assists', parseInt(e.target.value) || 0)}
                        className="w-8 sm:w-12 text-center border rounded py-0.5 sm:py-1 text-[10px] sm:text-sm"
                        min={0}
                      />
                    </td>
                    <td className="text-center px-0.5 sm:px-1">
                      <input
                        type="number"
                        value={playerStats.yellowCards || 0}
                        onChange={(e) => handleStatChange(player.id, 'yellowCards', parseInt(e.target.value) || 0)}
                        className="w-8 sm:w-12 text-center border rounded py-0.5 sm:py-1 text-[10px] sm:text-sm"
                        min={0}
                        max={2}
                      />
                    </td>
                    <td className="text-center px-0.5 sm:px-1">
                      <input
                        type="number"
                        value={playerStats.redCards || 0}
                        onChange={(e) => handleStatChange(player.id, 'redCards', parseInt(e.target.value) || 0)}
                        className="w-8 sm:w-12 text-center border rounded py-0.5 sm:py-1 text-[10px] sm:text-sm"
                        min={0}
                        max={1}
                      />
                    </td>
                    <td className="text-center px-0.5 sm:px-1">
                      {player.position === 'GOALKEEPER' ? (
                        <input
                          type="checkbox"
                          checked={playerStats.cleanSheet || false}
                          onChange={(e) => handleStatChange(player.id, 'cleanSheet', e.target.checked)}
                          className="w-4 h-4 sm:w-5 sm:h-5"
                        />
                      ) : (
                        <span className="text-gray-300">-</span>
                      )}
                    </td>
                    <td className="text-center px-0.5 sm:px-1">
                      {player.position === 'GOALKEEPER' ? (
                        <input
                          type="number"
                          value={playerStats.penaltySaves || 0}
                          onChange={(e) => handleStatChange(player.id, 'penaltySaves', parseInt(e.target.value) || 0)}
                          className="w-8 sm:w-12 text-center border rounded py-0.5 sm:py-1 text-[10px] sm:text-sm"
                          min={0}
                        />
                      ) : (
                        <span className="text-gray-300">-</span>
                      )}
                    </td>
                    <td className="text-center px-0.5 sm:px-1">
                      <input
                        type="number"
                        value={playerStats.minutesPlayed || 0}
                        onChange={(e) => handleStatChange(player.id, 'minutesPlayed', parseInt(e.target.value) || 0)}
                        className="w-9 sm:w-14 text-center border rounded py-0.5 sm:py-1 text-[10px] sm:text-sm"
                        min={0}
                        max={120}
                      />
                    </td>
                    <td className="text-center px-0.5 sm:px-1">
                      <input
                        type="number"
                        value={playerStats.bonusPoints || 0}
                        onChange={(e) => handleStatChange(player.id, 'bonusPoints', parseInt(e.target.value) || 0)}
                        className="w-9 sm:w-14 text-center border rounded py-0.5 sm:py-1 bg-yellow-50 text-[10px] sm:text-sm"
                        title="نقاط إضافية يدوية"
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {currentPlayers.length === 0 && (
          <p className="text-center text-gray-500 py-6 sm:py-8 text-sm">لا يوجد لاعبون في هذا الفريق</p>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-2 sm:gap-4">
        <Link to="/admin/matches" className="btn-secondary flex-1 text-xs sm:text-base">
          ← العودة
        </Link>
        <button
          onClick={handleSaveStats}
          disabled={savingStats}
          className="btn-primary flex-1 text-xs sm:text-base"
        >
          {savingStats ? '⏳ جاري الحفظ...' : '💾 حفظ'}
        </button>
      </div>
    </div>
  );
};

export default MatchStats;
