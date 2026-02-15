import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { leagueAPI } from '../../services/api';
import toast from 'react-hot-toast';

const POSITIONS = {
  GOALKEEPER: { name: 'حارس مرمى', icon: '🧤', color: 'bg-yellow-500' },
  DEFENDER: { name: 'مدافع', icon: '🛡️', color: 'bg-blue-500' },
  MIDFIELDER: { name: 'وسط', icon: '🎯', color: 'bg-green-500' },
  FORWARD: { name: 'مهاجم', icon: '⚽', color: 'bg-red-500' },
};

const ViewMemberTeams = () => {
  const [searchParams] = useSearchParams();
  const leagueIdParam = searchParams.get('leagueId');

  const [leagues, setLeagues] = useState([]);
  const [selectedLeagueId, setSelectedLeagueId] = useState(leagueIdParam ? parseInt(leagueIdParam) : null);
  const [fantasyTeams, setFantasyTeams] = useState([]);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadLeagues = async () => {
      try {
        const response = await leagueAPI.getAll();
        const leaguesList = response.data.leagues || [];
        setLeagues(leaguesList);
        
        if (leaguesList.length > 0 && !leagueIdParam) {
          setSelectedLeagueId(leaguesList[0].id);
        }
      } catch (error) {
        toast.error('خطأ في جلب الدوريات');
      } finally {
        setLoading(false);
      }
    };
    loadLeagues();
  }, [leagueIdParam]);

  useEffect(() => {
    if (selectedLeagueId) {
      fetchFantasyTeams();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedLeagueId]);

  const fetchFantasyTeams = async () => {
    try {
      const response = await leagueAPI.getFantasyTeams(selectedLeagueId);
      setFantasyTeams(response.data.fantasyTeams || []);
    } catch (error) {
      toast.error('خطأ في جلب الفرق');
    }
  };

  const viewTeamDetails = (team) => {
    setSelectedTeam(team);
  };

  const closeDetails = () => {
    setSelectedTeam(null);
  };

  // تصنيف اللاعبين الأساسيين حسب المركز
  const getStartersByPosition = (players) => {
    if (!players) return { GOALKEEPER: [], DEFENDER: [], MIDFIELDER: [], FORWARD: [] };
    
    const groups = { GOALKEEPER: [], DEFENDER: [], MIDFIELDER: [], FORWARD: [] };
    players
      .filter(fp => fp.isStarter)
      .forEach(fp => {
        if (fp.player && groups[fp.player.position]) {
          groups[fp.player.position].push(fp);
        }
      });
    return groups;
  };

  // الحصول على البدلاء
  const getSubstitutes = (players) => {
    if (!players) return [];
    return players.filter(fp => !fp.isStarter);
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-l from-indigo-600 to-purple-600 rounded-2xl p-6 text-white">
        <h1 className="text-2xl font-bold mb-2">عرض فرق الأعضاء 👥</h1>
        <p className="text-white/80">اختر دوري لعرض تشكيلات فرق الأعضاء مع النقاط الإجمالية</p>
      </div>

      {/* League Selector */}
      <div className="card">
        <label className="block text-sm font-medium text-gray-700 mb-2">اختر الدوري:</label>
        <select
          value={selectedLeagueId || ''}
          onChange={(e) => setSelectedLeagueId(parseInt(e.target.value))}
          className="input w-full"
        >
          {leagues.map(league => (
            <option key={league.id} value={league.id}>
              {league.name} - {league._count?.members || 0} عضو
            </option>
          ))}
        </select>
      </div>

      {/* Fantasy Teams List */}
      <div className="card">
        <h2 className="text-lg font-bold mb-4">فرق الفانتازي ({fantasyTeams.length})</h2>
        
        {fantasyTeams.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <span className="text-4xl">📭</span>
            <p className="mt-2">لا توجد فرق في هذا الدوري</p>
          </div>
        ) : (
          <div className="space-y-3">
            {fantasyTeams.map((team, index) => (
              <div 
                key={team.id}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition"
              >
                <div className="flex items-center gap-4">
                  {/* الترتيب */}
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                    index === 0 ? 'bg-yellow-500 text-white' :
                    index === 1 ? 'bg-gray-400 text-white' :
                    index === 2 ? 'bg-amber-600 text-white' :
                    'bg-gray-200 text-gray-700'
                  }`}>
                    {index + 1}
                  </div>
                  
                  {/* معلومات الفريق */}
                  <div>
                    <h3 className="font-bold text-lg">{team.name}</h3>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <span>👤 {team.user?.name}</span>
                      <span>•</span>
                      <span>📧 {team.user?.email}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  {/* النقاط */}
                  <div className="text-center">
                    <p className="text-2xl font-bold text-primary-600">{team.totalPoints || 0}</p>
                    <p className="text-xs text-gray-500">نقطة</p>
                  </div>

                  {/* زر العرض */}
                  <button
                    onClick={() => viewTeamDetails(team)}
                    className="btn-primary text-sm"
                  >
                    👁️ عرض التشكيلة
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Team Details Modal */}
      {selectedTeam && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-auto">
          <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-gradient-to-l from-primary-600 to-secondary-600 text-white p-4 sm:p-6 rounded-t-2xl z-10">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold">{selectedTeam.name}</h2>
                  <p className="text-white/80 text-sm sm:text-base">
                    👤 {selectedTeam.user?.name} • 📧 {selectedTeam.user?.email}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-center">
                    <p className="text-2xl sm:text-3xl font-bold">{selectedTeam.totalPoints || 0}</p>
                    <p className="text-xs text-white/80">إجمالي النقاط</p>
                  </div>
                  <button
                    onClick={closeDetails}
                    className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30"
                  >
                    ✕
                  </button>
                </div>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-4 sm:p-6">
              {selectedTeam.players && selectedTeam.players.length > 0 ? (
                <div className="space-y-6">
                  {/* Field Formation */}
                  <div className="bg-gradient-to-b from-green-700 to-green-600 rounded-xl p-2 sm:p-4 relative overflow-hidden" style={{ minHeight: '320px' }}>
                    {/* Field Lines */}
                    <div className="absolute inset-2 sm:inset-4 border-2 border-white/30 rounded-lg"></div>
                    <div className="absolute top-1/2 left-2 right-2 sm:left-4 sm:right-4 border-t-2 border-white/30"></div>
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 sm:w-20 sm:h-20 border-2 border-white/30 rounded-full"></div>
                    <div className="absolute bottom-2 sm:bottom-4 left-1/2 -translate-x-1/2 w-20 sm:w-32 h-8 sm:h-12 border-2 border-white/30 border-b-0"></div>
                    
                    {/* Players */}
                    <div className="relative z-10 flex flex-col h-full justify-between py-2 sm:py-4" style={{ minHeight: '290px' }}>
                      {/* Forwards */}
                      <div className="flex justify-center gap-1 sm:gap-4 flex-wrap">
                        {getStartersByPosition(selectedTeam.players).FORWARD?.map((fp) => (
                          <PlayerCard key={fp.id} fantasyPlayer={fp} />
                        ))}
                      </div>

                      {/* Midfielders */}
                      <div className="flex justify-center gap-1 sm:gap-3 flex-wrap">
                        {getStartersByPosition(selectedTeam.players).MIDFIELDER?.map((fp) => (
                          <PlayerCard key={fp.id} fantasyPlayer={fp} />
                        ))}
                      </div>

                      {/* Defenders */}
                      <div className="flex justify-center gap-1 sm:gap-3 flex-wrap">
                        {getStartersByPosition(selectedTeam.players).DEFENDER?.map((fp) => (
                          <PlayerCard key={fp.id} fantasyPlayer={fp} />
                        ))}
                      </div>

                      {/* Goalkeeper */}
                      <div className="flex justify-center">
                        {getStartersByPosition(selectedTeam.players).GOALKEEPER?.map((fp) => (
                          <PlayerCard key={fp.id} fantasyPlayer={fp} />
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Substitutes */}
                  <div className="bg-gray-50 rounded-xl p-4">
                    <h3 className="font-bold mb-3">📋 البدلاء ({getSubstitutes(selectedTeam.players).length})</h3>
                    <div className="flex flex-wrap justify-center gap-3">
                      {getSubstitutes(selectedTeam.players).map((fp) => (
                        <PlayerCard key={fp.id} fantasyPlayer={fp} isBench />
                      ))}
                    </div>
                  </div>

                  {/* Players Table */}
                  <div className="bg-gray-50 rounded-xl p-4">
                    <h3 className="font-bold mb-3">📊 تفاصيل اللاعبين (النقاط الإجمالية)</h3>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="bg-gray-200">
                            <th className="p-2 text-right">اللاعب</th>
                            <th className="p-2 text-center">المركز</th>
                            <th className="p-2 text-center">الفريق</th>
                            <th className="p-2 text-center">السعر</th>
                            <th className="p-2 text-center">الحالة</th>
                            <th className="p-2 text-center">النقاط الإجمالية</th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedTeam.players?.map(fp => (
                            <tr key={fp.id} className="border-b hover:bg-gray-100">
                              <td className="p-2 flex items-center gap-2">
                                {fp.captainType === 'CAPTAIN' && <span className="text-yellow-500">👑</span>}
                                {fp.captainType === 'TRIPLE_CAPTAIN' && <span className="text-purple-500">🔥</span>}
                                {fp.player?.name}
                              </td>
                              <td className="p-2 text-center">
                                <span className={`px-2 py-0.5 rounded text-xs ${POSITIONS[fp.player?.position]?.color} text-white`}>
                                  {POSITIONS[fp.player?.position]?.name}
                                </span>
                              </td>
                              <td className="p-2 text-center">{fp.player?.team?.shortName}</td>
                              <td className="p-2 text-center">${parseFloat(fp.player?.price || 0).toFixed(1)}</td>
                              <td className="p-2 text-center">
                                <span className={`px-2 py-0.5 rounded text-xs ${fp.isStarter ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-600'}`}>
                                  {fp.isStarter ? '⭐ أساسي' : '📋 بديل'}
                                </span>
                              </td>
                              <td className="p-2 text-center">
                                <span className="font-bold text-primary-600">{fp.totalPoints || 0}</span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <span className="text-4xl">📭</span>
                  <p className="mt-2">لم يتم إنشاء التشكيلة بعد</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// مكون بطاقة اللاعب - يعرض النقاط الإجمالية على مدار كل الجولات
const PlayerCard = ({ fantasyPlayer, isBench }) => {
  const player = fantasyPlayer.player;
  if (!player) return null;

  // النقاط الإجمالية للاعب في هذا الفريق
  const totalPoints = fantasyPlayer.totalPoints || 0;

  const isCaptain = fantasyPlayer.captainType === 'CAPTAIN';
  const isTripleCaptain = fantasyPlayer.captainType === 'TRIPLE_CAPTAIN';

  return (
    <div className={`relative rounded-md sm:rounded-lg p-1.5 sm:p-2 text-center min-w-[55px] sm:min-w-[75px] max-w-[65px] sm:max-w-[85px] shadow-lg ${
      isBench 
        ? 'bg-gray-200'
        : isCaptain
          ? 'bg-yellow-100 ring-2 ring-yellow-500'
          : isTripleCaptain
            ? 'bg-purple-100 ring-2 ring-purple-500'
            : 'bg-white'
    }`}>
      {/* شارة الكابتن */}
      {(isCaptain || isTripleCaptain) && (
        <div className={`absolute -top-1 -right-1 w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center text-[10px] sm:text-xs font-bold ${
          isTripleCaptain ? 'bg-purple-500 text-white' : 'bg-yellow-500 text-white'
        }`}>
          {isTripleCaptain ? '3x' : 'C'}
        </div>
      )}
      
      <div className="text-lg sm:text-2xl mb-0.5 sm:mb-1">{POSITIONS[player.position]?.icon}</div>
      <p className="text-[10px] sm:text-xs font-bold truncate">{player.name.split(' ')[0]}</p>
      <p className="text-[9px] sm:text-xs text-gray-500 truncate">{player.team?.shortName}</p>
      <p className="text-[9px] sm:text-xs text-green-600 font-medium">{parseFloat(player.price || 0).toFixed(1)}$</p>
      
      {/* النقاط الإجمالية */}
      <span className={`inline-block text-[9px] sm:text-xs px-1 rounded mt-0.5 sm:mt-1 font-bold ${
        totalPoints > 0 
          ? 'bg-green-200 text-green-800' 
          : 'bg-gray-100 text-gray-600'
      }`}>
        {totalPoints} نقطة
      </span>
    </div>
  );
};

export default ViewMemberTeams;
