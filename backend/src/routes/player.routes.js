/**
 * Player Routes
 */

const express = require('express');
const router = express.Router();
const playerController = require('../controllers/player.controller');
const { authenticate } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { createPlayerValidator, idParamValidator } = require('../validators');

router.use(authenticate);

// User routes
router.get('/', playerController.getPlayers);
router.get('/top/:leagueId', playerController.getTopPlayers);
router.get('/:id', idParamValidator, validate, playerController.getPlayer);

// Admin routes (permission checked in controller via hasLeagueAccess)
router.post('/', createPlayerValidator, validate, playerController.createPlayer);
router.put('/:id', idParamValidator, validate, playerController.updatePlayer);
router.delete('/:id', idParamValidator, validate, playerController.deletePlayer);

module.exports = router;
