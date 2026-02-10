/**
 * Transfer Controller
 * Handles player transfers between rounds
 */

const prisma = require('../config/database');
const { formatResponse, calculateBudgetUsed } = require('../utils/helpers');

/**
 * Make a transfer
 * POST /api/transfers
 */
const createTransfer = async (req, res, next) => {
  try {
    const { fantasyTeamId, playerInId, playerOutId } = req.body;

    // Get fantasy team with league info
    const fantasyTeam = await prisma.fantasyTeam.findUnique({
      where: { id: parseInt(fantasyTeamId) },
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

    // Check ownership
    if (fantasyTeam.userId !== req.user.id) {
      return res.status(403).json(
        formatResponse('error', 'غير مسموح بإجراء انتقالات لهذا الفريق')
      );
    }

    // Get current active round with transfers open (يتحكم فيه الأدمن يدوياً)
    const activeRound = await prisma.round.findFirst({
      where: {
        leagueId: fantasyTeam.leagueId,
        transfersOpen: true,
        isCompleted: false
      },
      orderBy: { roundNumber: 'asc' }
    });

    if (!activeRound) {
      return res.status(400).json(
        formatResponse('error', 'الانتقالات مغلقة حالياً - انتظر حتى يفتحها المشرف')
      );
    }

    // Check transfers count for this round
    const transfersCount = await prisma.transfer.count({
      where: {
        fantasyTeamId: parseInt(fantasyTeamId),
        roundId: activeRound.id
      }
    });

    if (transfersCount >= fantasyTeam.league.maxTransfersPerRound) {
      return res.status(400).json(
        formatResponse('error', `وصلت للحد الأقصى من الانتقالات (${fantasyTeam.league.maxTransfersPerRound})`)
      );
    }

    // Get player out details
    const fantasyPlayerOut = fantasyTeam.players.find(
      fp => fp.playerId === parseInt(playerOutId)
    );

    if (!fantasyPlayerOut) {
      return res.status(400).json(
        formatResponse('error', 'اللاعب المستبعد غير موجود في فريقك')
      );
    }

    // Get player in details
    const playerIn = await prisma.player.findFirst({
      where: {
        id: parseInt(playerInId),
        leagueId: fantasyTeam.leagueId,
        isActive: true
      }
    });

    if (!playerIn) {
      return res.status(400).json(
        formatResponse('error', 'اللاعب الجديد غير متاح')
      );
    }

    // Check if player is already in team
    const alreadyInTeam = fantasyTeam.players.some(
      fp => fp.playerId === parseInt(playerInId)
    );

    if (alreadyInTeam) {
      return res.status(400).json(
        formatResponse('error', 'اللاعب موجود بالفعل في فريقك')
      );
    }

    // Check position match
    if (playerIn.position !== fantasyPlayerOut.player.position) {
      return res.status(400).json(
        formatResponse('error', 'يجب استبدال اللاعب بلاعب في نفس المركز')
      );
    }

    // Check budget
    const playerOutPrice = parseFloat(fantasyPlayerOut.player.price);
    const playerInPrice = parseFloat(playerIn.price);
    const currentBudget = parseFloat(fantasyTeam.budget);
    const newBudget = currentBudget + playerOutPrice - playerInPrice;

    if (newBudget < 0) {
      return res.status(400).json(
        formatResponse('error', `الميزانية غير كافية. المتاح: ${(currentBudget + playerOutPrice).toFixed(2)}$، المطلوب: ${playerInPrice}$`)
      );
    }

    // Check max players per real team
    const teamPlayerCount = fantasyTeam.players.filter(
      fp => fp.player.teamId === playerIn.teamId && fp.playerId !== parseInt(playerOutId)
    ).length;

    if (teamPlayerCount >= fantasyTeam.league.maxPlayersPerRealTeam) {
      return res.status(400).json(
        formatResponse('error', `لديك بالفعل ${fantasyTeam.league.maxPlayersPerRealTeam} لاعبين من نفس الفريق`)
      );
    }

    // Execute transfer in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create transfer record
      const transfer = await tx.transfer.create({
        data: {
          fantasyTeamId: parseInt(fantasyTeamId),
          userId: req.user.id,
          roundId: activeRound.id,
          playerInId: parseInt(playerInId),
          playerOutId: parseInt(playerOutId)
        }
      });

      // Update fantasy player
      await tx.fantasyPlayer.update({
        where: { id: fantasyPlayerOut.id },
        data: { playerId: parseInt(playerInId) }
      });

      // Update budget
      await tx.fantasyTeam.update({
        where: { id: parseInt(fantasyTeamId) },
        data: { budget: newBudget }
      });

      return transfer;
    });

    // Get updated team
    const updatedTeam = await prisma.fantasyTeam.findUnique({
      where: { id: parseInt(fantasyTeamId) },
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
      formatResponse('success', 'تم الانتقال بنجاح', {
        transfer: result,
        remainingTransfers: fantasyTeam.league.maxTransfersPerRound - transfersCount - 1,
        newBudget: newBudget.toFixed(2),
        updatedTeam
      })
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Get transfer history for a fantasy team
 * GET /api/transfers/:fantasyTeamId
 */
const getTransferHistory = async (req, res, next) => {
  try {
    const { fantasyTeamId } = req.params;

    const transfers = await prisma.transfer.findMany({
      where: { fantasyTeamId: parseInt(fantasyTeamId) },
      include: {
        playerIn: {
          include: {
            team: { select: { id: true, name: true, shortName: true } }
          }
        },
        playerOut: {
          include: {
            team: { select: { id: true, name: true, shortName: true } }
          }
        },
        round: {
          select: { id: true, name: true, roundNumber: true }
        }
      },
      orderBy: { transferDate: 'desc' }
    });

    res.json(formatResponse('success', 'تم جلب سجل الانتقالات', { transfers }));
  } catch (error) {
    next(error);
  }
};

/**
 * Get remaining transfers for current round
 * GET /api/transfers/:fantasyTeamId/remaining
 */
const getRemainingTransfers = async (req, res, next) => {
  try {
    const { fantasyTeamId } = req.params;

    const fantasyTeam = await prisma.fantasyTeam.findUnique({
      where: { id: parseInt(fantasyTeamId) },
      include: { league: true }
    });

    if (!fantasyTeam) {
      return res.status(404).json(
        formatResponse('error', 'الفريق الخيالي غير موجود')
      );
    }

    // Get active round
    const activeRound = await prisma.round.findFirst({
      where: {
        leagueId: fantasyTeam.leagueId,
        transfersOpen: true,
        isCompleted: false
      },
      orderBy: { roundNumber: 'asc' }
    });

    if (!activeRound) {
      return res.json(formatResponse('success', 'الانتقالات مغلقة', {
        transfersOpen: false,
        remaining: 0,
        max: fantasyTeam.league.maxTransfersPerRound
      }));
    }

    // Count transfers made
    const transfersMade = await prisma.transfer.count({
      where: {
        fantasyTeamId: parseInt(fantasyTeamId),
        roundId: activeRound.id
      }
    });

    const remaining = fantasyTeam.league.maxTransfersPerRound - transfersMade;

    // Check if locked
    const now = new Date();
    const isLocked = activeRound.lockTime && now >= new Date(activeRound.lockTime);

    res.json(formatResponse('success', 'تم جلب الانتقالات المتبقية', {
      transfersOpen: !isLocked,
      remaining: isLocked ? 0 : remaining,
      max: fantasyTeam.league.maxTransfersPerRound,
      transfersMade,
      roundId: activeRound.id,
      roundName: activeRound.name,
      lockTime: activeRound.lockTime
    }));
  } catch (error) {
    next(error);
  }
};

/**
 * Get all transfers for a round (Admin)
 * GET /api/transfers/round/:roundId
 */
const getRoundTransfers = async (req, res, next) => {
  try {
    const { roundId } = req.params;

    const transfers = await prisma.transfer.findMany({
      where: { roundId: parseInt(roundId) },
      include: {
        fantasyTeam: {
          include: {
            user: { select: { id: true, name: true } }
          }
        },
        playerIn: {
          include: {
            team: { select: { id: true, name: true } }
          }
        },
        playerOut: {
          include: {
            team: { select: { id: true, name: true } }
          }
        }
      },
      orderBy: { transferDate: 'desc' }
    });

    res.json(formatResponse('success', 'تم جلب انتقالات الجولة', { transfers }));
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createTransfer,
  getTransferHistory,
  getRemainingTransfers,
  getRoundTransfers
};
