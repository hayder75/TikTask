const Campaign = require('../models/Campaign');
const CampaignApplication = require('../models/CampaignApplication');
const User = require('../models/User');
const { validationResult } = require('express-validator');
const { getMockVideoInfo } = require('../utils/mockTikTokData');

const getAvailableCampaigns = async (req, res) => {
  const { categoryId, minFollowers } = req.query;

  try {
    const query = { status: 'active' };
    if (categoryId) query.category = categoryId;
    if (minFollowers) query.minFollowerCount = { $lte: minFollowers };

    const campaigns = await Campaign.find(query)
      .populate('category', 'name')
      .where('minFollowerCount').lte(req.user.followerCount);

    res.json(campaigns);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

const applyForCampaign = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { campaignId } = req.params;
  const { proposedLikes, proposedViews, proposedPrice } = req.body;

  try {
    const campaign = await Campaign.findById(campaignId);
    if (!campaign) {
      return res.status(404).json({ message: 'Campaign not found' });
    }
    if (req.user.followerCount < campaign.minFollowerCount) {
      return res.status(400).json({ message: 'Insufficient followers' });
    }

    const existingApplication = await CampaignApplication.findOne({
      campaignId,
      marketerId: req.user._id,
    });
    if (existingApplication) {
      return res.status(400).json({ message: 'Already applied' });
    }

    const applicationCount = await CampaignApplication.countDocuments({
      campaignId,
      status: 'accepted',
    });
    if (applicationCount >= campaign.allowedMarketers) {
      return res.status(400).json({ message: 'Campaign slots full' });
    }

    const application = new CampaignApplication({
      campaignId,
      marketerId: req.user._id,
      bid: { proposedLikes, proposedViews, proposedPrice },
    });

    await application.save();
    res.status(201).json(application);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

const getMyApplications = async (req, res) => {
  try {
    const applications = await CampaignApplication.find({
      marketerId: req.user._id,
    }).populate('campaignId', 'title description');
    res.json(applications);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

const attachTikTokLink = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { applicationId } = req.params;
  const { tiktokVideoLink } = req.body;

  try {
    const application = await CampaignApplication.findById(applicationId);
    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }
    if (application.marketerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    if (application.status !== 'accepted') {
      return res.status(400).json({ message: 'Application must be accepted to attach TikTok link' });
    }

    const user = await User.findById(req.user._id);
    if (!user.tiktokUsername) {
      return res.status(400).json({ message: 'TikTok account not linked' });
    }

    // Extract video ID from TikTok URL
    const videoIdMatch = tiktokVideoLink.match(/\/video\/(\d+)/);
    if (!videoIdMatch) {
      return res.status(400).json({ message: 'Invalid TikTok video URL' });
    }
    const videoId = videoIdMatch[1];

    // Verify video ownership using mock data
    const videoInfo = getMockVideoInfo(videoId);
    if (videoInfo.username !== user.tiktokUsername) {
      return res.status(400).json({ message: 'Video does not belong to your TikTok account' });
    }

    application.tiktokVideoLink = tiktokVideoLink;
    application.statsSnapshot = {
      likes: videoInfo.like_count,
      views: videoInfo.view_count,
      lastUpdated: new Date(),
    };
    await application.save();
    res.json(application);
  } catch (error) {
    res.status(500).json({ message: 'Server error: ' + error.message });
  }
};

const submitApplication = async (req, res) => {
  const { applicationId } = req.params;

  try {
    const application = await CampaignApplication.findById(applicationId);
    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }
    if (application.marketerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    if (!application.tiktokVideoLink) {
      return res.status(400).json({ message: 'TikTok link required' });
    }

    application.status = 'completed';
    await application.save();
    res.json({ message: 'Application submitted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

const withdrawApplication = async (req, res) => {
  const { applicationId } = req.params;

  try {
    const application = await CampaignApplication.findById(applicationId);
    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }
    if (application.marketerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    if (application.status !== 'pending') {
      return res.status(400).json({ message: 'Cannot withdraw non-pending application' });
    }

    application.status = 'withdrawn';
    await application.save();
    res.json({ message: 'Application withdrawn' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

const reviewApplication = async (req, res) => {
  const { applicationId } = req.params;
  const { status } = req.body;

  if (!['accepted', 'rejected'].includes(status)) {
    return res.status(400).json({ message: 'Invalid status' });
  }

  try {
    const application = await CampaignApplication.findById(applicationId).populate('campaignId');
    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }
    if (application.campaignId.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    if (status === 'accepted') {
      const acceptedCount = await CampaignApplication.countDocuments({
        campaignId: application.campaignId,
        status: 'accepted',
      });
      if (acceptedCount >= application.campaignId.allowedMarketers) {
        return res.status(400).json({ message: 'Campaign slots full' });
      }
    }

    application.status = status;
    await application.save();
    res.json(application);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getAvailableCampaigns,
  applyForCampaign,
  getMyApplications,
  attachTikTokLink,
  submitApplication,
  withdrawApplication,
  reviewApplication,
};