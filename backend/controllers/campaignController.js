const Campaign = require('../models/Campaign');
const { validationResult } = require('express-validator');

const createCampaign = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { title, description, category, minFollowerCount, allowedMarketers, budget } = req.body;

  try {
    const campaign = new Campaign({
      title,
      description,
      category,
      minFollowerCount,
      allowedMarketers,
      budget,
      createdBy: req.user._id,
    });

    await campaign.save();
    res.status(201).json(campaign);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

const getCampaigns = async (req, res) => {
  const { categoryId, status } = req.query;

  try {
    const query = {};
    if (categoryId) query.category = categoryId;
    if (status) query.status = status;
    if (req.user.role === 'seller') query.createdBy = req.user._id;

    const campaigns = await Campaign.find(query).populate('category', 'name');
    res.json(campaigns);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

const updateCampaign = async (req, res) => {
  const { campaignId } = req.params;
  const { title, description, category, minFollowerCount, allowedMarketers, budget, status } = req.body;

  try {
    const campaign = await Campaign.findById(campaignId);
    if (!campaign) {
      return res.status(404).json({ message: 'Campaign not found' });
    }
    if (campaign.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    campaign.title = title || campaign.title;
    campaign.description = description || campaign.description;
    campaign.category = category || campaign.category;
    campaign.minFollowerCount = minFollowerCount || campaign.minFollowerCount;
    campaign.allowedMarketers = allowedMarketers || campaign.allowedMarketers;
    campaign.budget = budget || campaign.budget;
    campaign.status = status || campaign.status;

    await campaign.save();
    res.json(campaign);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { createCampaign, getCampaigns, updateCampaign };