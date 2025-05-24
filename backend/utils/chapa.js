const axios = require('axios');
require('dotenv').config();

const CHAPA_SECRET_KEY = process.env.CHAPA_SECRET_KEY;

async function initiatePayment({ amount, tx_ref, email, first_name, last_name, return_url, callback_url }) {
  try {
    const response = await axios.post(
      'https://api.chapa.co/v1/transaction/initialize',
      {
        amount,
        currency: 'ETB',
        email,
        first_name,
        last_name,
        tx_ref,
        return_url,
        callback_url,
      },
      {
        headers: {
          Authorization: `Bearer ${CHAPA_SECRET_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error('Chapa init error:', error.response?.data || error.message);
    throw error;
  }
}

async function verifyTransaction(tx_ref) {
  try {
    const response = await axios.get(`https://api.chapa.co/v1/transaction/verify/${tx_ref}`, {
      headers: {
        Authorization: `Bearer ${CHAPA_SECRET_KEY}`,
      },
    });
    return response.data;
  } catch (error) {
    console.error('Chapa verify error:', error.response?.data || error.message);
    throw error;
  }
}

module.exports = {
  initiatePayment,
  verifyTransaction,
};
