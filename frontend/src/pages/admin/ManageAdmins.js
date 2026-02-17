import React, { useState, useEffect } from 'react';
import { adminManagementAPI } from '../../services/api';
import toast from 'react-hot-toast';

const ManageAdmins = () => {
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [adminsRes, statsRes] = await Promise.all([
        adminManagementAPI.getAll(),
        adminManagementAPI.getStats()
      ]);
      setAdmins(adminsRes.data.admins || []);
      setStats(statsRes.data.stats || null);
    } catch (error) {
      toast.error('خطأ في تحميل البيانات');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name || !formData.email) {
      toast.error('الاسم والبريد الإلكتروني مطلوبين');
      return;
    }

    if (!editingAdmin && !formData.password) {
      toast.error('كلمة المرور مطلوبة');
      return;
    }

    try {
      if (editingAdmin) {
        const updateData = { name: formData.name, email: formData.email };
        if (formData.password) updateData.password = formData.password;
        await adminManagementAPI.update(editingAdmin.id, updateData);
        toast.success('تم تحديث الأدمن بنجاح');
      } else {
        await adminManagementAPI.create(formData);
        toast.success('تم إنشاء حساب الأدمن بنجاح');
      }
      setShowModal(false);
      resetForm();
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'حدث خطأ');
    }
  };

  const handleEdit = (admin) => {
    setEditingAdmin(admin);
    setFormData({
      name: admin.name,
      email: admin.email,
      password: ''
    });
    setShowModal(true);
  };

  const handleDelete = async (admin) => {
    if (!window.confirm(`هل أنت متأكد من حذف ${admin.name}؟ سيتم حذف الدوري وجميع بياناته!`)) {
      return;
    }

    try {
      await adminManagementAPI.delete(admin.id);
      toast.success('تم حذف الأدمن بنجاح');
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'خطأ في الحذف');
    }
  };

  const resetForm = () => {
    setEditingAdmin(null);
    setFormData({ name: '', email: '', password: '' });
  };

  const openCreateModal = () => {
    resetForm();
    setShowModal(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[300px] sm:min-h-[400px]">
        <div className="text-center">
          <div className="text-3xl sm:text-4xl animate-bounce mb-4">⚙️</div>
          <p className="text-gray-600 text-sm sm:text-base">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-l from-purple-600 to-pink-600 rounded-xl sm:rounded-2xl p-4 sm:p-6 text-white">
        <h1 className="text-xl sm:text-2xl font-bold mb-1 sm:mb-2">إدارة العملاء 👥</h1>
        <p className="text-white/80 text-sm sm:text-base">إنشاء وإدارة حسابات الأدمن (العملاء)</p>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-4">
          <div className="card p-3 sm:p-4 text-center">
            <div className="text-xl sm:text-3xl font-bold text-purple-600">{stats.totalAdmins}</div>
            <div className="text-gray-500 text-xs sm:text-sm">عدد العملاء</div>
          </div>
          <div className="card p-3 sm:p-4 text-center">
            <div className="text-xl sm:text-3xl font-bold text-blue-600">{stats.totalLeagues}</div>
            <div className="text-gray-500 text-xs sm:text-sm">عدد الدوريات</div>
          </div>
          <div className="card p-3 sm:p-4 text-center">
            <div className="text-xl sm:text-3xl font-bold text-green-600">{stats.totalUsers}</div>
            <div className="text-gray-500 text-xs sm:text-sm">المستخدمين</div>
          </div>
          <div className="card p-3 sm:p-4 text-center">
            <div className="text-xl sm:text-3xl font-bold text-orange-600">{stats.totalMatches}</div>
            <div className="text-gray-500 text-xs sm:text-sm">المباريات</div>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-end">
        <button
          onClick={openCreateModal}
          className="btn-primary flex items-center gap-2 text-sm sm:text-base py-2 px-3 sm:px-4"
        >
          <span>➕</span>
          <span className="hidden sm:inline">إنشاء حساب عميل جديد</span>
          <span className="sm:hidden">عميل جديد</span>
        </button>
      </div>

      {/* Admins List */}
      <div className="card overflow-hidden">
        <div className="p-3 sm:p-4 border-b">
          <h2 className="text-base sm:text-lg font-bold">قائمة العملاء</h2>
        </div>
        
        {admins.length === 0 ? (
          <div className="p-6 sm:p-8 text-center text-gray-500">
            <div className="text-3xl sm:text-4xl mb-4">👤</div>
            <p className="text-sm sm:text-base">لا يوجد عملاء بعد</p>
            <button 
              onClick={openCreateModal}
              className="mt-4 text-purple-600 hover:underline text-sm sm:text-base"
            >
              أنشئ أول حساب عميل
            </button>
          </div>
        ) : (
          <div className="divide-y">
            {admins.map(admin => (
              <div key={admin.id} className="p-3 sm:p-4 hover:bg-gray-50">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 sm:gap-3">
                      <div className="w-9 h-9 sm:w-10 sm:h-10 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-purple-600 font-bold text-sm sm:text-base">
                          {admin.name.charAt(0)}
                        </span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="font-bold text-sm sm:text-base truncate">{admin.name}</h3>
                        <p className="text-gray-500 text-xs sm:text-sm truncate">{admin.email}</p>
                      </div>
                    </div>
                    
                    {admin.leagues && admin.leagues.length > 0 ? (
                      <div className="mt-2 sm:mt-3 bg-gray-50 rounded-lg p-2 sm:p-3">
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs sm:text-sm">
                          <span>🏆</span>
                          <span className="font-medium truncate max-w-[120px] sm:max-w-none">{admin.leagues[0].name}</span>
                          <span className="text-gray-400 hidden sm:inline">|</span>
                          <span className="text-gray-500">كود: {admin.leagues[0].code}</span>
                          <span className="text-gray-400 hidden sm:inline">|</span>
                          <span className="text-gray-500">
                            {admin.leagues[0]._count?.members || 0} عضو
                          </span>
                          {admin.leagues[0].isActive ? (
                            <span className="bg-green-100 text-green-700 px-1.5 sm:px-2 py-0.5 rounded text-[10px] sm:text-xs">نشط</span>
                          ) : (
                            <span className="bg-red-100 text-red-700 px-1.5 sm:px-2 py-0.5 rounded text-[10px] sm:text-xs">غير نشط</span>
                          )}
                        </div>
                      </div>
                    ) : (
                      <p className="mt-2 text-gray-400 text-xs sm:text-sm">لم ينشئ دوري بعد</p>
                    )}
                  </div>

                  <div className="flex gap-1 sm:gap-2 flex-shrink-0">
                    <button
                      onClick={() => handleEdit(admin)}
                      className="p-2 hover:bg-gray-100 rounded-lg text-blue-600"
                      title="تعديل"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => handleDelete(admin)}
                      className="p-2 hover:bg-gray-100 rounded-lg text-red-600"
                      title="حذف"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-xl sm:rounded-2xl w-full max-w-md my-auto max-h-[95vh] overflow-hidden flex flex-col">
            <div className="p-4 sm:p-6 border-b flex-shrink-0">
              <h2 className="text-lg sm:text-xl font-bold">
                {editingAdmin ? 'تعديل بيانات العميل' : 'إنشاء حساب عميل جديد'}
              </h2>
            </div>

            <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-3 sm:space-y-4 overflow-y-auto flex-1">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  الاسم *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="input w-full"
                  placeholder="اسم العميل"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  البريد الإلكتروني *
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="input w-full"
                  placeholder="email@example.com"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  كلمة المرور {!editingAdmin && '*'}
                </label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="input w-full"
                  placeholder={editingAdmin ? 'اتركه فارغاً للإبقاء على كلمة المرور الحالية' : 'كلمة المرور'}
                  required={!editingAdmin}
                />
              </div>

              <div className="flex gap-2 sm:gap-3 pt-3 sm:pt-4">
                <button type="submit" className="btn-primary flex-1 text-sm sm:text-base py-2">
                  {editingAdmin ? 'حفظ التعديلات' : 'إنشاء الحساب'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="btn-secondary flex-1 text-sm sm:text-base py-2"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageAdmins;
