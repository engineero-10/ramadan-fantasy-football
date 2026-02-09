/**
 * Round Routes
 */

const express = require('express');
const router = express.Router();
const roundController = require('../controllers/round.controller');
const { authenticate, isAdmin } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { createRoundValidator, idParamValidator } = require('../validators');

router.use(authenticate);

// User routes
router.get('/', roundController.getRounds);
router.get('/current/:leagueId', roundController.getCurrentRound);
router.get('/:id', idParamValidator, validate, roundController.getRound);

// Admin routes
router.post('/', isAdmin, createRoundValidator, validate, roundController.createRound);
router.put('/:id', isAdmin, idParamValidator, validate, roundController.updateRound);
router.put('/:id/transfers', isAdmin, idParamValidator, validate, roundController.toggleTransfers);
router.put('/:id/complete', isAdmin, idParamValidator, validate, roundController.completeRound);
router.delete('/:id', isAdmin, idParamValidator, validate, roundController.deleteRound);

module.exports = router;
