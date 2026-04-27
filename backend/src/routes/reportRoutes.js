const express = require('express');
const reportController = require('../controllers/reportController');
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');
const validate = require('../middleware/validate');
const { submitReport, updateReportStatus } = require('../validators/reportValidator');

const auditLogger = require('../middleware/auditLogger');

const router = express.Router();

router.post('/', authenticate, validate(submitReport), reportController.submitReport);
router.get('/', authenticate, reportController.getReports);
router.get('/:id', authenticate, reportController.getReport);
router.put('/:id/status', authenticate, authorize('officer', 'detective', 'admin'), validate(updateReportStatus), auditLogger('UPDATE', 'Report'), reportController.updateReportStatus);
router.delete('/:id', authenticate, authorize('admin'), auditLogger('DELETE', 'Report'), reportController.deleteReport);

module.exports = router;
