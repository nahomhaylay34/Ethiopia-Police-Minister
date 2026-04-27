const express = require('express');
const adminController = require('../controllers/adminController');
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');

const router = express.Router();

router.use(authenticate, authorize('admin'));

router.get('/dashboard/stats', adminController.getStats);
router.get('/dashboard/trends', adminController.getTrends);
router.get('/dashboard/crime-distribution', adminController.getCrimeDistribution);
router.get('/dashboard/status-distribution', adminController.getStatusDistribution);
router.get('/dashboard/officer-load', adminController.getOfficerLoad);
router.get('/dashboard/alerts', adminController.getAlerts);
router.post('/export', adminController.exportData);
router.get('/audit-logs', adminController.getAuditLogs);

// Admin user management (only admin can access)
router.get('/users', adminController.getUsers);
router.post('/users', adminController.createUser);
router.put('/users/:id', adminController.updateUser);
router.delete('/users/:id', adminController.deleteUser);
router.post('/announcements', adminController.createAnnouncement);

module.exports = router;
