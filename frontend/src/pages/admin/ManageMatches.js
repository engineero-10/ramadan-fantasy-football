import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { matchAPI, teamAPI, roundAPI, leagueAPI } from '../../services/api';
import toast from 'react-hot-toast';

const MATCH_STATUS = {
  SCHEDULED: { label: 'مجدولة', color: 'bg-blue-100 text-blue-700' },
  LIVE: { label: 'جارية', color: 'bg-green-100 text-green-700' },
  COMPLETED: { label: 'انتهت', color: 'bg-gray-100 text-gray-700' },
  POSTPONED: { label: 'مؤجلة', color: 'bg-yellow-100 text-yellow-700' },
  CANCELLED: { label: 'ملغاة', color: 'bg-red-100 text-red-700' },
};

const ManageMatches = ({ fixedLeagueId }) => {
  const [matches, setMatches] = useState([]);
  const [teams, setTeams] = useState([]);
  const [rounds, setRounds] = useState([]);
  const [leagues, setLeagues] = useState([]);
  const [selectedLeague, setSelectedLeague] = useState(fixedLeagueId || '');
  const [selectedRound, setSelectedRound] = useState('');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showResultModal, setShowResultModal] = useState(false);
  const [editingMatch, setEditingMatch] = useState(null);
  const [formData, setFormData] = useState({
    homeTeamId: '',
    awayTeamId: '',
    roundId: '',
    matchDate: '',
    location: '',
  });
  const [resultData, setResultData] = useState({
    homeScore: 0,
    awayScore: 0,
    status: 'COMPLETED',
  });

  useEffect(() => {
    if (!fixedLeagueId) {
      fetchLeagues();
    } else {
      fetchLeagueData();
      setSelectedLeague(fixedLeagueId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fixedLeagueId]);

  useEffect(() => {
    if (selectedLeague) {
      fetchTeams();
      fetchRounds();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedLeague]);

  useEffect(() => {
    fetchMatches();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedLeague, selectedRound]);

  const fetchLeagueData = async () => {
    try {
      const response = await leagueAPI.getById(fixedLeagueId);
      const league = response.data.league || response.data;
      setLeagues([league]);
    } catch (error) {
      console.error('Error fetching league:', error);
    }
  };

  const fetchLeagues = async () => {
    try {
      const response = await leagueAPI.getAll();
      setLeagues(response.data.leagues || []);
      if (response.data.leagues?.length > 0) {
        setSelectedLeague(response.data.leagues[0].id);
      }
    } catch (error) {
      toast.error('خطأ في جلب الدوريات');
    }
  };

  const fetchTeams = async () => {
    try {
      const response = await teamAPI.getAll({ leagueId: selectedLeague });
      setTeams(response.data.teams || []);
    } catch (error) {
      toast.error('خطأ في جلب الفرق');
    }
  };

  const fetchRounds = async () => {
    try {
      const response = await roundAPI.getAll(selectedLeague);
      setRounds(response.data.rounds || []);
    } catch (error) {
      toast.error('خطأ في جلب الجولات');
    }
  };

  const fetchMatches = async () => {
    setLoading(true);
    try {
      const params = {};
      if (selectedLeague) params.leagueId = selectedLeague;
      if (selectedRound) params.roundId = selectedRound;
      
      const response = await matchAPI.getAll(params);
      setMatches(response.data.matches || []);
    } catch (error) {
      toast.error('خطأ في جلب المباريات');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (formData.homeTeamId === formData.awayTeamId) {
      toast.error('لا يمكن أن يكون الفريقان نفسهما');
      return;
    }
    
    try {
      const data = {
        ...formData,
        matchDate: new Date(formData.matchDate).toISOString(),
      };
      
      if (editingMatch) {
        await matchAPI.update(editingMatch.id, data);
        toast.success('تم تحديث المباراة بنجاح');
      } else {
        await matchAPI.create(data);
        toast.success('تم إنشاء المباراة بنجاح');
      }
      setShowModal(false);
      resetForm();
      fetchMatches();
    } catch (error) {
      toast.error(error.response?.data?.message || 'حدث خطأ');
    }
  };

  const handleResultSubmit = async (e) => {
    e.preventDefault();
    try {
      await matchAPI.updateResult(editingMatch.id, resultData);
      toast.success('تم تحديث النتيجة بنجاح');
      setShowResultModal(false);
      setEditingMatch(null);
      fetchMatches();
    } catch (error) {
      toast.error(error.response?.data?.message || 'خطأ في تحديث النتيجة');
    }
  };

  const handleEdit = (match) => {
    setEditingMatch(match);
    setFormData({
      homeTeamId: match.homeTeamId,
      awayTeamId: match.awayTeamId,
      roundId: match.roundId,
      matchDate: new Date(match.matchDate).toISOString().slice(0, 16),
      location: match.location || '',
    });
    setShowModal(true);
  };

  const handleEditResult = (match) => {
    setEditingMatch(match);
    setResultData({
      homeScore: match.homeScore || 0,
      awayScore: match.awayScore || 0,
      status: match.status || 'COMPLETED',
    });
    setShowResultModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('هل أنت متأكد من حذف هذه المباراة؟')) return;
    
    try {
      await matchAPI.delete(id);
      toast.success('تم حذف المباراة');
      fetchMatches();
    } catch (error) {
      toast.error(error.response?.data?.message || 'خطأ في الحذف');
    }
  };

  const resetForm = () => {
    setEditingMatch(null);
    setFormData({
      homeTeamId: '',
      awayTeamId: '',
      roundId: selectedRound || '',
      matchDate: '',
      location: '',
    });
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">📅 إدارة المباريات</h1>
          <p className="text-gray-600 text-sm sm:text-base">جدولة وإدارة مباريات البطولة</p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setShowModal(true);
          }}
          className="btn-primary text-sm sm:text-base"
        >
          ➕ إضافة مباراة
        </button>
      </div>

      {/* Filters */}
      <div className="card p-3 sm:p-6">
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
          {!fixedLeagueId && (
            <select
              value={selectedLeague}
              onChange={(e) => {
                setSelectedLeague(e.target.value);
                setSelectedRound('');
              }}
              className="input flex-1 text-sm sm:text-base"
            >
              {leagues.map((league) => (
                <option key={league.id} value={league.id}>
                  {league.name}
                </option>
              ))}
            </select>
          )}
          <select
            value={selectedRound}
            onChange={(e) => setSelectedRound(e.target.value)}
            className="input flex-1 text-sm sm:text-base"
          >
            <option value="">كل الجولات</option>
            {rounds.map((round) => (
              <option key={round.id} value={round.id}>
                {round.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Matches List */}
      <div className="card p-3 sm:p-6">
        {loading ? (
          <div className="text-center py-6 sm:py-8">
            <div className="animate-spin text-3xl sm:text-4xl">⚙️</div>
          </div>
        ) : matches.length > 0 ? (
          <div className="space-y-3 sm:space-y-4">
            {matches.map((match) => {
              const status = MATCH_STATUS[match.status] || MATCH_STATUS.SCHEDULED;
              const matchDate = new Date(match.matchDate);
              
              return (
                <div key={match.id} className="bg-gray-50 rounded-lg sm:rounded-xl p-3 sm:p-4">
                  <div className="flex flex-col gap-3 sm:gap-4">
                    {/* Match Info */}
                    <div className="flex items-center gap-2 sm:gap-4">
                      <div className="text-center flex-1 min-w-0">
                        <p className="font-bold text-xs sm:text-base truncate">{match.homeTeam?.name}</p>
                      </div>
                      
                      <div className="text-center px-2 sm:px-4 flex-shrink-0">
                        {match.status === 'COMPLETED' ? (
                          <p className="text-lg sm:text-2xl font-bold">
                            {match.homeScore} - {match.awayScore}
                          </p>
                        ) : (
                          <p className="text-base sm:text-xl text-gray-400">VS</p>
                        )}
                        <span className={`text-[10px] sm:text-xs px-1 sm:px-2 py-0.5 sm:py-1 rounded ${status.color}`}>
                          {status.label}
                        </span>
                      </div>
                      
                      <div className="text-center flex-1 min-w-0">
                        <p className="font-bold text-xs sm:text-base truncate">{match.awayTeam?.name}</p>
                      </div>
                    </div>

                    {/* Date & Actions */}
                    <div className="flex items-center justify-between gap-2 pt-2 border-t border-gray-200">
                      <div className="text-[10px] sm:text-sm text-gray-600">
                        <p>{matchDate.toLocaleDateString('ar-SA')}</p>
                        <p>{matchDate.toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })}</p>
                        {match.location && <p className="hidden sm:block text-xs">📍 {match.location}</p>}
                      </div>
                      
                      <div className="flex gap-1">
                        <button
                          onClick={() => handleEditResult(match)}
                          className="bg-green-100 text-green-700 hover:bg-green-200 p-1 sm:px-2 sm:py-1 rounded text-xs sm:text-sm"
                          title="تحديث النتيجة"
                        >
                          🎯
                        </button>
                        <Link
                          to={fixedLeagueId ? `/manage-league/${fixedLeagueId}/match-stats/${match.id}` : `/admin/match-stats/${match.id}`}
                          className="bg-purple-100 text-purple-700 hover:bg-purple-200 p-1 sm:px-2 sm:py-1 rounded text-xs sm:text-sm"
                          title="إحصائيات اللاعبين"
                        >
                          📊
                        </Link>
                        <button
                          onClick={() => handleEdit(match)}
                          className="bg-blue-100 text-blue-700 hover:bg-blue-200 p-1 sm:px-2 sm:py-1 rounded text-xs sm:text-sm"
                          title="تعديل"
                        >
                          ✏️
                        </button>
                        <button
                          onClick={() => handleDelete(match.id)}
                          className="bg-red-100 text-red-700 hover:bg-red-200 p-1 sm:px-2 sm:py-1 rounded text-xs sm:text-sm"
                          title="حذف"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8 sm:py-12">
            <div className="text-4xl sm:text-5xl mb-4">📅</div>
            <p className="text-gray-600 text-sm sm:text-base">لا توجد مباريات</p>
            <button
              onClick={() => {
                resetForm();
                setShowModal(true);
              }}
              className="btn-primary mt-4 text-sm sm:text-base"
            >
              إضافة أول مباراة
            </button>
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-2 sm:p-4 z-50">
          <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 w-full max-w-md max-h-[95vh] overflow-y-auto">
            <h2 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4">
              {editingMatch ? 'تعديل المباراة' : 'إضافة مباراة جديدة'}
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                  الفريق المضيف *
                </label>
                <select
                  value={formData.homeTeamId}
                  onChange={(e) => setFormData({ ...formData, homeTeamId: e.target.value })}
                  className="input text-sm sm:text-base"
                  required
                >
                  <option value="">اختر الفريق</option>
                  {teams.map((team) => (
                    <option key={team.id} value={team.id}>
                      {team.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                  الفريق الضيف *
                </label>
                <select
                  value={formData.awayTeamId}
                  onChange={(e) => setFormData({ ...formData, awayTeamId: e.target.value })}
                  className="input text-sm sm:text-base"
                  required
                >
                  <option value="">اختر الفريق</option>
                  {teams.map((team) => (
                    <option key={team.id} value={team.id}>
                      {team.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                  الجولة *
                </label>
                <select
                  value={formData.roundId}
                  onChange={(e) => setFormData({ ...formData, roundId: e.target.value })}
                  className="input text-sm sm:text-base"
                  required
                >
                  <option value="">اختر الجولة</option>
                  {rounds.map((round) => (
                    <option key={round.id} value={round.id}>
                      {round.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                  موعد المباراة *
                </label>
                <input
                  type="datetime-local"
                  value={formData.matchDate}
                  onChange={(e) => setFormData({ ...formData, matchDate: e.target.value })}
                  className="input text-sm sm:text-base"
                  required
                />
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                  المكان (اختياري)
                </label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="input text-sm sm:text-base"
                  placeholder="مثال: ملعب النادي"
                />
              </div>

              <div className="flex gap-2 sm:gap-3 pt-3 sm:pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    resetForm();
                  }}
                  className="btn-secondary flex-1 text-sm sm:text-base"
                >
                  إلغاء
                </button>
                <button type="submit" className="btn-primary flex-1 text-sm sm:text-base">
                  {editingMatch ? 'تحديث' : 'إضافة'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Result Modal */}
      {showResultModal && editingMatch && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-2 sm:p-4 z-50">
          <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 w-full max-w-md">
            <h2 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4">تحديث نتيجة المباراة</h2>
            
            <div className="text-center mb-4 sm:mb-6">
              <p className="text-sm sm:text-lg">
                {editingMatch.homeTeam?.name} vs {editingMatch.awayTeam?.name}
              </p>
            </div>
            
            <form onSubmit={handleResultSubmit} className="space-y-3 sm:space-y-4">
              <div className="flex items-center justify-center gap-2 sm:gap-4">
                <div className="text-center">
                  <label className="block text-xs sm:text-sm text-gray-600 mb-1 sm:mb-2 truncate max-w-[80px] sm:max-w-none">
                    {editingMatch.homeTeam?.name}
                  </label>
                  <input
                    type="number"
                    value={resultData.homeScore}
                    onChange={(e) => setResultData({ ...resultData, homeScore: parseInt(e.target.value) || 0 })}
                    className="input w-16 sm:w-20 text-center text-xl sm:text-2xl"
                    min={0}
                  />
                </div>
                <span className="text-xl sm:text-2xl">-</span>
                <div className="text-center">
                  <label className="block text-xs sm:text-sm text-gray-600 mb-1 sm:mb-2 truncate max-w-[80px] sm:max-w-none">
                    {editingMatch.awayTeam?.name}
                  </label>
                  <input
                    type="number"
                    value={resultData.awayScore}
                    onChange={(e) => setResultData({ ...resultData, awayScore: parseInt(e.target.value) || 0 })}
                    className="input w-16 sm:w-20 text-center text-xl sm:text-2xl"
                    min={0}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                  حالة المباراة
                </label>
                <select
                  value={resultData.status}
                  onChange={(e) => setResultData({ ...resultData, status: e.target.value })}
                  className="input text-sm sm:text-base"
                >
                  {Object.entries(MATCH_STATUS).map(([key, { label }]) => (
                    <option key={key} value={key}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-2 sm:gap-3 pt-3 sm:pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowResultModal(false);
                    setEditingMatch(null);
                  }}
                  className="btn-secondary flex-1 text-sm sm:text-base"
                >
                  إلغاء
                </button>
                <button type="submit" className="btn-primary flex-1 text-sm sm:text-base">
                  حفظ النتيجة
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageMatches;
