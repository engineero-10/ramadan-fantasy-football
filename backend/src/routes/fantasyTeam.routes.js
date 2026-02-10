/**
 * Fantasy Team Routes
 */

const express = require('express');
const router = express.Router();
const fantasyTeamController = require('../controllers/fantasyTeam.controller');
const { authenticate } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { createFantasyTeamValidator, idParamValidator } = require('../validators');

router.use(authenticate);

// User routes
router.post('/', createFantasyTeamValidator, validate, fantasyTeamController.createFantasyTeam);
router.get('/my', fantasyTeamController.getMyFantasyTeam); // Get user's first fantasy team
router.get('/:leagueId', fantasyTeamController.getMyFantasyTeam);
router.get('/team/:id', idParamValidator, validate, fantasyTeamController.getFantasyTeam);
router.put('/:id', idParamValidator, validate, fantasyTeamController.updateFantasyTeam);
router.put('/:id/lineup', idParamValidator, validate, fantasyTeamController.updateLineup);
router.get('/:id/points/:roundId', fantasyTeamController.getRoundPoints);

module.exports = router;
