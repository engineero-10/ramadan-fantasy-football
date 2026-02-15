/**
 * Admin Management Controller
 * Owner-only operations to manage admin accounts
 */

const bcrypt = require('bcryptjs');
const prisma = require('../config/database');
const { formatResponse, paginate, paginationMeta } = require('../utils/helpers');

/**
 * Get all admin accounts (Owner only)
 * GET /api/admin-management
 */
const getAdmins = async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const { skip, take } = paginate(parseInt(page), parseInt(limit));

    const [admins, total] = await Promise.all([
      prisma.user.findMany({
        where: { role: 'ADMIN' },
        skip,
        take,
        select: {
          id: true,
          email: true,
          name: true,
          createdAt: true,
          leagues: {
            select: {
              id: true,
              name: true,
              code: true,
              isActive: true,
              _count: {
                select: { members: true, fantasyTeams: true }
              }
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.user.count({ where: { role: 'ADMIN' } })
    ]);

    res.json(
      formatResponse('success', 'تم جلب الأدمن بنجاح', {
        admins,
        pagination: paginationMeta(total, parseInt(page), parseInt(limit))
      })
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Create admin account (Owner only)
 * POST /api/admin-management
 */
const createAdmin = async (req, res, next) => {
  try {
    const { email, password, name } = req.body;

    // Validate
    if (!email || !password || !name) {
      return res.status(400).json(
        formatResponse('error', 'البريد الإلكتروني وكلمة المرور والاسم مطلوبين')
      );
    }

    // Check email
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return res.status(409).json(
        formatResponse('error', 'البريد الإلكتروني مسجل مسبقاً')
      );
    }

    // Create admin
    const hashedPassword = await bcrypt.hash(password, 12);
    const admin = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        role: 'ADMIN'
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true
      }
    });

    res.status(201).json(
      formatResponse('success', 'تم إنشاء حساب الأدمن بنجاح', { admin })
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Get admin by ID (Owner only)
 * GET /api/admin-management/:id
 */
const getAdmin = async (req, res, next) => {
  try {
    const { id } = req.params;

    const admin = await prisma.user.findFirst({
      where: { 
        id: parseInt(id),
        role: 'ADMIN'
      },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
        leagues: {
          select: {
            id: true,
            name: true,
            code: true,
            isActive: true,
            _count: {
              select: { 
                members: true, 
                fantasyTeams: true,
                teams: true,
                players: true,
                rounds: true 
              }
            }
          }
        }
      }
    });

    if (!admin) {
      return res.status(404).json(
        formatResponse('error', 'الأدمن غير موجود')
      );
    }

    res.json(formatResponse('success', 'تم جلب بيانات الأدمن', { admin }));
  } catch (error) {
    next(error);
  }
};

/**
 * Update admin (Owner only)
 * PUT /api/admin-management/:id
 */
const updateAdmin = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { email, password, name } = req.body;

    // Check admin exists
    const existingAdmin = await prisma.user.findFirst({
      where: { 
        id: parseInt(id),
        role: 'ADMIN'
      }
    });

    if (!existingAdmin) {
      return res.status(404).json(
        formatResponse('error', 'الأدمن غير موجود')
      );
    }

    // Check email uniqueness if changed
    if (email && email !== existingAdmin.email) {
      const emailExists = await prisma.user.findUnique({ where: { email } });
      if (emailExists) {
        return res.status(409).json(
          formatResponse('error', 'البريد الإلكتروني مستخدم')
        );
      }
    }

    // Build update data
    const updateData = {};
    if (email) updateData.email = email;
    if (name) updateData.name = name;
    if (password) updateData.password = await bcrypt.hash(password, 12);

    const admin = await prisma.user.update({
      where: { id: parseInt(id) },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true
      }
    });

    res.json(formatResponse('success', 'تم تحديث الأدمن بنجاح', { admin }));
  } catch (error) {
    next(error);
  }
};

/**
 * Delete admin account (Owner only)
 * DELETE /api/admin-management/:id
 */
const deleteAdmin = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Check admin exists
    const admin = await prisma.user.findFirst({
      where: { 
        id: parseInt(id),
        role: 'ADMIN'
      },
      include: {
        leagues: {
          select: { id: true }
        }
      }
    });

    if (!admin) {
      return res.status(404).json(
        formatResponse('error', 'الأدمن غير موجود')
      );
    }

    // Delete admin's leagues first (cascade will handle the rest)
    for (const league of admin.leagues) {
      await prisma.league.delete({ where: { id: league.id } });
    }

    // Delete admin
    await prisma.user.delete({ where: { id: parseInt(id) } });

    res.json(formatResponse('success', 'تم حذف الأدمن بنجاح'));
  } catch (error) {
    next(error);
  }
};

/**
 * Get system stats (Owner only)
 * GET /api/admin-management/stats
 */
const getSystemStats = async (req, res, next) => {
  try {
    const [
      totalAdmins,
      totalLeagues,
      totalUsers,
      totalTeams,
      totalPlayers,
      totalMatches
    ] = await Promise.all([
      prisma.user.count({ where: { role: 'ADMIN' } }),
      prisma.league.count(),
      prisma.user.count({ where: { role: 'USER' } }),
      prisma.team.count(),
      prisma.player.count(),
      prisma.match.count()
    ]);

    // Get recent admins
    const recentAdmins = await prisma.user.findMany({
      where: { role: 'ADMIN' },
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
        leagues: {
          select: {
            name: true,
            _count: { select: { members: true } }
          }
        }
      }
    });

    res.json(
      formatResponse('success', 'تم جلب إحصائيات النظام', {
        stats: {
          totalAdmins,
          totalLeagues,
          totalUsers,
          totalTeams,
          totalPlayers,
          totalMatches
        },
        recentAdmins
      })
    );
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAdmins,
  createAdmin,
  getAdmin,
  updateAdmin,
  deleteAdmin,
  getSystemStats
};
