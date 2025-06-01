const TelegramBot = require('node-telegram-bot-api');
const User = require('../models/User');

// Initialize the bot with your token
const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { polling: false });

// Handle /start command to link the Telegram account
bot.onText(/\/start (.+)/, async (msg, match) => {
  const chatId = msg.chat.id;
  const userId = match[1]; // Extract userId from /start command

  try {
    const user = await User.findById(userId);
    if (!user) {
      bot.sendMessage(chatId, 'User not found. Please ensure you are registered on the platform.');
      return;
    }

    user.telegramChatId = chatId;
    await user.save();
    bot.sendMessage(chatId, `Welcome, ${user.name}! Your Telegram account is now linked. You’ll receive notifications for campaigns here.`);
  } catch (error) {
    console.error('Error linking Telegram account:', error.message);
    bot.sendMessage(chatId, 'An error occurred while linking your account. Please try again later.');
  }
});

// Handle /start without parameters (if user starts chat directly)
bot.onText(/\/start$/, (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(chatId, 'Welcome! To link your account, please use the link provided by the platform (it should include your user ID).');
});

// Function to send a notification to a user
const sendNotification = async (chatId, message) => {
  try {
    await bot.sendMessage(chatId, message);
    console.log(`Notification sent to chatId ${chatId}: ${message}`);
  } catch (error) {
    console.error(`Error sending Telegram notification to chatId ${chatId}:`, error.message);
  }
};

module.exports = { bot, sendNotification };