/**
 * Fantasy Team Controller
 * Handles user fantasy team management
 */

const prisma = require('../config/database');
const { formatResponse, validateFormation, calculateBudgetUsed } = require('../utils/helpers');

/**
 * Create fantasy team
 * POST /api/fantasy-teams
 */
const createFantasyTeam = async (req, res, next) => {
  try {
    const { name, leagueId, players } = req.body;

    // Check if user is member of league
    const membership = await prisma.leagueMember.findUnique({
      where: {
        userId_leagueId: {
          userId: req.user.id,
          leagueId: parseInt(leagueId)
        }
      }
    });

    if (!membership) {
      return res.status(403).json(
        formatResponse('error', 'يجب الانضمام للدوري أولاً')
      );
    }

    // Check if user already has a fantasy team in this league
    const existingTeam = await prisma.fantasyTeam.findUnique({
      where: {
        userId_leagueId: {
          userId: req.user.id,
          leagueId: parseInt(leagueId)
        }
      }
    });

    if (existingTeam) {
      return res.status(400).json(
        formatResponse('error', 'لديك فريق خيالي بالفعل في هذا الدوري')
      );
    }

    // Get league rules
    const league = await prisma.league.findUnique({
      where: { id: parseInt(leagueId) }
    });

    if (!league) {
      return res.status(404).json(
        formatResponse('error', 'الدوري غير موجود')
      );
    }

    // Get player details with prices and teams
    const playerIds = players.map(p => parseInt(p.playerId));
    const playerDetails = await prisma.player.findMany({
      where: {
        id: { in: playerIds },
        leagueId: parseInt(leagueId),
        isActive: true
      }
    });

    if (playerDetails.length !== players.length) {
      return res.status(400).json(
        formatResponse('error', 'بعض اللاعبين غير متاحين')
      );
    }

    // Prepare players with team info for validation
    const playersWithTeam = players.map(p => {
      const details = playerDetails.find(d => d.id === parseInt(p.playerId));
      return {
        ...p,
        playerId: parseInt(p.playerId),
        teamId: details.teamId,
        price: details.price
      };
    });

    // Validate formation
    const formationValidation = validateFormation(playersWithTeam, {
      playersPerTeam: league.playersPerTeam,
      startingPlayers: league.startingPlayers,
      substitutes: league.substitutes,
      maxPlayersPerRealTeam: league.maxPlayersPerRealTeam
    });

    if (!formationValidation.isValid) {
      return res.status(400).json(
        formatResponse('error', 'خطأ في التشكيلة', formationValidation.errors)
      );
    }

    // Validate budget
    const budgetUsed = calculateBudgetUsed(playersWithTeam);
    if (budgetUsed > parseFloat(league.budget)) {
      return res.status(400).json(
        formatResponse('error', `تجاوزت الميزانية المتاحة (${league.budget}$). المستخدم: ${budgetUsed.toFixed(2)}$`)
      );
    }

    // Create fantasy team
    const fantasyTeam = await prisma.fantasyTeam.create({
      data: {
        name,
        userId: req.user.id,
        leagueId: parseInt(leagueId),
        budget: parseFloat(league.budget) - budgetUsed,
        players: {
          create: playersWithTeam.map((p, index) => ({
            playerId: p.playerId,
            isStarter: p.isStarter,
            position: index
          }))
        }
      },
      include: {
        players: {
          include: {
            player: {
              include: {
                team: { select: { id: true, name: true, shortName: true } }
              }
            }
          }
        }
      }
    });

    res.status(201).json(
      formatResponse('success', 'تم إنشاء الفريق الخيالي بنجاح', fantasyTeam)
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Get user's fantasy team in a league
 * GET /api/fantasy-teams/:leagueId or GET /api/fantasy-teams/my
 */
const getMyFantasyTeam = async (req, res, next) => {
  try {
    const { leagueId } = req.params;

    const includeOptions = {
      players: {
        include: {
          player: {
            include: {
              team: { select: { id: true, name: true, shortName: true } },
              matchStats: {
                orderBy: { match: { matchDate: 'desc' } },
                take: 5,
                include: {
                  match: {
                    include: {
                      round: { select: { id: true, name: true, roundNumber: true } }
                    }
                  }
                }
              }
            }
          }
        },
        orderBy: [
          { isStarter: 'desc' },
          { position: 'asc' }
        ]
      },
      pointsHistory: {
        include: {
          round: { select: { id: true, name: true, roundNumber: true } }
        },
        orderBy: { round: { roundNumber: 'asc' } }
      },
      league: {
        select: {
          id: true,
          name: true,
          budget: true,
          playersPerTeam: true,
          startingPlayers: true,
          substitutes: true,
          maxPlayersPerRealTeam: true,
          maxTransfersPerRound: true
        }
      }
    };

    let fantasyTeam;
    
    // If leagueId is provided and valid, find specific team
    if (leagueId && leagueId !== 'undefined' && leagueId !== 'my') {
      fantasyTeam = await prisma.fantasyTeam.findUnique({
        where: {
          userId_leagueId: {
            userId: req.user.id,
            leagueId: parseInt(leagueId)
          }
        },
        include: includeOptions
      });
    } else {
      // No leagueId provided - find user's first fantasy team
      fantasyTeam = await prisma.fantasyTeam.findFirst({
        where: { userId: req.user.id },
        orderBy: { createdAt: 'desc' },
        include: includeOptions
      });
    }

    if (!fantasyTeam) {
      return res.status(404).json(
        formatResponse('error', 'لم تقم بإنشاء فريق خيالي بعد')
      );
    }

    // Calculate player stats
    const playersWithStats = fantasyTeam.players.map(fp => {
      const totalPoints = fp.player.matchStats.reduce((sum, s) => sum + s.points, 0);
      return {
        ...fp,
        totalPoints
      };
    });

    res.json(formatResponse('success', 'تم جلب بيانات الفريق', {
      fantasyTeam: {
        ...fantasyTeam,
        players: playersWithStats
      }
    }));
  } catch (error) {
    next(error);
  }
};

/**
 * Get fantasy team by ID
 * GET /api/fantasy-teams/team/:id
 */
const getFantasyTeam = async (req, res, next) => {
  try {
    const { id } = req.params;

    const fantasyTeam = await prisma.fantasyTeam.findUnique({
      where: { id: parseInt(id) },
      include: {
        user: { select: { id: true, name: true } },
        players: {
          include: {
            player: {
              include: {
                team: { select: { id: true, name: true, shortName: true } }
              }
            }
          },
          orderBy: [
            { isStarter: 'desc' },
            { position: 'asc' }
          ]
        },
        pointsHistory: {
          include: {
            round: { select: { id: true, name: true, roundNumber: true } }
          },
          orderBy: { round: { roundNumber: 'asc' } }
        }
      }
    });

    if (!fantasyTeam) {
      return res.status(404).json(
        formatResponse('error', 'الفريق الخيالي غير موجود')
      );
    }

    res.json(formatResponse('success', 'تم جلب بيانات الفريق', fantasyTeam));
  } catch (error) {
    next(error);
  }
};

/**
 * Update fantasy team name
 * PUT /api/fantasy-teams/:id
 */
const updateFantasyTeam = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name } = req.body;

    const fantasyTeam = await prisma.fantasyTeam.findUnique({
      where: { id: parseInt(id) }
    });

    if (!fantasyTeam) {
      return res.status(404).json(
        formatResponse('error', 'الفريق الخيالي غير موجود')
      );
    }

    if (fantasyTeam.userId !== req.user.id) {
      return res.status(403).json(
        formatResponse('error', 'غير مسموح بتعديل هذا الفريق')
      );
    }

    const updatedTeam = await prisma.fantasyTeam.update({
      where: { id: parseInt(id) },
      data: { name }
    });

    res.json(formatResponse('success', 'تم تحديث اسم الفريق', { fantasyTeam: updatedTeam }));
  } catch (error) {
    next(error);
  }
};

/**
 * Update fantasy team lineup (swap starters/substitutes)
 * PUT /api/fantasy-teams/:id/lineup
 */
const updateLineup = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { players } = req.body; // Array of { fantasyPlayerId, isStarter, position }

    const fantasyTeam = await prisma.fantasyTeam.findUnique({
      where: { id: parseInt(id) },
      include: {
        league: true,
        players: {
          include: {
            player: true
          }
        }
      }
    });

    if (!fantasyTeam) {
      return res.status(404).json(
        formatResponse('error', 'الفريق الخيالي غير موجود')
      );
    }

    if (fantasyTeam.userId !== req.user.id) {
      return res.status(403).json(
        formatResponse('error', 'غير مسموح بتعديل هذا الفريق')
      );
    }

    // التحقق من إمكانية التعديل (يتحكم فيها الأدمن عبر transfersOpen)
    // البحث عن جولة مفتوحة للتعديل
    const openRound = await prisma.round.findFirst({
      where: {
        leagueId: fantasyTeam.leagueId,
        transfersOpen: true,
        isCompleted: false
      }
    });

    // إذا لم توجد جولة مفتوحة، لا يمكن التعديل
    if (!openRound) {
      return res.status(400).json(
        formatResponse('error', 'لا يمكن تعديل التشكيلة حالياً - انتظر حتى يفتح المشرف الانتقالات')
      );
    }

    // Validate lineup
    const startersCount = players.filter(p => p.isStarter).length;
    if (startersCount !== fantasyTeam.league.startingPlayers) {
      return res.status(400).json(
        formatResponse('error', `يجب اختيار ${fantasyTeam.league.startingPlayers} لاعب أساسي`)
      );
    }

    // Update each player's position
    for (const p of players) {
      await prisma.fantasyPlayer.update({
        where: { id: parseInt(p.fantasyPlayerId) },
        data: {
          isStarter: p.isStarter,
          position: p.position
        }
      });
    }

    // Get updated team
    const updatedTeam = await prisma.fantasyTeam.findUnique({
      where: { id: parseInt(id) },
      include: {
        players: {
          include: {
            player: {
              include: {
                team: { select: { id: true, name: true, shortName: true } }
              }
            }
          },
          orderBy: [
            { isStarter: 'desc' },
            { position: 'asc' }
          ]
        }
      }
    });

    res.json(formatResponse('success', 'تم تحديث التشكيلة', { fantasyTeam: updatedTeam }));
  } catch (error) {
    next(error);
  }
};

/**
 * Get fantasy team points for a round
 * GET /api/fantasy-teams/:id/points/:roundId
 */
const getRoundPoints = async (req, res, next) => {
  try {
    const { id, roundId } = req.params;

    const fantasyTeam = await prisma.fantasyTeam.findUnique({
      where: { id: parseInt(id) },
      include: {
        players: {
          where: { isStarter: true },
          include: {
            player: {
              include: {
                team: { select: { id: true, name: true } },
                matchStats: {
                  where: {
                    match: { roundId: parseInt(roundId) }
                  },
                  include: {
                    match: {
                      include: {
                        homeTeam: { select: { id: true, name: true } },
                        awayTeam: { select: { id: true, name: true } }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    });

    if (!fantasyTeam) {
      return res.status(404).json(
        formatResponse('error', 'الفريق الخيالي غير موجود')
      );
    }

    // Get points history for this round
    const pointsHistory = await prisma.pointsHistory.findUnique({
      where: {
        fantasyTeamId_roundId: {
          fantasyTeamId: parseInt(id),
          roundId: parseInt(roundId)
        }
      }
    });

    // Calculate player breakdown
    const playerBreakdown = fantasyTeam.players.map(fp => {
      const stats = fp.player.matchStats[0] || null;
      return {
        playerId: fp.player.id,
        playerName: fp.player.name,
        position: fp.player.position,
        team: fp.player.team,
        stats,
        points: stats ? stats.points : 0
      };
    });

    const totalPoints = playerBreakdown.reduce((sum, p) => sum + p.points, 0);

    res.json(formatResponse('success', 'تم جلب نقاط الجولة', {
      fantasyTeamId: parseInt(id),
      roundId: parseInt(roundId),
      totalPoints,
      rank: pointsHistory?.rank || null,
      playerBreakdown
    }));
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createFantasyTeam,
  getMyFantasyTeam,
  getFantasyTeam,
  updateFantasyTeam,
  updateLineup,
  getRoundPoints
};
