/**
 * Player Controller
 * Handles player management
 */

const prisma = require('../config/database');
const { formatResponse, paginate, paginationMeta } = require('../utils/helpers');

/**
 * Create player (Admin only)
 * POST /api/players
 */
const createPlayer = async (req, res, next) => {
  try {
    const { name, position, price, teamId, leagueId } = req.body;

    // Check ownership
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
        formatResponse('error', 'غير مسموح بإضافة لاعبين لهذا الدوري')
      );
    }

    // Check team belongs to league
    const team = await prisma.team.findFirst({
      where: {
        id: parseInt(teamId),
        leagueId: parseInt(leagueId)
      }
    });

    if (!team) {
      return res.status(400).json(
        formatResponse('error', 'الفريق غير موجود في هذا الدوري')
      );
    }

    const player = await prisma.player.create({
      data: {
        name,
        position,
        price: parseFloat(price),
        teamId: parseInt(teamId),
        leagueId: parseInt(leagueId)
      },
      include: {
        team: {
          select: {
            id: true,
            name: true,
            shortName: true
          }
        }
      }
    });

    res.status(201).json(
      formatResponse('success', 'تم إنشاء اللاعب بنجاح', player)
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Get players with filters
 * GET /api/players
 */
const getPlayers = async (req, res, next) => {
  try {
    const { 
      leagueId, 
      teamId, 
      position, 
      minPrice, 
      maxPrice,
      search,
      page = 1, 
      limit = 20 
    } = req.query;

    if (!leagueId) {
      return res.status(400).json(
        formatResponse('error', 'معرف الدوري مطلوب')
      );
    }

    const { skip, take } = paginate(parseInt(page), parseInt(limit));

    // Build where clause
    const where = {
      leagueId: parseInt(leagueId),
      isActive: true
    };

    if (teamId) {
      where.teamId = parseInt(teamId);
    }

    if (position) {
      where.position = position;
    }

    if (minPrice || maxPrice) {
      where.price = {};
      if (minPrice) where.price.gte = parseFloat(minPrice);
      if (maxPrice) where.price.lte = parseFloat(maxPrice);
    }

    if (search) {
      where.name = {
        contains: search
      };
    }

    const [players, total] = await Promise.all([
      prisma.player.findMany({
        where,
        skip,
        take,
        include: {
          team: {
            select: {
              id: true,
              name: true,
              shortName: true
            }
          }
        },
        orderBy: [
          { position: 'asc' },
          { price: 'desc' }
        ]
      }),
      prisma.player.count({ where })
    ]);

    res.json(
      formatResponse('success', 'تم جلب اللاعبين بنجاح', {
        players,
        pagination: paginationMeta(total, parseInt(page), parseInt(limit))
      })
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Get player by ID with stats
 * GET /api/players/:id
 */
const getPlayer = async (req, res, next) => {
  try {
    const { id } = req.params;

    const player = await prisma.player.findUnique({
      where: { id: parseInt(id) },
      include: {
        team: {
          select: {
            id: true,
            name: true,
            shortName: true
          }
        },
        league: {
          select: {
            id: true,
            name: true
          }
        },
        matchStats: {
          include: {
            match: {
              include: {
                round: {
                  select: {
                    id: true,
                    name: true,
                    roundNumber: true
                  }
                },
                homeTeam: { select: { id: true, name: true } },
                awayTeam: { select: { id: true, name: true } }
              }
            }
          },
          orderBy: { match: { matchDate: 'desc' } },
          take: 10
        }
      }
    });

    if (!player) {
      return res.status(404).json(
        formatResponse('error', 'اللاعب غير موجود')
      );
    }

    // Calculate total stats
    const totalStats = player.matchStats.reduce((acc, stat) => ({
      totalPoints: acc.totalPoints + stat.points,
      goals: acc.goals + stat.goals,
      assists: acc.assists + stat.assists,
      yellowCards: acc.yellowCards + stat.yellowCards,
      redCards: acc.redCards + stat.redCards,
      cleanSheets: acc.cleanSheets + (stat.cleanSheet ? 1 : 0),
      penaltySaves: acc.penaltySaves + stat.penaltySaves,
      matchesPlayed: acc.matchesPlayed + (stat.minutesPlayed > 0 ? 1 : 0)
    }), {
      totalPoints: 0,
      goals: 0,
      assists: 0,
      yellowCards: 0,
      redCards: 0,
      cleanSheets: 0,
      penaltySaves: 0,
      matchesPlayed: 0
    });

    res.json(formatResponse('success', 'تم جلب بيانات اللاعب', {
      ...player,
      totalStats
    }));
  } catch (error) {
    next(error);
  }
};

/**
 * Update player (Admin only)
 * PUT /api/players/:id
 */
const updatePlayer = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, position, price, teamId, isActive } = req.body;

    const player = await prisma.player.findUnique({
      where: { id: parseInt(id) },
      include: { league: true }
    });

    if (!player) {
      return res.status(404).json(
        formatResponse('error', 'اللاعب غير موجود')
      );
    }

    if (player.league.createdById !== req.user.id && req.user.role !== 'ADMIN') {
      return res.status(403).json(
        formatResponse('error', 'غير مسموح بتعديل هذا اللاعب')
      );
    }

    const updateData = {};
    if (name) updateData.name = name;
    if (position) updateData.position = position;
    if (price) updateData.price = parseFloat(price);
    if (teamId) updateData.teamId = parseInt(teamId);
    if (typeof isActive === 'boolean') updateData.isActive = isActive;

    const updatedPlayer = await prisma.player.update({
      where: { id: parseInt(id) },
      data: updateData,
      include: {
        team: {
          select: { id: true, name: true, shortName: true }
        }
      }
    });

    res.json(formatResponse('success', 'تم تحديث اللاعب بنجاح', updatedPlayer));
  } catch (error) {
    next(error);
  }
};

/**
 * Delete player (Admin only)
 * DELETE /api/players/:id
 */
const deletePlayer = async (req, res, next) => {
  try {
    const { id } = req.params;

    const player = await prisma.player.findUnique({
      where: { id: parseInt(id) },
      include: { league: true }
    });

    if (!player) {
      return res.status(404).json(
        formatResponse('error', 'اللاعب غير موجود')
      );
    }

    if (player.league.createdById !== req.user.id && req.user.role !== 'ADMIN') {
      return res.status(403).json(
        formatResponse('error', 'غير مسموح بحذف هذا اللاعب')
      );
    }

    await prisma.player.delete({
      where: { id: parseInt(id) }
    });

    res.json(formatResponse('success', 'تم حذف اللاعب بنجاح'));
  } catch (error) {
    next(error);
  }
};

/**
 * Get top players in league
 * GET /api/players/top/:leagueId
 */
const getTopPlayers = async (req, res, next) => {
  try {
    const { leagueId } = req.params;
    const { limit = 10 } = req.query;

    const players = await prisma.player.findMany({
      where: { leagueId: parseInt(leagueId), isActive: true },
      include: {
        team: {
          select: { id: true, name: true, shortName: true }
        },
        matchStats: true
      }
    });

    // Calculate total points for each player
    const playersWithPoints = players.map(player => {
      const totalPoints = player.matchStats.reduce((sum, stat) => sum + stat.points, 0);
      return {
        id: player.id,
        name: player.name,
        position: player.position,
        price: player.price,
        team: player.team,
        totalPoints,
        matchesPlayed: player.matchStats.filter(s => s.minutesPlayed > 0).length
      };
    });

    // Sort by points
    playersWithPoints.sort((a, b) => b.totalPoints - a.totalPoints);

    res.json(
      formatResponse('success', 'تم جلب أفضل اللاعبين', 
        playersWithPoints.slice(0, parseInt(limit))
      )
    );
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createPlayer,
  getPlayers,
  getPlayer,
  updatePlayer,
  deletePlayer,
  getTopPlayers
};
