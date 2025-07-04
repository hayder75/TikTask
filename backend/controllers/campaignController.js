const Campaign = require("../models/Campaign");
const User = require("../models/User");
const { validationResult } = require("express-validator");
const CampaignApplication = require("../models/CampaignApplication");
const Message = require("../models/Message");
const { sendNotification } = require("./telegramBot");


const createCampaign = async (req, res) => {
  const {
    title,
    description,
    category,
    videoLink,
    minFollowerCount,
    allowedMarketers,
    budget,
  } = req.body;

  try {
    console.log('req.user._id:', req.user._id);
    const seller = await User.findById(req.user._id);
    if (seller.balance < budget) {
      return res
        .status(400)
        .json({
          message: `Insufficient balance. Required: ${budget} Birr, Available: ${seller.balance} Birr. Please deposit more.`,
        });
    }

    seller.balance -= budget;
    await seller.save();

    const campaign = new Campaign({
      title,
      description,
      category,
      videoLink,
      minFollowerCount,
      allowedMarketers,
      budget,
      createdBy: req.user._id,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    });

    await campaign.save();
    res.status(201).json(campaign);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const getCampaigns = async (req, res) => {
  try {
    const query = {};
    if (req.user.role === "seller") query.createdBy = req.user._id;
    else if (req.user.role === "marketer") query.status = "active";

    const campaigns = await Campaign.find(query).populate("category", "name");
    const campaignsWithCounts = await Promise.all(
      campaigns.map(async (campaign) => {
        const applicationCount = await CampaignApplication.countDocuments({
          campaignId: campaign._id,
          status: "accepted",
        });
        return { ...campaign.toObject(), applicationCount };
      })
    );

    res.json(campaignsWithCounts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getCampaignById = async (req, res) => {
  const { campaignId } = req.params;

  try {
    const campaign = await Campaign.findById(campaignId).populate(
      "category",
      "name"
    );
    if (!campaign)
      return res.status(404).json({ message: "Campaign not found" });
    if (campaign.createdBy.toString() !== req.user._id.toString())
      return res.status(403).json({ message: "Not authorized" });

    const applicationCount = await CampaignApplication.countDocuments({
      campaignId,
      status: "accepted",
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

const shortlistMarketers = async (req, res) => {
  const { campaignId } = req.params;
  const { applicationIds } = req.body;

  try {
    const errors = validationResult(req);
    if (!errors.isEmpty())
      return res.status(400).json({ errors: errors.array() });
    if (
      !applicationIds ||
      !Array.isArray(applicationIds) ||
      applicationIds.length === 0
    )
      return res
        .status(400)
        .json({ message: "applicationIds must be a non-empty array" });

    const campaign = await Campaign.findById(campaignId);
    if (!campaign)
      return res.status(404).json({ message: "Campaign not found" });
    if (campaign.createdBy.toString() !== req.user._id.toString())
      return res.status(403).json({ message: "Not authorized" });
    if (campaign.status !== "active")
      return res.status(400).json({ message: "Campaign is not active" });

    const acceptedCount = await CampaignApplication.countDocuments({
      campaignId,
      status: "accepted",
    });
    if (acceptedCount + applicationIds.length > campaign.allowedMarketers)
      return res
        .status(400)
        .json({ message: "Exceeds allowed marketers limit" });

    const applications = await CampaignApplication.find({
      _id: { $in: applicationIds },
      campaignId,
      status: "pending",
    });
    if (applications.length !== applicationIds.length)
      return res
        .status(400)
        .json({
          message: "One or more application IDs are invalid or not pending",
        });

    const updates = applications.map((application) => ({
      updateOne: {
        filter: { _id: application._id },
        update: { $set: { status: "accepted" } },
      },
    }));

    await CampaignApplication.bulkWrite(updates);

    const acceptedApplications = await CampaignApplication.find({
      _id: { $in: applicationIds },
    }).populate("marketerId", "name email followerCount telegramChatId");
    
    // Send notification to each marketer
    for (const app of acceptedApplications) {
      const messageContent = `You've been shortlisted for the campaign "${campaign.title}"!\nDescription: ${campaign.description}\nVideo Link: ${campaign.videoLink}\nPlease download the video, post it on TikTok, and submit the posted link via the platform at /api/applications/${app._id}/submit-link.`;

      // Save to in-app notifications
      const notification = new Message({
        campaignApplicationId: app._id,
        videoLink: campaign.videoLink,
        title: campaign.title,
        description: campaign.description,
      });
      await notification.save();
      console.log(`In-app notification sent to marketer for application ${app._id}`);

      // Send Telegram notification if chatId exists
      if (app.marketerId.telegramChatId) {
        await sendNotification(app.marketerId.telegramChatId, messageContent);
      } else {
        console.log(`No Telegram chatId for marketer ${app.marketerId._id}. Skipping Telegram notification.`);
      }
    }

    if (acceptedCount + applicationIds.length === campaign.allowedMarketers)
      campaign.status = "completed";
    await campaign.save();

    res.json({ message: `${applicationIds.length} marketers accepted` });
  } catch (error) {
    console.error("Error in shortlistMarketers:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};


const getApplications = async (req, res) => {
  const { campaignId } = req.params;

  try {
    const campaign = await Campaign.findById(campaignId);
    if (!campaign)
      return res.status(404).json({ message: "Campaign not found" });
    if (campaign.createdBy.toString() !== req.user._id.toString())
      return res.status(403).json({ message: "Not authorized" });

    const applications = await CampaignApplication.find({
      campaignId,
      status: "pending",
    }).populate("marketerId", "name tiktokUsername followerCount");

    res.json(applications);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

const getAcceptedStats = async (req, res) => {
  const { campaignId } = req.params;

  try {
    const campaign = await Campaign.findById(campaignId);
    if (!campaign)
      return res.status(404).json({ message: "Campaign not found" });
    if (campaign.createdBy.toString() !== req.user._id.toString())
      return res.status(403).json({ message: "Not authorized" });

    const applications = await CampaignApplication.find({
      campaignId,
      status: "accepted",
    }).populate("marketerId", "name tiktokUsername");

    const stats = applications.map((app) => ({
      ...app.toObject(),
      statsSnapshot: app.submission?.statsSnapshot || {
        likes: 0,
        views: 0,
        comments: 0,
        lastUpdated: null,
        isActive: false,
      },
    }));

    res.json(stats);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const reopenCampaign = async (req, res) => {
  const { campaignId } = req.params;

  try {
    const campaign = await Campaign.findById(campaignId);
    if (!campaign)
      return res.status(404).json({ message: "Campaign not found" });
    if (campaign.createdBy.toString() !== req.user._id.toString())
      return res.status(403).json({ message: "Not authorized" });
    if (campaign.status !== "hidden")
      return res.status(400).json({ message: "Campaign is not hidden" });

    const acceptedCount = await CampaignApplication.countDocuments({
      campaignId,
      status: "accepted",
    });
    if (acceptedCount >= campaign.allowedMarketers)
      return res
        .status(400)
        .json({ message: "Cannot reopen with full marketer limit" });

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
  shortlistMarketers,
  getApplications,
  getAcceptedStats,
  reopenCampaign,
};