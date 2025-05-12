const express = require('express');
const {
  getAvailableCampaigns,
  applyForCampaign,
  getMyApplications,
  getCampaignApplications,
  shortlistApplicants,
  submitVideo,
  getAcceptedVideoStats,
  reviewApplication,
  withdrawApplication,
} = require('../controllers/applicationController');
const { protect, restrictTo } = require('../utils/authMiddleware');
const { check } = require('express-validator');

const router = express.Router();

router.get('/available', protect, restrictTo('marketer'), getAvailableCampaigns);

router.post(
  '/:campaignId/apply',
  protect,
  restrictTo('marketer'),
  applyForCampaign
);

router.get('/', protect, restrictTo('marketer'), getMyApplications);

router.get('/campaign/:campaignId', protect, restrictTo('seller'), getCampaignApplications);

router.post(
  '/:campaignId/shortlist',
  protect,
  restrictTo('seller'),
  [check('applicationIds').isArray()],
  shortlistApplicants
);

router.post(
  '/:applicationId/submit-video',
  protect,
  restrictTo('marketer'),
  [check('tiktokVideoLink', 'TikTok video link is required').not().isEmpty()],
  submitVideo
);

router.get('/campaign/:campaignId/accepted-stats', protect, restrictTo('seller'), getAcceptedVideoStats);

router.patch(
  '/:applicationId/review',
  protect,
  restrictTo('seller'),
  [check('status', 'Status must be accepted or rejected').isIn(['accepted', 'rejected'])],
  reviewApplication
);

router.patch('/:applicationId/withdraw', protect, restrictTo('marketer'), withdrawApplication);

module.exports = router;