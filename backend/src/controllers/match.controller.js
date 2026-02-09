/**
 * Match Controller
 * Handles match management and results
 */

const prisma = require('../config/database');
const { formatResponse, paginate, paginationMeta } = require('../utils/helpers');
const { calculatePlayerPoints } = require('../config/points');

/**
 * Create match (Admin only)
 * POST /api/matches
 */
const createMatch = async (req, res, next) => {
  try {
    const { homeTeamId, awayTeamId, roundId, matchDate } = req.body;

    // Get round and check ownership
    const round = await prisma.round.findUnique({
      where: { id: parseInt(roundId) },
      include: { league: true }
    });

    if (!round) {
      return res.status(404).json(
        formatResponse('error', 'الجولة غير موجودة')
      );
    }

    if (round.league.createdById !== req.user.id && req.user.role !== 'ADMIN') {
      return res.status(403).json(
        formatResponse('error', 'غير مسموح بإضافة مباريات لهذه الجولة')
      );
    }

    // Validate teams belong to same league
    const [homeTeam, awayTeam] = await Promise.all([
      prisma.team.findFirst({
        where: { id: parseInt(homeTeamId), leagueId: round.leagueId }
      }),
      prisma.team.findFirst({
        where: { id: parseInt(awayTeamId), leagueId: round.leagueId }
      })
    ]);

    if (!homeTeam || !awayTeam) {
      return res.status(400).json(
        formatResponse('error', 'أحد الفريقين غير موجود في هذا الدوري')
      );
    }

    if (homeTeamId === awayTeamId) {
      return res.status(400).json(
        formatResponse('error', 'لا يمكن للفريق أن يلعب ضد نفسه')
      );
    }

    const match = await prisma.match.create({
      data: {
        homeTeamId: parseInt(homeTeamId),
        awayTeamId: parseInt(awayTeamId),
        roundId: parseInt(roundId),
        matchDate: new Date(matchDate)
      },
      include: {
        homeTeam: { select: { id: true, name: true, shortName: true } },
        awayTeam: { select: { id: true, name: true, shortName: true } },
        round: { select: { id: true, name: true, roundNumber: true } }
      }
    });

    res.status(201).json(
      formatResponse('success', 'تم إنشاء المباراة بنجاح', match)
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Get matches with filters
 * GET /api/matches
 */
const getMatches = async (req, res, next) => {
  try {
    const { leagueId, roundId, teamId, status, page = 1, limit = 20 } = req.query;
    const { skip, take } = paginate(parseInt(page), parseInt(limit));

    const where = {};

    if (roundId) {
      where.roundId = parseInt(roundId);
    } else if (leagueId) {
      where.round = { leagueId: parseInt(leagueId) };
    }

    if (teamId) {
      where.OR = [
        { homeTeamId: parseInt(teamId) },
        { awayTeamId: parseInt(teamId) }
      ];
    }

    if (status) {
      where.status = status;
    }

    const [matches, total] = await Promise.all([
      prisma.match.findMany({
        where,
        skip,
        take,
        include: {
          homeTeam: { select: { id: true, name: true, shortName: true } },
          awayTeam: { select: { id: true, name: true, shortName: true } },
          round: { select: { id: true, name: true, roundNumber: true } }
        },
        orderBy: { matchDate: 'asc' }
      }),
      prisma.match.count({ where })
    ]);

    res.json(
      formatResponse('success', 'تم جلب المباريات بنجاح', {
        matches,
        pagination: paginationMeta(total, parseInt(page), parseInt(limit))
      })
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Get match by ID with stats
 * GET /api/matches/:id
 */
const getMatch = async (req, res, next) => {
  try {
    const { id } = req.params;

    const match = await prisma.match.findUnique({
      where: { id: parseInt(id) },
      include: {
        homeTeam: {
          select: { id: true, name: true, shortName: true, logo: true }
        },
        awayTeam: {
          select: { id: true, name: true, shortName: true, logo: true }
        },
        round: {
          select: { id: true, name: true, roundNumber: true }
        },
        matchStats: {
          include: {
            player: {
              select: {
                id: true,
                name: true,
                position: true,
                teamId: true
              }
            }
          },
          orderBy: { points: 'desc' }
        }
      }
    });

    if (!match) {
      return res.status(404).json(
        formatResponse('error', 'المباراة غير موجودة')
      );
    }

    // Group stats by team
    const homeStats = match.matchStats.filter(s => s.player.teamId === match.homeTeamId);
    const awayStats = match.matchStats.filter(s => s.player.teamId === match.awayTeamId);

    res.json(formatResponse('success', 'تم جلب بيانات المباراة', {
      ...match,
      homeTeamStats: homeStats,
      awayTeamStats: awayStats
    }));
  } catch (error) {
    next(error);
  }
};

/**
 * Update match result (Admin only)
 * PUT /api/matches/:id/result
 */
const updateMatchResult = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { homeScore, awayScore, status } = req.body;

    const match = await prisma.match.findUnique({
      where: { id: parseInt(id) },
      include: { round: { include: { league: true } } }
    });

    if (!match) {
      return res.status(404).json(
        formatResponse('error', 'المباراة غير موجودة')
      );
    }

    if (match.round.league.createdById !== req.user.id && req.user.role !== 'ADMIN') {
      return res.status(403).json(
        formatResponse('error', 'غير مسموح بتعديل نتيجة هذه المباراة')
      );
    }

    const updatedMatch = await prisma.match.update({
      where: { id: parseInt(id) },
      data: {
        homeScore: parseInt(homeScore),
        awayScore: parseInt(awayScore),
        status: status || 'COMPLETED'
      },
      include: {
        homeTeam: { select: { id: true, name: true } },
        awayTeam: { select: { id: true, name: true } }
      }
    });

    res.json(formatResponse('success', 'تم تحديث نتيجة المباراة', updatedMatch));
  } catch (error) {
    next(error);
  }
};

/**
 * Update player stats for a match (Admin only)
 * PUT /api/matches/:id/stats
 */
const updateMatchStats = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { stats } = req.body;

    const match = await prisma.match.findUnique({
      where: { id: parseInt(id) },
      include: { 
        round: { include: { league: true } },
        homeTeam: true,
        awayTeam: true
      }
    });

    if (!match) {
      return res.status(404).json(
        formatResponse('error', 'المباراة غير موجودة')
      );
    }

    if (match.round.league.createdById !== req.user.id && req.user.role !== 'ADMIN') {
      return res.status(403).json(
        formatResponse('error', 'غير مسموح بتعديل إحصائيات هذه المباراة')
      );
    }

    // Process each player's stats
    const processedStats = [];
    for (const stat of stats) {
      // Get player position
      const player = await prisma.player.findUnique({
        where: { id: parseInt(stat.playerId) }
      });

      if (!player) continue;

      // Determine if clean sheet applies
      const isHomeTeam = player.teamId === match.homeTeamId;
      const cleanSheet = stat.cleanSheet || 
        (stat.minutesPlayed > 0 && 
         ((isHomeTeam && match.awayScore === 0) || 
          (!isHomeTeam && match.homeScore === 0)));

      // Calculate points
      const points = calculatePlayerPoints({
        minutesPlayed: stat.minutesPlayed || 0,
        goals: stat.goals || 0,
        assists: stat.assists || 0,
        yellowCards: stat.yellowCards || 0,
        redCards: stat.redCards || 0,
        cleanSheet,
        penaltySaves: stat.penaltySaves || 0
      }, player.position);

      // Upsert stat
      const matchStat = await prisma.matchStat.upsert({
        where: {
          playerId_matchId: {
            playerId: parseInt(stat.playerId),
            matchId: parseInt(id)
          }
        },
        update: {
          minutesPlayed: stat.minutesPlayed || 0,
          goals: stat.goals || 0,
          assists: stat.assists || 0,
          yellowCards: stat.yellowCards || 0,
          redCards: stat.redCards || 0,
          cleanSheet,
          penaltySaves: stat.penaltySaves || 0,
          points
        },
        create: {
          playerId: parseInt(stat.playerId),
          matchId: parseInt(id),
          minutesPlayed: stat.minutesPlayed || 0,
          goals: stat.goals || 0,
          assists: stat.assists || 0,
          yellowCards: stat.yellowCards || 0,
          redCards: stat.redCards || 0,
          cleanSheet,
          penaltySaves: stat.penaltySaves || 0,
          points
        }
      });

      processedStats.push(matchStat);
    }

    res.json(formatResponse('success', 'تم تحديث إحصائيات المباراة', processedStats));
  } catch (error) {
    next(error);
  }
};

/**
 * Delete match (Admin only)
 * DELETE /api/matches/:id
 */
const deleteMatch = async (req, res, next) => {
  try {
    const { id } = req.params;

    const match = await prisma.match.findUnique({
      where: { id: parseInt(id) },
      include: { round: { include: { league: true } } }
    });

    if (!match) {
      return res.status(404).json(
        formatResponse('error', 'المباراة غير موجودة')
      );
    }

    if (match.round.league.createdById !== req.user.id && req.user.role !== 'ADMIN') {
      return res.status(403).json(
        formatResponse('error', 'غير مسموح بحذف هذه المباراة')
      );
    }

    await prisma.match.delete({
      where: { id: parseInt(id) }
    });

    res.json(formatResponse('success', 'تم حذف المباراة بنجاح'));
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createMatch,
  getMatches,
  getMatch,
  updateMatchResult,
  updateMatchStats,
  deleteMatch
};
