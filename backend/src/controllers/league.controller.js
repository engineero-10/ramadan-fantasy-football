/**
 * League Controller
 * Handles league management (Admin) and joining (User)
 */

const prisma = require('../config/database');
const { formatResponse, generateLeagueCode, paginate, paginationMeta } = require('../utils/helpers');

/**
 * Create new league (Admin only - ONE league per admin)
 * POST /api/leagues
 */
const createLeague = async (req, res, next) => {
  try {
    // التحقق من عدم وجود دوري سابق لهذا الأدمن - مسموح بدوري واحد فقط لكل أدمن
    const existingLeague = await prisma.league.findFirst({
      where: { createdById: req.user.id }
    });
    if (existingLeague) {
      return res.status(400).json(
        formatResponse('error', 'لديك دوري بالفعل - مسموح بدوري واحد فقط لكل مشرف')
      );
    }

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

    // الأدمن لا ينضم كعضو - فقط للإدارة

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
    const { page = 1, limit = 10, myLeagues, all } = req.query;
    const { skip, take } = paginate(parseInt(page), parseInt(limit));

    let where = {};
    
    // للمالك: يظهر كل الدوريات
    // للأدمن: يظهر فقط الدوريات التي أنشأها
    // للمستخدم العادي: يظهر فقط الدوريات المشترك فيها
    const isOwner = req.user?.role === 'OWNER';
    const isAdmin = req.user?.role === 'ADMIN';
    
    // المالك يرى كل الدوريات
    if (isOwner) {
      // لا يوجد where - يرى الكل
    }
    // الأدمن يرى فقط دورياته
    else if (isAdmin) {
      where = { createdById: req.user.id };
    }
    
    const showOnlyMyLeagues = !isOwner && !isAdmin && all !== 'true';
    
    if (showOnlyMyLeagues || myLeagues === 'true') {
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

    if (existing.createdById !== req.user.id) {
      return res.status(403).json(
        formatResponse('error', 'غير مسموح بتعديل هذا الدوري - يمكنك تعديل دوريك فقط')
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

    if (existing.createdById !== req.user.id) {
      return res.status(403).json(
        formatResponse('error', 'غير مسموح بحذف هذا الدوري - يمكنك حذف دوريك فقط')
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
    // منع الأدمن من الانضمام للدوريات - الأدمن للإدارة فقط
    if (req.user.role === 'ADMIN') {
      return res.status(403).json(
        formatResponse('error', 'المشرف لا يمكنه الانضمام للدوريات - صلاحياته للإدارة فقط')
      );
    }

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
      orderBy: [
        { role: 'asc' }, // الأدمنز أولاً
        { joinedAt: 'asc' }
      ]
    });

    res.json(formatResponse('success', 'تم جلب أعضاء الدوري', { members }));
  } catch (error) {
    next(error);
  }
};

/**
 * Update member role (promote/demote to admin)
 * PUT /api/leagues/:id/members/:userId/role
 */
const updateMemberRole = async (req, res, next) => {
  try {
    const { id, userId } = req.params;
    const { role } = req.body; // 'ADMIN' or 'MEMBER'

    // التحقق من أن المستخدم الحالي أدمن في الدوري أو الأدمن الرئيسي
    const league = await prisma.league.findUnique({
      where: { id: parseInt(id) }
    });

    if (!league) {
      return res.status(404).json(
        formatResponse('error', 'الدوري غير موجود')
      );
    }

    // التحقق من الصلاحيات
    const isMainAdmin = req.user.role === 'ADMIN';
    const isLeagueAdmin = await prisma.leagueMember.findFirst({
      where: {
        leagueId: parseInt(id),
        userId: req.user.id,
        role: 'ADMIN'
      }
    });

    if (!isMainAdmin && !isLeagueAdmin) {
      return res.status(403).json(
        formatResponse('error', 'غير مسموح بتغيير صلاحيات الأعضاء')
      );
    }

    // التحقق من وجود العضو في الدوري
    const member = await prisma.leagueMember.findUnique({
      where: {
        userId_leagueId: {
          userId: parseInt(userId),
          leagueId: parseInt(id)
        }
      }
    });

    if (!member) {
      return res.status(404).json(
        formatResponse('error', 'العضو غير موجود في هذا الدوري')
      );
    }

    // لا يمكن للأدمن إزالة صلاحياته الخاصة
    if (parseInt(userId) === req.user.id && role === 'MEMBER') {
      return res.status(400).json(
        formatResponse('error', 'لا يمكنك إزالة صلاحيات الأدمن من نفسك')
      );
    }

    // تحديث الدور
    const updatedMember = await prisma.leagueMember.update({
      where: {
        userId_leagueId: {
          userId: parseInt(userId),
          leagueId: parseInt(id)
        }
      },
      data: { role },
      include: {
        user: {
          select: { id: true, name: true, email: true }
        }
      }
    });

    const message = role === 'ADMIN' ? 'تم ترقية العضو لمشرف' : 'تم إزالة صلاحيات المشرف';
    res.json(formatResponse('success', message, { member: updatedMember }));
  } catch (error) {
    next(error);
  }
};

/**
 * Get leagues where user is admin (league admin or creator)
 * GET /api/leagues/my-admin-leagues
 */
const getMyAdminLeagues = async (req, res, next) => {
  try {
    const userId = req.user.id;

    // جلب الدوريات التي أنشأها المستخدم أو هو أدمن فيها
    const leagues = await prisma.league.findMany({
      where: {
        OR: [
          { createdById: userId },
          {
            members: {
              some: {
                userId: userId,
                role: 'ADMIN'
              }
            }
          }
        ]
      },
      include: {
        createdBy: {
          select: { id: true, name: true }
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
    });

    res.json(formatResponse('success', 'تم جلب الدوريات', { leagues }));
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
        code: true,
        budget: true,
        startingPlayers: true,
        substitutes: true,
        maxTeams: true,
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

    res.json(formatResponse('success', 'تم جلب بيانات الدوري', { league }));
  } catch (error) {
    next(error);
  }
};

/**
 * Get all fantasy teams in a league with detailed player info (Admin only)
 * GET /api/leagues/:id/fantasy-teams
 */
const getLeagueFantasyTeams = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Check league exists and user has access
    const league = await prisma.league.findUnique({
      where: { id: parseInt(id) }
    });

    if (!league) {
      return res.status(404).json(
        formatResponse('error', 'الدوري غير موجود')
      );
    }

    // Only owner or league creator can view all teams
    if (req.user.role !== 'OWNER' && league.createdById !== req.user.id) {
      return res.status(403).json(
        formatResponse('error', 'غير مسموح بعرض فرق هذا الدوري')
      );
    }

    const fantasyTeams = await prisma.fantasyTeam.findMany({
      where: { leagueId: parseInt(id) },
      include: {
        user: { select: { id: true, name: true, email: true } },
        players: {
          include: {
            player: {
              include: {
                team: { select: { id: true, name: true, shortName: true } }
              }
            }
          }
        },
        _count: { select: { players: true } }
      },
      orderBy: { totalPoints: 'desc' }
    });

    res.json(formatResponse('success', 'تم جلب فرق الدوري', { fantasyTeams }));
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
  updateMemberRole,
  getMyAdminLeagues,
  getLeagueByCode,
  getLeagueFantasyTeams
};
