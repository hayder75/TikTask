const express = require('express');
const { protect } = require('../utils/authMiddleware');
const {
  getAvailableCampaigns,
  applyForCampaign,
  submitLink,
  abortApplication,
} = require('../controllers/applicationController');
const { check } = require('express-validator');

const router = express.Router();

router.get('/available', protect, getAvailableCampaigns);
router.post('/:campaignId/apply', protect, applyForCampaign);
router.post('/:applicationId/submit-link', protect, [
  check('tiktokVideoLink', 'TikTok video link is required').not().isEmpty(),
], submitLink);
router.patch('/:applicationId/abort', protect, abortApplication);

module.exports = router;