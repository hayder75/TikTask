const express = require('express');
const { protect } = require('../utils/authMiddleware');
const { 
  createCampaign, 
  getCampaigns, 
  getCampaignById, 
  shortlistMarketers, 
  getApplications, 
  getAcceptedStats, 
  reopenCampaign 
} = require('../controllers/campaignController');
const { calculateBudget } = require('../controllers/paymentController');

const router = express.Router();

// Calculate budget estimate
router.post('/calculate-budget', protect, calculateBudget);

// Create a new campaign (seller only)
router.post('/', protect, createCampaign);

// Get campaigns (filtered by role: seller sees own campaigns, marketer sees active campaigns)
router.get('/', protect, getCampaigns);

// Get a specific campaign by ID (seller only, must be the creator)
router.get('/:campaignId', protect, getCampaignById);

// Shortlist marketers for a campaign (seller only, must be the creator)
router.post('/:campaignId/shortlist', protect, shortlistMarketers);

// Get pending applications for a campaign (seller only, must be the creator)
router.get('/:campaignId/applications', protect, getApplications);

// Get stats for accepted applications (seller only, must be the creator)
router.get('/:campaignId/accepted-stats', protect, getAcceptedStats);

// Reopen a hidden campaign (seller only, must be the creator)
router.patch('/:campaignId/reopen', protect, reopenCampaign);

module.exports = router;