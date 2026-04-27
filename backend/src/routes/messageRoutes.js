const express = require('express');
const messageController = require('../controllers/messageController');
const authenticate = require('../middleware/authenticate');

const router = express.Router();

router.use(authenticate);

router.post('/send', messageController.sendMessage);
router.get('/conversations', messageController.getConversations);
router.get('/conversations/:userId', messageController.getConversation);
router.get('/users', messageController.searchUsers);
router.put('/:id/read', messageController.markMessageRead);

module.exports = router;
