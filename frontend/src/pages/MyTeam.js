import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { fantasyTeamAPI, roundAPI } from '../services/api';
import toast from 'react-hot-toast';

const POSITIONS = {
  GK: { name: 'حارس مرمى', icon: '🧤', color: 'bg-yellow-500' },
  DEF: { name: 'مدافع', icon: '🛡️', color: 'bg-blue-500' },
  MID: { name: 'وسط', icon: '🎯', color: 'bg-green-500' },
  FWD: { name: 'مهاجم', icon: '⚽', color: 'bg-red-500' },
};

const MyTeam = () => {
  const [fantasyTeam, setFantasyTeam] = useState(null);
  const [currentRound, setCurrentRound] = useState(null);
  const [roundPoints, setRoundPoints] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // جلب الفريق الخيالي
      const teamRes = await fantasyTeamAPI.getMyTeam();
      setFantasyTeam(teamRes.data.fantasyTeam);

      if (teamRes.data.fantasyTeam) {
        // جلب الجولة الحالية
        try {
          const roundRes = await roundAPI.getCurrent(teamRes.data.fantasyTeam.leagueId);
          setCurrentRound(roundRes.data.round);

          // جلب نقاط الجولة
          if (roundRes.data.round) {
            const pointsRes = await fantasyTeamAPI.getRoundPoints(
              teamRes.data.fantasyTeam.id,
              roundRes.data.round.id
            );
            setRoundPoints(pointsRes.data);
          }
        } catch (e) {
          // No current round
        }
      }
    } catch (error) {
      // No fantasy team
    } finally {
      setLoading(false);
    }
  };

  // تصنيف اللاعبين حسب المركز
  const groupPlayersByPosition = () => {
    if (!fantasyTeam?.players) return {};
    
    const groups = { GK: [], DEF: [], MID: [], FWD: [] };
    fantasyTeam.players.forEach(fp => {
      if (fp.player && groups[fp.player.position]) {
        groups[fp.player.position].push(fp);
      }
    });
    return groups;
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

  if (!fantasyTeam) {
    return (
      <div className="max-w-lg mx-auto">
        <div className="card text-center">
          <div className="text-5xl mb-4">🎯</div>
          <h1 className="text-2xl font-bold mb-2">لا يوجد فريق</h1>
          <p className="text-gray-600 mb-6">لم تنشئ فريقك الخيالي بعد</p>
          <Link to="/create-team" className="btn-primary">
            إنشاء فريق جديد
          </Link>
        </div>
      </div>
    );
  }

  const playerGroups = groupPlayersByPosition();

  return (
    <div className="space-y-6">
      {/* Team Header */}
      <div className="card bg-gradient-to-l from-primary-600 to-secondary-600 text-white">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">{fantasyTeam.name}</h1>
            <p className="text-white/80">دوري: {fantasyTeam.league?.name}</p>
          </div>
          <div className="flex gap-6">
            <div className="text-center">
              <p className="text-3xl font-bold">{fantasyTeam.totalPoints}</p>
              <p className="text-sm text-white/80">إجمالي النقاط</p>
            </div>
            {roundPoints && (
              <div className="text-center">
                <p className="text-3xl font-bold">{roundPoints.roundPoints || 0}</p>
                <p className="text-sm text-white/80">نقاط الجولة</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Current Round Info */}
      {currentRound && (
        <div className="card bg-yellow-50 border border-yellow-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-2xl">📅</span>
              <div>
                <p className="font-medium">{currentRound.name}</p>
                <p className="text-sm text-gray-600">
                  {currentRound.transfersOpen ? '🟢 الانتقالات مفتوحة' : '🔴 الانتقالات مغلقة'}
                </p>
              </div>
            </div>
            {currentRound.transfersOpen && (
              <Link to="/transfers" className="btn-secondary text-sm">
                إجراء انتقالات
              </Link>
            )}
          </div>
        </div>
      )}

      {/* Field Formation */}
      <div className="card">
        <h2 className="text-lg font-bold mb-4 text-center">تشكيلة الفريق</h2>
        
        <div className="bg-green-600 rounded-xl p-4 relative min-h-[500px]">
          {/* Field Lines */}
          <div className="absolute inset-4 border-2 border-white/30 rounded-lg"></div>
          <div className="absolute top-1/2 left-4 right-4 border-t-2 border-white/30"></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 border-2 border-white/30 rounded-full"></div>
          
          {/* Players by Position */}
          <div className="relative z-10 flex flex-col h-full justify-between py-4">
            {/* Forwards */}
            <div className="flex justify-center gap-4">
              {playerGroups.FWD?.map((fp) => (
                <PlayerCard key={fp.id} fantasyPlayer={fp} roundPoints={roundPoints} />
              ))}
            </div>

            {/* Midfielders */}
            <div className="flex justify-center gap-3 flex-wrap">
              {playerGroups.MID?.map((fp) => (
                <PlayerCard key={fp.id} fantasyPlayer={fp} roundPoints={roundPoints} />
              ))}
            </div>

            {/* Defenders */}
            <div className="flex justify-center gap-3 flex-wrap">
              {playerGroups.DEF?.map((fp) => (
                <PlayerCard key={fp.id} fantasyPlayer={fp} roundPoints={roundPoints} />
              ))}
            </div>

            {/* Goalkeeper */}
            <div className="flex justify-center">
              {playerGroups.GK?.map((fp) => (
                <PlayerCard key={fp.id} fantasyPlayer={fp} roundPoints={roundPoints} />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Players List */}
      <div className="card">
        <h2 className="text-lg font-bold mb-4">قائمة اللاعبين</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-right py-2">اللاعب</th>
                <th className="text-center py-2">المركز</th>
                <th className="text-center py-2">الفريق</th>
                <th className="text-center py-2">النقاط</th>
              </tr>
            </thead>
            <tbody>
              {fantasyTeam.players?.map((fp) => (
                <tr key={fp.id} className="border-b hover:bg-gray-50">
                  <td className="py-3">
                    <Link 
                      to={`/player/${fp.player?.id}`}
                      className="font-medium hover:text-primary-600"
                    >
                      {fp.player?.name}
                    </Link>
                  </td>
                  <td className="text-center">
                    <span className={`inline-block px-2 py-1 rounded text-xs text-white ${POSITIONS[fp.player?.position]?.color}`}>
                      {POSITIONS[fp.player?.position]?.name}
                    </span>
                  </td>
                  <td className="text-center text-sm text-gray-600">
                    {fp.player?.team?.name}
                  </td>
                  <td className="text-center font-medium">
                    {fp.player?.totalPoints || 0}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link to="/transfers" className="card hover:shadow-lg transition text-center">
          <span className="text-3xl">🔄</span>
          <p className="font-medium mt-2">الانتقالات</p>
        </Link>
        <Link to="/leaderboard" className="card hover:shadow-lg transition text-center">
          <span className="text-3xl">📊</span>
          <p className="font-medium mt-2">الترتيب</p>
        </Link>
        <Link to="/matches" className="card hover:shadow-lg transition text-center">
          <span className="text-3xl">📅</span>
          <p className="font-medium mt-2">المباريات</p>
        </Link>
      </div>
    </div>
  );
};

// مكون بطاقة اللاعب على الملعب
const PlayerCard = ({ fantasyPlayer, roundPoints }) => {
  const player = fantasyPlayer.player;
  if (!player) return null;

  // حساب نقاط الجولة للاعب
  const playerRoundPoints = roundPoints?.playerPoints?.find(
    pp => pp.playerId === player.id
  )?.points || 0;

  return (
    <div className="bg-white rounded-lg p-2 text-center min-w-[70px] shadow-lg">
      <div className="text-xl mb-1">{POSITIONS[player.position]?.icon}</div>
      <p className="text-xs font-medium truncate max-w-[60px]">{player.name.split(' ')[0]}</p>
      <p className="text-xs text-gray-500">{player.team?.name?.substring(0, 6)}</p>
      {playerRoundPoints > 0 && (
        <span className="inline-block bg-green-100 text-green-700 text-xs px-1 rounded mt-1">
          +{playerRoundPoints}
        </span>
      )}
    </div>
  );
};

export default MyTeam;
