/**
 * Admin Management Routes
 * Owner-only routes to manage admin accounts
 */

const express = require('express');
const router = express.Router();
const adminManagementController = require('../controllers/adminManagement.controller');
const { authenticate, isOwner } = require('../middleware/auth');

// All routes require authentication and owner role
router.use(authenticate);
router.use(isOwner);

// System stats (must be before /:id to avoid conflict)
router.get('/stats', adminManagementController.getSystemStats);

// CRUD operations
router.get('/', adminManagementController.getAdmins);
router.post('/', adminManagementController.createAdmin);
router.get('/:id', adminManagementController.getAdmin);
router.put('/:id', adminManagementController.updateAdmin);
router.delete('/:id', adminManagementController.deleteAdmin);

module.exports = router;
