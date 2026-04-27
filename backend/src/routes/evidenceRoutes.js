const express = require('express');
const evidenceController = require('../controllers/evidenceController');
const authenticate = require('../middleware/authenticate');
const upload = require('../middleware/upload');

const router = express.Router();

router.use(authenticate);

router.post('/upload', upload.array('evidence', 5), evidenceController.uploadEvidence);
router.get('/:id', evidenceController.getEvidence);
router.delete('/:id', evidenceController.deleteEvidence);

module.exports = router;
