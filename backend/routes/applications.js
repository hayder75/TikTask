const express = require('express');
const { protect } = require('../utils/authMiddleware');
const { applyForCampaign, getAvailableCampaigns, submitLink , getMarketerCampaigns} = require('../controllers/applicationController');
const { abortApplication } = require('../controllers/paymentController');

const router = express.Router();

router.post('/:campaignId/apply', protect, applyForCampaign);
router.get('/available', protect, getAvailableCampaigns);
router.get('/marketer/campaigns', protect, getMarketerCampaigns);
router.post('/:applicationId/submit-link', protect, submitLink);
router.patch('/:applicationId/abort', protect, abortApplication);

module.exports = router;