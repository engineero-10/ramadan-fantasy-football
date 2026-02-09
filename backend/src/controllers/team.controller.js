/**
 * Team Controller
 * Handles real team management
 */

const prisma = require('../config/database');
const { formatResponse, paginate, paginationMeta } = require('../utils/helpers');

/**
 * Create team (Admin only)
 * POST /api/teams
 */
const createTeam = async (req, res, next) => {
  try {
    const { name, shortName, logo, leagueId } = req.body;

    // Check if league exists and user owns it
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
        formatResponse('error', 'غير مسموح بإضافة فرق لهذا الدوري')
      );
    }

    const team = await prisma.team.create({
      data: {
        name,
        shortName,
        logo,
        leagueId: parseInt(leagueId)
      }
    });

    res.status(201).json(
      formatResponse('success', 'تم إنشاء الفريق بنجاح', team)
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Get teams by league
 * GET /api/teams
 */
const getTeams = async (req, res, next) => {
  try {
    const { leagueId, page = 1, limit = 20 } = req.query;
    const { skip, take } = paginate(parseInt(page), parseInt(limit));

    if (!leagueId) {
      return res.status(400).json(
        formatResponse('error', 'معرف الدوري مطلوب')
      );
    }

    const [teams, total] = await Promise.all([
      prisma.team.findMany({
        where: { leagueId: parseInt(leagueId) },
        skip,
        take,
        include: {
          _count: {
            select: { players: true }
          }
        },
        orderBy: { name: 'asc' }
      }),
      prisma.team.count({ where: { leagueId: parseInt(leagueId) } })
    ]);

    res.json(
      formatResponse('success', 'تم جلب الفرق بنجاح', {
        teams,
        pagination: paginationMeta(total, parseInt(page), parseInt(limit))
      })
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Get team by ID
 * GET /api/teams/:id
 */
const getTeam = async (req, res, next) => {
  try {
    const { id } = req.params;

    const team = await prisma.team.findUnique({
      where: { id: parseInt(id) },
      include: {
        players: {
          where: { isActive: true },
          orderBy: { position: 'asc' }
        },
        league: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    if (!team) {
      return res.status(404).json(
        formatResponse('error', 'الفريق غير موجود')
      );
    }

    res.json(formatResponse('success', 'تم جلب بيانات الفريق', team));
  } catch (error) {
    next(error);
  }
};

/**
 * Update team (Admin only)
 * PUT /api/teams/:id
 */
const updateTeam = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, shortName, logo } = req.body;

    const team = await prisma.team.findUnique({
      where: { id: parseInt(id) },
      include: { league: true }
    });

    if (!team) {
      return res.status(404).json(
        formatResponse('error', 'الفريق غير موجود')
      );
    }

    if (team.league.createdById !== req.user.id && req.user.role !== 'ADMIN') {
      return res.status(403).json(
        formatResponse('error', 'غير مسموح بتعديل هذا الفريق')
      );
    }

    const updatedTeam = await prisma.team.update({
      where: { id: parseInt(id) },
      data: { name, shortName, logo }
    });

    res.json(formatResponse('success', 'تم تحديث الفريق بنجاح', updatedTeam));
  } catch (error) {
    next(error);
  }
};

/**
 * Delete team (Admin only)
 * DELETE /api/teams/:id
 */
const deleteTeam = async (req, res, next) => {
  try {
    const { id } = req.params;

    const team = await prisma.team.findUnique({
      where: { id: parseInt(id) },
      include: { league: true }
    });

    if (!team) {
      return res.status(404).json(
        formatResponse('error', 'الفريق غير موجود')
      );
    }

    if (team.league.createdById !== req.user.id && req.user.role !== 'ADMIN') {
      return res.status(403).json(
        formatResponse('error', 'غير مسموح بحذف هذا الفريق')
      );
    }

    await prisma.team.delete({
      where: { id: parseInt(id) }
    });

    res.json(formatResponse('success', 'تم حذف الفريق بنجاح'));
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createTeam,
  getTeams,
  getTeam,
  updateTeam,
  deleteTeam
};
