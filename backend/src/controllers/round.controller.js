/**
 * Round Controller
 * Handles round/gameweek management
 */

const prisma = require('../config/database');
const { formatResponse, paginate, paginationMeta, hasLeagueAccess } = require('../utils/helpers');

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

    if (!await hasLeagueAccess(req.user, league)) {
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
      formatResponse('success', 'تم إنشاء الجولة بنجاح', { round })
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
      round: {
        ...round,
        isLocked
      }
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

    if (!await hasLeagueAccess(req.user, round.league)) {
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

    res.json(formatResponse('success', 'تم تحديث الجولة بنجاح', { round: updatedRound }));
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

    if (!await hasLeagueAccess(req.user, round.league)) {
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

    res.json(formatResponse('success', message, { round: updatedRound }));
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

    if (!await hasLeagueAccess(req.user, round.league)) {
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

    if (!await hasLeagueAccess(req.user, round.league)) {
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

    // الأولوية 1: جولة فيها الانتقالات مفتوحة (للسماح بالتعديل قبل بدء الجولة)
    let round = await prisma.round.findFirst({
      where: {
        leagueId: parseInt(leagueId),
        transfersOpen: true,
        isCompleted: false
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
      orderBy: { roundNumber: 'asc' }
    });

    // الأولوية 2: جولة نشطة حالياً (بين تاريخ البداية والنهاية)
    if (!round) {
      round = await prisma.round.findFirst({
        where: {
          leagueId: parseInt(leagueId),
          startDate: { lte: now },
          endDate: { gte: now },
          isCompleted: false
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
    }

    // الأولوية 3: الجولة القادمة
    if (!round) {
      round = await prisma.round.findFirst({
        where: {
          leagueId: parseInt(leagueId),
          startDate: { gt: now },
          isCompleted: false
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

    // الأولوية 4: آخر جولة مكتملة (لعرض النتائج)
    if (!round) {
      round = await prisma.round.findFirst({
        where: {
          leagueId: parseInt(leagueId),
          isCompleted: true
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
        orderBy: { roundNumber: 'desc' }
      });
    }

    if (!round) {
      return res.status(404).json(
        formatResponse('error', 'لا توجد جولات متاحة')
      );
    }

    // التحكم يدوياً من الأدمن فقط
    const isLocked = !round.transfersOpen;

    res.json(formatResponse('success', 'تم جلب الجولة الحالية', {
      round: {
        ...round,
        isLocked
      }
    }));
  } catch (error) {
    next(error);
  }
};

/**
 * Get round statistics
 * GET /api/rounds/:id/stats
 * Returns user rankings and top players for a round
 */
const getRoundStats = async (req, res, next) => {
  try {
    const { id } = req.params;
    const roundId = parseInt(id);

    // Get round with league info
    const round = await prisma.round.findUnique({
      where: { id: roundId },
      include: {
        league: true
      }
    });

    if (!round) {
      return res.status(404).json(
        formatResponse('error', 'الجولة غير موجودة')
      );
    }

    // Get user rankings for this round (from PointsHistory)
    const userRankings = await prisma.pointsHistory.findMany({
      where: { roundId },
      include: {
        fantasyTeam: {
          include: {
            user: {
              select: { id: true, name: true, email: true }
            }
          }
        }
      },
      orderBy: { points: 'desc' }
    });

    // Format user rankings
    const formattedUserRankings = userRankings.map((ph, index) => ({
      rank: index + 1,
      userId: ph.fantasyTeam.user.id,
      userName: ph.fantasyTeam.user.name,
      teamName: ph.fantasyTeam.name,
      points: ph.points,
      previousRank: ph.rank
    }));

    // Get matches in this round
    const matches = await prisma.match.findMany({
      where: { roundId },
      select: { id: true }
    });
    const matchIds = matches.map(m => m.id);

    // Get top 10 players by points in this round
    const topPlayers = await prisma.matchStat.findMany({
      where: {
        matchId: { in: matchIds }
      },
      include: {
        player: {
          include: {
            team: {
              select: { id: true, name: true, shortName: true }
            }
          }
        },
        match: {
          include: {
            homeTeam: { select: { id: true, name: true, shortName: true } },
            awayTeam: { select: { id: true, name: true, shortName: true } }
          }
        }
      },
      orderBy: { points: 'desc' },
      take: 10
    });

    // Format top players
    const formattedTopPlayers = topPlayers.map((stat, index) => ({
      rank: index + 1,
      playerId: stat.player.id,
      playerName: stat.player.name,
      position: stat.player.position,
      teamName: stat.player.team.name,
      teamShortName: stat.player.team.shortName,
      points: stat.points,
      goals: stat.goals,
      assists: stat.assists,
      cleanSheet: stat.cleanSheet,
      bonusPoints: stat.bonusPoints,
      matchInfo: `${stat.match.homeTeam.shortName || stat.match.homeTeam.name} vs ${stat.match.awayTeam.shortName || stat.match.awayTeam.name}`
    }));

    // Calculate round statistics
    const totalPoints = userRankings.reduce((sum, ph) => sum + ph.points, 0);
    const avgPoints = userRankings.length > 0 ? Math.round(totalPoints / userRankings.length) : 0;
    const highestPoints = userRankings.length > 0 ? userRankings[0].points : 0;
    const lowestPoints = userRankings.length > 0 ? userRankings[userRankings.length - 1].points : 0;

    res.json(formatResponse('success', 'تم جلب إحصائيات الجولة', {
      round: {
        id: round.id,
        name: round.name,
        roundNumber: round.roundNumber,
        isCompleted: round.isCompleted
      },
      statistics: {
        totalParticipants: userRankings.length,
        totalPoints,
        averagePoints: avgPoints,
        highestPoints,
        lowestPoints
      },
      userRankings: formattedUserRankings,
      topPlayers: formattedTopPlayers
    }));
  } catch (error) {
    next(error);
  }
};

/**
 * Get round statistics for user (includes their own players)
 * GET /api/rounds/:id/my-stats
 * Returns user rankings, top players, and user's own team players for a round
 */
const getMyRoundStats = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const roundId = parseInt(id);

    // Get round with league info
    const round = await prisma.round.findUnique({
      where: { id: roundId },
      include: {
        league: true
      }
    });

    if (!round) {
      return res.status(404).json(
        formatResponse('error', 'الجولة غير موجودة')
      );
    }

    // Get user's fantasy team
    const fantasyTeam = await prisma.fantasyTeam.findFirst({
      where: {
        userId,
        leagueId: round.leagueId
      }
    });

    if (!fantasyTeam) {
      return res.status(404).json(
        formatResponse('error', 'لا يوجد فريق خيالي في هذا الدوري')
      );
    }

    // Get user rankings for this round (from PointsHistory)
    const userRankings = await prisma.pointsHistory.findMany({
      where: { roundId },
      include: {
        fantasyTeam: {
          include: {
            user: {
              select: { id: true, name: true, email: true }
            }
          }
        }
      },
      orderBy: { points: 'desc' }
    });

    // Format user rankings and find current user's rank
    let myRank = null;
    let myPoints = 0;
    const formattedUserRankings = userRankings.map((ph, index) => {
      const ranking = {
        rank: index + 1,
        userId: ph.fantasyTeam.user.id,
        userName: ph.fantasyTeam.user.name,
        teamName: ph.fantasyTeam.name,
        points: ph.points,
        isMe: ph.fantasyTeam.userId === userId
      };
      if (ranking.isMe) {
        myRank = index + 1;
        myPoints = ph.points;
      }
      return ranking;
    });

    // Get matches in this round
    const matches = await prisma.match.findMany({
      where: { roundId },
      select: { id: true }
    });
    const matchIds = matches.map(m => m.id);

    // Get top 10 players by points in this round
    const topPlayers = await prisma.matchStat.findMany({
      where: {
        matchId: { in: matchIds }
      },
      include: {
        player: {
          include: {
            team: {
              select: { id: true, name: true, shortName: true }
            }
          }
        },
        match: {
          include: {
            homeTeam: { select: { id: true, name: true, shortName: true } },
            awayTeam: { select: { id: true, name: true, shortName: true } }
          }
        }
      },
      orderBy: { points: 'desc' },
      take: 10
    });

    // Format top players
    const formattedTopPlayers = topPlayers.map((stat, index) => ({
      rank: index + 1,
      playerId: stat.player.id,
      playerName: stat.player.name,
      position: stat.player.position,
      teamName: stat.player.team.name,
      teamShortName: stat.player.team.shortName,
      points: stat.points,
      goals: stat.goals,
      assists: stat.assists,
      cleanSheet: stat.cleanSheet,
      bonusPoints: stat.bonusPoints,
      matchInfo: `${stat.match.homeTeam.shortName || stat.match.homeTeam.name} vs ${stat.match.awayTeam.shortName || stat.match.awayTeam.name}`
    }));

    // Get user's players in this round with their stats
    // We need to get the players that were in the team when this round was played
    // For simplicity, we'll get the current team players and their stats for this round
    const fantasyPlayers = await prisma.fantasyPlayer.findMany({
      where: { fantasyTeamId: fantasyTeam.id },
      include: {
        player: {
          include: {
            team: {
              select: { id: true, name: true, shortName: true }
            },
            matchStats: {
              where: {
                matchId: { in: matchIds }
              }
            }
          }
        }
      }
    });

    // Format my players with their round stats
    const myPlayers = fantasyPlayers.map(fp => {
      const stats = fp.player.matchStats[0] || null;
      return {
        playerId: fp.player.id,
        playerName: fp.player.name,
        position: fp.player.position,
        teamName: fp.player.team.name,
        teamShortName: fp.player.team.shortName,
        isStarter: fp.isStarter,
        points: stats?.points || 0,
        goals: stats?.goals || 0,
        assists: stats?.assists || 0,
        cleanSheet: stats?.cleanSheet || false,
        yellowCards: stats?.yellowCards || 0,
        redCards: stats?.redCards || 0,
        bonusPoints: stats?.bonusPoints || 0,
        minutesPlayed: stats?.minutesPlayed || 0,
        played: !!stats
      };
    }).sort((a, b) => b.points - a.points);

    // Calculate my stats
    const myTotalPoints = myPlayers
      .filter(p => p.isStarter)
      .reduce((sum, p) => sum + p.points, 0);

    // Calculate round statistics
    const totalPoints = userRankings.reduce((sum, ph) => sum + ph.points, 0);
    const avgPoints = userRankings.length > 0 ? Math.round(totalPoints / userRankings.length) : 0;
    const highestPoints = userRankings.length > 0 ? userRankings[0].points : 0;
    const lowestPoints = userRankings.length > 0 ? userRankings[userRankings.length - 1].points : 0;

    res.json(formatResponse('success', 'تم جلب إحصائيات الجولة', {
      round: {
        id: round.id,
        name: round.name,
        roundNumber: round.roundNumber,
        isCompleted: round.isCompleted
      },
      myStats: {
        rank: myRank,
        points: myPoints,
        teamName: fantasyTeam.name,
        totalPlayers: myPlayers.length,
        playersPlayed: myPlayers.filter(p => p.played).length
      },
      statistics: {
        totalParticipants: userRankings.length,
        totalPoints,
        averagePoints: avgPoints,
        highestPoints,
        lowestPoints
      },
      userRankings: formattedUserRankings,
      topPlayers: formattedTopPlayers,
      myPlayers
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
  getCurrentRound,
  getRoundStats,
  getMyRoundStats
};
