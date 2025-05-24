// routes/chapa.js
const express = require('express');
const axios = require('axios');
require('dotenv').config();

const router = express.Router();

router.post('/initialize', async (req, res) => {
  const { amount, currency, email, first_name, last_name, tx_ref, callback_url, return_url } = req.body;

  try {
    const response = await axios.post(
      `${process.env.CHAPA_BASE_URL}/transaction/initialize`,
      {
        amount,
        currency,
        email,
        first_name,
        last_name,
        tx_ref,
        callback_url,
        return_url,
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.CHAPA_SECRET_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    res.status(200).json(response.data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// routes/chapa.js
router.get('/verify/:tx_ref', async (req, res) => {
    const { tx_ref } = req.params;
  
    try {
      const response = await axios.get(
        `${process.env.CHAPA_BASE_URL}/transaction/verify/${tx_ref}`,
        {
          headers: {
            Authorization: `Bearer ${process.env.CHAPA_SECRET_KEY}`,
          },
        }
      );
  
      res.status(200).json(response.data);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  
  // routes/chapa.js
router.post('/webhook', (req, res) => {
    const event = req.body;
  
    // Verify the event's authenticity here (e.g., using a secret hash)
  
    if (event.event === 'payment.success') {
      const tx_ref = event.data.tx_ref;
      const amount = event.data.amount;
  
      // Update your database to reflect the successful payment
      // e.g., mark the seller's deposit as completed
  
      // Distribute funds to marketers based on achievements
      // Implement your business logic here
    }
  
    res.status(200).send('Webhook received');
  });
  
module.exports = router;
