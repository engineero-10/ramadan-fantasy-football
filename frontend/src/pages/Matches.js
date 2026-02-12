import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { matchAPI, roundAPI, leagueAPI } from '../services/api';
import toast from 'react-hot-toast';

const MATCH_STATUS = {
  SCHEDULED: { label: 'مجدولة', color: 'bg-blue-100 text-blue-700', icon: '📅' },
  LIVE: { label: 'جارية', color: 'bg-green-100 text-green-700', icon: '🔴' },
  COMPLETED: { label: 'انتهت', color: 'bg-gray-100 text-gray-700', icon: '✅' },
  POSTPONED: { label: 'مؤجلة', color: 'bg-yellow-100 text-yellow-700', icon: '⏸️' },
  CANCELLED: { label: 'ملغاة', color: 'bg-red-100 text-red-700', icon: '❌' },
};

const Matches = () => {
  const [matches, setMatches] = useState([]);
  const [rounds, setRounds] = useState([]);
  const [leagues, setLeagues] = useState([]);
  const [selectedLeague, setSelectedLeague] = useState('');
  const [selectedRound, setSelectedRound] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeagues();
  }, []);

  useEffect(() => {
    if (selectedLeague) {
      fetchRounds();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedLeague]);

  useEffect(() => {
    fetchMatches();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedLeague, selectedRound]);

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

  // تجميع المباريات حسب الجولة
  const matchesByRound = matches.reduce((acc, match) => {
    const roundName = match.round?.name || 'بدون جولة';
    if (!acc[roundName]) {
      acc[roundName] = [];
    }
    acc[roundName].push(match);
    return acc;
  }, {});

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="card p-3 sm:p-6">
        <div className="flex flex-col gap-3 sm:gap-4">
          <div>
            <h1 className="text-lg sm:text-2xl font-bold">📅 المباريات</h1>
            <p className="text-sm text-gray-600">جدول مباريات البطولة</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
            <select
              value={selectedLeague}
              onChange={(e) => {
                setSelectedLeague(e.target.value);
                setSelectedRound('');
              }}
              className="input text-sm flex-1"
            >
              <option value="">كل الدوريات</option>
              {leagues.map((league) => (
                <option key={league.id} value={league.id}>
                  {league.name}
                </option>
              ))}
            </select>
            <select
              value={selectedRound}
              onChange={(e) => setSelectedRound(e.target.value)}
              className="input text-sm flex-1"
              disabled={!selectedLeague}
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
      </div>

      {/* Matches */}
      {loading ? (
        <div className="flex items-center justify-center min-h-[200px]">
          <div className="text-center">
            <div className="text-4xl animate-bounce mb-4">⚽</div>
            <p className="text-gray-600">جاري التحميل...</p>
          </div>
        </div>
      ) : matches.length > 0 ? (
        Object.entries(matchesByRound).map(([roundName, roundMatches]) => (
          <div key={roundName} className="card p-3 sm:p-6">
            <h2 className="font-bold text-base sm:text-lg mb-3 sm:mb-4 pb-2 border-b">{roundName}</h2>
            <div className="space-y-3 sm:space-y-4">
              {roundMatches.map((match) => (
                <MatchCard key={match.id} match={match} />
              ))}
            </div>
          </div>
        ))
      ) : (
        <div className="card text-center py-12">
          <div className="text-5xl mb-4">📭</div>
          <p className="text-gray-600">لا توجد مباريات</p>
        </div>
      )}
    </div>
  );
};

// مكون بطاقة المباراة
const MatchCard = ({ match }) => {
  const status = MATCH_STATUS[match.status] || MATCH_STATUS.SCHEDULED;
  const matchDate = new Date(match.matchDate);
  const isFinished = match.status === 'COMPLETED';

  return (
    <Link 
      to={`/match/${match.id}`}
      className="block bg-gray-50 hover:bg-gray-100 rounded-lg sm:rounded-xl p-3 sm:p-4 transition"
    >
      <div className="flex items-center justify-between mb-2 sm:mb-3">
        <span className={`text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 sm:py-1 rounded ${status.color}`}>
          {status.icon} {status.label}
        </span>
        <span className="text-[10px] sm:text-xs text-gray-500">
          {matchDate.toLocaleDateString('ar-SA')} - {matchDate.toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>

      <div className="flex items-center justify-between">
        {/* Home Team */}
        <div className="flex-1 text-center min-w-0">
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white rounded-full mx-auto flex items-center justify-center text-xl sm:text-2xl shadow">
            ⚽
          </div>
          <p className="font-medium mt-1 sm:mt-2 text-xs sm:text-sm truncate px-1">{match.homeTeam?.name}</p>
        </div>

        {/* Score */}
        <div className="flex-shrink-0 px-2 sm:px-6">
          {isFinished ? (
            <div className="text-center">
              <p className="text-xl sm:text-3xl font-bold">
                {match.homeScore} - {match.awayScore}
              </p>
              <p className="text-[9px] sm:text-xs text-gray-500">النتيجة</p>
            </div>
          ) : (
            <div className="text-center">
              <p className="text-xl sm:text-2xl font-bold text-gray-300">VS</p>
              <p className="text-[9px] sm:text-xs text-gray-500">لم تبدأ</p>
            </div>
          )}
        </div>

        {/* Away Team */}
        <div className="flex-1 text-center min-w-0">
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white rounded-full mx-auto flex items-center justify-center text-xl sm:text-2xl shadow">
            ⚽
          </div>
          <p className="font-medium mt-1 sm:mt-2 text-xs sm:text-sm truncate px-1">{match.awayTeam?.name}</p>
        </div>
      </div>

      {match.location && (
        <p className="text-center text-[10px] sm:text-xs text-gray-500 mt-2 sm:mt-3 truncate">
          📍 {match.location}
        </p>
      )}
    </Link>
  );
};

export default Matches;
