import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { playerAPI } from '../services/api';
import toast from 'react-hot-toast';

const POSITIONS = {
  GK: { name: 'حارس مرمى', icon: '🧤', color: 'bg-yellow-500' },
  DEF: { name: 'مدافع', icon: '🛡️', color: 'bg-blue-500' },
  MID: { name: 'وسط', icon: '🎯', color: 'bg-green-500' },
  FWD: { name: 'مهاجم', icon: '⚽', color: 'bg-red-500' },
};

const PlayerDetails = () => {
  const { id } = useParams();
  const [player, setPlayer] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPlayer();
  }, [id]);

  const fetchPlayer = async () => {
    try {
      const response = await playerAPI.getOne(id);
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
    <div className="space-y-6">
      {/* Player Header */}
      <div className="card bg-gradient-to-l from-primary-600 to-secondary-600 text-white">
        <div className="flex flex-col md:flex-row items-center gap-6">
          <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center text-5xl shadow-lg">
            {position.icon}
          </div>
          <div className="text-center md:text-right flex-1">
            <h1 className="text-3xl font-bold">{player.name}</h1>
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mt-2">
              <span className={`px-3 py-1 rounded text-sm ${position.color} text-white`}>
                {position.name}
              </span>
              <span className="text-white/80">
                {player.team?.name}
              </span>
              {player.shirtNumber && (
                <span className="bg-white/20 px-2 py-1 rounded text-sm">
                  #{player.shirtNumber}
                </span>
              )}
            </div>
          </div>
          <div className="text-center">
            <p className="text-5xl font-bold">{player.totalPoints}</p>
            <p className="text-white/80">إجمالي النقاط</p>
          </div>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card text-center">
          <p className="text-3xl font-bold text-primary-600">{totalStats.goals}</p>
          <p className="text-sm text-gray-600">⚽ الأهداف</p>
        </div>
        <div className="card text-center">
          <p className="text-3xl font-bold text-green-600">{totalStats.assists}</p>
          <p className="text-sm text-gray-600">👟 التمريرات الحاسمة</p>
        </div>
        <div className="card text-center">
          <p className="text-3xl font-bold text-blue-600">{totalStats.matches}</p>
          <p className="text-sm text-gray-600">📅 المباريات</p>
        </div>
        <div className="card text-center">
          <p className="text-3xl font-bold text-purple-600">{totalStats.minutesPlayed}</p>
          <p className="text-sm text-gray-600">⏱️ الدقائق</p>
        </div>
      </div>

      {/* Additional Stats */}
      <div className="card">
        <h2 className="font-bold text-lg mb-4">إحصائيات إضافية</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-yellow-50 rounded-xl p-4 text-center">
            <p className="text-2xl">🟨</p>
            <p className="text-xl font-bold">{totalStats.yellowCards}</p>
            <p className="text-sm text-gray-600">بطاقات صفراء</p>
          </div>
          <div className="bg-red-50 rounded-xl p-4 text-center">
            <p className="text-2xl">🟥</p>
            <p className="text-xl font-bold">{totalStats.redCards}</p>
            <p className="text-sm text-gray-600">بطاقات حمراء</p>
          </div>
          {player.position === 'GK' && (
            <>
              <div className="bg-green-50 rounded-xl p-4 text-center">
                <p className="text-2xl">🛡️</p>
                <p className="text-xl font-bold">{totalStats.cleanSheets}</p>
                <p className="text-sm text-gray-600">شباك نظيفة</p>
              </div>
              <div className="bg-blue-50 rounded-xl p-4 text-center">
                <p className="text-2xl">🧤</p>
                <p className="text-xl font-bold">{totalStats.penaltiesSaved}</p>
                <p className="text-sm text-gray-600">ركلات محتسبة</p>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Match History */}
      <div className="card">
        <h2 className="font-bold text-lg mb-4">سجل المباريات</h2>
        {player.matchStats?.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-right py-2">المباراة</th>
                  <th className="text-center py-2">⚽</th>
                  <th className="text-center py-2">👟</th>
                  <th className="text-center py-2">🟨</th>
                  <th className="text-center py-2">🟥</th>
                  <th className="text-center py-2">⏱️</th>
                  <th className="text-center py-2">النقاط</th>
                </tr>
              </thead>
              <tbody>
                {player.matchStats.map((stat) => (
                  <tr key={stat.id} className="border-b hover:bg-gray-50">
                    <td className="py-3">
                      <Link 
                        to={`/match/${stat.matchId}`}
                        className="hover:text-primary-600"
                      >
                        <p className="font-medium text-sm">
                          {stat.match?.homeTeam?.name} vs {stat.match?.awayTeam?.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {new Date(stat.match?.matchDate).toLocaleDateString('ar-SA')}
                        </p>
                      </Link>
                    </td>
                    <td className="text-center">{stat.goals || 0}</td>
                    <td className="text-center">{stat.assists || 0}</td>
                    <td className="text-center">{stat.yellowCards || 0}</td>
                    <td className="text-center">{stat.redCards || 0}</td>
                    <td className="text-center">{stat.minutesPlayed || 0}</td>
                    <td className="text-center">
                      <span className={`px-2 py-1 rounded text-sm ${stat.points > 0 ? 'bg-green-100 text-green-700' : 'bg-gray-100'}`}>
                        {stat.points > 0 ? `+${stat.points}` : stat.points}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-center text-gray-500 py-4">لا توجد مباريات مسجلة</p>
        )}
      </div>

      {/* Points Breakdown */}
      <div className="card bg-gray-50">
        <h2 className="font-bold text-lg mb-4">نظام احتساب النقاط</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
          <div className="flex justify-between">
            <span>⚽ هدف:</span>
            <span className="font-medium text-green-600">+5</span>
          </div>
          <div className="flex justify-between">
            <span>👟 تمريرة حاسمة:</span>
            <span className="font-medium text-green-600">+3</span>
          </div>
          <div className="flex justify-between">
            <span>✅ مشاركة:</span>
            <span className="font-medium text-green-600">+1</span>
          </div>
          <div className="flex justify-between">
            <span>🟨 بطاقة صفراء:</span>
            <span className="font-medium text-red-600">-1</span>
          </div>
          <div className="flex justify-between">
            <span>🟥 بطاقة حمراء:</span>
            <span className="font-medium text-red-600">-4</span>
          </div>
          <div className="flex justify-between">
            <span>🛡️ شباك نظيفة (حارس):</span>
            <span className="font-medium text-green-600">+5</span>
          </div>
          <div className="flex justify-between">
            <span>🧤 صد ركلة جزاء:</span>
            <span className="font-medium text-green-600">+5</span>
          </div>
        </div>
      </div>

      {/* Back Button */}
      <div className="text-center">
        <Link to="/my-team" className="btn-secondary">
          ← العودة لفريقي
        </Link>
      </div>
    </div>
  );
};

export default PlayerDetails;
