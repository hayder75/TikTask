const express = require('express');
const { createCampaign, getCampaigns, getCampaignById, updateCampaign, reopenCampaign } = require('../controllers/campaignController');
const { protect, restrictTo } = require('../utils/authMiddleware');
const { check } = require('express-validator');

const router = express.Router();

router.post(
  '/',
  protect,
  restrictTo('seller'),
  [
    check('title', 'Title is required').not().isEmpty(),
    check('description', 'Description is required').not().isEmpty(),
    check('category', 'Category is required').not().isEmpty(),
    check('minFollowerCount', 'Minimum follower count is required').isInt({ min: 0 }),
    check('allowedMarketers', 'Allowed marketers is required').isInt({ min: 1 }),
    check('baseBid.proposedLikes', 'Proposed likes is required').isInt({ min: 0 }),
    check('baseBid.proposedViews', 'Proposed views is required').isInt({ min: 0 }),
    check('baseBid.proposedPrice', 'Proposed price is required').isFloat({ min: 0 }),
  ],
  createCampaign
);

router.get('/', protect, getCampaigns);

router.get('/:campaignId', protect, restrictTo('seller'), getCampaignById);

router.put('/:campaignId', protect, restrictTo('seller'), updateCampaign);

router.patch('/:campaignId/reopen', protect, restrictTo('seller'), reopenCampaign);

module.exports = router;