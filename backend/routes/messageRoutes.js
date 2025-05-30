const express = require('express');
const { protect } = require('../utils/authMiddleware');
const { sendNotification, getNotifications } = require('../controllers/messageController');

const router = express.Router();

router.post('/send', protect, sendNotification);
router.get('/', protect, getNotifications);

module.exports = router;