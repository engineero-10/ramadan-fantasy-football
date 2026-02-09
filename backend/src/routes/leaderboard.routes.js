/**
 * Leaderboard Routes
 */

const express = require('express');
const router = express.Router();
const leaderboardController = require('../controllers/leaderboard.controller');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

// Leaderboard routes
router.get('/:leagueId', leaderboardController.getLeaderboard);
router.get('/:leagueId/round/:roundId', leaderboardController.getRoundLeaderboard);
router.get('/:leagueId/my-rank', leaderboardController.getMyRank);
router.get('/:leagueId/stats', leaderboardController.getLeagueStats);
router.get('/h2h/:teamId1/:teamId2', leaderboardController.getHeadToHead);

module.exports = router;
