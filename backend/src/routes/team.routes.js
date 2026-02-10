/**
 * Team Routes
 */

const express = require('express');
const router = express.Router();
const teamController = require('../controllers/team.controller');
const { authenticate } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { createTeamValidator, idParamValidator } = require('../validators');

router.use(authenticate);

// User routes
router.get('/', teamController.getTeams);
router.get('/:id', idParamValidator, validate, teamController.getTeam);

// Admin routes (permission checked in controller via hasLeagueAccess)
router.post('/', createTeamValidator, validate, teamController.createTeam);
router.put('/:id', idParamValidator, validate, teamController.updateTeam);
router.delete('/:id', idParamValidator, validate, teamController.deleteTeam);

module.exports = router;
