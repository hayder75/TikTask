const Campaign = require('../models/Campaign');
const CampaignApplication = require('../models/CampaignApplication');
const User = require('../models/User');
const { validationResult } = require('express-validator');
const { getMockVideoInfo } = require('../utils/mockTikTokData');

const getAvailableCampaigns = async (req, res) => {
  try {
    const query = { status: 'active' };
    if (req.user.followerCount) {
      query.minFollowerCount = { $lte: req.user.followerCount };
    }

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

const applyForCampaign = async (req, res) => {
  const { campaignId } = req.params;
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const campaign = await Campaign.findById(campaignId);
    if (!campaign) {
      return res.status(404).json({ message: 'Campaign not found' });
    }
    if (campaign.status !== 'active') {
      return res.status(400).json({ message: 'Campaign is not active' });
    }
    if (req.user.followerCount < campaign.minFollowerCount) {
      return res.status(400).json({ message: 'Insufficient followers' });
    }
    if (req.user.connectionCoins <= 0) {
      return res.status(400).json({ message: 'Insufficient connection coins' });
    }

    const existingApplication = await CampaignApplication.findOne({
      campaignId,
      marketerId: req.user._id,
    });
    if (existingApplication) {
      return res.status(400).json({ message: 'Already applied' });
    }

    const user = await User.findById(req.user._id);
    user.connectionCoins -= 1;
    await user.save();

    const application = new CampaignApplication({
      campaignId,
      marketerId: req.user._id,
    });

    await application.save();
    res.status(201).json(application);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

const submitLink = async (req, res) => {
  const { applicationId } = req.params;
  const { tiktokVideoLink } = req.body;

  try {
    const application = await CampaignApplication.findById(applicationId).populate('marketerId campaignId');
    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }
    if (application.marketerId._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    if (application.status !== 'accepted') {
      return res.status(400).json({ message: 'Only accepted applications can submit links' });
    }

    const videoIdMatch = tiktokVideoLink.match(/\/video\/(\d+)/);
    if (!videoIdMatch) {
      return res.status(400).json({ message: 'Invalid TikTok video URL' });
    }
    const videoId = videoIdMatch[1];

    const videoInfo = getMockVideoInfo(videoId);
    if (videoInfo.username !== application.marketerId.tiktokUsername) {
      return res.status(400).json({ message: 'Video does not belong to your TikTok account' });
    }

    application.submission = {
      tiktokVideoLink,
      statsSnapshot: {
        likes: videoInfo.like_count,
        views: videoInfo.view_count,
        comments: videoInfo.comment_count,
        lastUpdated: new Date(),
      },
    };
    await application.save();

    res.json(application);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

const abortApplication = async (req, res) => {
  const { applicationId } = req.params;

  try {
    const application = await CampaignApplication.findById(applicationId).populate('campaignId');
    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }
    if (application.campaignId.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    if (application.status !== 'accepted') {
      return res.status(400).json({ message: 'Only accepted applications can be aborted' });
    }

    application.status = 'aborted';
    await application.save();

    const acceptedCount = await CampaignApplication.countDocuments({
      campaignId: application.campaignId._id,
      status: 'accepted',
    });
    if (acceptedCount === 0 && application.campaignId.status === 'completed') {
      application.campaignId.status = 'hidden';
    } else if (acceptedCount < application.campaignId.allowedMarketers) {
      application.campaignId.status = 'active';
    }
    await application.campaignId.save();

    res.json({ message: 'Marketer aborted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { getAvailableCampaigns, applyForCampaign, submitLink, abortApplication };