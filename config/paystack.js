/**
 * Paystack Configuration & API Client
 */

const axios = require('axios');

const {
  PAYSTACK_PUBLIC_KEY,
  PAYSTACK_SECRET_KEY,
  PAYSTACK_BASE_URL = 'https://api.paystack.co',
} = process.env;

if (!PAYSTACK_SECRET_KEY) {
  throw new Error('PAYSTACK_SECRET_KEY is not set in environment variables');
}

/**
 * Paystack API Client
 */
const paystackClient = axios.create({
  baseURL: PAYSTACK_BASE_URL,
  headers: {
    Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
    'Content-Type': 'application/json',
  },
});

/**
 * Initialize a payment transaction
 * @param {Object} params - Transaction parameters
 * @returns {Promise<Object>} - Response from Paystack API
 */
async function initializeTransaction(params) {
  try {
    const response = await paystackClient.post('/transaction/initialize', params);
    return response.data;
  } catch (error) {
    console.error('Error initializing transaction:', error.message);
    throw error;
  }
}

/**
 * Verify a transaction
 * @param {string} reference - Transaction reference
 * @returns {Promise<Object>} - Verified transaction details
 */
async function verifyTransaction(reference) {
  try {
    const response = await paystackClient.get(`/transaction/verify/${reference}`);
    return response.data;
  } catch (error) {
    console.error('Error verifying transaction:', error.message);
    throw error;
  }
}

/**
 * Get transaction details
 * @param {number} id - Transaction ID
 * @returns {Promise<Object>} - Transaction details
 */
async function getTransaction(id) {
  try {
    const response = await paystackClient.get(`/transaction/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching transaction:', error.message);
    throw error;
  }
}

/**
 * List transactions
 * @param {Object} params - Query parameters (perPage, page, status, etc.)
 * @returns {Promise<Object>} - List of transactions
 */
async function listTransactions(params = {}) {
  try {
    const response = await paystackClient.get('/transaction', { params });
    return response.data;
  } catch (error) {
    console.error('Error listing transactions:', error.message);
    throw error;
  }
}

/**
 * Create a customer
 * @param {Object} params - Customer details
 * @returns {Promise<Object>} - Created customer
 */
async function createCustomer(params) {
  try {
    const response = await paystackClient.post('/customer', params);
    return response.data;
  } catch (error) {
    console.error('Error creating customer:', error.message);
    throw error;
  }
}

/**
 * Get customer details
 * @param {number} id - Customer ID or email
 * @returns {Promise<Object>} - Customer details
 */
async function getCustomer(id) {
  try {
    const response = await paystackClient.get(`/customer/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching customer:', error.message);
    throw error;
  }
}

/**
 * Create a subscription
 * @param {Object} params - Subscription parameters
 * @returns {Promise<Object>} - Created subscription
 */
async function createSubscription(params) {
  try {
    const response = await paystackClient.post('/subscription', params);
    return response.data;
  } catch (error) {
    console.error('Error creating subscription:', error.message);
    throw error;
  }
}

/**
 * Initiate a transfer
 * @param {Object} params - Transfer parameters
 * @returns {Promise<Object>} - Transfer details
 */
async function initiateTransfer(params) {
  try {
    const response = await paystackClient.post('/transfer', params);
    return response.data;
  } catch (error) {
    console.error('Error initiating transfer:', error.message);
    throw error;
  }
}

/**
 * Create a transfer recipient
 * @param {Object} params - Recipient details
 * @returns {Promise<Object>} - Created recipient
 */
async function createTransferRecipient(params) {
  try {
    const response = await paystackClient.post('/transferrecipient', params);
    return response.data;
  } catch (error) {
    console.error('Error creating transfer recipient:', error.message);
    throw error;
  }
}

module.exports = {
  PAYSTACK_PUBLIC_KEY,
  PAYSTACK_SECRET_KEY,
  PAYSTACK_BASE_URL,
  paystackClient,
  initializeTransaction,
  verifyTransaction,
  getTransaction,
  listTransactions,
  createCustomer,
  getCustomer,
  createSubscription,
  initiateTransfer,
  createTransferRecipient,
};
