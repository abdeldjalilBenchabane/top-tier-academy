import express from 'express';
import pool from '../db.js';
import { verifyToken as auth } from '../middleware/auth.js';

const router = express.Router();

// Create Chargily checkout
router.post('/create-checkout', auth, async (req, res) => {
  try {
    const { amount, currency = 'dzd', packageId, packageName } = req.body;
    const userId = req.user.id;

    // Validate amount
    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Invalid amount' });
    }

    // Create transaction record first (status: 'pending')
    const transactionResult = await pool.query(
      `INSERT INTO point_transactions 
       (user_id, package_id, transaction_type, points, amount, currency, status, metadata)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id`,
      [
        userId,
        packageId,
        'purchase',
        parseInt(amount), // Convert to integer
        parseFloat(amount), // Convert to float for amount
        currency,
        'pending', // Mark as pending until payment is confirmed
        JSON.stringify({ packageName, source: 'chargily' })
      ]
    );

    const transactionId = transactionResult.rows[0].id;

    // DO NOT add points to user account here!

    // Create Chargily checkout
    const checkoutData = {
      amount: parseInt(amount),
      currency: 'dzd', // Chargily expects lowercase 'dzd'
      success_url:  'http://localhost:8080/points',
      failure_url: `${ 'http://localhost:8080/points'}/points/failure?transaction_id=${transactionId}`,
      metadata: {
        transaction_id: transactionId.toString(),
        user_id: userId.toString(),
        package_id: packageId?.toString(),
        package_name: packageName
      }
    };

    console.log('Creating Chargily checkout with data:', checkoutData);

    // Get Chargily API key from environment variables
    const chargilyApiKey = process.env.VITE_CHARGILY_API_KEY || process.env.CHARGILY_API_KEY;
    
    if (!chargilyApiKey) {
      console.error('Chargily API key not found in environment variables');
      return res.status(500).json({ error: 'Payment gateway configuration error' });
    }

    console.log('Using Chargily API key:', chargilyApiKey.substring(0, 10) + '...');

    const response = await fetch('https://pay.chargily.net/test/api/v2/checkouts', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${chargilyApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(checkoutData)
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Chargily API error:', errorData);
      console.error('Response status:', response.status);
      console.error('Request data:', checkoutData);
      return res.status(400).json({ 
        error: 'Payment gateway error', 
        details: errorData,
        status: response.status
      });
    }

    const checkoutResponse = await response.json();

    // Update transaction with checkout ID
    await pool.query(
      'UPDATE point_transactions SET payment_reference = $1 WHERE id = $2',
      [checkoutResponse.id, transactionId]
    );

    res.json({
      success: true,
      transactionId,
      checkoutUrl: checkoutResponse.checkout_url,
      checkoutId: checkoutResponse.id,
      message: 'Checkout created successfully'
    });

  } catch (error) {
    console.error('Error creating checkout:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Webhook to handle Chargily payment status updates
router.post('/webhook', async (req, res) => {
  try {
    console.log('--- WEBHOOK DEBUG ---');
    console.log('Webhook received:', {
      headers: req.headers,
      body: req.body
    });
    const { checkout_id, status, amount, currency } = req.body;
    console.log('Parsed webhook data:', {
      checkout_id,
      status,
      amount,
      currency
    });

    // Find transaction by checkout ID
    const transactionResult = await pool.query(
      'SELECT * FROM point_transactions WHERE payment_reference = $1',
      [checkout_id]
    );
    console.log('DB query for payment_reference:', {
      payment_reference: checkout_id,
      result: transactionResult.rows
    });

    if (transactionResult.rows.length === 0) {
      console.error('Transaction not found for checkout_id:', checkout_id);
      // Log all payment_references in the DB for debugging
      const allRefs = await pool.query('SELECT id, payment_reference, status FROM point_transactions ORDER BY id DESC LIMIT 10');
      console.log('Recent payment_references in DB:', allRefs.rows);
      console.log('--- WEBHOOK DEBUG END (not found) ---');
      return res.status(404).json({ error: 'Transaction not found' });
    }

    const transaction = transactionResult.rows[0];
    console.log('Found transaction:', transaction);
    console.log('Status transition:', {
      current_db_status: transaction.status,
      webhook_status: status
    });
      
    // Only update to completed if not already completed
    if (status && status.toLowerCase() === 'paid' && transaction.status !== 'completed') {
      await pool.query(
          'UPDATE point_transactions SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
        ['completed', transaction.id]
        );
      console.log({
        message: 'Transaction marked as completed (points will be added by trigger)',
        transaction_id: transaction.id
      });
    } else if (!status || status.toLowerCase() !== 'paid') {
      await pool.query(
        'UPDATE point_transactions SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
        ['failed', transaction.id]
      );
      console.log({
        message: 'Transaction marked as failed',
        transaction_id: transaction.id
      });
    } else {
      console.log({
        message: 'Transaction already completed, skipping update.',
        transaction_id: transaction.id
      });
    }
    console.log('--- WEBHOOK DEBUG END (success) ---');
    res.json({ success: true });

  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

// Diagnostic endpoint: List last 5 transactions
router.get('/debug/transactions', async (req, res) => {
  try {
    const result = await pool.query('SELECT id, payment_reference, status FROM point_transactions ORDER BY id DESC LIMIT 5');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch transactions', details: error.message });
  }
});

// Fallback endpoint: Mark transaction as completed if user lands on success_url with a valid token
router.post('/mark-completed', async (req, res) => {
  const { checkout_id, transaction_id } = req.body;
  console.log('--- /mark-completed endpoint called ---', req.body);
  if (!checkout_id && !transaction_id) return res.status(400).json({ error: 'Missing checkout_id or transaction_id' });

  try {
    let result;
    if (checkout_id) {
      result = await pool.query(
        'UPDATE point_transactions SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE payment_reference = $2 AND status != $1 RETURNING *',
        ['completed', checkout_id]
      );
      if (result.rows.length > 0) {
        console.log({
          message: 'Transaction marked as completed via success_url fallback (by checkout_id)',
          transaction_id: result.rows[0].id
        });
      }
    }
    // Fallback: try by transaction_id if not found by checkout_id
    if ((!result || result.rows.length === 0) && transaction_id) {
      result = await pool.query(
        'UPDATE point_transactions SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 AND status != $1 RETURNING *',
        ['completed', transaction_id]
      );
      if (result.rows.length > 0) {
        console.log({
          message: 'Transaction marked as completed via success_url fallback (by transaction_id)',
          transaction_id: result.rows[0].id
        });
      }
    }
    if (!result || result.rows.length === 0) {
      console.log('No transaction found or already completed for:', { checkout_id, transaction_id });
      return res.status(404).json({ error: 'Transaction not found or already completed', checkout_id, transaction_id });
    }
    res.json({ success: true, transaction: result.rows[0] });
  } catch (error) {
    console.error('Error in /mark-completed:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});

// Get transaction status
router.get('/transaction/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const result = await pool.query(
      'SELECT * FROM point_transactions WHERE id = $1 AND user_id = $2',
      [id, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    res.json({ transaction: result.rows[0] });

  } catch (error) {
    console.error('Error fetching transaction:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router; 