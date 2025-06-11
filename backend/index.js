const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const path = require('path');
const authRoutes = require("./routes/auth");
const paymentRoutes = require('./routes/payments');
const campaignRoutes = require("./routes/campaigns");
const applicationRoutes = require("./routes/applications");
const categoryRoutes = require("./routes/categories");
const tiktokRoutes = require('./controllers/tiktokController'); 
const userRoutes = require("./routes/users");
const tiktokTestRoutes = require('./routes/tiktokTestRoutes');
const { startScrapingSchedule } = require('./utils/tiktokScheduler');
const messageRoutes = require('./routes/messageRoutes'); 
const {
  termsOfService,
  privacyPolicy,
} = require("./controllers/staticController");
const { tiktokCallback } = require('./controllers/authController'); // Import tiktokCallback

require('./controllers/telegramBot'); 
require("./models/User");
require("./models/Campaign");
require("./models/CampaignApplication");
require("./models/Category");

dotenv.config();

const app = express();

app.use(express.json());

// Serve static files from the public folder
app.use(express.static('public'));

// Route definitions
app.use("/api/auth", authRoutes);
app.use("/api/campaigns", campaignRoutes);
app.use("/api/applications", applicationRoutes);
app.use("/api/categories", categoryRoutes);
app.use('/api/payments', paymentRoutes);
app.get("/terms", termsOfService);
app.get("/privacy", privacyPolicy);
app.use('/api/users', userRoutes);
app.use('/api/tiktok-test', tiktokTestRoutes);
app.use('/api/messages', messageRoutes); // Mount message routes
app.use('/api/tiktok', tiktokRoutes);

// Direct route for TikTok callback to match the redirect URI
app.get('/auth/callback', tiktokCallback);

// Fallback route for unmatched paths (e.g., /dashboard)
app.get('/dashboard', (req, res) => {
  const { token, username, followers } = req.query;
  if (token && username && followers) {
    res.send(`
      <h1>Welcome, ${username}!</h1>
      <p>Followers: ${followers}</p>
      <p>Token: ${token}</p>
      <script>
        localStorage.setItem('token', '${token}');
      </script>
    `);
  } else {
    res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
  }
});

app.get('/tiktok-auth', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'tiktok-auth.html'));
});

mongoose
  .connect(process.env.MONGODB_URI, {
    // useNewUrlParser: true,
    // useUnifiedTopology: true,
  })
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.log(err));

startScrapingSchedule();

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));