/**
 * Match Routes
 */

const express = require('express');
const router = express.Router();
const matchController = require('../controllers/match.controller');
const { authenticate } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { 
  createMatchValidator, 
  updateMatchResultValidator, 
  updateMatchStatsValidator,
  idParamValidator 
} = require('../validators');

router.use(authenticate);

// User routes
router.get('/', matchController.getMatches);
router.get('/:id', idParamValidator, validate, matchController.getMatch);

// Admin routes (permission checked in controller via hasLeagueAccess)
router.post('/', createMatchValidator, validate, matchController.createMatch);
router.put('/:id', idParamValidator, validate, matchController.updateMatch);
router.put('/:id/result', idParamValidator, updateMatchResultValidator, validate, matchController.updateMatchResult);
router.put('/:id/stats', idParamValidator, updateMatchStatsValidator, validate, matchController.updateMatchStats);
router.delete('/:id', idParamValidator, validate, matchController.deleteMatch);

module.exports = router;
