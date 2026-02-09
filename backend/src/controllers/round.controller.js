/**
 * Round Controller
 * Handles round/gameweek management
 */

const prisma = require('../config/database');
const { formatResponse, paginate, paginationMeta } = require('../utils/helpers');

/**
 * Create round (Admin only)
 * POST /api/rounds
 */
const createRound = async (req, res, next) => {
  try {
    const { name, roundNumber, leagueId, startDate, endDate, lockTime } = req.body;

    // Check league ownership
    const league = await prisma.league.findUnique({
      where: { id: parseInt(leagueId) }
    });

    if (!league) {
      return res.status(404).json(
        formatResponse('error', 'الدوري غير موجود')
      );
    }

    if (league.createdById !== req.user.id && req.user.role !== 'ADMIN') {
      return res.status(403).json(
        formatResponse('error', 'غير مسموح بإضافة جولات لهذا الدوري')
      );
    }

    // Calculate lock time (2 hours before start if not provided)
    const calculatedLockTime = lockTime 
      ? new Date(lockTime)
      : new Date(new Date(startDate).getTime() - 2 * 60 * 60 * 1000);

    const round = await prisma.round.create({
      data: {
        name,
        roundNumber: parseInt(roundNumber),
        leagueId: parseInt(leagueId),
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        lockTime: calculatedLockTime
      }
    });

    res.status(201).json(
      formatResponse('success', 'تم إنشاء الجولة بنجاح', round)
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Get rounds by league
 * GET /api/rounds
 */
const getRounds = async (req, res, next) => {
  try {
    const { leagueId, page = 1, limit = 20 } = req.query;
    const { skip, take } = paginate(parseInt(page), parseInt(limit));

    if (!leagueId) {
      return res.status(400).json(
        formatResponse('error', 'معرف الدوري مطلوب')
      );
    }

    const [rounds, total] = await Promise.all([
      prisma.round.findMany({
        where: { leagueId: parseInt(leagueId) },
        skip,
        take,
        include: {
          _count: {
            select: { matches: true }
          }
        },
        orderBy: { roundNumber: 'asc' }
      }),
      prisma.round.count({ where: { leagueId: parseInt(leagueId) } })
    ]);

    res.json(
      formatResponse('success', 'تم جلب الجولات بنجاح', {
        rounds,
        pagination: paginationMeta(total, parseInt(page), parseInt(limit))
      })
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Get round by ID with matches
 * GET /api/rounds/:id
 */
const getRound = async (req, res, next) => {
  try {
    const { id } = req.params;

    const round = await prisma.round.findUnique({
      where: { id: parseInt(id) },
      include: {
        matches: {
          include: {
            homeTeam: { select: { id: true, name: true, shortName: true } },
            awayTeam: { select: { id: true, name: true, shortName: true } }
          },
          orderBy: { matchDate: 'asc' }
        },
        league: {
          select: { id: true, name: true }
        }
      }
    });

    if (!round) {
      return res.status(404).json(
        formatResponse('error', 'الجولة غير موجودة')
      );
    }

    // Check if transfers are locked
    const isLocked = round.lockTime && new Date() >= new Date(round.lockTime);

    res.json(formatResponse('success', 'تم جلب بيانات الجولة', {
      ...round,
      isLocked
    }));
  } catch (error) {
    next(error);
  }
};

/**
 * Update round (Admin only)
 * PUT /api/rounds/:id
 */
const updateRound = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, startDate, endDate, lockTime, transfersOpen, isCompleted } = req.body;

    const round = await prisma.round.findUnique({
      where: { id: parseInt(id) },
      include: { league: true }
    });

    if (!round) {
      return res.status(404).json(
        formatResponse('error', 'الجولة غير موجودة')
      );
    }

    if (round.league.createdById !== req.user.id && req.user.role !== 'ADMIN') {
      return res.status(403).json(
        formatResponse('error', 'غير مسموح بتعديل هذه الجولة')
      );
    }

    const updateData = {};
    if (name) updateData.name = name;
    if (startDate) updateData.startDate = new Date(startDate);
    if (endDate) updateData.endDate = new Date(endDate);
    if (lockTime) updateData.lockTime = new Date(lockTime);
    if (typeof transfersOpen === 'boolean') updateData.transfersOpen = transfersOpen;
    if (typeof isCompleted === 'boolean') updateData.isCompleted = isCompleted;

    const updatedRound = await prisma.round.update({
      where: { id: parseInt(id) },
      data: updateData
    });

    res.json(formatResponse('success', 'تم تحديث الجولة بنجاح', updatedRound));
  } catch (error) {
    next(error);
  }
};

/**
 * Toggle transfers for a round (Admin only)
 * PUT /api/rounds/:id/transfers
 */
const toggleTransfers = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { transfersOpen } = req.body;

    const round = await prisma.round.findUnique({
      where: { id: parseInt(id) },
      include: { league: true }
    });

    if (!round) {
      return res.status(404).json(
        formatResponse('error', 'الجولة غير موجودة')
      );
    }

    if (round.league.createdById !== req.user.id && req.user.role !== 'ADMIN') {
      return res.status(403).json(
        formatResponse('error', 'غير مسموح بتعديل هذه الجولة')
      );
    }

    const updatedRound = await prisma.round.update({
      where: { id: parseInt(id) },
      data: { transfersOpen }
    });

    const message = transfersOpen 
      ? 'تم فتح الانتقالات للجولة' 
      : 'تم إغلاق الانتقالات للجولة';

    res.json(formatResponse('success', message, updatedRound));
  } catch (error) {
    next(error);
  }
};

/**
 * Complete round and calculate points (Admin only)
 * PUT /api/rounds/:id/complete
 */
const completeRound = async (req, res, next) => {
  try {
    const { id } = req.params;

    const round = await prisma.round.findUnique({
      where: { id: parseInt(id) },
      include: { league: true }
    });

    if (!round) {
      return res.status(404).json(
        formatResponse('error', 'الجولة غير موجودة')
      );
    }

    if (round.league.createdById !== req.user.id && req.user.role !== 'ADMIN') {
      return res.status(403).json(
        formatResponse('error', 'غير مسموح بإتمام هذه الجولة')
      );
    }

    // Get all fantasy teams in the league
    const fantasyTeams = await prisma.fantasyTeam.findMany({
      where: { leagueId: round.leagueId },
      include: {
        players: {
          where: { isStarter: true },
          include: {
            player: {
              include: {
                matchStats: {
                  where: {
                    match: { roundId: parseInt(id) }
                  }
                }
              }
            }
          }
        }
      }
    });

    // Calculate points for each fantasy team
    const pointsData = [];
    for (const team of fantasyTeams) {
      let roundPoints = 0;
      
      for (const fp of team.players) {
        const stats = fp.player.matchStats;
        if (stats.length > 0) {
          roundPoints += stats.reduce((sum, s) => sum + s.points, 0);
        }
      }

      // Save points history
      await prisma.pointsHistory.upsert({
        where: {
          fantasyTeamId_roundId: {
            fantasyTeamId: team.id,
            roundId: parseInt(id)
          }
        },
        update: { points: roundPoints },
        create: {
          fantasyTeamId: team.id,
          roundId: parseInt(id),
          points: roundPoints
        }
      });

      // Update total points
      await prisma.fantasyTeam.update({
        where: { id: team.id },
        data: {
          totalPoints: { increment: roundPoints }
        }
      });

      pointsData.push({
        teamId: team.id,
        teamName: team.name,
        roundPoints
      });
    }

    // Sort by points and assign ranks
    pointsData.sort((a, b) => b.roundPoints - a.roundPoints);
    for (let i = 0; i < pointsData.length; i++) {
      await prisma.pointsHistory.update({
        where: {
          fantasyTeamId_roundId: {
            fantasyTeamId: pointsData[i].teamId,
            roundId: parseInt(id)
          }
        },
        data: { rank: i + 1 }
      });
    }

    // Mark round as completed
    const updatedRound = await prisma.round.update({
      where: { id: parseInt(id) },
      data: { 
        isCompleted: true,
        transfersOpen: true // Open transfers after round completion
      }
    });

    res.json(formatResponse('success', 'تم إتمام الجولة وحساب النقاط', {
      round: updatedRound,
      pointsSummary: pointsData
    }));
  } catch (error) {
    next(error);
  }
};

/**
 * Delete round (Admin only)
 * DELETE /api/rounds/:id
 */
const deleteRound = async (req, res, next) => {
  try {
    const { id } = req.params;

    const round = await prisma.round.findUnique({
      where: { id: parseInt(id) },
      include: { league: true }
    });

    if (!round) {
      return res.status(404).json(
        formatResponse('error', 'الجولة غير موجودة')
      );
    }

    if (round.league.createdById !== req.user.id && req.user.role !== 'ADMIN') {
      return res.status(403).json(
        formatResponse('error', 'غير مسموح بحذف هذه الجولة')
      );
    }

    await prisma.round.delete({
      where: { id: parseInt(id) }
    });

    res.json(formatResponse('success', 'تم حذف الجولة بنجاح'));
  } catch (error) {
    next(error);
  }
};

/**
 * Get current active round for a league
 * GET /api/rounds/current/:leagueId
 */
const getCurrentRound = async (req, res, next) => {
  try {
    const { leagueId } = req.params;

    const now = new Date();

    // Find round that is currently active (between start and end date)
    let round = await prisma.round.findFirst({
      where: {
        leagueId: parseInt(leagueId),
        startDate: { lte: now },
        endDate: { gte: now }
      },
      include: {
        matches: {
          include: {
            homeTeam: { select: { id: true, name: true, shortName: true } },
            awayTeam: { select: { id: true, name: true, shortName: true } }
          },
          orderBy: { matchDate: 'asc' }
        }
      }
    });

    // If no active round, get the next upcoming one
    if (!round) {
      round = await prisma.round.findFirst({
        where: {
          leagueId: parseInt(leagueId),
          startDate: { gt: now }
        },
        include: {
          matches: {
            include: {
              homeTeam: { select: { id: true, name: true, shortName: true } },
              awayTeam: { select: { id: true, name: true, shortName: true } }
            },
            orderBy: { matchDate: 'asc' }
          }
        },
        orderBy: { startDate: 'asc' }
      });
    }

    if (!round) {
      return res.status(404).json(
        formatResponse('error', 'لا توجد جولات متاحة')
      );
    }

    // Check if transfers are locked
    const isLocked = round.lockTime && now >= new Date(round.lockTime);

    res.json(formatResponse('success', 'تم جلب الجولة الحالية', {
      ...round,
      isLocked
    }));
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createRound,
  getRounds,
  getRound,
  updateRound,
  toggleTransfers,
  completeRound,
  deleteRound,
  getCurrentRound
};
