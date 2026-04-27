const express = require('express');
const caseController = require('../controllers/caseController');
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');
const validate = require('../middleware/validate');
const { createCase, assignCase, addCaseNote } = require('../validators/caseValidator');

const auditLogger = require('../middleware/auditLogger');

const router = express.Router();

router.use(authenticate);

router.post('/', authorize('admin', 'detective', 'officer'), validate(createCase), auditLogger('CREATE', 'Case'), caseController.createCase);
router.get('/', caseController.getCases);
router.get('/:id', caseController.getCase);
router.put('/:id', authorize('admin', 'detective', 'officer'), caseController.updateCase);
router.post('/:id/charges', authorize('admin', 'detective', 'officer'), caseController.addCaseCharge);
router.post('/:id/assign', authorize('admin', 'detective'), validate(assignCase), auditLogger('ASSIGN', 'Case'), caseController.assignCase);
router.post('/:id/notes', authorize('admin', 'detective', 'officer'), validate(addCaseNote), auditLogger('ADD_NOTE', 'Case'), caseController.addCaseNote);
router.post('/merge', authorize('admin', 'detective'), auditLogger('MERGE', 'Case'), caseController.mergeCases);
router.get('/:id/timeline', caseController.getCaseTimeline);

module.exports = router;
