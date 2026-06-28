const express = require('express')
const router = express.Router()
const {
  getWalletBalance,
  getVirtualAccount,
  createCheckout,
  verifyCheckoutPayment,
  handleWebhook,
  getTransactions,
  getReconciliationReport,
  getAuditLogs
} = require('../controllers/payment.controller')
const {
  protect,
  authorize
} = require('../middleware/auth.middleware')

/**
 * @swagger
 * tags:
 *   name: Payments
 *   description: |
 *     Nomba-powered payment system with:
 *     - Virtual Account wallet funding
 *     - Nomba Checkout card payments
 *     - Webhook handling with idempotency
 *     - Reconciliation and audit logs
 */

// ─────────────────────────────────────────────────
// WALLET
// ─────────────────────────────────────────────────

/**
 * @swagger
 * /api/v1/payments/wallet:
 *   get:
 *     summary: Get wallet balance and virtual account details
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Wallet balance and Nomba virtual account
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 walletBalance:
 *                   type: number
 *                   example: 2500
 *                 virtualAccount:
 *                   type: object
 *                   properties:
 *                     accountNumber:
 *                       type: string
 *                       example: "9876543210"
 *                     bankName:
 *                       type: string
 *                       example: Nomba
 *                     accountName:
 *                       type: string
 *                       example: Toluwalope Adeleke
 *       401:
 *         description: Not authorized
 */
router.get('/wallet', protect, getWalletBalance)

// ─────────────────────────────────────────────────
// VIRTUAL ACCOUNT
// ─────────────────────────────────────────────────

/**
 * @swagger
 * /api/v1/payments/virtual-account:
 *   get:
 *     summary: Get or generate Nomba virtual account for wallet funding
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     description: |
 *       Returns the student's dedicated Nomba virtual account number.
 *       Transfer any amount to this account to fund your Waka Wallet instantly.
 *       Webhook confirms the transfer and credits wallet automatically.
 *     responses:
 *       200:
 *         description: Virtual account details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 virtualAccount:
 *                   type: object
 *                   properties:
 *                     accountNumber:
 *                       type: string
 *                       example: "9876543210"
 *                     bankName:
 *                       type: string
 *                       example: Nomba
 *                     accountName:
 *                       type: string
 *                       example: Toluwalope Adeleke
 *                     reference:
 *                       type: string
 *                 instruction:
 *                   type: string
 *                   example: Transfer any amount to fund your wallet instantly.
 *       401:
 *         description: Not authorized
 *       500:
 *         description: Failed to generate virtual account
 */
router.get('/virtual-account', protect, getVirtualAccount)

// ─────────────────────────────────────────────────
// CHECKOUT
// ─────────────────────────────────────────────────

/**
 * @swagger
 * /api/v1/payments/checkout:
 *   post:
 *     summary: Create Nomba checkout session for card payment
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     description: |
 *       Alternative to virtual account.
 *       Creates a Nomba checkout session for card payment.
 *       Supports idempotency key to prevent duplicate charges.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [amount]
 *             properties:
 *               amount:
 *                 type: number
 *                 example: 1000
 *                 description: Amount in Naira. Minimum ₦100.
 *               idempotencyKey:
 *                 type: string
 *                 example: unique-key-12345
 *                 description: Optional. Prevents duplicate checkout sessions.
 *     responses:
 *       200:
 *         description: Checkout session created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 reference:
 *                   type: string
 *                   example: WAKA-CHECKOUT-A1B2C3D4E5F6
 *                 checkoutUrl:
 *                   type: string
 *                   description: Redirect student to this URL to complete payment
 *                 amount:
 *                   type: number
 *                   example: 1000
 *                 message:
 *                   type: string
 *       400:
 *         description: Invalid amount
 *       409:
 *         description: Duplicate request still processing
 */
router.post('/checkout', protect, createCheckout)

// ─────────────────────────────────────────────────
// VERIFY PAYMENT
// ─────────────────────────────────────────────────

/**
 * @swagger
 * /api/v1/payments/verify/{reference}:
 *   get:
 *     summary: Verify checkout payment status with Nomba
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     description: |
 *       Verifies a checkout payment with Nomba and credits wallet if successful.
 *       Can be polled every 3 seconds from frontend until payment is confirmed.
 *     parameters:
 *       - in: path
 *         name: reference
 *         required: true
 *         schema:
 *           type: string
 *         description: Payment reference from checkout session
 *         example: WAKA-CHECKOUT-A1B2C3D4E5F6
 *     responses:
 *       200:
 *         description: Payment verified and wallet funded
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Payment verified. Wallet funded.
 *                 walletBalance:
 *                   type: number
 *                   example: 3500
 *                 transaction:
 *                   type: object
 *                   properties:
 *                     reference:
 *                       type: string
 *                     amount:
 *                       type: number
 *                     status:
 *                       type: string
 *                       example: success
 *       400:
 *         description: Payment not yet confirmed
 *       404:
 *         description: Transaction not found
 */
router.get('/verify/:reference', protect, verifyCheckoutPayment)

// ─────────────────────────────────────────────────
// NOMBA WEBHOOK
// ─────────────────────────────────────────────────

/**
 * @swagger
 * /api/v1/payments/webhook:
 *   post:
 *     summary: Nomba webhook receiver
 *     tags: [Payments]
 *     description: |
 *       Receives and processes payment events from Nomba.
 *
 *       **Supported events:**
 *       - `virtual_account.credit` — Student transfers to their virtual account
 *       - `transfer.success` — Bank transfer confirmed
 *       - `checkout.success` — Card payment completed
 *       - `payment.success` — General payment success
 *
 *       **Security:**
 *       - Webhook signature verified via HMAC SHA-512
 *       - Duplicate webhooks ignored via idempotency check
 *       - All events logged to audit trail
 *
 *       **Flow:**
 *       1. Nomba sends webhook
 *       2. Signature verified
 *       3. Duplicate check performed
 *       4. Wallet credited atomically
 *       5. Reconciliation record created
 *       6. Student notified
 *
 *       Always returns 200 to Nomba to prevent retries after processing.
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               event:
 *                 type: string
 *                 example: virtual_account.credit
 *                 enum:
 *                   - virtual_account.credit
 *                   - transfer.success
 *                   - checkout.success
 *                   - payment.success
 *               data:
 *                 type: object
 *                 properties:
 *                   accountNumber:
 *                     type: string
 *                   amount:
 *                     type: number
 *                   reference:
 *                     type: string
 *     responses:
 *       200:
 *         description: Webhook received and processed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Webhook processed
 *       400:
 *         description: Invalid webhook signature
 */
router.post('/webhook', handleWebhook)

// ─────────────────────────────────────────────────
// TRANSACTION HISTORY
// ─────────────────────────────────────────────────

/**
 * @swagger
 * /api/v1/payments/transactions:
 *   get:
 *     summary: Get paginated transaction history
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum:
 *             - wallet_funding
 *             - rental_payment
 *             - deposit_refund
 *             - late_fee
 *             - checkout_payment
 *         description: Filter by transaction type
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, success, failed]
 *         description: Filter by status
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *     responses:
 *       200:
 *         description: Paginated transaction history
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 count:
 *                   type: number
 *                 total:
 *                   type: number
 *                 page:
 *                   type: number
 *                 transactions:
 *                   type: array
 */
router.get('/transactions', protect, getTransactions)

// ─────────────────────────────────────────────────
// RECONCILIATION — ADMIN ONLY
// ─────────────────────────────────────────────────

/**
 * @swagger
 * /api/v1/payments/reconciliation:
 *   get:
 *     summary: Daily reconciliation report (Admin only)
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     description: |
 *       Compares expected vs actual payment amounts.
 *       Shows unreconciled transactions and discrepancies.
 *       Use to verify Nomba balance matches internal records.
 *     parameters:
 *       - in: query
 *         name: date
 *         schema:
 *           type: string
 *           format: date
 *           example: "2026-06-25"
 *         description: Date to reconcile. Defaults to today.
 *     responses:
 *       200:
 *         description: Reconciliation summary
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 dailySummary:
 *                   type: object
 *                   properties:
 *                     date:
 *                       type: string
 *                     totalTransactions:
 *                       type: number
 *                     totalExpected:
 *                       type: number
 *                     totalActual:
 *                       type: number
 *                     totalDiscrepancy:
 *                       type: number
 *                     unreconciledCount:
 *                       type: number
 *                     reconciliationRate:
 *                       type: string
 *                       example: "98.50%"
 *                 unreconciled:
 *                   type: object
 *                   properties:
 *                     count:
 *                       type: number
 *                     items:
 *                       type: array
 *       401:
 *         description: Not authorized
 *       403:
 *         description: Admin access required
 */
router.get(
  '/reconciliation',
  protect,
  authorize('admin'),
  getReconciliationReport
)

// ─────────────────────────────────────────────────
// AUDIT LOGS — ADMIN ONLY
// ─────────────────────────────────────────────────

/**
 * @swagger
 * /api/v1/payments/audit-logs:
 *   get:
 *     summary: Payment audit logs (Admin only)
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     description: |
 *       Full audit trail of all payment-related actions.
 *       Every wallet credit, checkout, webhook, and refund is logged.
 *       Includes who did it, when, what changed, and the result.
 *     parameters:
 *       - in: query
 *         name: userId
 *         schema:
 *           type: string
 *         description: Filter by specific user
 *       - in: query
 *         name: action
 *         schema:
 *           type: string
 *           enum:
 *             - WALLET_FUNDED
 *             - CHECKOUT_INITIATED
 *             - CHECKOUT_VERIFIED
 *             - WEBHOOK_RECEIVED
 *             - WEBHOOK_DUPLICATE
 *             - WEBHOOK_FAILED
 *             - PAYMENT_FAILED
 *             - DEPOSIT_REFUNDED
 *             - LATE_FEE_CHARGED
 *         description: Filter by action type
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *     responses:
 *       200:
 *         description: Paginated audit logs
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 count:
 *                   type: number
 *                 total:
 *                   type: number
 *                 logs:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       action:
 *                         type: string
 *                       userId:
 *                         type: object
 *                       resourceType:
 *                         type: string
 *                       previousState:
 *                         type: object
 *                       newState:
 *                         type: object
 *                       status:
 *                         type: string
 *                       createdAt:
 *                         type: string
 *       401:
 *         description: Not authorized
 *       403:
 *         description: Admin access required
 */
router.get(
  '/audit-logs',
  protect,
  authorize('admin'),
  getAuditLogs
)

module.exports = router