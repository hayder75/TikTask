const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const authRoutes = require("./routes/auth");
const paymentRoutes = require('./routes/payments');
const campaignRoutes = require("./routes/campaigns");
const applicationRoutes = require("./routes/applications");
const categoryRoutes = require("./routes/categories");
const userRoutes = require("./routes/users");
const {
  termsOfService,
  privacyPolicy,
} = require("./controllers/staticController");

// Import models to register them
require("./models/User");
require("./models/Campaign");
require("./models/CampaignApplication");
require("./models/Category");

dotenv.config();

const app = express();

app.use(express.json());

mongoose
  .connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.log(err));

app.use("/api/auth", authRoutes);
app.use("/api/campaigns", campaignRoutes);
app.use("/api/applications", applicationRoutes);
app.use("/api/categories", categoryRoutes);
app.use('/api/payments', paymentRoutes);
app.get("/terms", termsOfService);
app.get("/privacy", privacyPolicy);
app.use('/api/users', userRoutes);
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
