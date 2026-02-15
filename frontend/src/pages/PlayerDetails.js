import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { playerAPI } from '../services/api';
import toast from 'react-hot-toast';

const POSITIONS = {
  GOALKEEPER: { name: 'حارس مرمى', icon: '🧤', color: 'bg-yellow-500' },
  DEFENDER: { name: 'مدافع', icon: '🛡️', color: 'bg-blue-500' },
  MIDFIELDER: { name: 'وسط', icon: '🎯', color: 'bg-green-500' },
  FORWARD: { name: 'مهاجم', icon: '⚽', color: 'bg-red-500' },
};

const PlayerDetails = () => {
  const { playerId } = useParams();
  const [player, setPlayer] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPlayer();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playerId]);

  const fetchPlayer = async () => {
    try {
      const response = await playerAPI.getById(playerId);
      setPlayer(response.data.player);
    } catch (error) {
      toast.error('خطأ في جلب بيانات اللاعب');
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

  if (!player) {
    return (
      <div className="card text-center py-12">
        <div className="text-5xl mb-4">❌</div>
        <p className="text-gray-600">اللاعب غير موجود</p>
        <Link to="/matches" className="btn-primary mt-4 inline-block">
          العودة
        </Link>
      </div>
    );
  }

  const position = POSITIONS[player.position] || {};

  // حساب الإحصائيات الإجمالية
  const totalStats = player.matchStats?.reduce((acc, stat) => {
    acc.goals += stat.goals || 0;
    acc.assists += stat.assists || 0;
    acc.yellowCards += stat.yellowCards || 0;
    acc.redCards += stat.redCards || 0;
    acc.cleanSheets += stat.cleanSheet ? 1 : 0;
    acc.penaltiesSaved += stat.penaltySaved || 0;
    acc.minutesPlayed += stat.minutesPlayed || 0;
    acc.matches += 1;
    return acc;
  }, {
    goals: 0,
    assists: 0,
    yellowCards: 0,
    redCards: 0,
    cleanSheets: 0,
    penaltiesSaved: 0,
    minutesPlayed: 0,
    matches: 0,
  }) || {};

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Player Header */}
      <div className="card bg-gradient-to-l from-primary-600 to-secondary-600 text-white p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
          <div className="w-16 h-16 sm:w-24 sm:h-24 bg-white rounded-full flex items-center justify-center text-3xl sm:text-5xl shadow-lg flex-shrink-0">
            {position.icon}
          </div>
          <div className="text-center sm:text-right flex-1 min-w-0">
            <h1 className="text-xl sm:text-3xl font-bold truncate">{player.name}</h1>
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 sm:gap-3 mt-2">
              <span className={`px-2 sm:px-3 py-0.5 sm:py-1 rounded text-xs sm:text-sm ${position.color} text-white`}>
                {position.name}
              </span>
              <span className="text-white/80 text-sm truncate">
                {player.team?.name}
              </span>
              {player.shirtNumber && (
                <span className="bg-white/20 px-2 py-0.5 sm:py-1 rounded text-xs sm:text-sm">
                  #{player.shirtNumber}
                </span>
              )}
            </div>
          </div>
          <div className="text-center flex-shrink-0">
            <p className="text-3xl sm:text-5xl font-bold">{player.totalPoints}</p>
            <p className="text-white/80 text-xs sm:text-base">إجمالي النقاط</p>
          </div>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-4 gap-2 sm:gap-4">
        <div className="card p-2 sm:p-6 text-center">
          <p className="text-xl sm:text-3xl font-bold text-primary-600">{totalStats.goals}</p>
          <p className="text-[10px] sm:text-sm text-gray-600">⚽ أهداف</p>
        </div>
        <div className="card p-2 sm:p-6 text-center">
          <p className="text-xl sm:text-3xl font-bold text-green-600">{totalStats.assists}</p>
          <p className="text-[10px] sm:text-sm text-gray-600">👟 تمريرات</p>
        </div>
        <div className="card p-2 sm:p-6 text-center">
          <p className="text-xl sm:text-3xl font-bold text-blue-600">{totalStats.matches}</p>
          <p className="text-[10px] sm:text-sm text-gray-600">📅 مباريات</p>
        </div>
        <div className="card p-2 sm:p-6 text-center">
          <p className="text-xl sm:text-3xl font-bold text-purple-600">{totalStats.minutesPlayed}</p>
          <p className="text-[10px] sm:text-sm text-gray-600">⏱️ دقيقة</p>
        </div>
      </div>

      {/* Additional Stats */}
      <div className="card p-3 sm:p-6">
        <h2 className="font-bold text-sm sm:text-lg mb-3 sm:mb-4">إحصائيات إضافية</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4">
          <div className="bg-yellow-50 rounded-lg sm:rounded-xl p-2 sm:p-4 text-center">
            <p className="text-lg sm:text-2xl">🟨</p>
            <p className="text-base sm:text-xl font-bold">{totalStats.yellowCards}</p>
            <p className="text-[10px] sm:text-sm text-gray-600">صفراء</p>
          </div>
          <div className="bg-red-50 rounded-lg sm:rounded-xl p-2 sm:p-4 text-center">
            <p className="text-lg sm:text-2xl">🟥</p>
            <p className="text-base sm:text-xl font-bold">{totalStats.redCards}</p>
            <p className="text-[10px] sm:text-sm text-gray-600">حمراء</p>
          </div>
          {player.position === 'GOALKEEPER' && (
            <>
              <div className="bg-green-50 rounded-lg sm:rounded-xl p-2 sm:p-4 text-center">
                <p className="text-lg sm:text-2xl">🛡️</p>
                <p className="text-base sm:text-xl font-bold">{totalStats.cleanSheets}</p>
                <p className="text-[10px] sm:text-sm text-gray-600">شباك نظيفة</p>
              </div>
              <div className="bg-blue-50 rounded-lg sm:rounded-xl p-2 sm:p-4 text-center">
                <p className="text-lg sm:text-2xl">🧤</p>
                <p className="text-base sm:text-xl font-bold">{totalStats.penaltiesSaved}</p>
                <p className="text-[10px] sm:text-sm text-gray-600">ركلات</p>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Match History */}
      <div className="card p-3 sm:p-6">
        <h2 className="font-bold text-sm sm:text-lg mb-3 sm:mb-4">سجل المباريات</h2>
        {player.matchStats?.length > 0 ? (
          <div className="overflow-x-auto -mx-3 sm:mx-0">
            <table className="w-full text-xs sm:text-sm min-w-[400px]">
              <thead>
                <tr className="border-b">
                  <th className="text-right py-2 px-1">المباراة</th>
                  <th className="text-center py-2 px-1">⚽</th>
                  <th className="text-center py-2 px-1">👟</th>
                  <th className="text-center py-2 px-1">🟨</th>
                  <th className="text-center py-2 px-1">🟥</th>
                  <th className="text-center py-2 px-1">⏱️</th>
                  <th className="text-center py-2 px-1">ن</th>
                </tr>
              </thead>
              <tbody>
                {player.matchStats.map((stat) => (
                  <tr key={stat.id} className="border-b hover:bg-gray-50">
                    <td className="py-2 sm:py-3 px-1">
                      <Link 
                        to={`/match/${stat.matchId}`}
                        className="hover:text-primary-600"
                      >
                        <p className="font-medium text-[10px] sm:text-sm truncate max-w-[100px] sm:max-w-none">
                          {stat.match?.homeTeam?.shortName || stat.match?.homeTeam?.name} vs {stat.match?.awayTeam?.shortName || stat.match?.awayTeam?.name}
                        </p>
                        <p className="text-[9px] sm:text-xs text-gray-500">
                          {new Date(stat.match?.matchDate).toLocaleDateString('ar-SA')}
                        </p>
                      </Link>
                    </td>
                    <td className="text-center px-1">{stat.goals || 0}</td>
                    <td className="text-center px-1">{stat.assists || 0}</td>
                    <td className="text-center px-1">{stat.yellowCards || 0}</td>
                    <td className="text-center px-1">{stat.redCards || 0}</td>
                    <td className="text-center px-1">{stat.minutesPlayed || 0}</td>
                    <td className="text-center px-1">
                      <span className={`px-1 sm:px-2 py-0.5 rounded text-[10px] sm:text-sm ${stat.points > 0 ? 'bg-green-100 text-green-700' : 'bg-gray-100'}`}>
                        {stat.points > 0 ? `+${stat.points}` : stat.points}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-center text-gray-500 py-4 text-sm">لا توجد مباريات مسجلة</p>
        )}
      </div>

      {/* Points Breakdown */}
      <div className="card bg-gray-50 p-3 sm:p-6">
        <h2 className="font-bold text-sm sm:text-lg mb-3 sm:mb-4">نظام احتساب النقاط</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-4 text-xs sm:text-sm">
          <div className="flex justify-between">
            <span>⚽ هدف:</span>
            <span className="font-medium text-green-600">+5</span>
          </div>
          <div className="flex justify-between">
            <span>👟 تمريرة:</span>
            <span className="font-medium text-green-600">+3</span>
          </div>
          <div className="flex justify-between">
            <span>✅ مشاركة:</span>
            <span className="font-medium text-green-600">+1</span>
          </div>
          <div className="flex justify-between">
            <span>🟨 صفراء:</span>
            <span className="font-medium text-red-600">-1</span>
          </div>
          <div className="flex justify-between">
            <span>🟥 حمراء:</span>
            <span className="font-medium text-red-600">-4</span>
          </div>
          <div className="flex justify-between">
            <span>🛡️ شباك نظيفة:</span>
            <span className="font-medium text-green-600">+5</span>
          </div>
          <div className="flex justify-between">
            <span>🧤 صد ركلة:</span>
            <span className="font-medium text-green-600">+5</span>
          </div>
        </div>
      </div>

      {/* Back Button */}
      <div className="text-center">
        <Link to="/my-team" className="btn-secondary text-sm sm:text-base py-2 px-4">
          ← العودة لفريقي
        </Link>
      </div>
    </div>
  );
};

export default PlayerDetails;
