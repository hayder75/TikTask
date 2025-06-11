const axios = require('axios');
const logger = require('./logger');
const TiktokVideoStats = require('../models/TiktokVideoStats');

async function fetchVideoMetrics(videoUrl) {
  logger.info('Starting Apify TikTok API request', { videoUrl });

  try {
    // Step 1: Extract the video ID from the URL (for logging, not API use)
    const videoIdMatch = videoUrl.match(/video\/(\d+)/);
    if (!videoIdMatch) {
      logger.error('Could not extract video ID from video URL', { videoUrl });
      return { message: 'Could not extract video ID from video URL' };
    }
    const videoId = videoIdMatch[1]; // e.g., "7356223198091808006"
    logger.info('Extracted video ID', { videoId });

    // Step 2: Start Apify TikTok Scraper API run asynchronously
    const apiToken = 'apify_api_5RPssMTdfdaeMP5eBM22KC8ZFZoVXb4yWrOf'; // Replace with your valid Apify API token
    const actorId = 'clockworks~tiktok-scraper'; // Correct actor ID
    const runResponse = await axios.post(
      `https://api.apify.com/v2/acts/${actorId}/runs?token=${apiToken}`,
      {
        postURLs: [videoUrl], // Correct field for video URLs
        maxItems: 1, // Limit to 1 item for a single video
      },
      { headers: { 'Content-Type': 'application/json' } }
    );
    logger.info('Apify API run initiated', { runId: runResponse.data.data.id });
    const runId = runResponse.data.data.id;
    const datasetId = runResponse.data.data.defaultDatasetId;

    // Step 3: Poll for dataset results (e.g., wait up to 30 seconds)
    const maxWaitTime = 30000; // 30 seconds timeout
    const pollInterval = 2000; // Check every 2 seconds
    let elapsedTime = 0;
    let videoData;

    while (elapsedTime < maxWaitTime) {
      const datasetResponse = await axios.get(
        `https://api.apify.com/v2/datasets/${datasetId}/items?token=${apiToken}&limit=1`
      );
      videoData = datasetResponse.data[0];
      if (videoData) break;
      await new Promise(resolve => setTimeout(resolve, pollInterval));
      elapsedTime += pollInterval;
    }

    if (!videoData) {
      throw new Error('No video data found in dataset within timeout');
    }
    logger.info('Raw video data for debugging', { videoData });

    // Step 4: Extract only required metrics
    const { playCount: views, commentCount: comments, shareCount: shares } = videoData;
    logger.info('Extracted video metrics', { views, comments, shares });

    // Step 5: Save to MongoDB
    const usernameMatch = videoUrl.match(/@([^/]+)/);
    const username = usernameMatch ? usernameMatch[1] : 'Unknown';
    const statsEntry = new TiktokVideoStats({
      url: videoUrl,
      username,
      stats: [{ views, comments, shares }],
    });
    await statsEntry.save();
    logger.info('Video stats saved to MongoDB', { videoUrl });

    return {
      message: 'Successfully fetched and saved video metrics',
      videoUrl,
      metrics: { views, comments, shares },
    };
  } catch (error) {
    logger.error('Apify API request failed', {
      videoUrl,
      error: error.message,
      response: error.response ? error.response.data : 'No response data',
      stack: error.stack,
    });
    throw error;
  }
}

module.exports = { fetchVideoMetrics };