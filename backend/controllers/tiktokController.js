const express = require('express');
const router = express.Router();

// In-memory store for mock TikTok stats (replace with database or real API later)
const tikTokStats = new Map([
  ['https://www.tiktok.com/@marketer1/video/12345', { views: 100, likes: 50, comments: 10, lastUpdated: new Date() }],
  ['https://www.tiktok.com/@marketer2/video/67890', { views: 200, likes: 100, comments: 20, lastUpdated: new Date() }],
]);

router.get('/stats', (req, res) => {
  const { url } = req.query;
  if (!url) {
    return res.status(400).json({ message: 'URL parameter is required' });
  }

  const stats = tikTokStats.get(url);
  if (!stats) {
    return res.status(404).json({ message: 'TikTok video stats not found' });
  }

  res.json({
    url,
    stats: {
      views: stats.views,
      likes: stats.likes,
      comments: stats.comments,
      lastUpdated: stats.lastUpdated
    }
  });
});

// Add or update stats for a URL (for testing)
router.post('/stats', (req, res) => {
  const { url, views, likes, comments } = req.body;
  if (!url || views == null || likes == null || comments == null) {
    return res.status(400).json({ message: 'URL, views, likes, and comments are required' });
  }

  tikTokStats.set(url, {
    views,
    likes,
    comments,
    lastUpdated: new Date()
  });
  res.json({ message: 'Stats updated successfully', url, stats: tikTokStats.get(url) });
});

module.exports = router;