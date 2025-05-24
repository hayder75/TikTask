const axios = require('axios');

const CHAPA_BASE_URL = 'https://api.chapa.co/v1';
const CHAPA_SECRET_KEY = process.env.CHAPA_SECRET_KEY; // Ensure this is set in your .env file

// Initiate a payment
async function initiatePayment({ amount, tx_ref, email, first_name, last_name, return_url, callback_url }) {
  const payload = {
    amount,
    currency: 'ETB',
    email,
    first_name,
    last_name,
    tx_ref,
    return_url,
    callback_url,
    customization: {
      title: 'Campaign Deposit',
      description: 'Deposit for campaign funding',
    },
  };

  try {
    const response = await axios.post(`${CHAPA_BASE_URL}/transaction/initialize`, payload, {
      headers: {
        Authorization: `Bearer ${CHAPA_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
    });
    return response.data;
  } catch (error) {
    console.error('Chapa initiatePayment error:', error.response?.data || error.message);
    throw error;
  }
}

// Verify a payment
async function verifyPayment(tx_ref) {
  try {
    const response = await axios.get(`${CHAPA_BASE_URL}/transaction/verify/${tx_ref}`, {
      headers: {
        Authorization: `Bearer ${CHAPA_SECRET_KEY}`,
      },
    });
    return response.data;
  } catch (error) {
    console.error('Chapa verifyPayment error:', error.response?.data || error.message);
    throw error;
  }
}

module.exports = {
  initiatePayment,
  verifyPayment,
};
