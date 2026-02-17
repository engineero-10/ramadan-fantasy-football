import React, { useState, useEffect } from 'react';
import { leagueAPI, leaderboardAPI } from '../../services/api';
import toast from 'react-hot-toast';

const ManageLeagues = () => {
  const [leagues, setLeagues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showMembersModal, setShowMembersModal] = useState(false);
  const [selectedLeagueMembers, setSelectedLeagueMembers] = useState([]);
  const [selectedLeagueName, setSelectedLeagueName] = useState('');
  const [selectedLeagueId, setSelectedLeagueId] = useState(null);
  const [membersLoading, setMembersLoading] = useState(false);
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

  const handleViewMembers = async (league) => {
    setSelectedLeagueName(league.name);
    setSelectedLeagueId(league.id);
    setMembersLoading(true);
    setShowMembersModal(true);
    
    try {
      // جلب الأعضاء مع معلومات الدور
      const membersRes = await leagueAPI.getMembers(league.id);
      const members = membersRes.data.members || [];
      
      // جلب ترتيب الأعضاء حسب النقاط
      try {
        const leaderboardRes = await leaderboardAPI.get(league.id, { limit: 100 });
        const leaderboard = leaderboardRes.data.leaderboard || [];
        
        // دمج البيانات
        const mergedMembers = members.map(m => {
          const teamData = leaderboard.find(l => l.userId === m.user.id);
          return {
            ...m,
            teamName: teamData?.name || null,
            totalPoints: teamData?.totalPoints || 0,
            noTeam: !teamData
          };
        });
        setSelectedLeagueMembers(mergedMembers);
      } catch (e) {
        // لا يوجد ترتيب - عرض الأعضاء فقط
        setSelectedLeagueMembers(members.map(m => ({
          ...m,
          teamName: null,
          totalPoints: 0,
          noTeam: true
        })));
      }
    } catch (error) {
      toast.error('خطأ في جلب بيانات الأعضاء');
      setSelectedLeagueMembers([]);
    } finally {
      setMembersLoading(false);
    }
  };

  const handleToggleRole = async (userId, currentRole) => {
    const newRole = currentRole === 'ADMIN' ? 'MEMBER' : 'ADMIN';
    const confirmMsg = newRole === 'ADMIN' 
      ? 'هل تريد ترقية هذا العضو لمشرف؟' 
      : 'هل تريد إزالة صلاحيات المشرف من هذا العضو؟';
    
    if (!window.confirm(confirmMsg)) return;
    
    try {
      await leagueAPI.updateMemberRole(selectedLeagueId, userId, newRole);
      toast.success(newRole === 'ADMIN' ? 'تم ترقية العضو لمشرف' : 'تم إزالة صلاحيات المشرف');
      
      // تحديث القائمة
      setSelectedLeagueMembers(prev => prev.map(m => 
        m.user.id === userId ? { ...m, role: newRole } : m
      ));
    } catch (error) {
      toast.error(error.response?.data?.message || 'خطأ في تغيير الصلاحيات');
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
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">🏆 إدارة الدوري</h1>
          <p className="text-gray-600 text-sm sm:text-base">إعدادات وإدارة الدوري</p>
        </div>
        {leagues.length === 0 && (
          <button
            onClick={() => {
              resetForm();
              setShowModal(true);
            }}
            className="btn-primary text-sm sm:text-base"
          >
            ➕ إنشاء الدوري
          </button>
        )}
      </div>

      {/* Leagues List */}
      <div className="card p-3 sm:p-6">
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin text-4xl">⚙️</div>
          </div>
        ) : leagues.length > 0 ? (
          <div className="overflow-x-auto -mx-3 sm:mx-0">
            <table className="w-full sm:min-w-0">
              <thead>
                <tr className="border-b">
                  <th className="text-right py-2 sm:py-3 px-2 text-xs sm:text-sm">اسم الدوري</th>
                  <th className="text-center py-2 sm:py-3 px-2 text-xs sm:text-sm">الكود</th>
                  <th className="text-center py-2 sm:py-3 px-2 text-xs sm:text-sm">الأعضاء</th>
                  <th className="text-center py-2 sm:py-3 px-2 text-xs sm:text-sm hidden sm:table-cell">الانتقالات</th>
                  <th className="text-center py-2 sm:py-3 px-2 text-xs sm:text-sm hidden sm:table-cell">تاريخ الإنشاء</th>
                  <th className="text-center py-2 sm:py-3 px-2 text-xs sm:text-sm">إجراءات</th>
                </tr>
              </thead>
              <tbody>
                {leagues.map((league) => (
                  <tr key={league.id} className="border-b hover:bg-gray-50">
                    <td className="py-3 sm:py-4 px-2">
                      <p className="font-medium text-xs sm:text-base">{league.name}</p>
                      {league.description && (
                        <p className="text-[10px] sm:text-sm text-gray-500 truncate max-w-[100px] sm:max-w-none">{league.description}</p>
                      )}
                    </td>
                    <td className="text-center px-2">
                      <button
                        onClick={() => copyCode(league.code)}
                        className="bg-gray-100 hover:bg-gray-200 px-2 sm:px-3 py-0.5 sm:py-1 rounded font-mono text-[10px] sm:text-sm transition"
                        title="انقر للنسخ"
                      >
                        {league.code} 📋
                      </button>
                    </td>
                    <td className="text-center px-2">
                      <button
                        onClick={() => handleViewMembers(league)}
                        className="bg-blue-100 text-blue-700 hover:bg-blue-200 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded text-[10px] sm:text-sm transition cursor-pointer"
                        title="عرض الأعضاء والترتيب"
                      >
                        👥 {league._count?.members || 0}
                      </button>
                    </td>
                    <td className="text-center px-2 hidden sm:table-cell text-sm">{league.maxTransfersPerRound}</td>
                    <td className="text-center text-xs sm:text-sm text-gray-600 px-2 hidden sm:table-cell">
                      {new Date(league.createdAt).toLocaleDateString('ar-SA')}
                    </td>
                    <td className="text-center px-2">
                      <div className="flex items-center justify-center gap-1 sm:gap-2">
                        <button
                          onClick={() => handleViewMembers(league)}
                          className="text-green-600 hover:text-green-800 p-1 text-sm sm:text-base"
                          title="عرض الأعضاء والترتيب"
                        >
                          👥
                        </button>
                        <button
                          onClick={() => handleEdit(league)}
                          className="text-blue-600 hover:text-blue-800 p-1 text-sm sm:text-base"
                          title="تعديل"
                        >
                          ✏️
                        </button>
                        <button
                          onClick={() => handleDelete(league.id)}
                          className="text-red-600 hover:text-red-800 p-1 text-sm sm:text-base"
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
          <div className="text-center py-8 sm:py-12">
            <div className="text-4xl sm:text-5xl mb-4">🏆</div>
            <p className="text-gray-600 text-sm sm:text-base">لم يتم إنشاء الدوري بعد</p>
            <p className="text-xs sm:text-sm text-gray-500 mt-2">اضغط على زر "إنشاء الدوري" للبدء</p>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-2 sm:p-4 z-50">
          <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 w-full max-w-md max-h-[95vh] overflow-y-auto">
            <h2 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4">
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

      {/* Members Modal */}
      {showMembersModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-2 sm:p-4 z-50">
          <div className="bg-white rounded-xl sm:rounded-2xl p-3 sm:p-6 w-full max-w-2xl max-h-[95vh] sm:max-h-[80vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <h2 className="text-base sm:text-xl font-bold truncate flex-1 ml-2">👥 أعضاء {selectedLeagueName}</h2>
              <button
                onClick={() => setShowMembersModal(false)}
                className="text-gray-500 hover:text-gray-700 text-xl sm:text-2xl w-8 h-8 flex items-center justify-center flex-shrink-0"
              >
                ✕
              </button>
            </div>
            
            {membersLoading ? (
              <div className="text-center py-8 sm:py-12">
                <div className="animate-spin text-3xl sm:text-4xl">⚙️</div>
                <p className="text-gray-600 mt-2 text-sm">جاري التحميل...</p>
              </div>
            ) : selectedLeagueMembers.length > 0 ? (
              <div className="overflow-y-auto flex-1 -mx-3 sm:mx-0">
                <table className="w-full text-xs sm:text-sm">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      <th className="text-center py-2 sm:py-3 px-1 sm:px-2">#</th>
                      <th className="text-right py-2 sm:py-3 px-1 sm:px-2">المستخدم</th>
                      <th className="text-right py-2 sm:py-3 px-1 sm:px-2 hidden sm:table-cell">الفريق</th>
                      <th className="text-center py-2 sm:py-3 px-1 sm:px-2">نقاط</th>
                      <th className="text-center py-2 sm:py-3 px-1 sm:px-2">الدور</th>
                      <th className="text-center py-2 sm:py-3 px-1 sm:px-2">إجراء</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedLeagueMembers.map((member, idx) => (
                      <tr key={member.id || idx} className="border-b hover:bg-gray-50">
                        <td className="text-center py-2 sm:py-3 px-1 sm:px-2">
                          <span className={`inline-flex items-center justify-center w-6 h-6 sm:w-8 sm:h-8 rounded-full text-[10px] sm:text-sm font-bold
                            ${idx === 0 ? 'bg-yellow-100 text-yellow-700' : 
                              idx === 1 ? 'bg-gray-200 text-gray-700' : 
                              idx === 2 ? 'bg-orange-100 text-orange-700' : 
                              'bg-gray-100 text-gray-600'}`}
                          >
                            {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : idx + 1}
                          </span>
                        </td>
                        <td className="py-2 sm:py-3 px-1 sm:px-2">
                          <p className="font-medium text-xs sm:text-sm truncate max-w-[80px] sm:max-w-none">{member.user?.name || 'غير معروف'}</p>
                          <p className="text-[10px] sm:text-xs text-gray-500 truncate hidden sm:block">{member.user?.email}</p>
                        </td>
                        <td className="py-2 sm:py-3 px-1 sm:px-2 hidden sm:table-cell">
                          {member.noTeam ? (
                            <span className="text-gray-400 text-xs">لم ينشئ فريق</span>
                          ) : (
                            <span className="font-medium text-primary-600 text-xs sm:text-sm">{member.teamName}</span>
                          )}
                        </td>
                        <td className="text-center py-2 sm:py-3 px-1 sm:px-2">
                          <span className={`font-bold text-sm sm:text-lg ${member.noTeam ? 'text-gray-400' : 'text-primary-600'}`}>
                            {member.totalPoints || 0}
                          </span>
                        </td>
                        <td className="text-center py-2 sm:py-3 px-1 sm:px-2">
                          {member.role === 'ADMIN' ? (
                            <span className="bg-purple-100 text-purple-700 px-1 sm:px-2 py-0.5 sm:py-1 rounded text-[10px] sm:text-xs font-medium">
                              🛡️
                            </span>
                          ) : (
                            <span className="bg-gray-100 text-gray-600 px-1 sm:px-2 py-0.5 sm:py-1 rounded text-[10px] sm:text-xs">
                              عضو
                            </span>
                          )}
                        </td>
                        <td className="text-center py-2 sm:py-3 px-1 sm:px-2">
                          <button
                            onClick={() => handleToggleRole(member.user.id, member.role)}
                            className={`px-1 sm:px-2 py-0.5 sm:py-1 rounded text-[10px] sm:text-xs transition ${
                              member.role === 'ADMIN'
                                ? 'bg-red-100 text-red-600 hover:bg-red-200'
                                : 'bg-green-100 text-green-600 hover:bg-green-200'
                            }`}
                            title={member.role === 'ADMIN' ? 'إزالة صلاحيات المشرف' : 'ترقية لمشرف'}
                          >
                            {member.role === 'ADMIN' ? '⬇️' : '⬆️'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8 sm:py-12">
                <div className="text-4xl sm:text-5xl mb-4">👥</div>
                <p className="text-gray-600 text-sm">لا يوجد أعضاء في هذا الدوري بعد</p>
              </div>
            )}
            
            <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t">
              <button
                onClick={() => setShowMembersModal(false)}
                className="btn-secondary w-full text-sm sm:text-base py-2"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageLeagues;
