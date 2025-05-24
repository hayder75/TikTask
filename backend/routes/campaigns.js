const express = require('express');
const { protect } = require('../utils/authMiddleware');
const { createCampaign, getCampaigns, getCampaignById, shortlistMarketers, getApplications, getAcceptedStats, reopenCampaign } = require('../controllers/campaignController');
const { calculateBudget } = require('../controllers/paymentController');

const router = express.Router();

router.post('/calculate-budget', protect, calculateBudget);
router.post('/', protect, createCampaign);
router.get('/', protect, getCampaigns);
router.get('/:campaignId', protect, getCampaignById);
router.post('/:campaignId/shortlist', protect, shortlistMarketers);
router.get('/:campaignId/applications', protect, getApplications);
router.get('/:campaignId/accepted-stats', protect, getAcceptedStats);
router.patch('/:campaignId/reopen', protect, reopenCampaign);

module.exports = router;