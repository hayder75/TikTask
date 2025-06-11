const express = require('express');
const router = express.Router();
const { submitVideoForTest, getVideoStats, checkAvatar } = require('../controllers/tiktokTestController');

router.post('/submit-video', submitVideoForTest);
router.get('/stats/:videoUrl', getVideoStats);
router.post('/check-avatar', checkAvatar); // New endpoint for avatar checking

module.exports = router;