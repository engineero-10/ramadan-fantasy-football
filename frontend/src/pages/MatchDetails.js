import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { matchAPI } from '../services/api';
import toast from 'react-hot-toast';

const MATCH_STATUS = {
  SCHEDULED: { label: 'مجدولة', color: 'bg-blue-100 text-blue-700' },
  LIVE: { label: 'جارية', color: 'bg-green-100 text-green-700' },
  COMPLETED: { label: 'انتهت', color: 'bg-gray-100 text-gray-700' },
  POSTPONED: { label: 'مؤجلة', color: 'bg-yellow-100 text-yellow-700' },
  CANCELLED: { label: 'ملغاة', color: 'bg-red-100 text-red-700' },
};

const STAT_ICONS = {
  goals: '⚽',
  assists: '👟',
  yellowCards: '🟨',
  redCards: '🟥',
  cleanSheet: '🛡️',
  penaltySaved: '🧤',
  minutesPlayed: '⏱️',
};

const MatchDetails = () => {
  const { id } = useParams();
  const [match, setMatch] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMatch();
  }, [id]);

  const fetchMatch = async () => {
    try {
      const response = await matchAPI.getById(id);
      setMatch(response.data.match);
    } catch (error) {
      toast.error('خطأ في جلب تفاصيل المباراة');
    } finally {
      setLoading(false);
    }
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

  if (!match) {
    return (
      <div className="card text-center py-12">
        <div className="text-5xl mb-4">❌</div>
        <p className="text-gray-600">المباراة غير موجودة</p>
        <Link to="/matches" className="btn-primary mt-4 inline-block">
          العودة للمباريات
        </Link>
      </div>
    );
  }

  const status = MATCH_STATUS[match.status] || MATCH_STATUS.SCHEDULED;
  const matchDate = new Date(match.matchDate);
  const isFinished = match.status === 'COMPLETED';

  // تجميع الإحصائيات حسب الفريق
  const homeStats = match.stats?.filter(s => s.player?.teamId === match.homeTeamId) || [];
  const awayStats = match.stats?.filter(s => s.player?.teamId === match.awayTeamId) || [];

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Match Header */}
      <div className="card bg-gradient-to-l from-primary-600 to-secondary-600 text-white p-4 sm:p-6">
        <div className="text-center mb-3 sm:mb-4">
          <span className={`inline-block px-2 sm:px-3 py-0.5 sm:py-1 rounded text-xs sm:text-sm ${status.color}`}>
            {status.label}
          </span>
          <p className="mt-1.5 sm:mt-2 text-white/80 text-sm sm:text-base">
            {matchDate.toLocaleDateString('ar-SA')}
          </p>
          <p className="text-white/60 text-xs sm:text-sm">
            {matchDate.toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>

        <div className="flex items-center justify-between max-w-xl mx-auto gap-2">
          {/* Home Team */}
          <div className="flex-1 text-center min-w-0">
            <div className="w-12 h-12 sm:w-20 sm:h-20 bg-white rounded-full mx-auto flex items-center justify-center text-2xl sm:text-4xl shadow-lg">
              ⚽
            </div>
            <p className="font-bold text-xs sm:text-lg mt-2 sm:mt-3 truncate px-1">{match.homeTeam?.shortName || match.homeTeam?.name}</p>
          </div>

          {/* Score */}
          <div className="flex-shrink-0 px-2 sm:px-8">
            {isFinished ? (
              <p className="text-3xl sm:text-5xl font-bold">
                {match.homeScore} - {match.awayScore}
              </p>
            ) : (
              <p className="text-2xl sm:text-4xl font-bold text-white/50">VS</p>
            )}
          </div>

          {/* Away Team */}
          <div className="flex-1 text-center min-w-0">
            <div className="w-12 h-12 sm:w-20 sm:h-20 bg-white rounded-full mx-auto flex items-center justify-center text-2xl sm:text-4xl shadow-lg">
              ⚽
            </div>
            <p className="font-bold text-xs sm:text-lg mt-2 sm:mt-3 truncate px-1">{match.awayTeam?.shortName || match.awayTeam?.name}</p>
          </div>
        </div>

        {match.location && (
          <p className="text-center text-white/80 mt-3 sm:mt-4 text-xs sm:text-base">
            📍 {match.location}
          </p>
        )}
      </div>

      {/* Match Info */}
      <div className="card p-3 sm:p-6">
        <h2 className="font-bold text-sm sm:text-lg mb-3 sm:mb-4">معلومات المباراة</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4">
          <div className="bg-gray-50 rounded-lg sm:rounded-xl p-2 sm:p-4 text-center">
            <p className="text-[10px] sm:text-sm text-gray-500">الدوري</p>
            <p className="font-medium text-xs sm:text-base truncate">{match.round?.league?.name || '-'}</p>
          </div>
          <div className="bg-gray-50 rounded-lg sm:rounded-xl p-2 sm:p-4 text-center">
            <p className="text-[10px] sm:text-sm text-gray-500">الجولة</p>
            <p className="font-medium text-xs sm:text-base truncate">{match.round?.name || '-'}</p>
          </div>
          <div className="bg-gray-50 rounded-lg sm:rounded-xl p-2 sm:p-4 text-center">
            <p className="text-[10px] sm:text-sm text-gray-500">التاريخ</p>
            <p className="font-medium text-xs sm:text-base">{matchDate.toLocaleDateString('ar-SA')}</p>
          </div>
          <div className="bg-gray-50 rounded-lg sm:rounded-xl p-2 sm:p-4 text-center">
            <p className="text-[10px] sm:text-sm text-gray-500">الوقت</p>
            <p className="font-medium text-xs sm:text-base">
              {matchDate.toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
        </div>
      </div>

      {/* Match Stats */}
      {isFinished && (homeStats.length > 0 || awayStats.length > 0) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-6">
          {/* Home Team Stats */}
          <div className="card p-3 sm:p-6">
            <h3 className="font-bold mb-3 sm:mb-4 text-center border-b pb-2 text-sm sm:text-base truncate">
              {match.homeTeam?.name}
            </h3>
            {homeStats.length > 0 ? (
              <div className="space-y-2 sm:space-y-3">
                {homeStats.map((stat) => (
                  <PlayerStatCard key={stat.id} stat={stat} />
                ))}
              </div>
            ) : (
              <p className="text-center text-gray-500 py-3 sm:py-4 text-sm">لا توجد إحصائيات</p>
            )}
          </div>

          {/* Away Team Stats */}
          <div className="card p-3 sm:p-6">
            <h3 className="font-bold mb-3 sm:mb-4 text-center border-b pb-2 text-sm sm:text-base truncate">
              {match.awayTeam?.name}
            </h3>
            {awayStats.length > 0 ? (
              <div className="space-y-2 sm:space-y-3">
                {awayStats.map((stat) => (
                  <PlayerStatCard key={stat.id} stat={stat} />
                ))}
              </div>
            ) : (
              <p className="text-center text-gray-500 py-3 sm:py-4 text-sm">لا توجد إحصائيات</p>
            )}
          </div>
        </div>
      )}

      {/* Back Button */}
      <div className="text-center">
        <Link to="/matches" className="btn-secondary text-sm sm:text-base py-2 px-4">
          ← العودة للمباريات
        </Link>
      </div>
    </div>
  );
};

// مكون إحصائيات اللاعب
const PlayerStatCard = ({ stat }) => {
  return (
    <div className="bg-gray-50 rounded-lg sm:rounded-xl p-2 sm:p-3">
      <div className="flex items-center justify-between mb-1.5 sm:mb-2">
        <Link to={`/player/${stat.player?.id}`} className="font-medium hover:text-primary-600 text-xs sm:text-base truncate flex-1 ml-2">
          {stat.player?.name}
        </Link>
        <span className="text-[10px] sm:text-sm bg-primary-100 text-primary-700 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded flex-shrink-0">
          +{stat.points} ن
        </span>
      </div>
      <div className="flex flex-wrap gap-1 sm:gap-2 text-[10px] sm:text-sm">
        {stat.goals > 0 && (
          <span className="bg-white px-1.5 sm:px-2 py-0.5 sm:py-1 rounded">
            {STAT_ICONS.goals}{stat.goals}
          </span>
        )}
        {stat.assists > 0 && (
          <span className="bg-white px-1.5 sm:px-2 py-0.5 sm:py-1 rounded">
            {STAT_ICONS.assists}{stat.assists}
          </span>
        )}
        {stat.yellowCards > 0 && (
          <span className="bg-white px-1.5 sm:px-2 py-0.5 sm:py-1 rounded">
            {STAT_ICONS.yellowCards}{stat.yellowCards}
          </span>
        )}
        {stat.redCards > 0 && (
          <span className="bg-white px-1.5 sm:px-2 py-0.5 sm:py-1 rounded">
            {STAT_ICONS.redCards}{stat.redCards}
          </span>
        )}
        {stat.cleanSheet && (
          <span className="bg-white px-1.5 sm:px-2 py-0.5 sm:py-1 rounded">
            {STAT_ICONS.cleanSheet}
          </span>
        )}
        {stat.penaltySaved > 0 && (
          <span className="bg-white px-1.5 sm:px-2 py-0.5 sm:py-1 rounded">
            {STAT_ICONS.penaltySaved}{stat.penaltySaved}
          </span>
        )}
        {stat.minutesPlayed > 0 && (
          <span className="bg-gray-100 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded text-gray-600">
            {STAT_ICONS.minutesPlayed}{stat.minutesPlayed}د
          </span>
        )}
      </div>
    </div>
  );
};

export default MatchDetails;
