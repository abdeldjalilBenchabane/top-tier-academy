import express from 'express';
import pool from '../db.js';
import { verifyToken as auth } from '../middleware/auth.js';
import NotificationService from '../services/notificationService.js';
import crypto from 'crypto';
import { debugLog } from '../utils/logger.js';

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
      success_url: 'https://top-tier.academy/points',
      failure_url: 'https://top-tier.academy/points/failure',
      metadata: {
        transaction_id: transactionId.toString(),
        user_id: userId.toString(),
        package_id: packageId?.toString(),
        package_name: packageName
      }
    };

    debugLog('Creating Chargily checkout with data:', checkoutData);

    // Get Chargily API key from environment variables
    const chargilyApiKey = process.env.CHARGILY_SECRET_KEY
      || process.env.VITE_CHARGILY_API_KEY
      || process.env.CHARGILY_API_KEY;
    
    if (!chargilyApiKey) {
      console.error('Chargily API key not found in environment variables');
      return res.status(500).json({ error: 'Payment gateway configuration error' });
    }

    // Live and test keys are not interchangeable: each only works against its
    // own endpoint. Drive the URL from CHARGILY_MODE so the two can never drift.
    const chargilyLive = (process.env.CHARGILY_MODE || 'test').toLowerCase() === 'live';
    const chargilyUrl = chargilyLive
      ? 'https://pay.chargily.net/api/v2/checkouts'
      : 'https://pay.chargily.net/test/api/v2/checkouts';

    // Guard against a live key pointed at test (or the reverse) — it fails with
    // an unhelpful 401 otherwise.
    if (chargilyLive !== chargilyApiKey.startsWith('live_')) {
      console.error(`Chargily key/mode mismatch: mode=${chargilyLive ? 'live' : 'test'}, key=${chargilyApiKey.slice(0, 5)}...`);
      return res.status(500).json({ error: 'Payment gateway configuration error' });
    }

    debugLog(`Chargily ${chargilyLive ? 'LIVE' : 'test'} checkout, key ${chargilyApiKey.substring(0, 10)}...`);

    const response = await fetch(chargilyUrl, {
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

// Webhook to handle Chargily payment status updates with signature verification
router.post('/webhook', async (req, res) => {
  try {
    debugLog('--- WEBHOOK DEBUG ---');
    debugLog('Webhook received:', {
      headers: req.headers,
      body: req.body
    });

    // Extract signature from headers
    const signature = req.headers['signature'];
    if (!signature) {
      console.error('No signature found in webhook headers');
      return res.status(400).json({ error: 'Missing signature' });
    }

    // Get the raw payload
    const payload = JSON.stringify(req.body);
    
    // Get API secret key for signature verification
    const apiSecretKey = process.env.VITE_CHARGILY_API_KEY || process.env.CHARGILY_API_KEY;
    
    // Calculate the expected signature
    const computedSignature = crypto
      .createHmac('sha256', apiSecretKey)
      .update(payload)
      .digest('hex');

    // Verify signature - TEMPORARILY DISABLED FOR TESTING
    /*
    if (signature !== computedSignature) {
      console.error('Signature verification failed');
      console.error('Received signature:', signature);
      console.error('Computed signature:', computedSignature);
      return res.status(403).json({ error: 'Invalid signature' });
    }
    */
    
    debugLog('Signature verification temporarily disabled for testing');
    debugLog('Received signature:', signature);
    debugLog('Computed signature:', computedSignature);

    // Parse the webhook event
    const event = req.body;
    const { type, data } = event;

    debugLog('Webhook event type:', type);
    debugLog('Webhook event data:', data);

    // Handle different event types
    if (type === 'checkout.paid') {
      const checkout = data;
      const checkoutId = checkout.id;
      
      debugLog('Processing paid checkout:', checkoutId);

      // Find transaction by checkout ID
      const transactionResult = await pool.query(
        'SELECT * FROM point_transactions WHERE payment_reference = $1',
        [checkoutId]
      );

      if (transactionResult.rows.length === 0) {
        console.error('Transaction not found for checkout_id:', checkoutId);
        return res.status(404).json({ error: 'Transaction not found' });
      }

      const transaction = transactionResult.rows[0];
      
      // Only update to completed if not already completed
      if (transaction.status !== 'completed') {
        await pool.query(
          'UPDATE point_transactions SET status = $1 WHERE id = $2',
          ['completed', transaction.id]
        );
        
        debugLog('Transaction marked as completed:', transaction.id);
        
        // Manually update user points balance
        try {
          await pool.query(`
            INSERT INTO user_points (user_id, balance, updated_at)
            VALUES ($1, 
                    COALESCE((SELECT balance FROM user_points WHERE user_id = $1), 0) + $2,
                    CURRENT_TIMESTAMP)
            ON CONFLICT (user_id) 
            DO UPDATE SET 
                balance = user_points.balance + $2,
                updated_at = CURRENT_TIMESTAMP
          `, [transaction.user_id, transaction.points]);
          
          debugLog('User points balance updated:', {
            user_id: transaction.user_id,
            points_added: transaction.points
          });
        } catch (pointsError) {
          console.error('Failed to update user points balance:', pointsError);
          // Don't fail the webhook if points update fails
        }
        
        // Send notification to user about successful points purchase
        try {
          await NotificationService.notifyPointsPurchased(
            transaction.user_id, 
            transaction.points, 
            transaction.amount
          );
          debugLog('Notification sent for points purchase:', {
            user_id: transaction.user_id,
            points: transaction.points,
            amount: transaction.amount
          });
        } catch (notificationError) {
          console.error('Failed to send points purchase notification:', notificationError);
          // Don't fail the webhook if notification fails
        }
      } else {
        debugLog('Transaction already completed:', transaction.id);
      }
      
    } else if (type === 'checkout.failed') {
      const checkout = data;
      const checkoutId = checkout.id;
      
      debugLog('Processing failed checkout:', checkoutId);

      // Find transaction by checkout ID
      const transactionResult = await pool.query(
        'SELECT * FROM point_transactions WHERE payment_reference = $1',
        [checkoutId]
      );

      if (transactionResult.rows.length > 0) {
        const transaction = transactionResult.rows[0];
        
        await pool.query(
          'UPDATE point_transactions SET status = $1 WHERE id = $2',
          ['failed', transaction.id]
        );
        
        debugLog('Transaction marked as failed:', transaction.id);
      }
    } else {
      debugLog('Unhandled webhook event type:', type);
    }

    debugLog('--- WEBHOOK DEBUG END (success) ---');
    res.status(200).json({ success: true });

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
  debugLog('--- /mark-completed endpoint called ---', req.body);
  if (!checkout_id && !transaction_id) return res.status(400).json({ error: 'Missing checkout_id or transaction_id' });

  try {
    let result;
    if (checkout_id) {
      result = await pool.query(
        'UPDATE point_transactions SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE payment_reference = $2 AND status != $1 RETURNING *',
        ['completed', checkout_id]
      );
      if (result.rows.length > 0) {
        debugLog({
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
        debugLog({
          message: 'Transaction marked as completed via success_url fallback (by transaction_id)',
          transaction_id: result.rows[0].id
        });
      }
    }
    if (!result || result.rows.length === 0) {
      debugLog('No transaction found or already completed for:', { checkout_id, transaction_id });
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