const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/publicController');
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');

// ── Public routes (no auth) ──────────────────────────────────────────────────
router.get('/missing-persons', ctrl.getMissingPersons);
router.get('/missing-persons/:id', ctrl.getMissingPerson);

router.get('/fugitives', ctrl.getFugitives);
router.get('/fugitives/:id', ctrl.getFugitive);

// ── Protected routes (officer / detective / admin only) ──────────────────────
router.use(authenticate);

router.post('/missing-persons', authorize('officer', 'detective', 'admin'), ctrl.createMissingPerson);
router.put('/missing-persons/:id', authorize('officer', 'detective', 'admin'), ctrl.updateMissingPerson);
router.delete('/missing-persons/:id', authorize('officer', 'detective', 'admin'), ctrl.deleteMissingPerson);

router.post('/fugitives', authorize('officer', 'detective', 'admin'), ctrl.createFugitive);
router.put('/fugitives/:id', authorize('officer', 'detective', 'admin'), ctrl.updateFugitive);
router.delete('/fugitives/:id', authorize('officer', 'detective', 'admin'), ctrl.deleteFugitive);

module.exports = router;
