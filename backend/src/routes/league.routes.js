/**
 * League Routes
 */

const express = require('express');
const router = express.Router();
const leagueController = require('../controllers/league.controller');
const { authenticate, isAdmin } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { createLeagueValidator, joinLeagueValidator, idParamValidator } = require('../validators');

// Public routes
router.get('/code/:code', leagueController.getLeagueByCode);

// Protected routes
router.use(authenticate);

// User routes
router.get('/', leagueController.getLeagues);
router.get('/my-admin-leagues', leagueController.getMyAdminLeagues);
router.get('/:id', idParamValidator, validate, leagueController.getLeague);
router.get('/:id/members', idParamValidator, validate, leagueController.getLeagueMembers);
router.post('/join', joinLeagueValidator, validate, leagueController.joinLeague);

// Admin routes (league admins or system admin)
router.put('/:id/members/:userId/role', idParamValidator, validate, leagueController.updateMemberRole);

// System Admin routes
router.post('/', isAdmin, createLeagueValidator, validate, leagueController.createLeague);
router.put('/:id', isAdmin, idParamValidator, validate, leagueController.updateLeague);
router.delete('/:id', isAdmin, idParamValidator, validate, leagueController.deleteLeague);

module.exports = router;
