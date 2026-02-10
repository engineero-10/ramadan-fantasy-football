import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { fantasyTeamAPI, roundAPI, leagueAPI } from '../services/api';
import toast from 'react-hot-toast';

const POSITIONS = {
  GOALKEEPER: { name: 'حارس مرمى', icon: '🧤', color: 'bg-yellow-500' },
  DEFENDER: { name: 'مدافع', icon: '🛡️', color: 'bg-blue-500' },
  MIDFIELDER: { name: 'وسط', icon: '🎯', color: 'bg-green-500' },
  FORWARD: { name: 'مهاجم', icon: '⚽', color: 'bg-red-500' },
};

// تحديد حالة الجولة (يتحكم فيها الأدمن)
const getRoundStatus = (round) => {
  if (round.isCompleted) {
    return { status: 'completed', label: '✅ مكتملة', color: 'bg-gray-100 border-gray-300' };
  }
  if (round.transfersOpen) {
    return { status: 'open', label: '✏️ مفتوحة للتعديل', color: 'bg-green-50 border-green-300' };
  }
  return { status: 'locked', label: '🔒 مغلقة', color: 'bg-orange-50 border-orange-300' };
};

const MyTeam = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const leagueIdParam = searchParams.get('leagueId');
  
  const [fantasyTeams, setFantasyTeams] = useState([]);
  const [selectedLeagueId, setSelectedLeagueId] = useState(leagueIdParam ? parseInt(leagueIdParam) : null);
  const [fantasyTeam, setFantasyTeam] = useState(null);
  const [currentRound, setCurrentRound] = useState(null);
  const [roundPoints, setRoundPoints] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [swapping, setSwapping] = useState(false);

  // جلب كل الفرق أولاً
  useEffect(() => {
    fetchAllTeams();
  }, []);

  // عند تغيير الدوري المحدد، جلب بيانات الفريق
  useEffect(() => {
    if (selectedLeagueId) {
      fetchTeamData(selectedLeagueId);
    }
  }, [selectedLeagueId]);

  const fetchAllTeams = async () => {
    try {
      const teamsRes = await fantasyTeamAPI.getMyTeams();
      const teams = teamsRes.data.fantasyTeams || [];
      setFantasyTeams(teams);
      
      if (teams.length > 0) {
        // إذا كان هناك leagueId في الـ URL، استخدمه
        if (leagueIdParam) {
          const team = teams.find(t => t.leagueId === parseInt(leagueIdParam));
          if (team) {
            setSelectedLeagueId(parseInt(leagueIdParam));
          } else {
            // إذا لم يكن للمستخدم فريق في هذا الدوري، اختر أول فريق
            setSelectedLeagueId(teams[0].leagueId);
          }
        } else {
          // استخدم أول فريق
          setSelectedLeagueId(teams[0].leagueId);
        }
      }
    } catch (error) {
      // No fantasy teams
    } finally {
      setLoading(false);
    }
  };

  const fetchTeamData = async (leagueId) => {
    try {
      // جلب الفريق الخيالي للدوري المحدد
      const teamRes = await fantasyTeamAPI.getMyTeam(leagueId);
      setFantasyTeam(teamRes.data.fantasyTeam);

      if (teamRes.data.fantasyTeam) {
        // جلب الجولة الحالية
        try {
          const roundRes = await roundAPI.getCurrent(leagueId);
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
          setCurrentRound(null);
          setRoundPoints(null);
        }
      }
    } catch (error) {
      setFantasyTeam(null);
    }
  };

  // تغيير الدوري
  const handleLeagueChange = (newLeagueId) => {
    setSelectedLeagueId(newLeagueId);
    setSearchParams({ leagueId: newLeagueId });
  };

  // تصنيف اللاعبين الأساسيين حسب المركز
  const getStartersByPosition = () => {
    if (!fantasyTeam?.players) return { GOALKEEPER: [], DEFENDER: [], MIDFIELDER: [], FORWARD: [] };
    
    const groups = { GOALKEEPER: [], DEFENDER: [], MIDFIELDER: [], FORWARD: [] };
    fantasyTeam.players
      .filter(fp => fp.isStarter)
      .forEach(fp => {
        if (fp.player && groups[fp.player.position]) {
          groups[fp.player.position].push(fp);
        }
      });
    return groups;
  };

  // الحصول على البدلاء
  const getSubstitutes = () => {
    if (!fantasyTeam?.players) return [];
    return fantasyTeam.players.filter(fp => !fp.isStarter);
  };

  // التحقق من إمكانية تعديل التشكيلة (يتحكم فيها الأدمن)
  const canEditLineup = () => {
    if (!currentRound) return false; // لا توجد جولة
    if (currentRound.transfersOpen) return true; // الانتقالات مفتوحة من الأدمن
    return false;
  };

  const editAllowed = canEditLineup();

  // تبديل لاعبين
  const handleSwap = async (player1, player2) => {
    if (!player1 || !player2) return;
    
    // التحقق من أن اللاعبين في نفس المركز
    if (player1.player.position !== player2.player.position) {
      toast.error('يجب تبديل لاعبين في نفس المركز');
      return;
    }

    setSwapping(true);
    try {
      // تحديث التشكيلة
      const updatedPlayers = fantasyTeam.players.map(fp => {
        if (fp.id === player1.id) {
          return { fantasyPlayerId: fp.id, isStarter: player2.isStarter, position: fp.position };
        }
        if (fp.id === player2.id) {
          return { fantasyPlayerId: fp.id, isStarter: player1.isStarter, position: fp.position };
        }
        return { fantasyPlayerId: fp.id, isStarter: fp.isStarter, position: fp.position };
      });

      await fantasyTeamAPI.updateLineup(fantasyTeam.id, updatedPlayers);
      toast.success('تم تعديل التشكيلة');
      
      // إعادة جلب البيانات
      fetchTeamData(selectedLeagueId);
    } catch (error) {
      toast.error(error.response?.data?.message || 'خطأ في تعديل التشكيلة');
    } finally {
      setSwapping(false);
      setSelectedPlayer(null);
    }
  };

  // اختيار لاعب للتبديل
  const selectForSwap = (fp) => {
    if (swapping) return;
    if (!editAllowed) {
      toast.error('لا يمكن تعديل التشكيلة حالياً - الجولة جارية');
      return;
    }
    
    if (!selectedPlayer) {
      setSelectedPlayer(fp);
      toast.success(`اختر لاعب آخر من نفس المركز (${POSITIONS[fp.player.position]?.name}) للتبديل`);
    } else {
      if (selectedPlayer.id === fp.id) {
        setSelectedPlayer(null);
        return;
      }
      handleSwap(selectedPlayer, fp);
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

  if (!fantasyTeam && fantasyTeams.length === 0) {
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

  const startersByPosition = getStartersByPosition();
  const substitutes = getSubstitutes();

  return (
    <div className="space-y-6">
      {/* League/Team Selector */}
      {fantasyTeams.length > 1 && (
        <div className="card">
          <div className="flex items-center gap-4">
            <label className="font-medium text-gray-700">اختر الفريق:</label>
            <select
              value={selectedLeagueId || ''}
              onChange={(e) => handleLeagueChange(parseInt(e.target.value))}
              className="input flex-1"
            >
              {fantasyTeams.map((team) => (
                <option key={team.id} value={team.leagueId}>
                  {team.name} - {team.league?.name} ({team.totalPoints} نقطة)
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {fantasyTeam ? (
        <>
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
                <div className="text-center">
                  <p className="text-3xl font-bold text-green-300">{parseFloat(fantasyTeam.budget || 0).toFixed(1)}$</p>
                  <p className="text-sm text-white/80">الميزانية</p>
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
        <div className={`card border-2 ${getRoundStatus(currentRound).color}`}>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            {/* Round Info */}
            <div className="flex items-center gap-4">
              <div className="bg-primary-100 rounded-full w-14 h-14 flex items-center justify-center">
                <span className="text-2xl font-bold text-primary-600">{currentRound.roundNumber}</span>
              </div>
              <div>
                <h3 className="font-bold text-lg">{currentRound.name}</h3>
                <div className="flex items-center gap-2 text-sm">
                  <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-white">
                    {getRoundStatus(currentRound).label}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {new Date(currentRound.startDate).toLocaleDateString('ar-SA')} - {new Date(currentRound.endDate).toLocaleDateString('ar-SA')}
                </p>
              </div>
            </div>

            {/* أزرار الإجراءات */}
            <div className="flex items-center gap-4">
              <div className="flex gap-2">
                {currentRound.transfersOpen && (
                  <Link to="/transfers" className="btn-primary text-sm">
                    🔄 انتقالات
                  </Link>
                )}
                <Link to={`/matches?round=${currentRound.id}`} className="btn-secondary text-sm">
                  ⚽ المباريات
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* إذا لم توجد جولة */}
      {!currentRound && !loading && fantasyTeam && (
        <div className="card bg-gray-50 border border-gray-200 text-center py-8">
          <span className="text-4xl">📅</span>
          <p className="text-gray-600 mt-2">لا توجد جولة حالية</p>
          <p className="text-sm text-gray-500">انتظر حتى يفتح المشرف جولة جديدة</p>
        </div>
      )}

      {/* Swap Instructions */}
      {selectedPlayer && (
        <div className="card bg-blue-50 border border-blue-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-2xl">🔄</span>
              <div>
                <p className="font-medium">وضع التبديل</p>
                <p className="text-sm text-gray-600">
                  اختر لاعب {POSITIONS[selectedPlayer.player.position]?.name} آخر للتبديل مع {selectedPlayer.player.name}
                </p>
              </div>
            </div>
            <button 
              onClick={() => setSelectedPlayer(null)}
              className="btn-secondary text-sm"
            >
              إلغاء
            </button>
          </div>
        </div>
      )}

      {/* رسالة حالة التعديل */}
      {!editAllowed && (
        <div className="card bg-orange-50 border border-orange-300">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🔒</span>
            <div>
              <p className="font-medium text-orange-800">التشكيلة مقفلة</p>
              <p className="text-sm text-orange-600">
                لا يمكن تعديل التشكيلة أثناء الجولة. انتظر حتى يفتح المشرف نافذة الانتقالات للجولة القادمة.
              </p>
            </div>
          </div>
        </div>
      )}

      {editAllowed && !selectedPlayer && (
        <div className="card bg-green-50 border border-green-300">
          <div className="flex items-center gap-3">
            <span className="text-2xl">✏️</span>
            <div>
              <p className="font-medium text-green-800">يمكنك تعديل التشكيلة</p>
              <p className="text-sm text-green-600">
                اضغط على أي لاعب لتبديله مع لاعب آخر من نفس المركز
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Field Formation - الأساسيين فقط */}
      <div className="card p-2 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-3 sm:mb-4 gap-2">
          <h2 className="text-base sm:text-lg font-bold">⭐ التشكيلة الأساسية ({fantasyTeam.players?.filter(p => p.isStarter).length || 0})</h2>
          {editAllowed && <p className="text-xs sm:text-sm text-green-600">✏️ اضغط للتبديل</p>}
          {!editAllowed && <p className="text-xs sm:text-sm text-orange-600">🔒 مقفل</p>}
        </div>
        
        <div className="bg-gradient-to-b from-green-700 to-green-600 rounded-lg sm:rounded-xl p-2 sm:p-4 relative overflow-hidden" style={{ minHeight: '340px' }}>
          {/* Field Lines */}
          <div className="absolute inset-2 sm:inset-4 border-2 border-white/30 rounded-lg"></div>
          <div className="absolute top-1/2 left-2 right-2 sm:left-4 sm:right-4 border-t-2 border-white/30"></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 sm:w-20 sm:h-20 border-2 border-white/30 rounded-full"></div>
          {/* Goal Area */}
          <div className="absolute bottom-2 sm:bottom-4 left-1/2 -translate-x-1/2 w-20 sm:w-32 h-8 sm:h-12 border-2 border-white/30 border-b-0"></div>
          
          {/* Players by Position - الأساسيين فقط */}
          <div className="relative z-10 flex flex-col h-full justify-between py-2 sm:py-4" style={{ minHeight: '310px' }}>
            {/* Forwards - المهاجمين */}
            <div className="flex justify-center gap-1 sm:gap-4 flex-wrap">
              {startersByPosition.FORWARD?.map((fp) => (
                <PlayerCard 
                  key={fp.id} 
                  fantasyPlayer={fp} 
                  roundPoints={roundPoints}
                  isSelected={selectedPlayer?.id === fp.id}
                  onSelect={() => selectForSwap(fp)}
                  canSwap={!selectedPlayer || selectedPlayer.player.position === fp.player.position}
                />
              ))}
            </div>

            {/* Midfielders - الوسط */}
            <div className="flex justify-center gap-1 sm:gap-3 flex-wrap">
              {startersByPosition.MIDFIELDER?.map((fp) => (
                <PlayerCard 
                  key={fp.id} 
                  fantasyPlayer={fp} 
                  roundPoints={roundPoints}
                  isSelected={selectedPlayer?.id === fp.id}
                  onSelect={() => selectForSwap(fp)}
                  canSwap={!selectedPlayer || selectedPlayer.player.position === fp.player.position}
                />
              ))}
            </div>

            {/* Defenders - المدافعين */}
            <div className="flex justify-center gap-1 sm:gap-3 flex-wrap">
              {startersByPosition.DEFENDER?.map((fp) => (
                <PlayerCard 
                  key={fp.id} 
                  fantasyPlayer={fp} 
                  roundPoints={roundPoints}
                  isSelected={selectedPlayer?.id === fp.id}
                  onSelect={() => selectForSwap(fp)}
                  canSwap={!selectedPlayer || selectedPlayer.player.position === fp.player.position}
                />
              ))}
            </div>

            {/* Goalkeeper - الحارس */}
            <div className="flex justify-center">
              {startersByPosition.GOALKEEPER?.map((fp) => (
                <PlayerCard 
                  key={fp.id} 
                  fantasyPlayer={fp} 
                  roundPoints={roundPoints}
                  isSelected={selectedPlayer?.id === fp.id}
                  onSelect={() => selectForSwap(fp)}
                  canSwap={!selectedPlayer || selectedPlayer.player.position === fp.player.position}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Bench - البدلاء */}
      <div className="card">
        <h2 className="text-lg font-bold mb-4">📋 البدلاء ({substitutes.length})</h2>
        <div className="bg-gray-100 rounded-xl p-4">
          <div className="flex flex-wrap justify-center gap-4">
            {substitutes.length > 0 ? (
              substitutes.map((fp) => (
                <PlayerCard 
                  key={fp.id} 
                  fantasyPlayer={fp} 
                  roundPoints={roundPoints}
                  isSelected={selectedPlayer?.id === fp.id}
                  onSelect={() => selectForSwap(fp)}
                  canSwap={!selectedPlayer || selectedPlayer.player.position === fp.player.position}
                  isBench
                />
              ))
            ) : (
              <p className="text-gray-500">لا يوجد بدلاء</p>
            )}
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
                <th className="text-center py-2">السعر</th>
                <th className="text-center py-2">الحالة</th>
                <th className="text-center py-2">النقاط</th>
              </tr>
            </thead>
            <tbody>
              {fantasyTeam.players?.map((fp) => (
                <tr key={fp.id} className={`border-b hover:bg-gray-50 ${!fp.isStarter ? 'bg-gray-50' : ''}`}>
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
                  <td className="text-center text-sm font-medium text-green-600">
                    {parseFloat(fp.player?.price || 0).toFixed(1)}$
                  </td>
                  <td className="text-center">
                    <span className={`inline-block px-2 py-1 rounded text-xs ${
                      fp.isStarter 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-gray-200 text-gray-600'
                    }`}>
                      {fp.isStarter ? '⭐ أساسي' : '📋 بديل'}
                    </span>
                  </td>
                  <td className="text-center font-medium">
                    {fp.totalPoints || fp.player?.totalPoints || 0}
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
        </>
      ) : (
        <div className="card text-center py-8">
          <div className="text-5xl mb-4">⏳</div>
          <p className="text-gray-600">جاري تحميل بيانات الفريق...</p>
        </div>
      )}
    </div>
  );
};

// مكون بطاقة اللاعب على الملعب
const PlayerCard = ({ fantasyPlayer, roundPoints, isSelected, onSelect, canSwap, isBench }) => {
  const player = fantasyPlayer.player;
  if (!player) return null;

  // حساب نقاط الجولة للاعب
  const playerRoundPoints = roundPoints?.playerPoints?.find(
    pp => pp.playerId === player.id
  )?.points || 0;

  return (
    <button
      onClick={onSelect}
      disabled={!canSwap}
      className={`rounded-md sm:rounded-lg p-1.5 sm:p-2 text-center min-w-[55px] sm:min-w-[75px] max-w-[65px] sm:max-w-[85px] shadow-lg transition-all cursor-pointer ${
        isSelected 
          ? 'bg-yellow-400 ring-2 sm:ring-4 ring-yellow-300 scale-105 sm:scale-110' 
          : isBench 
            ? 'bg-gray-200 hover:bg-gray-300'
            : 'bg-white hover:bg-gray-50'
      } ${!canSwap && !isSelected ? 'opacity-40 cursor-not-allowed' : ''}`}
    >
      <div className="text-lg sm:text-2xl mb-0.5 sm:mb-1">{POSITIONS[player.position]?.icon}</div>
      <p className="text-[10px] sm:text-xs font-bold truncate">{player.name.split(' ')[0]}</p>
      <p className="text-[9px] sm:text-xs text-gray-500 truncate">{player.team?.shortName || player.team?.name?.substring(0, 4)}</p>
      <p className="text-[9px] sm:text-xs text-green-600 font-medium">{parseFloat(player.price || 0).toFixed(1)}$</p>
      {playerRoundPoints > 0 && (
        <span className="inline-block bg-green-100 text-green-700 text-[9px] sm:text-xs px-1 rounded mt-0.5 sm:mt-1">
          +{playerRoundPoints}
        </span>
      )}
      {isSelected && <span className="block text-[9px] sm:text-xs mt-0.5 sm:mt-1">✓</span>}
    </button>
  );
};

export default MyTeam;
