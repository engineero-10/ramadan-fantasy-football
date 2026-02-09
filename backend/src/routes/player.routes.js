/**
 * Player Routes
 */

const express = require('express');
const router = express.Router();
const playerController = require('../controllers/player.controller');
const { authenticate, isAdmin } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { createPlayerValidator, idParamValidator } = require('../validators');

router.use(authenticate);

// User routes
router.get('/', playerController.getPlayers);
router.get('/top/:leagueId', playerController.getTopPlayers);
router.get('/:id', idParamValidator, validate, playerController.getPlayer);

// Admin routes
router.post('/', isAdmin, createPlayerValidator, validate, playerController.createPlayer);
router.put('/:id', isAdmin, idParamValidator, validate, playerController.updatePlayer);
router.delete('/:id', isAdmin, idParamValidator, validate, playerController.deletePlayer);

module.exports = router;
