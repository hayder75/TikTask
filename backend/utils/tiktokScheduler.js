const cron = require('node-cron');
const { scrapeVideoStats } = require('./tiktokScraper');
const TiktokVideoStats = require('../models/TiktokVideoStats');
const logger = require('./logger');

const startScrapingSchedule = () => {
  cron.schedule('0 */6 * * *', async () => { // Every 6 hours
    logger.info('Starting scheduled scraping', { timestamp: new Date().toISOString() });
    try {
      const videos = await TiktokVideoStats.find();
      if (!videos.length) {
        logger.info('No videos to scrape');
        return;
      }

      for (const video of videos) {
        try {
          const stats = await scrapeVideoStats(video.url);
          video.stats.push(stats);
          await video.save();
          logger.info('Stats updated', { url: video.url, stats });
        } catch (error) {
          logger.error('Failed to scrape video during schedule', { url: video.url, error: error.message });
          // Continue with the next video instead of failing the entire job
        }
      }
      logger.info('Scheduled scraping completed', { timestamp: new Date().toISOString() });
    } catch (error) {
      logger.error('Scheduled scraping failed entirely', { error: error.message, stack: error.stack });
    }
  }, {
    scheduled: true,
    timezone: 'Africa/Addis_Ababa',
  });
};

module.exports = { startScrapingSchedule };