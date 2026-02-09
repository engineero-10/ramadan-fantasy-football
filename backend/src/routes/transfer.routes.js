/**
 * Transfer Routes
 */

const express = require('express');
const router = express.Router();
const transferController = require('../controllers/transfer.controller');
const { authenticate, isAdmin } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { createTransferValidator } = require('../validators');

router.use(authenticate);

// User routes
router.post('/', createTransferValidator, validate, transferController.createTransfer);
router.get('/:fantasyTeamId', transferController.getTransferHistory);
router.get('/:fantasyTeamId/remaining', transferController.getRemainingTransfers);

// Admin routes
router.get('/round/:roundId', isAdmin, transferController.getRoundTransfers);

module.exports = router;
