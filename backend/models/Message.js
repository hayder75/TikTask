const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema({
  campaignApplicationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "CampaignApplication",
    required: true,
  },
  videoLink: {
    type: String,
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Message", messageSchema);