const express = require('express');
const { protect } = require('../utils/authMiddleware');
const { sendMessage, getMessages, markMessageAsRead } = require('../controllers/messageController');

const router = express.Router();

router.post('/send', protect, sendMessage);
router.get('/', protect, getMessages);
router.put('/:messageId/read', protect, markMessageAsRead);

module.exports = router;