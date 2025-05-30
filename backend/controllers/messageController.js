const Message = require('../models/Message');
const CampaignApplication = require('../models/CampaignApplication');

const sendNotification = async (req, res) => {
  const { campaignApplicationId, videoLink, title, description } = req.body;

  try {
    if (!campaignApplicationId || !videoLink || !title || !description) {
      return res.status(400).json({ message: 'campaignApplicationId, videoLink, title, and description are required' });
    }

    const campaignApplication = await CampaignApplication.findById(campaignApplicationId);
    if (!campaignApplication) {
      return res.status(404).json({ message: 'Campaign application not found' });
    }
    if (campaignApplication.marketerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to send notification for this application' });
    }

    const notification = new Message({
      campaignApplicationId,
      videoLink,
      title,
      description,
    });

    await notification.save();
    res.status(201).json({ message: 'Notification sent successfully', notificationId: notification._id });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const getNotifications = async (req, res) => {
  try {
    const applications = await CampaignApplication.find({ marketerId: req.user._id, status: 'accepted' });
    const applicationIds = applications.map(app => app._id);

    const notifications = await Message.find({ campaignApplicationId: { $in: applicationIds } })
      .sort({ createdAt: -1 });

    res.json(notifications);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = { sendNotification, getNotifications };