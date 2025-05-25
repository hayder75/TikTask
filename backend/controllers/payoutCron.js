const cron = require('node-cron');
const { processDailyPayouts } = require('./controllers/paymentController');

cron.schedule('* * * * *', async () => { // Runs every minute
  await processDailyPayouts();
});

// Placeholder for weekly follower count update (to be implemented with TikTok API)
cron.schedule('0 0 * * 1', () => {
  console.log('Weekly follower count update scheduled. Implement TikTok API call here.');
});