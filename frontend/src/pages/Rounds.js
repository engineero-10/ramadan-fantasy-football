import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { roundAPI, fantasyTeamAPI } from '../services/api';
import toast from 'react-hot-toast';

// تحديد حالة الجولة (يتحكم فيها الأدمن)
const getRoundStatus = (round) => {
  if (round.isCompleted) {
    return { 
      status: 'completed', 
      label: 'مكتملة', 
      icon: '✅',
      color: 'bg-gray-100 border-gray-300 text-gray-700' 
    };
  }
  if (round.transfersOpen) {
    return { 
      status: 'open', 
      label: 'مفتوحة للتعديل', 
      icon: '✏️',
      color: 'bg-green-100 border-green-300 text-green-700' 
    };
  }
  return { 
    status: 'locked', 
    label: 'مغلقة', 
    icon: '🔒',
    color: 'bg-orange-100 border-orange-300 text-orange-700' 
  };
};

const Rounds = () => {
  const [rounds, setRounds] = useState([]);
  const [fantasyTeam, setFantasyTeam] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // جلب الفريق الخيالي للحصول على leagueId
      const teamRes = await fantasyTeamAPI.getMyTeam();
      setFantasyTeam(teamRes.data.fantasyTeam);

      if (teamRes.data.fantasyTeam?.leagueId) {
        // جلب جميع الجولات
        const roundsRes = await roundAPI.getAll(teamRes.data.fantasyTeam.leagueId);
        setRounds(roundsRes.data.rounds || []);
      }
    } catch (error) {
      toast.error('خطأ في تحميل البيانات');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="text-4xl animate-bounce mb-4">📅</div>
          <p className="text-gray-600">جاري تحميل الجولات...</p>
        </div>
      </div>
    );
  }

  if (!fantasyTeam) {
    return (
      <div className="max-w-lg mx-auto card text-center">
        <div className="text-5xl mb-4">🎯</div>
        <h1 className="text-2xl font-bold mb-2">لا يوجد فريق</h1>
        <p className="text-gray-600 mb-4">يجب إنشاء فريق أولاً لمشاهدة جدول الجولات</p>
        <Link to="/create-team" className="btn-primary">
          إنشاء فريق
        </Link>
      </div>
    );
  }

  // تصنيف الجولات
  const completedRounds = rounds.filter(r => getRoundStatus(r).status === 'completed');
  const openRounds = rounds.filter(r => getRoundStatus(r).status === 'open');
  const lockedRounds = rounds.filter(r => getRoundStatus(r).status === 'locked');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="card bg-gradient-to-l from-primary-600 to-secondary-600 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">📅 جدول الجولات</h1>
            <p className="text-white/80">{fantasyTeam.league?.name}</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold">{rounds.length}</p>
            <p className="text-sm text-white/80">جولة</p>
          </div>
        </div>
      </div>

      {/* ملخص سريع */}
      <div className="grid grid-cols-3 gap-4">
        <div className="card text-center bg-green-50 border border-green-200">
          <span className="text-3xl">✏️</span>
          <p className="text-2xl font-bold text-green-600">{openRounds.length}</p>
          <p className="text-sm text-gray-600">مفتوحة</p>
        </div>
        <div className="card text-center bg-orange-50 border border-orange-200">
          <span className="text-3xl">🔒</span>
          <p className="text-2xl font-bold text-orange-600">{lockedRounds.length}</p>
          <p className="text-sm text-gray-600">مغلقة</p>
        </div>
        <div className="card text-center bg-gray-50 border border-gray-200">
          <span className="text-3xl">✅</span>
          <p className="text-2xl font-bold text-gray-600">{completedRounds.length}</p>
          <p className="text-sm text-gray-600">مكتملة</p>
        </div>
      </div>

      {rounds.length === 0 ? (
        <div className="card text-center py-12">
          <span className="text-5xl mb-4 block">📅</span>
          <h3 className="text-xl font-bold mb-2">لا توجد جولات بعد</h3>
          <p className="text-gray-600">سيتم إضافة الجولات من قبل المشرف قريباً</p>
        </div>
      ) : (
        <div className="space-y-4">
          {rounds.map((round) => {
            const status = getRoundStatus(round);
            const canEdit = round.transfersOpen && !round.isCompleted;
            return (
              <div 
                key={round.id} 
                className={`card border-2 ${status.color} transition-all hover:shadow-lg`}
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  {/* Round Info */}
                  <div className="flex items-center gap-4">
                    <div className="bg-white rounded-full w-14 h-14 flex items-center justify-center shadow">
                      <span className="text-2xl font-bold text-primary-600">{round.roundNumber}</span>
                    </div>
                    <div>
                      <h3 className="font-bold text-lg">{round.name}</h3>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${status.color}`}>
                          {status.icon} {status.label}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        📆 {new Date(round.startDate).toLocaleDateString('ar-SA', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-3 flex-wrap">
                    {/* عدد المباريات */}
                    <div className="bg-white rounded-lg px-3 py-2 text-center shadow-sm">
                      <p className="text-xs text-gray-500">⚽ المباريات</p>
                      <p className="font-bold">{round._count?.matches || 0}</p>
                    </div>

                    {/* أزرار الإجراءات */}
                    <div className="flex gap-2">
                      <Link 
                        to={`/matches?round=${round.id}`} 
                        className="btn-secondary text-sm py-1 px-3"
                      >
                        المباريات
                      </Link>
                      {canEdit && (
                        <Link 
                          to="/transfers" 
                          className="btn-primary text-sm py-1 px-3"
                        >
                          🔄 انتقالات
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Rounds;
