const Campaign = require('../models/Campaign');
const CampaignApplication = require('../models/CampaignApplication');
const User = require('../models/User');

const calculateBudget = async (req, res) => {
  const { budget, allowedMarketers } = req.body;

  try {
    const tiers = [
      { minFollowers: 0, maxFollowers: 10000, viewsPerMarketer: 500, likesPerMarketer: 50, rateView: 0.001, rateLike: 0.05 },
      { minFollowers: 10001, maxFollowers: 50000, viewsPerMarketer: 2500, likesPerMarketer: 250, rateView: 0.0015, rateLike: 0.075 },
      { minFollowers: 50001, maxFollowers: Infinity, viewsPerMarketer: 10000, likesPerMarketer: 1000, rateView: 0.002, rateLike: 0.10 },
    ];

    const avgPayoutPerMarketer = budget / allowedMarketers;
    let totalViews = 0, totalLikes = 0, marketerCount = 0, plan = 'Small';

    for (const tier of tiers) {
      const marketersInTier = Math.floor(avgPayoutPerMarketer / (tier.viewsPerMarketer * tier.rateView + tier.likesPerMarketer * tier.rateLike));
      if (marketerCount + marketersInTier <= allowedMarketers) {
        totalViews += marketersInTier * tier.viewsPerMarketer;
        totalLikes += marketersInTier * tier.likesPerMarketer;
        marketerCount += marketersInTier;
      } else {
        const remainingMarketers = allowedMarketers - marketerCount;
        totalViews += remainingMarketers * tier.viewsPerMarketer;
        totalLikes += remainingMarketers * tier.likesPerMarketer;
        break;
      }
    }

    if (budget >= 2000 && budget <= 4999) plan = 'Medium';
    else if (budget >= 5000) plan = 'Large';

    res.json({
      plan,
      estimatedViews: totalViews,
      estimatedLikes: totalLikes,
      minimumDeposit: budget * 0.50,
      recommendedDeposit: budget,
      marketerAllocation: `Allocating ${allowedMarketers} marketers in ${plan} tier`,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const processDailyPayouts = async () => {
  console.log('Running daily payout cron job...');
  try {
    const campaigns = await Campaign.find({ status: 'active' });
    for (const campaign of campaigns) {
      const applications = await CampaignApplication.find({ campaignId: campaign._id, status: 'accepted' })
        .populate('marketerId', 'followerCount balance');

      const totalViews = applications.reduce((sum, app) => sum + (app.submission?.statsSnapshot?.views || 0), 0);
      const totalLikes = applications.reduce((sum, app) => sum + (app.submission?.statsSnapshot?.likes || 0), 0);
      const totalDailyValue = (totalViews * 0.001) + (totalLikes * 0.05); // Baseline for small tier

      if (totalDailyValue === 0) continue;

      for (const app of applications) {
        if (!app.submission?.statsSnapshot?.isActive) continue;

        const stats = app.submission?.statsSnapshot || { views: 0, likes: 0 };
        const followerCount = app.marketerId.followerCount;
        let rateView = 0.001, rateLike = 0.05;
        if (followerCount > 10000 && followerCount <= 50000) { rateView = 0.0015; rateLike = 0.075; }
        else if (followerCount > 50000) { rateView = 0.002; rateLike = 0.10; }

        const dailyPayout = (stats.views * rateView) + (stats.likes * rateLike);
        const proportion = ((stats.views * rateView) + (stats.likes * rateLike)) / totalDailyValue;
        const payout = dailyPayout + (proportion * (campaign.budget / campaign.allowedMarketers - dailyPayout));

        app.pendingPayout = (app.pendingPayout || 0) + payout;
        await app.save();

        app.marketerId.balance += payout;
        campaign.totalPayout += payout;
        await app.marketerId.save();

        console.log(`Processed payout for marketer ${app.marketerId._id} on campaign ${campaign._id}: ${payout} Birr`);

        if (campaign.totalPayout >= 0.9 * campaign.budget) {
          console.log(`Warning: Campaign ${campaign.title} budget (90% of ${campaign.budget} Birr) is nearly exhausted.`);
        }
        if (campaign.totalPayout >= campaign.budget) {
          campaign.status = 'completed';
        }
      }
      await campaign.save();
    }
  } catch (error) {
    console.error('Error in payout cron job:', error);
  }
};

const abortApplication = async (req, res) => {
  const { applicationId } = req.params;

  try {
    const application = await CampaignApplication.findById(applicationId);
    if (!application) return res.status(404).json({ message: 'Application not found' });
    const campaign = await Campaign.findById(application.campaignId);
    if (!campaign || campaign.createdBy.toString() !== req.user._id.toString())
      return res.status(403).json({ message: 'Not authorized' });

    const seller = await User.findById(campaign.createdBy);
    if (seller.abortCount >= 1) {
      const penalty = 0.10 * campaign.budget;
      seller.balance -= penalty;
      console.log(`Penalty of ${penalty} Birr applied for aborting marketer.`);
    }
    seller.abortCount += 1;
    await seller.save();

    application.status = 'aborted';
    await application.save();

    const acceptedCount = await CampaignApplication.countDocuments({ campaignId: campaign._id, status: 'accepted' });
    if (acceptedCount === 0 && campaign.status === 'completed') {
      campaign.status = 'hidden';
    } else if (acceptedCount < campaign.allowedMarketers) {
      campaign.status = 'active';
    }
    await campaign.save();

    res.json({ message: 'Marketer aborted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = { calculateBudget, processDailyPayouts, abortApplication };