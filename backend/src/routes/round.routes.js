/**
 * Round Routes
 */

const express = require('express');
const router = express.Router();
const roundController = require('../controllers/round.controller');
const { authenticate } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { createRoundValidator, idParamValidator } = require('../validators');

router.use(authenticate);

// User routes
router.get('/', roundController.getRounds);
router.get('/current/:leagueId', roundController.getCurrentRound);
router.get('/:id', idParamValidator, validate, roundController.getRound);
router.get('/:id/stats', idParamValidator, validate, roundController.getRoundStats);
router.get('/:id/my-stats', idParamValidator, validate, roundController.getMyRoundStats);

// Admin routes (permission checked in controller via hasLeagueAccess)
router.post('/', createRoundValidator, validate, roundController.createRound);
router.put('/:id', idParamValidator, validate, roundController.updateRound);
router.put('/:id/transfers', idParamValidator, validate, roundController.toggleTransfers);
router.put('/:id/complete', idParamValidator, validate, roundController.completeRound);
router.delete('/:id', idParamValidator, validate, roundController.deleteRound);

module.exports = router;
