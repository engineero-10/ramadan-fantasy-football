import React, { useState, useEffect } from 'react';
import { fantasyTeamAPI, playerAPI, transferAPI, roundAPI } from '../services/api';
import toast from 'react-hot-toast';

const POSITIONS = {
  GK: { name: 'حارس مرمى', icon: '🧤' },
  DEF: { name: 'مدافع', icon: '🛡️' },
  MID: { name: 'وسط', icon: '🎯' },
  FWD: { name: 'مهاجم', icon: '⚽' },
};

const Transfers = () => {
  const [fantasyTeam, setFantasyTeam] = useState(null);
  const [currentRound, setCurrentRound] = useState(null);
  const [allPlayers, setAllPlayers] = useState([]);
  const [transferHistory, setTransferHistory] = useState([]);
  const [remainingTransfers, setRemainingTransfers] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Transfer State
  const [selectedOutPlayer, setSelectedOutPlayer] = useState(null);
  const [selectedInPlayer, setSelectedInPlayer] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [positionFilter, setPositionFilter] = useState('');
  const [transferLoading, setTransferLoading] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // جلب الفريق الخيالي
      const teamRes = await fantasyTeamAPI.getMyTeam();
      setFantasyTeam(teamRes.data.fantasyTeam);

      if (teamRes.data.fantasyTeam) {
        const leagueId = teamRes.data.fantasyTeam.leagueId;

        // جلب الجولة الحالية
        try {
          const roundRes = await roundAPI.getCurrent(leagueId);
          setCurrentRound(roundRes.data.round);

          if (roundRes.data.round) {
            // جلب الانتقالات المتبقية
            const remainingRes = await transferAPI.getRemaining(teamRes.data.fantasyTeam.id, roundRes.data.round.id);
            setRemainingTransfers(remainingRes.data);
          }
        } catch (e) {}

        // جلب جميع اللاعبين
        const playersRes = await playerAPI.getAll({ leagueId });
        setAllPlayers(playersRes.data.players || []);

        // جلب سجل الانتقالات
        const historyRes = await transferAPI.getHistory(teamRes.data.fantasyTeam.id);
        setTransferHistory(historyRes.data.transfers || []);
      }
    } catch (error) {
      toast.error('خطأ في تحميل البيانات');
    } finally {
      setLoading(false);
    }
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
      fetchData();
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

  if (!fantasyTeam) {
    return (
      <div className="max-w-lg mx-auto card text-center">
        <div className="text-5xl mb-4">🎯</div>
        <h1 className="text-2xl font-bold mb-2">لا يوجد فريق</h1>
        <p className="text-gray-600">يجب إنشاء فريق أولاً لإجراء الانتقالات</p>
      </div>
    );
  }

  const transfersOpen = currentRound?.transfersOpen;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="card">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">🔄 الانتقالات</h1>
            <p className="text-gray-600">{fantasyTeam.name}</p>
          </div>
          <div className="flex gap-4">
            {remainingTransfers && (
              <div className="text-center bg-gray-50 px-4 py-2 rounded-xl">
                <p className="text-2xl font-bold">{remainingTransfers.remaining}</p>
                <p className="text-xs text-gray-600">انتقالات متبقية</p>
              </div>
            )}
            <div className={`text-center px-4 py-2 rounded-xl ${transfersOpen ? 'bg-green-100' : 'bg-red-100'}`}>
              <p className="text-lg">{transfersOpen ? '🟢' : '🔴'}</p>
              <p className="text-xs">{transfersOpen ? 'مفتوحة' : 'مغلقة'}</p>
            </div>
          </div>
        </div>
      </div>

      {!transfersOpen && (
        <div className="card bg-yellow-50 border border-yellow-200">
          <p className="text-center">⚠️ الانتقالات مغلقة حالياً. انتظر حتى يفتح المشرف نافذة الانتقالات.</p>
        </div>
      )}

      {transfersOpen && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* My Team Players */}
          <div className="card">
            <h2 className="font-bold mb-4">فريقك - اختر اللاعب الخارج</h2>
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {fantasyTeam.players?.map((fp) => (
                <button
                  key={fp.id}
                  onClick={() => {
                    setSelectedOutPlayer(fp);
                    setSelectedInPlayer(null);
                    setPositionFilter(fp.player?.position || '');
                  }}
                  className={`w-full flex items-center justify-between p-3 rounded-xl transition ${
                    selectedOutPlayer?.id === fp.id
                      ? 'bg-red-100 border-2 border-red-500'
                      : 'bg-gray-50 hover:bg-gray-100'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{POSITIONS[fp.player?.position]?.icon}</span>
                    <div className="text-right">
                      <p className="font-medium">{fp.player?.name}</p>
                      <p className="text-xs text-gray-500">{fp.player?.team?.name}</p>
                    </div>
                  </div>
                  <span className="text-sm text-gray-600">{fp.player?.totalPoints} نقطة</span>
                </button>
              ))}
            </div>
          </div>

          {/* Transfer Preview */}
          <div className="card bg-gray-50">
            <h2 className="font-bold mb-4 text-center">معاينة الانتقال</h2>
            
            <div className="flex flex-col items-center gap-4">
              {/* Out Player */}
              <div className={`w-full p-4 rounded-xl text-center ${selectedOutPlayer ? 'bg-red-100' : 'bg-white'}`}>
                {selectedOutPlayer ? (
                  <>
                    <span className="text-3xl">{POSITIONS[selectedOutPlayer.player?.position]?.icon}</span>
                    <p className="font-medium mt-2">{selectedOutPlayer.player?.name}</p>
                    <p className="text-xs text-gray-500">خروج ↗️</p>
                  </>
                ) : (
                  <p className="text-gray-400">اختر اللاعب الخارج</p>
                )}
              </div>

              <span className="text-2xl">⬇️</span>

              {/* In Player */}
              <div className={`w-full p-4 rounded-xl text-center ${selectedInPlayer ? 'bg-green-100' : 'bg-white'}`}>
                {selectedInPlayer ? (
                  <>
                    <span className="text-3xl">{POSITIONS[selectedInPlayer.position]?.icon}</span>
                    <p className="font-medium mt-2">{selectedInPlayer.name}</p>
                    <p className="text-xs text-gray-500">دخول ↙️</p>
                  </>
                ) : (
                  <p className="text-gray-400">اختر اللاعب الداخل</p>
                )}
              </div>

              <button
                onClick={handleTransfer}
                disabled={!selectedOutPlayer || !selectedInPlayer || transferLoading}
                className="btn-primary w-full"
              >
                {transferLoading ? '⏳ جاري التنفيذ...' : '✅ تأكيد الانتقال'}
              </button>
            </div>
          </div>

          {/* Available Players */}
          <div className="card">
            <h2 className="font-bold mb-4">اللاعبون المتاحون</h2>
            
            <div className="mb-3">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="input w-full"
                placeholder="بحث عن لاعب..."
              />
            </div>

            {selectedOutPlayer && (
              <p className="text-sm text-gray-600 mb-3 bg-yellow-50 p-2 rounded">
                يعرض لاعبو مركز: {POSITIONS[selectedOutPlayer.player?.position]?.name}
              </p>
            )}

            <div className="space-y-2 max-h-[350px] overflow-y-auto">
              {availablePlayers.map((player) => (
                <button
                  key={player.id}
                  onClick={() => setSelectedInPlayer(player)}
                  disabled={!selectedOutPlayer}
                  className={`w-full flex items-center justify-between p-3 rounded-xl transition ${
                    selectedInPlayer?.id === player.id
                      ? 'bg-green-100 border-2 border-green-500'
                      : selectedOutPlayer
                        ? 'bg-gray-50 hover:bg-gray-100'
                        : 'bg-gray-50 opacity-50 cursor-not-allowed'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{POSITIONS[player.position]?.icon}</span>
                    <div className="text-right">
                      <p className="font-medium">{player.name}</p>
                      <p className="text-xs text-gray-500">{player.team?.name}</p>
                    </div>
                  </div>
                  <span className="text-sm text-gray-600">{player.totalPoints} نقطة</span>
                </button>
              ))}
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
    </div>
  );
};

export default Transfers;
