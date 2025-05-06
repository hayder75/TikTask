const express = require('express');
const { createCampaign, getCampaigns, updateCampaign } = require('../controllers/campaignController');
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
    check('budget', 'Budget is required').isFloat({ min: 0 }),
  ],
  createCampaign
);

router.get('/', protect, getCampaigns);

router.put('/:campaignId', protect, restrictTo('seller'), updateCampaign);

module.exports = router;