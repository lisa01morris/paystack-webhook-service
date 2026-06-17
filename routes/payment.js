/**
 * Payment Routes
 * Handles payment initialization and verification
 */

const express = require('express');
const {
  initializeTransaction,
  verifyTransaction,
  getTransaction,
  listTransactions,
} = require('../config/paystack');

const router = express.Router();

/**
 * POST /api/payment/initialize
 * Initialize a payment transaction
 * @body {number} amount - Amount in kobo (for NGN)
 * @body {string} email - Customer email
 * @body {string} reference - Unique transaction reference (optional)
 * @body {Object} metadata - Additional data to attach to transaction (optional)
 */
router.post('/initialize', async (req, res) => {
  try {
    const { amount, email, reference, metadata } = req.body;

    // Validation
    if (!amount || !email) {
      return res.status(400).json({
        status: false,
        message: 'Amount and email are required',
      });
    }

    const params = {
      amount: Math.round(amount), // Ensure it's in kobo
      email,
      reference,
      metadata,
    };

    const response = await initializeTransaction(params);

    res.json({
      status: true,
      data: response.data,
      authorizationUrl: response.data?.authorization_url,
    });
  } catch (error) {
    console.error('Payment initialization error:', error.message);
    res.status(500).json({
      status: false,
      message: 'Failed to initialize payment',
      error: error.message,
    });
  }
});

/**
 * GET /api/payment/verify/:reference
 * Verify a payment transaction
 * @param {string} reference - Transaction reference
 */
router.get('/verify/:reference', async (req, res) => {
  try {
    const { reference } = req.params;

    if (!reference) {
      return res.status(400).json({
        status: false,
        message: 'Reference is required',
      });
    }

    const response = await verifyTransaction(reference);

    res.json({
      status: response.status,
      data: response.data,
      message: response.message,
    });
  } catch (error) {
    console.error('Payment verification error:', error.message);
    res.status(500).json({
      status: false,
      message: 'Failed to verify payment',
      error: error.message,
    });
  }
});

/**
 * GET /api/payment/:id
 * Get transaction details
 * @param {number} id - Transaction ID
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        status: false,
        message: 'Transaction ID is required',
      });
    }

    const response = await getTransaction(id);

    res.json({
      status: true,
      data: response.data,
    });
  } catch (error) {
    console.error('Get transaction error:', error.message);
    res.status(500).json({
      status: false,
      message: 'Failed to fetch transaction',
      error: error.message,
    });
  }
});

/**
 * GET /api/payment
 * List transactions with filters
 * @query {number} page - Page number (default: 1)
 * @query {number} perPage - Results per page (default: 10)
 * @query {string} status - Filter by status (success, failed, abandoned)
 */
router.get('/', async (req, res) => {
  try {
    const { page = 1, perPage = 10, status } = req.query;

    const params = {
      page: Math.max(1, parseInt(page)),
      perPage: Math.min(100, parseInt(perPage)),
    };

    if (status) {
      params.status = status;
    }

    const response = await listTransactions(params);

    res.json({
      status: true,
      data: response.data,
      pagination: {
        total: response.meta?.total,
        totalPages: response.meta?.total_pages,
        currentPage: response.meta?.page,
        perPage: response.meta?.pageSize,
      },
    });
  } catch (error) {
    console.error('List transactions error:', error.message);
    res.status(500).json({
      status: false,
      message: 'Failed to fetch transactions',
      error: error.message,
    });
  }
});

module.exports = router;
