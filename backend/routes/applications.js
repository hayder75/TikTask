const express = require('express');
const {
  getAvailableCampaigns,
  applyForCampaign,
  getMyApplications,
  attachTikTokLink,
  submitApplication,
  withdrawApplication,
  reviewApplication,
} = require('../controllers/applicationController');
const { protect, restrictTo } = require('../utils/authMiddleware');
const { check } = require('express-validator');

const router = express.Router();

router.get('/available', protect, restrictTo('marketer'), getAvailableCampaigns);

router.post(
  '/:campaignId/apply',
  protect,
  restrictTo('marketer'),
  [
    check('proposedLikes', 'Proposed likes is required').isInt({ min: 0 }),
    check('proposedViews', 'Proposed views is required').isInt({ min: 0 }),
    check('proposedPrice', 'Proposed price is required').isFloat({ min: 0 }),
  ],
  applyForCampaign
);

router.get('/', protect, restrictTo('marketer'), getMyApplications);

router.patch(
  '/:applicationId/attach-tiktok',
  protect,
  restrictTo('marketer'),
  [check('tiktokVideoLink', 'TikTok video link is required').not().isEmpty()],
  attachTikTokLink
);

router.patch('/:applicationId/submit', protect, restrictTo('marketer'), submitApplication);

router.patch('/:applicationId/withdraw', protect, restrictTo('marketer'), withdrawApplication);

router.patch(
  '/:applicationId/review',
  protect,
  restrictTo('seller'),
  [check('status', 'Status must be accepted or rejected').isIn(['accepted', 'rejected'])],
  reviewApplication
);

module.exports = router;