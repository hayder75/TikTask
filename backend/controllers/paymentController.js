const Campaign = require('../models/Campaign');
const CampaignApplication = require('../models/CampaignApplication');
const User = require('../models/User');
const PayoutTransaction = require('../models/PayoutTransaction');

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
  console.log('Starting daily payout cron job...');
  try {
    console.log('Fetching campaigns with remaining budget...');
    const campaigns = await Campaign.find({
      $or: [
        { status: 'active' },
        { status: 'completed', remainingBudget: { $gt: 0 } }
      ]
    });
    console.log(`Found ${campaigns.length} campaigns with remaining budget:`, campaigns.map(c => c._id));

    for (const campaign of campaigns) {
      console.log(`Processing campaign ${campaign._id} (Budget: ${campaign.budget}, Allowed Marketers: ${campaign.allowedMarketers}, Status: ${campaign.status})`);
      const applications = await CampaignApplication.find({ campaignId: campaign._id, status: 'accepted' })
        .populate('marketerId', 'followerCount balance');
      console.log(`Found ${applications.length} accepted applications for campaign ${campaign._id}`);

      const totalViews = applications.reduce((sum, app) => {
        console.log(`Application ${app._id} stats: views=${app.submission?.statsSnapshot?.views || 0}, likes=${app.submission?.statsSnapshot?.likes || 0}`);
        return sum + (app.submission?.statsSnapshot?.views || 0);
      }, 0);
      const totalLikes = applications.reduce((sum, app) => sum + (app.submission?.statsSnapshot?.likes || 0), 0);
      console.log(`Total Views: ${totalViews}, Total Likes: ${totalLikes}`);
      const totalDailyValue = (totalViews * 0.001) + (totalLikes * 0.05); // Baseline for small tier
      console.log(`Calculated totalDailyValue: ${totalDailyValue}`);

      if (totalDailyValue === 0) {
        console.log(`No payout calculated for campaign ${campaign._id} due to zero totalDailyValue`);
        continue;
      }

      let totalPayout = 0;
      const seller = await User.findById(campaign.createdBy);
      console.log(`Seller ${seller?._id} balance: ${seller?.balance}`);
      if (!seller) {
        console.log(`Seller not found for campaign ${campaign._id}`);
        continue;
      }

      for (const app of applications) {
        console.log(`Processing application ${app._id} for marketer ${app.marketerId._id}`);
        if (!app.submission?.statsSnapshot?.isActive) {
          console.log(`Skipping ${app._id} due to inactive statsSnapshot`);
          continue;
        }

        const stats = app.submission?.statsSnapshot || { views: 0, likes: 0 };
        console.log(`Stats for ${app._id}: views=${stats.views}, likes=${stats.likes}`);

        // Compare current stats with last processed stats
        const lastStats = app.lastProcessedStats || { views: 0, likes: 0 };
        console.log(`Last processed stats for ${app._id}: views=${lastStats.views}, likes=${lastStats.likes}`);
        if (stats.views === lastStats.views && stats.likes === lastStats.likes) {
          console.log(`Skipping payout for ${app._id} due to unchanged stats`);
          continue;
        }

        const followerCount = app.marketerId.followerCount || 0; // Default to 0 if undefined
        console.log(`Follower count for ${app.marketerId._id}: ${followerCount}`);
        let rateView = 0.001, rateLike = 0.05;
        if (followerCount > 10000 && followerCount <= 50000) { rateView = 0.0015; rateLike = 0.075; }
        else if (followerCount > 50000) { rateView = 0.002; rateLike = 0.10; }
        console.log(`Rates: rateView=${rateView}, rateLike=${rateLike}`);

        // Calculate payout based on the difference in stats
        const deltaViews = stats.views - lastStats.views;
        const deltaLikes = stats.likes - lastStats.likes;
        console.log(`Delta for ${app._id}: views=${deltaViews}, likes=${deltaLikes}`);

        const dailyPayout = (deltaViews * rateView) + (deltaLikes * rateLike);
        console.log(`Daily payout for ${app._id}: ${dailyPayout}`);
        const proportion = ((deltaViews * rateView) + (deltaLikes * rateLike)) / totalDailyValue;
        console.log(`Proportion for ${app._id}: ${proportion}`);
        const payout = dailyPayout + (proportion * (campaign.budget / campaign.allowedMarketers - dailyPayout));
        console.log(`Final payout for ${app._id}: ${payout}`);

        // Cap payout to available remainingBudget per marketer
        const maxPayoutPerMarketer = campaign.remainingBudget / applications.length;
        const adjustedPayout = Math.min(payout, maxPayoutPerMarketer);
        if (adjustedPayout <= 0) {
          console.log(`No payout for ${app._id} due to insufficient remaining budget`);
          continue;
        }

        const marketer = await User.findById(app.marketerId._id);
        console.log(`Marketer ${marketer?._id} found, role: ${marketer?.role}, current balance: ${marketer?.balance}`);
        if (!marketer || marketer.role !== 'marketer') {
          console.log(`Marketer ${app.marketerId._id} not found or invalid role`);
          continue;
        }

        marketer.balance += adjustedPayout;
        const savedMarketer = await marketer.save();
        console.log(`Applied payout of ${adjustedPayout} Birr to marketer ${marketer._id}. New balance: ${savedMarketer.balance}`);

        const payoutTransaction = new PayoutTransaction({
          marketerId: marketer._id,
          amount: adjustedPayout,
          status: 'completed',
          campaignId: campaign._id,
          applicationId: app._id,
          campaignBudget: campaign.budget,
          performanceFactor: proportion,
          createdAt: new Date(),
        });
        await payoutTransaction.save();
        console.log(`Saved transaction for marketer ${marketer._id}`);

        // Update lastProcessedStats
        app.lastProcessedStats = {
          views: stats.views,
          likes: stats.likes,
          lastProcessedAt: new Date()
        };
        await app.save();
        console.log(`Updated lastProcessedStats for ${app._id}`);

        totalPayout += adjustedPayout;
        console.log(`Processed payout for marketer ${marketer._id} on campaign ${campaign._id}: ${adjustedPayout} Birr`);
      }

      if (totalPayout > 0) {
        console.log(`Total payout for campaign ${campaign._id}: ${totalPayout}`);
        campaign.remainingBudget -= totalPayout;
        campaign.totalPayout += totalPayout;
        await campaign.save();
        console.log(`Updated campaign ${campaign._id} - Remaining Budget: ${campaign.remainingBudget}, Total Payout: ${campaign.totalPayout}`);

        if (campaign.remainingBudget <= 0) {
          campaign.status = 'completed';
          await campaign.save();
          console.log(`Campaign ${campaign._id} marked as completed due to exhausted budget`);
        } else if (campaign.totalPayout >= 0.9 * campaign.budget) {
          console.log(`Warning: Campaign ${campaign.title} budget (90% of ${campaign.budget} Birr) is nearly exhausted.`);
        }
      }
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

const triggerProcessDailyPayouts = async (req, res) => {
  try {
    await processDailyPayouts();
    res.json({ message: 'Daily payouts processed successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error processing payouts', error: error.message });
  }
};

module.exports = { calculateBudget, processDailyPayouts, abortApplication, triggerProcessDailyPayouts };