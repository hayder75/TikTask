const Campaign = require('../models/Campaign');
const CampaignApplication = require('../models/CampaignApplication');
const Category = require('../models/Category');
const User = require('../models/User');
const { validationResult } = require('express-validator');

const createCampaign = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { title, description, category, videoLink, minFollowerCount, allowedMarketers, baseBid } = req.body;

  try {
    const categoryExists = await Category.findById(category);
    if (!categoryExists) {
      return res.status(400).json({ message: 'Invalid category ID' });
    }

    const campaign = new Campaign({
      title,
      description,
      category,
      videoLink,
      minFollowerCount,
      allowedMarketers,
      baseBid,
      createdBy: req.user._id,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    });

    await campaign.save();
    res.status(201).json(campaign);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

const getCampaigns = async (req, res) => {
  try {
    const query = {};
    if (req.user.role === 'seller') query.createdBy = req.user._id;
    else if (req.user.role === 'marketer') query.status = 'active';

    const campaigns = await Campaign.find(query).populate('category', 'name');
    const campaignsWithCounts = await Promise.all(campaigns.map(async (campaign) => {
      const applicationCount = await CampaignApplication.countDocuments({ campaignId: campaign._id, status: 'accepted' });
      return { ...campaign.toObject(), applicationCount };
    }));

    res.json(campaignsWithCounts);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

const getCampaignById = async (req, res) => {
  const { campaignId } = req.params;

  try {
    const campaign = await Campaign.findById(campaignId).populate('category', 'name');
    if (!campaign) {
      return res.status(404).json({ message: 'Campaign not found' });
    }
    if (campaign.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const applicationCount = await CampaignApplication.countDocuments({ campaignId, status: 'accepted' });
    const acceptedCount = await CampaignApplication.countDocuments({ campaignId, status: 'accepted' });

    res.json({ ...campaign.toObject(), applicationCount, acceptedCount });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

const shortlistMarketers = async (req, res) => {
  const { campaignId } = req.params;
  const { applicationIds } = req.body;

  try {
    // Validate input
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    if (!applicationIds || !Array.isArray(applicationIds) || applicationIds.length === 0) {
      return res.status(400).json({ message: 'applicationIds must be a non-empty array' });
    }

    // Find the campaign
    const campaign = await Campaign.findById(campaignId);
    if (!campaign) {
      return res.status(404).json({ message: 'Campaign not found' });
    }
    if (campaign.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    if (campaign.status !== 'active') {
      return res.status(400).json({ message: 'Campaign is not active' });
    }

    // Check current accepted count
    const acceptedCount = await CampaignApplication.countDocuments({ campaignId, status: 'accepted' });
    if (acceptedCount + applicationIds.length > campaign.allowedMarketers) {
      return res.status(400).json({ message: 'Exceeds allowed marketers limit' });
    }

    // Validate and update applications
    const applications = await CampaignApplication.find({ _id: { $in: applicationIds }, campaignId, status: 'pending' });
    if (applications.length !== applicationIds.length) {
      return res.status(400).json({ message: 'One or more application IDs are invalid or not pending' });
    }

    const updates = applications.map(application => ({
      updateOne: {
        filter: { _id: application._id },
        update: { $set: { status: 'accepted' } },
      },
    }));

    await CampaignApplication.bulkWrite(updates);

    // Notify accepted marketers (simulated)
    const acceptedApplications = await CampaignApplication.find({ _id: { $in: applicationIds } })
      .populate('marketerId', 'name email');
    acceptedApplications.forEach(app => {
      console.log(`Sending video link to ${app.marketerId.name} at ${app.marketerId.email}: ${campaign.videoLink}`);
    });

    // Update campaign status if limit reached
    if (acceptedCount + applicationIds.length === campaign.allowedMarketers) {
      campaign.status = 'completed';
    }
    await campaign.save();

    res.json({ message: `${applicationIds.length} marketers accepted` });
  } catch (error) {
    console.error('Error in shortlistMarketers:', error); // Debug log
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const getApplications = async (req, res) => {
  const { campaignId } = req.params;

  try {
    const campaign = await Campaign.findById(campaignId);
    if (!campaign) {
      return res.status(404).json({ message: 'Campaign not found' });
    }
    if (campaign.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const applications = await CampaignApplication.find({ campaignId, status: 'pending' })
      .populate('marketerId', 'name tiktokUsername followerCount');

    res.json(applications);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

const getAcceptedStats = async (req, res) => {
  const { campaignId } = req.params;

  try {
    const campaign = await Campaign.findById(campaignId);
    if (!campaign) {
      return res.status(404).json({ message: 'Campaign not found' });
    }
    if (campaign.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const applications = await CampaignApplication.find({ campaignId, status: 'accepted' })
      .populate('marketerId', 'name tiktokUsername');

    const stats = applications.map(app => ({
      ...app.toObject(),
      mockStats: {
        likes: Math.floor(Math.random() * 1000),
        views: Math.floor(Math.random() * 10000),
        comments: Math.floor(Math.random() * 100),
      },
    }));

    res.json(stats);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

const reopenCampaign = async (req, res) => {
  const { campaignId } = req.params;

  try {
    const campaign = await Campaign.findById(campaignId);
    if (!campaign) {
      return res.status(404).json({ message: 'Campaign not found' });
    }
    if (campaign.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    if (campaign.status !== 'hidden') {
      return res.status(400).json({ message: 'Campaign is not hidden' });
    }

    const acceptedCount = await CampaignApplication.countDocuments({ campaignId, status: 'accepted' });
    if (acceptedCount >= campaign.allowedMarketers) {
      return res.status(400).json({ message: 'Cannot reopen with full marketer limit' });
    }

    campaign.status = 'active';
    campaign.expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await campaign.save();

    res.json(campaign);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  createCampaign,
  getCampaigns,
  getCampaignById,
  shortlistMarketers,
  getApplications,
  getAcceptedStats,
  reopenCampaign,
};