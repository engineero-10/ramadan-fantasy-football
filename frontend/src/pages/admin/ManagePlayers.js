import React, { useState, useEffect } from 'react';
import { playerAPI, teamAPI, leagueAPI } from '../../services/api';
import toast from 'react-hot-toast';

const POSITIONS = [
  { value: 'GK', label: 'حارس مرمى', icon: '🧤' },
  { value: 'DEF', label: 'مدافع', icon: '🛡️' },
  { value: 'MID', label: 'وسط', icon: '🎯' },
  { value: 'FWD', label: 'مهاجم', icon: '⚽' },
];

const ManagePlayers = () => {
  const [players, setPlayers] = useState([]);
  const [teams, setTeams] = useState([]);
  const [leagues, setLeagues] = useState([]);
  const [selectedLeague, setSelectedLeague] = useState('');
  const [selectedTeam, setSelectedTeam] = useState('');
  const [positionFilter, setPositionFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    position: 'MID',
    teamId: '',
    shirtNumber: '',
  });

  useEffect(() => {
    fetchLeagues();
  }, []);

  useEffect(() => {
    if (selectedLeague) {
      fetchTeams();
    }
  }, [selectedLeague]);

  useEffect(() => {
    fetchPlayers();
  }, [selectedLeague, selectedTeam, positionFilter]);

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
    setLoading(true);
    try {
      const params = {};
      if (selectedLeague) params.leagueId = selectedLeague;
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
      position: 'MID',
      teamId: teams[0]?.id || '',
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">👤 إدارة اللاعبين</h1>
          <p className="text-gray-600">إضافة وتعديل لاعبي الفرق</p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setShowModal(true);
          }}
          className="btn-primary"
        >
          ➕ إضافة لاعب
        </button>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <select
            value={selectedLeague}
            onChange={(e) => {
              setSelectedLeague(e.target.value);
              setSelectedTeam('');
            }}
            className="input"
          >
            <option value="">كل الدوريات</option>
            {leagues.map((league) => (
              <option key={league.id} value={league.id}>
                {league.name}
              </option>
            ))}
          </select>
          
          <select
            value={selectedTeam}
            onChange={(e) => setSelectedTeam(e.target.value)}
            className="input"
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
            className="input"
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
            className="input"
            placeholder="بحث عن لاعب..."
          />
        </div>
      </div>

      {/* Players Table */}
      <div className="card">
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin text-4xl">⚙️</div>
          </div>
        ) : filteredPlayers.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-right py-3">اللاعب</th>
                  <th className="text-center py-3">المركز</th>
                  <th className="text-center py-3">الفريق</th>
                  <th className="text-center py-3">الرقم</th>
                  <th className="text-center py-3">النقاط</th>
                  <th className="text-center py-3">إجراءات</th>
                </tr>
              </thead>
              <tbody>
                {filteredPlayers.map((player) => {
                  const posInfo = getPositionInfo(player.position);
                  return (
                    <tr key={player.id} className="border-b hover:bg-gray-50">
                      <td className="py-3">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{posInfo.icon}</span>
                          <span className="font-medium">{player.name}</span>
                        </div>
                      </td>
                      <td className="text-center">
                        <span className="bg-gray-100 px-2 py-1 rounded text-sm">
                          {posInfo.label}
                        </span>
                      </td>
                      <td className="text-center text-sm text-gray-600">
                        {player.team?.name}
                      </td>
                      <td className="text-center">
                        {player.shirtNumber || '-'}
                      </td>
                      <td className="text-center">
                        <span className="font-bold text-primary-600">
                          {player.totalPoints}
                        </span>
                      </td>
                      <td className="text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleEdit(player)}
                            className="text-blue-600 hover:text-blue-800 p-1"
                            title="تعديل"
                          >
                            ✏️
                          </button>
                          <button
                            onClick={() => handleDelete(player.id)}
                            className="text-red-600 hover:text-red-800 p-1"
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
          <div className="text-center py-12">
            <div className="text-5xl mb-4">👤</div>
            <p className="text-gray-600">لا يوجد لاعبين</p>
            <button
              onClick={() => {
                resetForm();
                setShowModal(true);
              }}
              className="btn-primary mt-4"
            >
              إضافة أول لاعب
            </button>
          </div>
        )}
      </div>

      {/* Stats Summary */}
      {players.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {POSITIONS.map((pos) => {
            const count = players.filter(p => p.position === pos.value).length;
            return (
              <div key={pos.value} className="card bg-gray-50">
                <div className="text-center">
                  <span className="text-3xl">{pos.icon}</span>
                  <p className="font-bold text-xl mt-2">{count}</p>
                  <p className="text-sm text-gray-600">{pos.label}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">
              {editingPlayer ? 'تعديل اللاعب' : 'إضافة لاعب جديد'}
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  اسم اللاعب *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="input"
                  placeholder="الاسم الكامل"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  المركز *
                </label>
                <select
                  value={formData.position}
                  onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                  className="input"
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
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  الفريق *
                </label>
                <select
                  value={formData.teamId}
                  onChange={(e) => setFormData({ ...formData, teamId: e.target.value })}
                  className="input"
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
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  رقم القميص (اختياري)
                </label>
                <input
                  type="number"
                  value={formData.shirtNumber}
                  onChange={(e) => setFormData({ ...formData, shirtNumber: e.target.value })}
                  className="input"
                  min={1}
                  max={99}
                  placeholder="مثال: 10"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    resetForm();
                  }}
                  className="btn-secondary flex-1"
                >
                  إلغاء
                </button>
                <button type="submit" className="btn-primary flex-1">
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
