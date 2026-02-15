import React, { useState, useEffect, useRef } from 'react';
import { fantasyTeamAPI, playerAPI, transferAPI, roundAPI } from '../services/api';
import toast from 'react-hot-toast';
import { Link, useSearchParams } from 'react-router-dom';

const POSITIONS = {
  GOALKEEPER: { name: 'حارس مرمى', icon: '🧤' },
  DEFENDER: { name: 'مدافع', icon: '🛡️' },
  MIDFIELDER: { name: 'وسط', icon: '🎯' },
  FORWARD: { name: 'مهاجم', icon: '⚽' },
};

// مكون العد التنازلي
const CountdownTimer = ({ targetDate, onExpire }) => {
  const [timeLeft, setTimeLeft] = useState('');
  const hasExpiredRef = useRef(false);

  useEffect(() => {
    // Reset expired flag when targetDate changes
    hasExpiredRef.current = false;
  }, [targetDate]);

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date();
      const target = new Date(targetDate);
      const diff = target - now;

      if (diff <= 0) {
        setTimeLeft('انتهى الوقت');
        // Only call onExpire once
        if (onExpire && !hasExpiredRef.current) {
          hasExpiredRef.current = true;
          onExpire();
        }
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      if (hours > 0) {
        setTimeLeft(`${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
      } else {
        setTimeLeft(`${minutes}:${seconds.toString().padStart(2, '0')}`);
      }
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);
    return () => clearInterval(timer);
  }, [targetDate, onExpire]);

  return <span className="font-mono font-bold">{timeLeft}</span>;
};

const Transfers = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const leagueIdParam = searchParams.get('leagueId');

  const [fantasyTeams, setFantasyTeams] = useState([]);
  const [selectedLeagueId, setSelectedLeagueId] = useState(leagueIdParam ? parseInt(leagueIdParam) : null);
  const [fantasyTeam, setFantasyTeam] = useState(null);
  const [currentRound, setCurrentRound] = useState(null);
  const [allPlayers, setAllPlayers] = useState([]);
  const [transferHistory, setTransferHistory] = useState([]);
  const [remainingTransfers, setRemainingTransfers] = useState(null);
  const [loading, setLoading] = useState(true);
  const [transfersExpired, setTransfersExpired] = useState(false); // حالة انتهاء وقت الانتقالات
  
  // Transfer State
  const [selectedOutPlayer, setSelectedOutPlayer] = useState(null);
  const [selectedInPlayer, setSelectedInPlayer] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [positionFilter, setPositionFilter] = useState('');
  const [transferLoading, setTransferLoading] = useState(false);

  // جلب كل الفرق أولاً
  useEffect(() => {
    fetchAllTeams();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // عند تغيير الدوري المحدد، جلب بيانات الفريق
  useEffect(() => {
    if (selectedLeagueId) {
      setTransfersExpired(false); // إعادة تعيين حالة انتهاء الوقت
      fetchTeamData(selectedLeagueId);
    }
  }, [selectedLeagueId]);

  const fetchAllTeams = async () => {
    try {
      const teamsRes = await fantasyTeamAPI.getMyTeams();
      const teams = teamsRes.data.fantasyTeams || [];
      setFantasyTeams(teams);
      
      if (teams.length > 0) {
        if (leagueIdParam) {
          const team = teams.find(t => t.leagueId === parseInt(leagueIdParam));
          if (team) {
            setSelectedLeagueId(parseInt(leagueIdParam));
          } else {
            setSelectedLeagueId(teams[0].leagueId);
          }
        } else {
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

          if (roundRes.data.round) {
            // جلب الانتقالات المتبقية
            const remainingRes = await transferAPI.getRemaining(teamRes.data.fantasyTeam.id, roundRes.data.round.id);
            setRemainingTransfers(remainingRes.data);
          }
        } catch (e) {
          setCurrentRound(null);
          setRemainingTransfers(null);
        }

        // جلب جميع اللاعبين (limit=1000 لتجاوز الـ pagination)
        const playersRes = await playerAPI.getAll({ leagueId, limit: 1000 });
        setAllPlayers(playersRes.data.players || []);

        // جلب سجل الانتقالات
        const historyRes = await transferAPI.getHistory(teamRes.data.fantasyTeam.id);
        setTransferHistory(historyRes.data.transfers || []);
      }
    } catch (error) {
      setFantasyTeam(null);
    }
  };

  // تغيير الدوري
  const handleLeagueChange = (newLeagueId) => {
    setSelectedLeagueId(newLeagueId);
    setSearchParams({ leagueId: newLeagueId });
    // Reset transfer selection
    setSelectedOutPlayer(null);
    setSelectedInPlayer(null);
  };

  // اللاعبون المتاحون للانتقال (ليسوا في الفريق)
  const availablePlayers = allPlayers.filter(player => {
    const inTeam = fantasyTeam?.players?.some(fp => fp.playerId === player.id);
    const matchesSearch = player.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          player.team?.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesPosition = !positionFilter || player.position === positionFilter;
    const matchesOutPlayerPosition = !selectedOutPlayer || player.position === selectedOutPlayer.player.position;
    return !inTeam && matchesSearch && matchesPosition && matchesOutPlayerPosition;
  });

  // تنفيذ الانتقال
  const handleTransfer = async () => {
    if (!selectedOutPlayer || !selectedInPlayer) {
      toast.error('اختر اللاعب الخارج والداخل');
      return;
    }

    setTransferLoading(true);
    try {
      await transferAPI.create({
        fantasyTeamId: fantasyTeam.id,
        playerOutId: selectedOutPlayer.playerId,
        playerInId: selectedInPlayer.id,
        roundId: currentRound?.id,
      });
      toast.success('تم الانتقال بنجاح!');
      
      // إعادة تحميل البيانات
      setSelectedOutPlayer(null);
      setSelectedInPlayer(null);
      fetchTeamData(selectedLeagueId);
    } catch (error) {
      toast.error(error.response?.data?.message || 'خطأ في تنفيذ الانتقال');
    } finally {
      setTransferLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="text-4xl animate-bounce mb-4">🔄</div>
          <p className="text-gray-600">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  if (!fantasyTeam && fantasyTeams.length === 0) {
    return (
      <div className="max-w-lg mx-auto card text-center">
        <div className="text-5xl mb-4">🎯</div>
        <h1 className="text-2xl font-bold mb-2">لا يوجد فريق</h1>
        <p className="text-gray-600">يجب إنشاء فريق أولاً لإجراء الانتقالات</p>
      </div>
    );
  }

  // الأدمن يتحكم في فتح/إغلاق الانتقالات - أو انتهى الوقت محلياً
  const transfersOpen = currentRound?.transfersOpen && !transfersExpired;

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
                  {team.name} - {team.league?.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {fantasyTeam && (
        <>
          {/* Round Info Header */}
          {currentRound && (
            <div className={`card ${transfersOpen ? 'bg-green-50 border-green-300' : 'bg-red-50 border-red-300'} border-2`}>
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="bg-white rounded-full w-12 h-12 flex items-center justify-center shadow">
                    <span className="text-xl font-bold text-primary-600">{currentRound.roundNumber}</span>
                  </div>
                  <div>
                    <h2 className="font-bold">{currentRound.name}</h2>
                    <p className="text-sm text-gray-600">
                      {new Date(currentRound.startDate).toLocaleDateString('ar-SA')} - {new Date(currentRound.endDate).toLocaleDateString('ar-SA')}
                    </p>
                  </div>
                </div>
                
                {/* معلومات الحالة والمؤقت */}
                <div className="flex items-center gap-4">
                  {transfersOpen && currentRound.lockTime && (
                    <div className="bg-white rounded-lg px-4 py-2 shadow-sm border">
                      <p className="text-xs text-gray-500 text-center">⏰ تغلق بعد</p>
                      <div className="text-xl text-red-600">
                        <CountdownTimer 
                          targetDate={currentRound.lockTime} 
                          onExpire={() => {
                            toast.success('تم إغلاق الانتقالات');
                            setTransfersExpired(true);
                          }}
                        />
                      </div>
                    </div>
              )}
              <div className={`px-4 py-2 rounded-lg ${transfersOpen ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                <p className="font-bold">{transfersOpen ? '🟢 مفتوحة' : '🔴 مغلقة'}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="card p-3 sm:p-6">
        <div className="flex flex-col gap-3 sm:gap-4">
          <div>
            <h1 className="text-lg sm:text-2xl font-bold">🔄 الانتقالات</h1>
            <p className="text-sm text-gray-600">{fantasyTeam.name}</p>
          </div>
          <div className="flex gap-2 sm:gap-4 flex-wrap">
            {/* Budget */}
            <div className="text-center bg-green-50 px-3 py-2 sm:px-4 rounded-lg sm:rounded-xl flex-1 min-w-[80px]">
              <p className="text-lg sm:text-2xl font-bold text-green-600">{parseFloat(fantasyTeam.budget || 0).toFixed(1)}$</p>
              <p className="text-[10px] sm:text-xs text-gray-600">الميزانية</p>
            </div>
            {/* Max per team */}
            <div className="text-center bg-blue-50 px-3 py-2 sm:px-4 rounded-lg sm:rounded-xl flex-1 min-w-[60px]">
              <p className="text-lg sm:text-2xl font-bold text-blue-600">{fantasyTeam.league?.maxPlayersPerRealTeam || 2}</p>
              <p className="text-[10px] sm:text-xs text-gray-600">أقصى/فريق</p>
            </div>
            {remainingTransfers && (
              <div className="text-center bg-gray-50 px-3 py-2 sm:px-4 rounded-lg sm:rounded-xl flex-1 min-w-[60px]">
                <p className="text-lg sm:text-2xl font-bold">{remainingTransfers.remaining}</p>
                <p className="text-[10px] sm:text-xs text-gray-600">متبقية</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {!transfersOpen && (
        <div className="card bg-yellow-50 border border-yellow-200 text-center py-8">
          <span className="text-4xl mb-4 block">🔒</span>
          <h3 className="font-bold text-lg mb-2">الانتقالات مغلقة حالياً</h3>
          <p className="text-gray-600">انتظر حتى يفتح المشرف نافذة الانتقالات للجولة القادمة</p>
          <Link to="/my-team" className="btn-secondary mt-4 inline-block">
            العودة لفريقي
          </Link>
        </div>
      )}

      {transfersOpen && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* My Team Players */}
          <div className="card p-3 sm:p-6">
            <h2 className="font-bold mb-3 sm:mb-4 text-sm sm:text-base">فريقك - اختر اللاعب الخارج</h2>
            <div className="space-y-2 max-h-[300px] sm:max-h-[400px] overflow-y-auto">
              {fantasyTeam.players?.map((fp) => (
                <button
                  key={fp.id}
                  onClick={() => {
                    setSelectedOutPlayer(fp);
                    setSelectedInPlayer(null);
                    setPositionFilter(fp.player?.position || '');
                  }}
                  className={`w-full flex items-center justify-between p-2 sm:p-3 rounded-lg sm:rounded-xl transition ${
                    selectedOutPlayer?.id === fp.id
                      ? 'bg-red-100 border-2 border-red-500'
                      : 'bg-gray-50 hover:bg-gray-100'
                  }`}
                >
                  <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                    <span className="text-lg sm:text-xl flex-shrink-0">{POSITIONS[fp.player?.position]?.icon}</span>
                    <div className="text-right min-w-0">
                      <p className="font-medium text-xs sm:text-sm truncate">{fp.player?.name}</p>
                      <p className="text-[10px] sm:text-xs text-gray-500 truncate">{fp.player?.team?.name}</p>
                    </div>
                  </div>
                  <div className="text-left flex-shrink-0">
                    <span className="text-xs sm:text-sm font-bold text-green-600">{parseFloat(fp.player?.price || 0).toFixed(1)}$</span>
                    <p className="text-[10px] sm:text-xs text-gray-500">{fp.player?.totalPoints} نقطة</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Transfer Preview */}
          <div className="card bg-gray-50 p-3 sm:p-6">
            <h2 className="font-bold mb-3 sm:mb-4 text-center text-sm sm:text-base">معاينة الانتقال</h2>
            
            {/* Budget Impact */}
            {selectedOutPlayer && selectedInPlayer && (
              <div className="mb-3 sm:mb-4 p-2 sm:p-3 rounded-lg sm:rounded-xl bg-white">
                <p className="text-xs sm:text-sm text-center">
                  تأثير الميزانية: 
                  <span className={`font-bold mr-2 ${
                    parseFloat(selectedOutPlayer.player?.price || 0) - parseFloat(selectedInPlayer.price || 0) >= 0 
                      ? 'text-green-600' 
                      : 'text-red-600'
                  }`}>
                    {(parseFloat(selectedOutPlayer.player?.price || 0) - parseFloat(selectedInPlayer.price || 0)).toFixed(1)}$
                  </span>
                </p>
              </div>
            )}
            
            <div className="flex flex-col items-center gap-3 sm:gap-4">
              {/* Out Player */}
              <div className={`w-full p-3 sm:p-4 rounded-lg sm:rounded-xl text-center ${selectedOutPlayer ? 'bg-red-100' : 'bg-white'}`}>
                {selectedOutPlayer ? (
                  <>
                    <span className="text-2xl sm:text-3xl">{POSITIONS[selectedOutPlayer.player?.position]?.icon}</span>
                    <p className="font-medium mt-1 sm:mt-2 text-sm sm:text-base">{selectedOutPlayer.player?.name}</p>
                    <p className="text-xs sm:text-sm text-green-600">{parseFloat(selectedOutPlayer.player?.price || 0).toFixed(1)}$</p>
                    <p className="text-[10px] sm:text-xs text-gray-500">خروج ↗️</p>
                  </>
                ) : (
                  <p className="text-gray-400 text-xs sm:text-sm">اختر اللاعب الخارج</p>
                )}
              </div>

              <span className="text-xl sm:text-2xl">⬇️</span>

              {/* In Player */}
              <div className={`w-full p-3 sm:p-4 rounded-lg sm:rounded-xl text-center ${selectedInPlayer ? 'bg-green-100' : 'bg-white'}`}>
                {selectedInPlayer ? (
                  <>
                    <span className="text-2xl sm:text-3xl">{POSITIONS[selectedInPlayer.position]?.icon}</span>
                    <p className="font-medium mt-1 sm:mt-2 text-sm sm:text-base">{selectedInPlayer.name}</p>
                    <p className="text-xs sm:text-sm text-green-600">{parseFloat(selectedInPlayer.price || 0).toFixed(1)}$</p>
                    <p className="text-[10px] sm:text-xs text-gray-500">دخول ↙️</p>
                  </>
                ) : (
                  <p className="text-gray-400 text-xs sm:text-sm">اختر اللاعب الداخل</p>
                )}
              </div>

              <button
                onClick={handleTransfer}
                disabled={!selectedOutPlayer || !selectedInPlayer || transferLoading}
                className="btn-primary w-full text-sm"
              >
                {transferLoading ? '⏳ جاري التنفيذ...' : '✅ تأكيد الانتقال'}
              </button>
            </div>
          </div>

          {/* Available Players */}
          <div className="card p-3 sm:p-6">
            <h2 className="font-bold mb-3 sm:mb-4 text-sm sm:text-base">اللاعبون المتاحون</h2>
            
            <div className="mb-2 sm:mb-3">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="input w-full text-sm"
                placeholder="بحث عن لاعب..."
              />
            </div>

            {selectedOutPlayer && (
              <p className="text-xs text-gray-600 mb-2 sm:mb-3 bg-yellow-50 p-2 rounded">
                مركز: {POSITIONS[selectedOutPlayer.player?.position]?.name}
              </p>
            )}

            <div className="space-y-2 max-h-[280px] sm:max-h-[350px] overflow-y-auto">
              {availablePlayers.map((player) => {
                // حساب عدد اللاعبين من نفس الفريق (باستثناء اللاعب الخارج)
                const teamCount = fantasyTeam?.players?.filter(
                  fp => fp.player?.teamId === player.teamId && fp.playerId !== selectedOutPlayer?.playerId
                ).length || 0;
                const maxPerTeam = fantasyTeam?.league?.maxPlayersPerRealTeam || 2;
                const teamLimitWarning = teamCount >= maxPerTeam;
                
                return (
                  <button
                    key={player.id}
                    onClick={() => !teamLimitWarning && setSelectedInPlayer(player)}
                    disabled={!selectedOutPlayer || teamLimitWarning}
                    className={`w-full flex items-center justify-between p-2 sm:p-3 rounded-lg sm:rounded-xl transition ${
                      selectedInPlayer?.id === player.id
                        ? 'bg-green-100 border-2 border-green-500'
                        : teamLimitWarning
                          ? 'bg-red-50 opacity-50 cursor-not-allowed'
                          : selectedOutPlayer
                            ? 'bg-gray-50 hover:bg-gray-100'
                            : 'bg-gray-50 opacity-50 cursor-not-allowed'
                    }`}
                  >
                    <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                      <span className="text-lg sm:text-xl flex-shrink-0">{POSITIONS[player.position]?.icon}</span>
                      <div className="text-right min-w-0">
                        <p className="font-medium text-xs sm:text-sm truncate">{player.name}</p>
                        <p className="text-[10px] sm:text-xs text-gray-500 truncate">
                          {player.team?.name}
                          {teamCount > 0 && (
                            <span className={`mr-1 ${teamLimitWarning ? 'text-red-500' : 'text-orange-500'}`}>
                              ({teamCount}/{maxPerTeam})
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                    <div className="text-left flex-shrink-0">
                      <span className="text-xs sm:text-sm font-bold text-green-600">{parseFloat(player.price || 0).toFixed(1)}$</span>
                      <p className="text-[10px] sm:text-xs text-gray-500">{player.totalPoints} نقطة</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Transfer History */}
      <div className="card">
        <h2 className="font-bold mb-4">📜 سجل الانتقالات</h2>
        
        {transferHistory.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-right py-2">التاريخ</th>
                  <th className="text-center py-2">اللاعب الخارج</th>
                  <th className="text-center py-2">اللاعب الداخل</th>
                  <th className="text-center py-2">الجولة</th>
                </tr>
              </thead>
              <tbody>
                {transferHistory.map((transfer) => (
                  <tr key={transfer.id} className="border-b hover:bg-gray-50">
                    <td className="py-2 text-sm">
                      {new Date(transfer.createdAt).toLocaleDateString('ar-SA')}
                    </td>
                    <td className="text-center">
                      <span className="text-red-600">{transfer.playerOut?.name}</span>
                    </td>
                    <td className="text-center">
                      <span className="text-green-600">{transfer.playerIn?.name}</span>
                    </td>
                    <td className="text-center text-sm text-gray-600">
                      {transfer.round?.name || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-center text-gray-500 py-4">لا توجد انتقالات سابقة</p>
        )}
      </div>
        </>
      )}
    </div>
  );
};

export default Transfers;
