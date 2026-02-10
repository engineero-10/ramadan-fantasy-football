/**
 * League Controller
 * Handles league management (Admin) and joining (User)
 */

const prisma = require('../config/database');
const { formatResponse, generateLeagueCode, paginate, paginationMeta } = require('../utils/helpers');

/**
 * Create new league (Admin only)
 * POST /api/leagues
 */
const createLeague = async (req, res, next) => {
  try {
    const {
      name,
      description,
      maxTeams,
      playersPerTeam,
      startingPlayers,
      substitutes,
      maxPlayersPerRealTeam,
      budget,
      maxTransfersPerRound
    } = req.body;

    // Validate starting + substitutes = playersPerTeam
    const total = (startingPlayers || 8) + (substitutes || 4);
    if (playersPerTeam && total !== playersPerTeam) {
      return res.status(400).json(
        formatResponse('error', 'مجموع اللاعبين الأساسيين والبدلاء يجب أن يساوي العدد الكلي للاعبين')
      );
    }

    // Generate unique code
    let code = generateLeagueCode();
    let codeExists = await prisma.league.findUnique({ where: { code } });
    while (codeExists) {
      code = generateLeagueCode();
      codeExists = await prisma.league.findUnique({ where: { code } });
    }

    const league = await prisma.league.create({
      data: {
        name,
        description,
        code,
        maxTeams: maxTeams || 10,
        playersPerTeam: playersPerTeam || 12,
        startingPlayers: startingPlayers || 8,
        substitutes: substitutes || 4,
        maxPlayersPerRealTeam: maxPlayersPerRealTeam || 2,
        budget: budget || 100,
        maxTransfersPerRound: maxTransfersPerRound || 2,
        createdById: req.user.id
      },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    // Auto-join creator as member
    await prisma.leagueMember.create({
      data: {
        userId: req.user.id,
        leagueId: league.id
      }
    });

    res.status(201).json(
      formatResponse('success', 'تم إنشاء الدوري بنجاح', { league })
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Get all leagues (with filters)
 * GET /api/leagues
 */
const getLeagues = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, myLeagues } = req.query;
    const { skip, take } = paginate(parseInt(page), parseInt(limit));

    let where = {};
    
    // Filter for user's leagues
    if (myLeagues === 'true' && req.user) {
      where = {
        OR: [
          { createdById: req.user.id },
          { members: { some: { userId: req.user.id } } }
        ]
      };
    }

    const [leagues, total] = await Promise.all([
      prisma.league.findMany({
        where,
        skip,
        take,
        include: {
          createdBy: {
            select: {
              id: true,
              name: true
            }
          },
          _count: {
            select: {
              members: true,
              teams: true,
              rounds: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.league.count({ where })
    ]);

    res.json(
      formatResponse('success', 'تم جلب الدوريات بنجاح', {
        leagues,
        pagination: paginationMeta(total, parseInt(page), parseInt(limit))
      })
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Get league by ID
 * GET /api/leagues/:id
 */
const getLeague = async (req, res, next) => {
  try {
    const { id } = req.params;

    const league = await prisma.league.findUnique({
      where: { id: parseInt(id) },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        teams: {
          select: {
            id: true,
            name: true,
            shortName: true,
            _count: { select: { players: true } }
          }
        },
        rounds: {
          orderBy: { roundNumber: 'asc' },
          select: {
            id: true,
            name: true,
            roundNumber: true,
            startDate: true,
            endDate: true,
            transfersOpen: true,
            isCompleted: true
          }
        },
        _count: {
          select: {
            members: true,
            players: true,
            fantasyTeams: true
          }
        }
      }
    });

    if (!league) {
      return res.status(404).json(
        formatResponse('error', 'الدوري غير موجود')
      );
    }

    res.json(formatResponse('success', 'تم جلب بيانات الدوري', league));
  } catch (error) {
    next(error);
  }
};

/**
 * Update league (Admin only)
 * PUT /api/leagues/:id
 */
const updateLeague = async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      name,
      description,
      maxTeams,
      playersPerTeam,
      startingPlayers,
      substitutes,
      maxPlayersPerRealTeam,
      budget,
      maxTransfersPerRound,
      isActive
    } = req.body;

    // Check ownership
    const existing = await prisma.league.findUnique({
      where: { id: parseInt(id) }
    });

    if (!existing) {
      return res.status(404).json(
        formatResponse('error', 'الدوري غير موجود')
      );
    }

    if (existing.createdById !== req.user.id && req.user.role !== 'ADMIN') {
      return res.status(403).json(
        formatResponse('error', 'غير مسموح بتعديل هذا الدوري')
      );
    }

    const league = await prisma.league.update({
      where: { id: parseInt(id) },
      data: {
        name,
        description,
        maxTeams,
        playersPerTeam,
        startingPlayers,
        substitutes,
        maxPlayersPerRealTeam,
        budget,
        maxTransfersPerRound,
        isActive
      }
    });

    res.json(formatResponse('success', 'تم تحديث الدوري بنجاح', { league }));
  } catch (error) {
    next(error);
  }
};

/**
 * Delete league (Admin only)
 * DELETE /api/leagues/:id
 */
const deleteLeague = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Check ownership
    const existing = await prisma.league.findUnique({
      where: { id: parseInt(id) }
    });

    if (!existing) {
      return res.status(404).json(
        formatResponse('error', 'الدوري غير موجود')
      );
    }

    if (existing.createdById !== req.user.id && req.user.role !== 'ADMIN') {
      return res.status(403).json(
        formatResponse('error', 'غير مسموح بحذف هذا الدوري')
      );
    }

    await prisma.league.delete({
      where: { id: parseInt(id) }
    });

    res.json(formatResponse('success', 'تم حذف الدوري بنجاح'));
  } catch (error) {
    next(error);
  }
};

/**
 * Join league with code (User)
 * POST /api/leagues/join
 */
const joinLeague = async (req, res, next) => {
  try {
    const { code } = req.body;

    const league = await prisma.league.findUnique({
      where: { code: code.toUpperCase() },
      include: {
        _count: { select: { members: true } }
      }
    });

    if (!league) {
      return res.status(404).json(
        formatResponse('error', 'رمز الدوري غير صحيح')
      );
    }

    if (!league.isActive) {
      return res.status(400).json(
        formatResponse('error', 'هذا الدوري غير نشط')
      );
    }

    // Check if already member
    const existingMember = await prisma.leagueMember.findUnique({
      where: {
        userId_leagueId: {
          userId: req.user.id,
          leagueId: league.id
        }
      }
    });

    if (existingMember) {
      return res.status(400).json(
        formatResponse('error', 'أنت بالفعل عضو في هذا الدوري')
      );
    }

    // Check max teams
    if (league._count.members >= league.maxTeams) {
      return res.status(400).json(
        formatResponse('error', 'الدوري وصل للحد الأقصى من الأعضاء')
      );
    }

    // Join league
    await prisma.leagueMember.create({
      data: {
        userId: req.user.id,
        leagueId: league.id
      }
    });

    res.json(formatResponse('success', 'تم الانضمام للدوري بنجاح', {
      leagueId: league.id,
      leagueName: league.name
    }));
  } catch (error) {
    next(error);
  }
};

/**
 * Get league members
 * GET /api/leagues/:id/members
 */
const getLeagueMembers = async (req, res, next) => {
  try {
    const { id } = req.params;

    const members = await prisma.leagueMember.findMany({
      where: { leagueId: parseInt(id) },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
      orderBy: { joinedAt: 'asc' }
    });

    res.json(formatResponse('success', 'تم جلب أعضاء الدوري', members));
  } catch (error) {
    next(error);
  }
};

/**
 * Get league by code
 * GET /api/leagues/code/:code
 */
const getLeagueByCode = async (req, res, next) => {
  try {
    const { code } = req.params;

    const league = await prisma.league.findUnique({
      where: { code: code.toUpperCase() },
      select: {
        id: true,
        name: true,
        description: true,
        isActive: true,
        _count: {
          select: { members: true }
        }
      }
    });

    if (!league) {
      return res.status(404).json(
        formatResponse('error', 'الدوري غير موجود')
      );
    }

    res.json(formatResponse('success', 'تم جلب بيانات الدوري', league));
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createLeague,
  getLeagues,
  getLeague,
  updateLeague,
  deleteLeague,
  joinLeague,
  getLeagueMembers,
  getLeagueByCode
};
