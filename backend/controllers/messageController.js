const Message = require('../models/Message');
const User = require('../models/User');

const sendMessage = async (req, res) => {
  const { recipientId, content, campaignId } = req.body;

  try {
    if (!recipientId || !content) {
      return res.status(400).json({ message: 'recipientId and content are required' });
    }

    const recipient = await User.findById(recipientId);
    if (!recipient) {
      return res.status(404).json({ message: 'Recipient not found' });
    }

    const message = new Message({
      senderId: req.user._id,
      recipientId,
      content,
      campaignId,
    });

    await message.save();
    res.status(201).json({ message: 'Message sent successfully', messageId: message._id });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const getMessages = async (req, res) => {
  try {
    const messages = await Message.find({ recipientId: req.user._id })
      .populate('senderId', 'name email')
      .populate('campaignId', 'title description')
      .sort({ createdAt: -1 });

    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const markMessageAsRead = async (req, res) => {
  const { messageId } = req.params;

  try {
    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }
    if (message.recipientId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    message.read = true;
    await message.save();
    res.json({ message: 'Message marked as read' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = { sendMessage, getMessages, markMessageAsRead };