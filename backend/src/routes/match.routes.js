/**
 * Match Routes
 */

const express = require('express');
const router = express.Router();
const matchController = require('../controllers/match.controller');
const { authenticate, isAdmin } = require('../middleware/auth');
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

// Admin routes
router.post('/', isAdmin, createMatchValidator, validate, matchController.createMatch);
router.put('/:id', isAdmin, idParamValidator, validate, matchController.updateMatch);
router.put('/:id/result', isAdmin, idParamValidator, updateMatchResultValidator, validate, matchController.updateMatchResult);
router.put('/:id/stats', isAdmin, idParamValidator, updateMatchStatsValidator, validate, matchController.updateMatchStats);
router.delete('/:id', isAdmin, idParamValidator, validate, matchController.deleteMatch);

module.exports = router;
