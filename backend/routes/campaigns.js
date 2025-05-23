const express = require('express');
const { protect } = require('../utils/authMiddleware');
const {
  createCampaign,
  getCampaigns,
  getCampaignById,
  shortlistMarketers,
  getApplications,
  getAcceptedStats,
  reopenCampaign,
} = require('../controllers/campaignController');
const { check } = require('express-validator');

const router = express.Router();

router.post(
  '/',
  protect,
  [
    check('title', 'Title is required').not().isEmpty(),
    check('description', 'Description is required').not().isEmpty(),
    check('category', 'Category ID is required').not().isEmpty(),
    check('videoLink', 'Video link is required').not().isEmpty(),
    check('minFollowerCount', 'Minimum follower count is required').isInt({ min: 0 }),
    check('allowedMarketers', 'Allowed marketers is required').isInt({ min: 1 }),
    check('baseBid.proposedLikes', 'Proposed likes is required').isInt({ min: 0 }),
    check('baseBid.proposedViews', 'Proposed views is required').isInt({ min: 0 }),
    check('baseBid.proposedPrice', 'Proposed price is required').isInt({ min: 0 }),
  ],
  createCampaign
);

router.get('/', protect, getCampaigns);
router.get('/:campaignId', protect, getCampaignById);
router.post('/:campaignId/shortlist', protect, [
  check('applicationIds', 'Application IDs are required').isArray({ min: 1 }),
], shortlistMarketers);
router.get('/:campaignId/applications', protect, getApplications);
router.get('/:campaignId/accepted-stats', protect, getAcceptedStats);
router.patch('/:campaignId/reopen', protect, reopenCampaign);

module.exports = router;