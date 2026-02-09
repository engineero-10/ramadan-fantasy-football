import React, { useState, useEffect } from 'react';
import { leagueAPI } from '../../services/api';
import toast from 'react-hot-toast';

const ManageLeagues = () => {
  const [leagues, setLeagues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingLeague, setEditingLeague] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    maxTransfersPerRound: 3,
  });

  useEffect(() => {
    fetchLeagues();
  }, []);

  const fetchLeagues = async () => {
    try {
      const response = await leagueAPI.getAll();
      setLeagues(response.data.leagues || []);
    } catch (error) {
      toast.error('خطأ في جلب الدوريات');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingLeague) {
        await leagueAPI.update(editingLeague.id, formData);
        toast.success('تم تحديث الدوري بنجاح');
      } else {
        await leagueAPI.create(formData);
        toast.success('تم إنشاء الدوري بنجاح');
      }
      setShowModal(false);
      resetForm();
      fetchLeagues();
    } catch (error) {
      toast.error(error.response?.data?.message || 'حدث خطأ');
    }
  };

  const handleEdit = (league) => {
    setEditingLeague(league);
    setFormData({
      name: league.name,
      description: league.description || '',
      maxTransfersPerRound: league.maxTransfersPerRound || 3,
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('هل أنت متأكد من حذف هذا الدوري؟')) return;
    
    try {
      await leagueAPI.delete(id);
      toast.success('تم حذف الدوري');
      fetchLeagues();
    } catch (error) {
      toast.error(error.response?.data?.message || 'خطأ في الحذف');
    }
  };

  const resetForm = () => {
    setEditingLeague(null);
    setFormData({
      name: '',
      description: '',
      maxTransfersPerRound: 3,
    });
  };

  const copyCode = (code) => {
    navigator.clipboard.writeText(code);
    toast.success('تم نسخ الكود!');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">🏆 إدارة الدوريات</h1>
          <p className="text-gray-600">إنشاء وتعديل دوريات البطولة</p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setShowModal(true);
          }}
          className="btn-primary"
        >
          ➕ إنشاء دوري جديد
        </button>
      </div>

      {/* Leagues List */}
      <div className="card">
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin text-4xl">⚙️</div>
          </div>
        ) : leagues.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-right py-3">اسم الدوري</th>
                  <th className="text-center py-3">الكود</th>
                  <th className="text-center py-3">الأعضاء</th>
                  <th className="text-center py-3">الانتقالات/الجولة</th>
                  <th className="text-center py-3">تاريخ الإنشاء</th>
                  <th className="text-center py-3">إجراءات</th>
                </tr>
              </thead>
              <tbody>
                {leagues.map((league) => (
                  <tr key={league.id} className="border-b hover:bg-gray-50">
                    <td className="py-4">
                      <p className="font-medium">{league.name}</p>
                      {league.description && (
                        <p className="text-sm text-gray-500">{league.description}</p>
                      )}
                    </td>
                    <td className="text-center">
                      <button
                        onClick={() => copyCode(league.code)}
                        className="bg-gray-100 hover:bg-gray-200 px-3 py-1 rounded font-mono text-sm transition"
                        title="انقر للنسخ"
                      >
                        {league.code} 📋
                      </button>
                    </td>
                    <td className="text-center">
                      <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-sm">
                        {league._count?.members || 0} عضو
                      </span>
                    </td>
                    <td className="text-center">{league.maxTransfersPerRound}</td>
                    <td className="text-center text-sm text-gray-600">
                      {new Date(league.createdAt).toLocaleDateString('ar-SA')}
                    </td>
                    <td className="text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleEdit(league)}
                          className="text-blue-600 hover:text-blue-800 p-1"
                          title="تعديل"
                        >
                          ✏️
                        </button>
                        <button
                          onClick={() => handleDelete(league.id)}
                          className="text-red-600 hover:text-red-800 p-1"
                          title="حذف"
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="text-5xl mb-4">🏆</div>
            <p className="text-gray-600">لا توجد دوريات بعد</p>
            <button
              onClick={() => setShowModal(true)}
              className="btn-primary mt-4"
            >
              إنشاء أول دوري
            </button>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">
              {editingLeague ? 'تعديل الدوري' : 'إنشاء دوري جديد'}
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  اسم الدوري *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="input"
                  placeholder="مثال: دوري رمضان 2025"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  الوصف (اختياري)
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="input"
                  rows={3}
                  placeholder="وصف مختصر للدوري"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  عدد الانتقالات المسموحة لكل جولة
                </label>
                <input
                  type="number"
                  value={formData.maxTransfersPerRound}
                  onChange={(e) => setFormData({ ...formData, maxTransfersPerRound: parseInt(e.target.value) })}
                  className="input"
                  min={1}
                  max={10}
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
                  {editingLeague ? 'تحديث' : 'إنشاء'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageLeagues;
