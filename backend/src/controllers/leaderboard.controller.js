/**
 * Leaderboard Controller
 * Handles rankings and statistics
 */

const prisma = require('../config/database');
const { formatResponse, paginate, paginationMeta } = require('../utils/helpers');

/**
 * Get league leaderboard
 * GET /api/leaderboard/:leagueId
 */
const getLeaderboard = async (req, res, next) => {
  try {
    const { leagueId } = req.params;
    const { page = 1, limit = 50 } = req.query;
    const { skip, take } = paginate(parseInt(page), parseInt(limit));

    const [fantasyTeams, total] = await Promise.all([
      prisma.fantasyTeam.findMany({
        where: { leagueId: parseInt(leagueId) },
        skip,
        take,
        include: {
          user: {
            select: { id: true, name: true }
          },
          _count: {
            select: { transfers: true }
          }
        },
        orderBy: { totalPoints: 'desc' }
      }),
      prisma.fantasyTeam.count({ where: { leagueId: parseInt(leagueId) } })
    ]);

    // Add rank
    const rankedTeams = fantasyTeams.map((team, index) => ({
      rank: skip + index + 1,
      ...team
    }));

    res.json(
      formatResponse('success', 'تم جلب الترتيب العام', {
        leaderboard: rankedTeams,
        pagination: paginationMeta(total, parseInt(page), parseInt(limit))
      })
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Get leaderboard for a specific round
 * GET /api/leaderboard/:leagueId/round/:roundId
 */
const getRoundLeaderboard = async (req, res, next) => {
  try {
    const { leagueId, roundId } = req.params;
    const { page = 1, limit = 50 } = req.query;
    const { skip, take } = paginate(parseInt(page), parseInt(limit));

    const [pointsHistory, total] = await Promise.all([
      prisma.pointsHistory.findMany({
        where: {
          roundId: parseInt(roundId),
          fantasyTeam: { leagueId: parseInt(leagueId) }
        },
        skip,
        take,
        include: {
          fantasyTeam: {
            include: {
              user: { select: { id: true, name: true } }
            }
          }
        },
        orderBy: { points: 'desc' }
      }),
      prisma.pointsHistory.count({
        where: {
          roundId: parseInt(roundId),
          fantasyTeam: { leagueId: parseInt(leagueId) }
        }
      })
    ]);

    // Format the leaderboard
    const leaderboard = pointsHistory.map((ph, index) => ({
      rank: skip + index + 1,
      fantasyTeamId: ph.fantasyTeamId,
      teamName: ph.fantasyTeam.name,
      userName: ph.fantasyTeam.user.name,
      roundPoints: ph.points,
      totalPoints: ph.fantasyTeam.totalPoints
    }));

    res.json(
      formatResponse('success', 'تم جلب ترتيب الجولة', {
        leaderboard,
        pagination: paginationMeta(total, parseInt(page), parseInt(limit))
      })
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Get user's position in leaderboard
 * GET /api/leaderboard/:leagueId/my-rank
 */
const getMyRank = async (req, res, next) => {
  try {
    const { leagueId } = req.params;

    const fantasyTeam = await prisma.fantasyTeam.findUnique({
      where: {
        userId_leagueId: {
          userId: req.user.id,
          leagueId: parseInt(leagueId)
        }
      }
    });

    if (!fantasyTeam) {
      return res.status(404).json(
        formatResponse('error', 'لم تقم بإنشاء فريق في هذا الدوري')
      );
    }

    // Count teams with more points
    const higherRanked = await prisma.fantasyTeam.count({
      where: {
        leagueId: parseInt(leagueId),
        totalPoints: { gt: fantasyTeam.totalPoints }
      }
    });

    const totalTeams = await prisma.fantasyTeam.count({
      where: { leagueId: parseInt(leagueId) }
    });

    // Get recent points history
    const recentHistory = await prisma.pointsHistory.findMany({
      where: { fantasyTeamId: fantasyTeam.id },
      include: {
        round: { select: { id: true, name: true, roundNumber: true } }
      },
      orderBy: { round: { roundNumber: 'desc' } },
      take: 5
    });

    res.json(formatResponse('success', 'تم جلب ترتيبك', {
      rank: higherRanked + 1,
      totalTeams,
      totalPoints: fantasyTeam.totalPoints,
      teamName: fantasyTeam.name,
      recentHistory
    }));
  } catch (error) {
    next(error);
  }
};

/**
 * Get league statistics
 * GET /api/leaderboard/:leagueId/stats
 */
const getLeagueStats = async (req, res, next) => {
  try {
    const { leagueId } = req.params;

    // Get various statistics
    const [
      totalTeams,
      totalTransfers,
      avgPoints,
      topScorer,
      mostTransferred
    ] = await Promise.all([
      // Total fantasy teams
      prisma.fantasyTeam.count({
        where: { leagueId: parseInt(leagueId) }
      }),
      
      // Total transfers
      prisma.transfer.count({
        where: {
          fantasyTeam: { leagueId: parseInt(leagueId) }
        }
      }),
      
      // Average points
      prisma.fantasyTeam.aggregate({
        where: { leagueId: parseInt(leagueId) },
        _avg: { totalPoints: true }
      }),
      
      // Top scoring player
      prisma.player.findMany({
        where: { leagueId: parseInt(leagueId) },
        include: {
          team: { select: { id: true, name: true, shortName: true } },
          matchStats: true
        }
      }),
      
      // Most transferred in player (count transfers in)
      prisma.transfer.groupBy({
        by: ['playerInId'],
        where: {
          fantasyTeam: { leagueId: parseInt(leagueId) }
        },
        _count: { playerInId: true },
        orderBy: { _count: { playerInId: 'desc' } },
        take: 5
      })
    ]);

    // Calculate top scorers
    const playersWithPoints = topScorer.map(p => ({
      id: p.id,
      name: p.name,
      position: p.position,
      team: p.team,
      totalPoints: p.matchStats.reduce((sum, s) => sum + s.points, 0),
      goals: p.matchStats.reduce((sum, s) => sum + s.goals, 0),
      assists: p.matchStats.reduce((sum, s) => sum + s.assists, 0)
    })).sort((a, b) => b.totalPoints - a.totalPoints).slice(0, 5);

    // Get details for most transferred players
    const mostTransferredPlayers = await Promise.all(
      mostTransferred.map(async (t) => {
        const player = await prisma.player.findUnique({
          where: { id: t.playerInId },
          include: {
            team: { select: { id: true, name: true, shortName: true } }
          }
        });
        return {
          player,
          transferCount: t._count.playerInId
        };
      })
    );

    res.json(formatResponse('success', 'تم جلب إحصائيات الدوري', {
      totalTeams,
      totalTransfers,
      averagePoints: avgPoints._avg.totalPoints?.toFixed(2) || 0,
      topScorers: playersWithPoints,
      mostTransferredPlayers
    }));
  } catch (error) {
    next(error);
  }
};

/**
 * Get head-to-head comparison
 * GET /api/leaderboard/h2h/:teamId1/:teamId2
 */
const getHeadToHead = async (req, res, next) => {
  try {
    const { teamId1, teamId2 } = req.params;

    const [team1, team2] = await Promise.all([
      prisma.fantasyTeam.findUnique({
        where: { id: parseInt(teamId1) },
        include: {
          user: { select: { id: true, name: true } },
          pointsHistory: {
            include: {
              round: { select: { id: true, name: true, roundNumber: true } }
            },
            orderBy: { round: { roundNumber: 'asc' } }
          }
        }
      }),
      prisma.fantasyTeam.findUnique({
        where: { id: parseInt(teamId2) },
        include: {
          user: { select: { id: true, name: true } },
          pointsHistory: {
            include: {
              round: { select: { id: true, name: true, roundNumber: true } }
            },
            orderBy: { round: { roundNumber: 'asc' } }
          }
        }
      })
    ]);

    if (!team1 || !team2) {
      return res.status(404).json(
        formatResponse('error', 'أحد الفريقين غير موجود')
      );
    }

    // Calculate wins per round
    let team1Wins = 0;
    let team2Wins = 0;
    let draws = 0;

    const roundComparison = team1.pointsHistory.map(ph1 => {
      const ph2 = team2.pointsHistory.find(p => p.roundId === ph1.roundId);
      if (ph2) {
        if (ph1.points > ph2.points) team1Wins++;
        else if (ph2.points > ph1.points) team2Wins++;
        else draws++;
        
        return {
          round: ph1.round,
          team1Points: ph1.points,
          team2Points: ph2.points,
          winner: ph1.points > ph2.points ? team1.name : 
                  ph2.points > ph1.points ? team2.name : 'تعادل'
        };
      }
      return null;
    }).filter(Boolean);

    res.json(formatResponse('success', 'تم جلب المقارنة', {
      team1: {
        id: team1.id,
        name: team1.name,
        userName: team1.user.name,
        totalPoints: team1.totalPoints
      },
      team2: {
        id: team2.id,
        name: team2.name,
        userName: team2.user.name,
        totalPoints: team2.totalPoints
      },
      summary: {
        team1Wins,
        team2Wins,
        draws
      },
      roundComparison
    }));
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getLeaderboard,
  getRoundLeaderboard,
  getMyRank,
  getLeagueStats,
  getHeadToHead
};
