import React, { useState, useEffect } from 'react';
import { playerAPI, teamAPI, leagueAPI } from '../../services/api';
import toast from 'react-hot-toast';

const POSITIONS = [
  { value: 'GOALKEEPER', label: 'حارس مرمى', icon: '🧤' },
  { value: 'DEFENDER', label: 'مدافع', icon: '🛡️' },
  { value: 'MIDFIELDER', label: 'وسط', icon: '🎯' },
  { value: 'FORWARD', label: 'مهاجم', icon: '⚽' },
];

const ManagePlayers = ({ fixedLeagueId }) => {
  const [players, setPlayers] = useState([]);
  const [teams, setTeams] = useState([]);
  const [leagues, setLeagues] = useState([]);
  const [selectedLeague, setSelectedLeague] = useState(fixedLeagueId || '');
  const [selectedTeam, setSelectedTeam] = useState('');
  const [positionFilter, setPositionFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    position: 'MIDFIELDER',
    teamId: '',
    price: '5',
    shirtNumber: '',
  });

  useEffect(() => {
    if (!fixedLeagueId) {
      fetchLeagues();
    } else {
      fetchLeagueData();
      setSelectedLeague(fixedLeagueId);
    }
  }, [fixedLeagueId]);

  useEffect(() => {
    if (selectedLeague) {
      fetchTeams();
    }
  }, [selectedLeague]);

  useEffect(() => {
    if (selectedLeague) {
      fetchPlayers();
    }
  }, [selectedLeague, selectedTeam, positionFilter]);

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

  const fetchPlayers = async () => {
    if (!selectedLeague) {
      setPlayers([]);
      setLoading(false);
      return;
    }
    
    setLoading(true);
    try {
      const params = { limit: 1000, leagueId: selectedLeague };
      if (selectedTeam) params.teamId = selectedTeam;
      if (positionFilter) params.position = positionFilter;
      
      const response = await playerAPI.getAll(params);
      setPlayers(response.data.players || []);
    } catch (error) {
      toast.error('خطأ في جلب اللاعبين');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = {
        ...formData,
        price: parseFloat(formData.price),
        leagueId: selectedLeague,
        shirtNumber: formData.shirtNumber ? parseInt(formData.shirtNumber) : null,
      };
      
      if (editingPlayer) {
        await playerAPI.update(editingPlayer.id, data);
        toast.success('تم تحديث اللاعب بنجاح');
      } else {
        await playerAPI.create(data);
        toast.success('تم إضافة اللاعب بنجاح');
      }
      setShowModal(false);
      resetForm();
      fetchPlayers();
    } catch (error) {
      toast.error(error.response?.data?.message || 'حدث خطأ');
    }
  };

  const handleEdit = (player) => {
    setEditingPlayer(player);
    setFormData({
      name: player.name,
      position: player.position,
      teamId: player.teamId,
      price: player.price || '5',
      shirtNumber: player.shirtNumber || '',
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('هل أنت متأكد من حذف هذا اللاعب؟')) return;
    
    try {
      await playerAPI.delete(id);
      toast.success('تم حذف اللاعب');
      fetchPlayers();
    } catch (error) {
      toast.error(error.response?.data?.message || 'خطأ في الحذف');
    }
  };

  const resetForm = () => {
    setEditingPlayer(null);
    setFormData({
      name: '',
      position: 'MIDFIELDER',
      teamId: teams[0]?.id || '',
      price: '5',
      shirtNumber: '',
    });
  };

  // تصفية اللاعبين بالبحث
  const filteredPlayers = players.filter(player =>
    player.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getPositionInfo = (position) => {
    return POSITIONS.find(p => p.value === position) || {};
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">👤 إدارة اللاعبين</h1>
          <p className="text-gray-600 text-sm sm:text-base">إضافة وتعديل لاعبي الفرق</p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setShowModal(true);
          }}
          className="btn-primary text-sm sm:text-base"
        >
          ➕ إضافة لاعب
        </button>
      </div>

      {/* Filters */}
      <div className="card p-3 sm:p-6">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4">
          {!fixedLeagueId && (
            <select
              value={selectedLeague}
              onChange={(e) => {
                setSelectedLeague(e.target.value);
                setSelectedTeam('');
              }}
              className="input text-sm sm:text-base"
            >
              <option value="">كل الدوريات</option>
              {leagues.map((league) => (
                <option key={league.id} value={league.id}>
                  {league.name}
                </option>
              ))}
            </select>
          )}
          
          <select
            value={selectedTeam}
            onChange={(e) => setSelectedTeam(e.target.value)}
            className="input text-sm sm:text-base"
          >
            <option value="">كل الفرق</option>
            {teams.map((team) => (
              <option key={team.id} value={team.id}>
                {team.name}
              </option>
            ))}
          </select>
          
          <select
            value={positionFilter}
            onChange={(e) => setPositionFilter(e.target.value)}
            className="input text-sm sm:text-base"
          >
            <option value="">كل المراكز</option>
            {POSITIONS.map((pos) => (
              <option key={pos.value} value={pos.value}>
                {pos.icon} {pos.label}
              </option>
            ))}
          </select>
          
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input text-sm sm:text-base"
            placeholder="بحث عن لاعب..."
          />
        </div>
      </div>

      {/* Players Table */}
      <div className="card p-3 sm:p-6">
        {loading ? (
          <div className="text-center py-6 sm:py-8">
            <div className="animate-spin text-3xl sm:text-4xl">⚙️</div>
          </div>
        ) : filteredPlayers.length > 0 ? (
          <div className="overflow-x-auto -mx-3 sm:mx-0">
            <table className="w-full  text-xs sm:text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-right py-2 sm:py-3 px-1 sm:px-2">اللاعب</th>
                  <th className="text-center py-2 sm:py-3 px-1 sm:px-2">المركز</th>
                  <th className="text-center py-2 sm:py-3 px-1 sm:px-2 hidden sm:table-cell">الفريق</th>
                  <th className="text-center py-2 sm:py-3 px-1 sm:px-2">السعر</th>
                  <th className="text-center py-2 sm:py-3 px-1 sm:px-2 hidden sm:table-cell">الرقم</th>
                  <th className="text-center py-2 sm:py-3 px-1 sm:px-2">النقاط</th>
                  <th className="text-center py-2 sm:py-3 px-1 sm:px-2">إجراء</th>
                </tr>
              </thead>
              <tbody>
                {filteredPlayers.map((player) => {
                  const posInfo = getPositionInfo(player.position);
                  return (
                    <tr key={player.id} className="border-b hover:bg-gray-50">
                      <td className="py-2 sm:py-3 px-1 sm:px-2">
                        <div className="flex items-center gap-1 sm:gap-3">
                          <span className="text-lg sm:text-2xl">{posInfo.icon}</span>
                          <span className="font-medium truncate max-w-[80px] sm:max-w-none">{player.name}</span>
                        </div>
                      </td>
                      <td className="text-center py-2 sm:py-3 px-1 sm:px-2">
                        <span className="bg-gray-100 px-1 sm:px-2 py-0.5 sm:py-1 rounded text-[10px] sm:text-sm">
                          {posInfo.label}
                        </span>
                      </td>
                      <td className="text-center text-xs sm:text-sm text-gray-600 hidden sm:table-cell">
                        {player.team?.name}
                      </td>
                      <td className="text-center py-2 sm:py-3 px-1 sm:px-2">
                        <span className="bg-green-100 text-green-700 px-1 sm:px-2 py-0.5 sm:py-1 rounded text-[10px] sm:text-sm font-bold">
                          {player.price}M
                        </span>
                      </td>
                      <td className="text-center hidden sm:table-cell">
                        {player.shirtNumber || '-'}
                      </td>
                      <td className="text-center py-2 sm:py-3 px-1 sm:px-2">
                        <span className="font-bold text-primary-600 text-sm sm:text-base">
                          {player.totalPoints}
                        </span>
                      </td>
                      <td className="text-center py-2 sm:py-3 px-1 sm:px-2">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => handleEdit(player)}
                            className="text-blue-600 hover:text-blue-800 p-0.5 sm:p-1"
                            title="تعديل"
                          >
                            ✏️
                          </button>
                          <button
                            onClick={() => handleDelete(player.id)}
                            className="text-red-600 hover:text-red-800 p-0.5 sm:p-1"
                            title="حذف"
                          >
                            🗑️
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8 sm:py-12">
            <div className="text-4xl sm:text-5xl mb-4">👤</div>
            <p className="text-gray-600 text-sm sm:text-base">لا يوجد لاعبين</p>
            <button
              onClick={() => {
                resetForm();
                setShowModal(true);
              }}
              className="btn-primary mt-4 text-sm sm:text-base"
            >
              إضافة أول لاعب
            </button>
          </div>
        )}
      </div>

      {/* Stats Summary */}
      {players.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4">
          {POSITIONS.map((pos) => {
            const count = players.filter(p => p.position === pos.value).length;
            return (
              <div key={pos.value} className="card bg-gray-50 p-2 sm:p-4">
                <div className="text-center">
                  <span className="text-2xl sm:text-3xl">{pos.icon}</span>
                  <p className="font-bold text-lg sm:text-xl mt-1 sm:mt-2">{count}</p>
                  <p className="text-xs sm:text-sm text-gray-600">{pos.label}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-2 sm:p-4 z-50">
          <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 w-full max-w-md max-h-[95vh] overflow-y-auto">
            <h2 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4">
              {editingPlayer ? 'تعديل اللاعب' : 'إضافة لاعب جديد'}
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                  اسم اللاعب *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="input text-sm sm:text-base"
                  placeholder="الاسم الكامل"
                  required
                />
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                  المركز *
                </label>
                <select
                  value={formData.position}
                  onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                  className="input text-sm sm:text-base"
                  required
                >
                  {POSITIONS.map((pos) => (
                    <option key={pos.value} value={pos.value}>
                      {pos.icon} {pos.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                  الفريق *
                </label>
                <select
                  value={formData.teamId}
                  onChange={(e) => setFormData({ ...formData, teamId: e.target.value })}
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
                  السعر * (الحد الأقصى 10)
                </label>
                <input
                  type="number"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  className="input text-sm sm:text-base"
                  min={0.5}
                  max={10}
                  step={0.5}
                  placeholder="مثال: 5"
                  required
                />
                <p className="text-[10px] sm:text-xs text-gray-500 mt-1">السعر بالمليون (0.5 - 10)</p>
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                  رقم القميص (اختياري)
                </label>
                <input
                  type="number"
                  value={formData.shirtNumber}
                  onChange={(e) => setFormData({ ...formData, shirtNumber: e.target.value })}
                  className="input text-sm sm:text-base"
                  min={1}
                  max={99}
                  placeholder="مثال: 10"
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
                  {editingPlayer ? 'تحديث' : 'إضافة'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManagePlayers;
