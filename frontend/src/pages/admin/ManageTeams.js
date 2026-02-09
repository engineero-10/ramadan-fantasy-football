import React, { useState, useEffect } from 'react';
import { teamAPI, leagueAPI } from '../../services/api';
import toast from 'react-hot-toast';

const ManageTeams = () => {
  const [teams, setTeams] = useState([]);
  const [leagues, setLeagues] = useState([]);
  const [selectedLeague, setSelectedLeague] = useState('');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingTeam, setEditingTeam] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    leagueId: '',
  });

  useEffect(() => {
    fetchLeagues();
  }, []);

  useEffect(() => {
    fetchTeams();
  }, [selectedLeague]);

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
    setLoading(true);
    try {
      const params = selectedLeague ? { leagueId: selectedLeague } : {};
      const response = await teamAPI.getAll(params);
      setTeams(response.data.teams || []);
    } catch (error) {
      toast.error('خطأ في جلب الفرق');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingTeam) {
        await teamAPI.update(editingTeam.id, formData);
        toast.success('تم تحديث الفريق بنجاح');
      } else {
        await teamAPI.create(formData);
        toast.success('تم إضافة الفريق بنجاح');
      }
      setShowModal(false);
      resetForm();
      fetchTeams();
    } catch (error) {
      toast.error(error.response?.data?.message || 'حدث خطأ');
    }
  };

  const handleEdit = (team) => {
    setEditingTeam(team);
    setFormData({
      name: team.name,
      leagueId: team.leagueId,
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('هل أنت متأكد من حذف هذا الفريق؟ سيتم حذف جميع اللاعبين المرتبطين به.')) return;
    
    try {
      await teamAPI.delete(id);
      toast.success('تم حذف الفريق');
      fetchTeams();
    } catch (error) {
      toast.error(error.response?.data?.message || 'خطأ في الحذف');
    }
  };

  const resetForm = () => {
    setEditingTeam(null);
    setFormData({
      name: '',
      leagueId: selectedLeague || '',
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">⚽ إدارة الفرق</h1>
          <p className="text-gray-600">إضافة وتعديل فرق البطولة</p>
        </div>
        <div className="flex gap-3">
          <select
            value={selectedLeague}
            onChange={(e) => setSelectedLeague(e.target.value)}
            className="input"
          >
            <option value="">كل الدوريات</option>
            {leagues.map((league) => (
              <option key={league.id} value={league.id}>
                {league.name}
              </option>
            ))}
          </select>
          <button
            onClick={() => {
              resetForm();
              setShowModal(true);
            }}
            className="btn-primary"
          >
            ➕ إضافة فريق
          </button>
        </div>
      </div>

      {/* Teams Grid */}
      <div className="card">
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin text-4xl">⚙️</div>
          </div>
        ) : teams.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {teams.map((team) => (
              <div
                key={team.id}
                className="bg-gray-50 rounded-xl p-4 hover:shadow-md transition"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-2xl shadow">
                      ⚽
                    </div>
                    <div>
                      <h3 className="font-bold">{team.name}</h3>
                      <p className="text-xs text-gray-500">{team.league?.name}</p>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => handleEdit(team)}
                      className="text-blue-600 hover:text-blue-800 p-1"
                      title="تعديل"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => handleDelete(team.id)}
                      className="text-red-600 hover:text-red-800 p-1"
                      title="حذف"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
                <div className="flex justify-between text-sm text-gray-600">
                  <span>👥 {team._count?.players || 0} لاعب</span>
                  <span>📅 {new Date(team.createdAt).toLocaleDateString('ar-SA')}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="text-5xl mb-4">⚽</div>
            <p className="text-gray-600">لا توجد فرق بعد</p>
            <button
              onClick={() => {
                resetForm();
                setShowModal(true);
              }}
              className="btn-primary mt-4"
            >
              إضافة أول فريق
            </button>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">
              {editingTeam ? 'تعديل الفريق' : 'إضافة فريق جديد'}
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  اسم الفريق *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="input"
                  placeholder="مثال: فريق النجوم"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  الدوري *
                </label>
                <select
                  value={formData.leagueId}
                  onChange={(e) => setFormData({ ...formData, leagueId: e.target.value })}
                  className="input"
                  required
                >
                  <option value="">اختر الدوري</option>
                  {leagues.map((league) => (
                    <option key={league.id} value={league.id}>
                      {league.name}
                    </option>
                  ))}
                </select>
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
                  {editingTeam ? 'تحديث' : 'إضافة'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageTeams;
