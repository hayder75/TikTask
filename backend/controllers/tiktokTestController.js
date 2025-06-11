const { fetchVideoMetrics } = require('../utils/tiktokScraper');
const TiktokVideoStats = require('../models/TiktokVideoStats');
const logger = require('../utils/logger');

const submitVideoForTest = async (req, res) => {
  logger.warn('submitVideoForTest is disabled for now');
  res.status(501).json({ message: 'Endpoint disabled' });
};

const getVideoStats = async (req, res) => {
  const { url } = req.query;
  if (!url) {
    logger.warn('No URL provided for getVideoStats');
    return res.status(400).json({ message: 'URL parameter required' });
  }

  try {
    const stats = await TiktokVideoStats.findOne({ url });
    if (stats) {
      logger.info('Video stats retrieved', { url });
      res.json({ message: 'Successfully retrieved video stats', stats });
    } else {
      logger.warn('No stats found for URL', { url });
      res.status(404).json({ message: 'No stats found for this URL' });
    }
  } catch (error) {
    logger.error('Error retrieving video stats', { url, error: error.message });
    res.status(500).json({ message: 'Failed to retrieve video stats', error: error.message });
  }
};

const checkAvatar = async (req, res) => {
  const { videoUrl } = req.body;

  if (!videoUrl || !videoUrl.includes('tiktok.com')) {
    logger.warn('Invalid video URL submitted', { videoUrl });
    return res.status(400).json({ message: 'Valid TikTok video URL required' });
  }

  try {
    const result = await fetchVideoMetrics(videoUrl);
    res.json(result);
  } catch (error) {
    logger.error('Error fetching video metrics', { videoUrl, error: error.message, stack: error.stack });
    res.status(500).json({ message: 'Failed to fetch video metrics', error: error.message });
  }
};

module.exports = { submitVideoForTest, getVideoStats, checkAvatar };