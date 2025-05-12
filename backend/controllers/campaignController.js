const Campaign = require("../models/Campaign");
const CampaignApplication = require("../models/CampaignApplication");
const Category = require("../models/Category");
const { validationResult } = require("express-validator");

const createCampaign = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const {
    title,
    description,
    category,
    minFollowerCount,
    allowedMarketers,
    baseBid,
  } = req.body;

  try {
    const categoryExists = await Category.findById(category);
    if (!categoryExists) {
      return res.status(400).json({ message: "Invalid category ID" });
    }

    const campaign = new Campaign({
      title,
      description,
      category,
      minFollowerCount,
      allowedMarketers,
      baseBid,
      createdBy: req.user._id,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    });

    await campaign.save();
    res.status(201).json(campaign);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

const getCampaigns = async (req, res) => {
  const { categoryId, status } = req.query;

  try {
    const query = {};
    if (categoryId) query.category = categoryId;
    if (status) query.status = status;
    if (req.user.role === "seller") query.createdBy = req.user._id;
    else if (req.user.role === "marketer") query.status = "active";

    const campaigns = await Campaign.find(query).populate("category", "name");
    const campaignsWithCounts = await Promise.all(
      campaigns.map(async (campaign) => {
        const applicationCount = await CampaignApplication.countDocuments({
          campaignId: campaign._id,
        });
        return { ...campaign.toObject(), applicationCount };
      })
    );

    res.json(campaignsWithCounts);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

const getCampaignById = async (req, res) => {
  const { campaignId } = req.params;

  try {
    const campaign = await Campaign.findById(campaignId).populate(
      "category",
      "name"
    );
    if (!campaign) {
      return res.status(404).json({ message: "Campaign not found" });
    }
    if (campaign.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized" });
    }

    const applicationCount = await CampaignApplication.countDocuments({
      campaignId,
    });
    const acceptedCount = await CampaignApplication.countDocuments({
      campaignId,
      status: "accepted",
    });

    res.json({ ...campaign.toObject(), applicationCount, acceptedCount });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

const updateCampaign = async (req, res) => {
  const { campaignId } = req.params;
  const {
    title,
    description,
    category,
    minFollowerCount,
    allowedMarketers,
    baseBid,
    status,
  } = req.body;

  try {
    const campaign = await Campaign.findById(campaignId);
    if (!campaign) {
      return res.status(404).json({ message: "Campaign not found" });
    }
    if (campaign.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized" });
    }

    if (category) {
      const categoryExists = await Category.findById(category);
      if (!categoryExists) {
        return res.status(400).json({ message: "Invalid category ID" });
      }
    }

    campaign.title = title || campaign.title;
    campaign.description = description || campaign.description;
    campaign.category = category || campaign.category;
    campaign.minFollowerCount = minFollowerCount || campaign.minFollowerCount;
    campaign.allowedMarketers = allowedMarketers || campaign.allowedMarketers;
    campaign.baseBid = baseBid || campaign.baseBid;
    campaign.status = status || campaign.status;

    await campaign.save();
    res.json(campaign);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

const reopenCampaign = async (req, res) => {
  const { campaignId } = req.params;

  try {
    const campaign = await Campaign.findById(campaignId);
    if (!campaign) {
      return res.status(404).json({ message: "Campaign not found" });
    }
    if (campaign.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized" });
    }
    if (campaign.status !== "hidden") {
      return res.status(400).json({ message: "Campaign is not hidden" });
    }

    campaign.status = "active";
    campaign.expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await campaign.save();
    res.json(campaign);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
  createCampaign,
  getCampaigns,
  getCampaignById,
  updateCampaign,
  reopenCampaign,
};
