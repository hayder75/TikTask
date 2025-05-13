const Campaign = require("../models/Campaign");
const CampaignApplication = require("../models/CampaignApplication");
const User = require("../models/User");
const { validationResult } = require("express-validator");
const { getMockVideoInfo } = require("../utils/mockTikTokData");

const getAvailableCampaigns = async (req, res) => {
  const { categoryId, minFollowers } = req.query;

  try {
    const query = { status: "active" };
    if (categoryId) query.category = categoryId;
    if (minFollowers) query.minFollowerCount = { $lte: minFollowers };

    const campaigns = await Campaign.find(query)
      .populate("category", "name")
      .where("minFollowerCount")
      .lte(req.user.followerCount);

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


const applyForCampaign = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { campaignId } = req.params;

  try {
    const campaign = await Campaign.findById(campaignId);
    if (!campaign) {
      return res.status(404).json({ message: "Campaign not found" });
    }
    if (req.user.followerCount < campaign.minFollowerCount) {
      return res.status(400).json({ message: "Insufficient followers" });
    }
    if (campaign.status !== "active") {
      return res.status(400).json({ message: "Campaign is not active" });
    }

    const existingApplication = await CampaignApplication.findOne({
      campaignId,
      marketerId: req.user._id,
    });
    if (existingApplication) {
      return res.status(400).json({ message: "Already applied" });
    }

    const user = await User.findById(req.user._id);
    if (user.connectionCoins <= 0) {
      return res.status(400).json({ message: "Insufficient connection coins" });
    }

    const applicationCount = await CampaignApplication.countDocuments({
      campaignId,
    });
    const application = new CampaignApplication({
      campaignId,
      marketerId: req.user._id,
    });

    user.connectionCoins -= 1;
    await user.save();
    await application.save();

    res.status(201).json({
      ...application.toObject(),
      warning: `Applied successfully. ${applicationCount} people have applied, ensure your video is high quality if shortlisted.`,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error: " + error.message });
  }
};

const getMyApplications = async (req, res) => {
  try {
    const applications = await CampaignApplication.find({
      marketerId: req.user._id,
    }).populate("campaignId", "title description");
    res.json(applications);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

const getCampaignApplications = async (req, res) => {
  const { campaignId } = req.params;

  try {
    const campaign = await Campaign.findById(campaignId);
    if (!campaign) {
      return res.status(404).json({ message: "Campaign not found" });
    }
    if (campaign.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized" });
    }

    const applications = await CampaignApplication.find({ campaignId })
      .populate(
        "marketerId",
        "name tiktokUsername followerCount tiktokProfile verified"
      )
      .select("submission status createdAt");

    const totalApplications = applications.length;
    const acceptedCount = applications.filter(
      (app) => app.status === "accepted"
    ).length;

    res.json({ applications, totalApplications, acceptedCount });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

const shortlistApplicants = async (req, res) => {
  const { campaignId } = req.params;
  const { applicationIds } = req.body;

  try {
    const campaign = await Campaign.findById(campaignId);
    if (!campaign) {
      return res.status(404).json({ message: "Campaign not found" });
    }
    if (campaign.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized" });
    }

    const applications = await CampaignApplication.updateMany(
      { _id: { $in: applicationIds }, campaignId, status: "pending" },
      { status: "shortlisted" }
    );

    res.json({
      message: `${applications.modifiedCount} applicants shortlisted`,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

const submitVideo = async (req, res) => {
  const { applicationId } = req.params;
  const { tiktokVideoLink } = req.body;

  try {
    const application = await CampaignApplication.findById(
      applicationId
    ).populate("campaignId marketerId");
    if (!application) {
      return res.status(404).json({ message: "Application not found" });
    }
    if (application.marketerId._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized" });
    }
    if (application.status !== "shortlisted") {
      return res
        .status(400)
        .json({ message: "Only shortlisted applications can submit videos" });
    }

    const user = application.marketerId;
    const videoIdMatch = tiktokVideoLink.match(/\/video\/(\d+)/);
    if (!videoIdMatch) {
      return res.status(400).json({ message: "Invalid TikTok video URL" });
    }
    const videoId = videoIdMatch[1];

    const videoInfo = getMockVideoInfo(videoId);
    if (videoInfo.username !== user.tiktokUsername) {
      return res
        .status(400)
        .json({ message: "Video does not belong to your TikTok account" });
    }

    application.submission = {
      tiktokVideoLink,
      statsSnapshot: {
        likes: videoInfo.like_count,
        views: videoInfo.view_count,
        lastUpdated: new Date(),
      },
    };
    await application.save();

    res.json(application);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

const getAcceptedVideoStats = async (req, res) => {
  const { campaignId } = req.params;

  try {
    const campaign = await Campaign.findById(campaignId);
    if (!campaign) {
      return res.status(404).json({ message: "Campaign not found" });
    }
    if (campaign.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized" });
    }

    const applications = await CampaignApplication.find({
      campaignId,
      status: "accepted",
    })
      .populate(
        "marketerId",
        "name tiktokUsername followerCount tiktokProfile verified"
      )
      .select("submission");

    res.json(applications);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

const reviewApplication = async (req, res) => {
  const { applicationId } = req.params;
  const { status } = req.body;

  if (!["accepted", "rejected"].includes(status)) {
    return res.status(400).json({ message: "Invalid status" });
  }

  try {
    const application = await CampaignApplication.findById(
      applicationId
    ).populate("campaignId");
    if (!application) {
      return res.status(404).json({ message: "Application not found" });
    }
    if (
      application.campaignId.createdBy.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({ message: "Not authorized" });
    }
    if (
      application.status !== "shortlisted" ||
      !application.submission?.tiktokVideoLink
    ) {
      return res
        .status(400)
        .json({
          message: "Only shortlisted applications with videos can be reviewed",
        });
    }

    if (status === "accepted") {
      const acceptedCount = await CampaignApplication.countDocuments({
        campaignId: application.campaignId,
        status: "accepted",
      });
      if (acceptedCount >= application.campaignId.allowedMarketers) {
        return res.status(400).json({ message: "Campaign slots full" });
      }
    }

    application.status = status;
    await application.save();

    if (status === "accepted") {
      const acceptedCount = await CampaignApplication.countDocuments({
        campaignId: application.campaignId,
        status: "accepted",
      });
      if (acceptedCount >= application.campaignId.allowedMarketers) {
        application.campaignId.status = "completed";
        await application.campaignId.save();
      }
    }

    res.json(application);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

const withdrawApplication = async (req, res) => {
  const { applicationId } = req.params;

  try {
    const application = await CampaignApplication.findById(applicationId);
    if (!application) {
      return res.status(404).json({ message: "Application not found" });
    }
    if (application.marketerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized" });
    }
    if (
      application.status !== "pending" &&
      application.status !== "shortlisted"
    ) {
      return res
        .status(400)
        .json({
          message: "Cannot withdraw non-pending or shortlisted application",
        });
    }

    application.status = "withdrawn";
    await application.save();
    res.json({ message: "Application withdrawn" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
  getAvailableCampaigns,
  applyForCampaign,
  getMyApplications,
  getCampaignApplications,
  shortlistApplicants,
  submitVideo,
  getAcceptedVideoStats,
  reviewApplication,
  withdrawApplication,
};
