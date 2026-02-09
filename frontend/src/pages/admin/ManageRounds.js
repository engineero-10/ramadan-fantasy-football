import React, { useState, useEffect } from 'react';
import { roundAPI, leagueAPI } from '../../services/api';
import toast from 'react-hot-toast';

const ManageRounds = () => {
  const [rounds, setRounds] = useState([]);
  const [leagues, setLeagues] = useState([]);
  const [selectedLeague, setSelectedLeague] = useState('');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingRound, setEditingRound] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    leagueId: '',
    startDate: '',
    endDate: '',
    transferDeadline: '',
  });

  useEffect(() => {
    fetchLeagues();
  }, []);

  useEffect(() => {
    if (selectedLeague) {
      fetchRounds();
    }
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

  const fetchRounds = async () => {
    setLoading(true);
    try {
      const response = await roundAPI.getAll(selectedLeague);
      setRounds(response.data.rounds || []);
    } catch (error) {
      toast.error('خطأ في جلب الجولات');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = {
        ...formData,
        startDate: formData.startDate ? new Date(formData.startDate).toISOString() : null,
        endDate: formData.endDate ? new Date(formData.endDate).toISOString() : null,
        transferDeadline: formData.transferDeadline ? new Date(formData.transferDeadline).toISOString() : null,
      };
      
      if (editingRound) {
        await roundAPI.update(editingRound.id, data);
        toast.success('تم تحديث الجولة بنجاح');
      } else {
        await roundAPI.create(data);
        toast.success('تم إنشاء الجولة بنجاح');
      }
      setShowModal(false);
      resetForm();
      fetchRounds();
    } catch (error) {
      toast.error(error.response?.data?.message || 'حدث خطأ');
    }
  };

  const handleEdit = (round) => {
    setEditingRound(round);
    setFormData({
      name: round.name,
      leagueId: round.leagueId,
      startDate: round.startDate ? new Date(round.startDate).toISOString().slice(0, 16) : '',
      endDate: round.endDate ? new Date(round.endDate).toISOString().slice(0, 16) : '',
      transferDeadline: round.transferDeadline ? new Date(round.transferDeadline).toISOString().slice(0, 16) : '',
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('هل أنت متأكد من حذف هذه الجولة؟')) return;
    
    try {
      await roundAPI.delete(id);
      toast.success('تم حذف الجولة');
      fetchRounds();
    } catch (error) {
      toast.error(error.response?.data?.message || 'خطأ في الحذف');
    }
  };

  const toggleTransfers = async (roundId, currentState) => {
    try {
      await roundAPI.toggleTransfers(roundId, !currentState);
      toast.success(currentState ? 'تم إغلاق الانتقالات' : 'تم فتح الانتقالات');
      fetchRounds();
    } catch (error) {
      toast.error('خطأ في تغيير حالة الانتقالات');
    }
  };

  const completeRound = async (roundId) => {
    if (!window.confirm('هل أنت متأكد من إنهاء هذه الجولة؟ سيتم احتساب النقاط للجميع.')) return;
    
    try {
      await roundAPI.complete(roundId);
      toast.success('تم إنهاء الجولة واحتساب النقاط');
      fetchRounds();
    } catch (error) {
      toast.error('خطأ في إنهاء الجولة');
    }
  };

  const resetForm = () => {
    setEditingRound(null);
    setFormData({
      name: '',
      leagueId: selectedLeague || '',
      startDate: '',
      endDate: '',
      transferDeadline: '',
    });
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('ar-SA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">📅 إدارة الجولات</h1>
          <p className="text-gray-600">إنشاء وإدارة جولات البطولة</p>
        </div>
        <div className="flex gap-3">
          <select
            value={selectedLeague}
            onChange={(e) => setSelectedLeague(e.target.value)}
            className="input"
          >
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
            ➕ إنشاء جولة
          </button>
        </div>
      </div>

      {/* Rounds List */}
      <div className="card">
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin text-4xl">⚙️</div>
          </div>
        ) : rounds.length > 0 ? (
          <div className="space-y-4">
            {rounds.map((round, index) => (
              <div
                key={round.id}
                className={`bg-gray-50 rounded-xl p-4 ${round.isActive ? 'ring-2 ring-primary-500' : ''}`}
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-xl font-bold shadow">
                      {index + 1}
                    </div>
                    <div>
                      <h3 className="font-bold">{round.name}</h3>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {round.isActive && (
                          <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded">
                            🟢 جولة نشطة
                          </span>
                        )}
                        {round.isCompleted && (
                          <span className="bg-gray-200 text-gray-700 text-xs px-2 py-1 rounded">
                            ✅ مكتملة
                          </span>
                        )}
                        <span className={`text-xs px-2 py-1 rounded ${round.transfersOpen ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-700'}`}>
                          {round.transfersOpen ? '🔓 الانتقالات مفتوحة' : '🔒 الانتقالات مغلقة'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => toggleTransfers(round.id, round.transfersOpen)}
                      className={`text-sm px-3 py-1 rounded ${round.transfersOpen ? 'bg-red-100 text-red-700 hover:bg-red-200' : 'bg-green-100 text-green-700 hover:bg-green-200'}`}
                    >
                      {round.transfersOpen ? '🔒 إغلاق الانتقالات' : '🔓 فتح الانتقالات'}
                    </button>
                    {!round.isCompleted && (
                      <button
                        onClick={() => completeRound(round.id)}
                        className="text-sm px-3 py-1 rounded bg-purple-100 text-purple-700 hover:bg-purple-200"
                      >
                        ✅ إنهاء الجولة
                      </button>
                    )}
                    <button
                      onClick={() => handleEdit(round)}
                      className="text-sm px-3 py-1 rounded bg-blue-100 text-blue-700 hover:bg-blue-200"
                    >
                      ✏️ تعديل
                    </button>
                    <button
                      onClick={() => handleDelete(round.id)}
                      className="text-sm px-3 py-1 rounded bg-red-100 text-red-700 hover:bg-red-200"
                    >
                      🗑️ حذف
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 pt-4 border-t">
                  <div>
                    <p className="text-xs text-gray-500">بداية الجولة</p>
                    <p className="text-sm">{formatDate(round.startDate)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">نهاية الجولة</p>
                    <p className="text-sm">{formatDate(round.endDate)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">موعد إغلاق الانتقالات</p>
                    <p className="text-sm">{formatDate(round.transferDeadline)}</p>
                  </div>
                </div>

                <div className="flex gap-4 mt-3 text-sm text-gray-600">
                  <span>📅 {round._count?.matches || 0} مباراة</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="text-5xl mb-4">📅</div>
            <p className="text-gray-600">لا توجد جولات بعد</p>
            <button
              onClick={() => {
                resetForm();
                setShowModal(true);
              }}
              className="btn-primary mt-4"
            >
              إنشاء أول جولة
            </button>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">
              {editingRound ? 'تعديل الجولة' : 'إنشاء جولة جديدة'}
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  اسم الجولة *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="input"
                  placeholder="مثال: الجولة الأولى"
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

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  بداية الجولة
                </label>
                <input
                  type="datetime-local"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  className="input"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  نهاية الجولة
                </label>
                <input
                  type="datetime-local"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  className="input"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  موعد إغلاق الانتقالات
                </label>
                <input
                  type="datetime-local"
                  value={formData.transferDeadline}
                  onChange={(e) => setFormData({ ...formData, transferDeadline: e.target.value })}
                  className="input"
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
                  {editingRound ? 'تحديث' : 'إنشاء'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageRounds;
