const express = require('express')
const router = express.Router()
const {
  getWalletBalance,
  getVirtualAccount,
  createCheckout,
  verifyCheckoutPayment,
  handleWebhook,
  getTransactions,
  pollPaymentStatus,
  getReconciliationReport,
  getAuditLogs
} = require('../controllers/payment.controller')
const {
  protect,
  authorize
} = require('../middleware/auth.middleware')
const {
  validateCheckout
} = require('../middleware/validate.middleware')
const {
  paymentLimiter
} = require('../middleware/ratelimit.middleware')

/**
 * @swagger
 * tags:
 *   name: Payments
 *   description: |
 *     Nomba-powered payment system.
 *
 *     ### Two Ways To Fund Wallet
 *     1. **Virtual Account** — Transfer to your Nomba account number. Instant via webhook.
 *     2. **Checkout** — Pay by card via Nomba checkout link.
 *
 *     ### Security Features
 *     - Webhook HMAC SHA-512 signature verification
 *     - Idempotency keys prevent duplicate charges
 *     - MongoDB atomic transactions prevent partial updates
 *     - Rate limiting on payment endpoints
 *     - Full audit trail on every transaction
 *
 *     ### Admin Features
 *     - Daily reconciliation reports
 *     - Full payment audit logs
 *     - Discrepancy detection
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
 *       Returns the student's dedicated Nomba virtual account.
 *       Transfer any amount to fund wallet instantly.
 *       Nomba fires a webhook which automatically credits the wallet.
 *
 *       If no virtual account exists yet, one is generated via Nomba API.
 *       Each student gets a unique permanent account number.
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
 *       Alternative to virtual account transfer.
 *       Creates a Nomba hosted checkout page for card payment.
 *
 *       **Idempotency:**
 *       Pass an idempotencyKey to prevent duplicate checkout sessions
 *       if the same request is sent multiple times.
 *
 *       **After payment:**
 *       - Poll GET /verify/:reference every 3 seconds
 *       - Or wait for webhook to credit wallet automatically
 *
 *       Rate limited to 10 requests per minute.
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
 *                 example: checkout-user123-1719312000
 *                 description: Optional unique key to prevent duplicate sessions
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
 *       400:
 *         description: Validation error — amount below minimum
 *       409:
 *         description: Duplicate request still processing
 *       429:
 *         description: Too many requests — rate limited
 */
router.post(
  '/checkout',
  protect,
  paymentLimiter,
  validateCheckout,
  createCheckout
)

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
 *       Verifies a checkout payment with Nomba.
 *       If successful, credits wallet and creates reconciliation record.
 *
 *       **Frontend polling:**
 *       Call this every 3 seconds after checkout redirect
 *       until status returns success.
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
 *         description: Payment not yet confirmed by Nomba
 *       404:
 *         description: Transaction reference not found
 */
router.get('/verify/:reference', protect, verifyCheckoutPayment)

// ─────────────────────────────────────────────────
// POLL PAYMENT STATUS
// ─────────────────────────────────────────────────

/**
 * @swagger
 * /api/v1/payments/status/{reference}:
 *   get:
 *     summary: Poll payment status — lightweight check for frontend
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     description: |
 *       Lightweight endpoint for frontend polling.
 *       Does not call Nomba API — checks internal database only.
 *       Use this every 3 seconds while waiting for webhook confirmation.
 *       Switch to /verify/:reference if you need to force a Nomba check.
 *     parameters:
 *       - in: path
 *         name: reference
 *         required: true
 *         schema:
 *           type: string
 *         example: WAKA-CHECKOUT-A1B2C3D4E5F6
 *     responses:
 *       200:
 *         description: Current payment status
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 reference:
 *                   type: string
 *                 status:
 *                   type: string
 *                   enum: [pending, success, failed]
 *                   example: pending
 *                 amount:
 *                   type: number
 *                 walletBalance:
 *                   type: number
 *                   nullable: true
 *                   description: Only returned when status is success
 *                 message:
 *                   type: string
 *                   example: ⏳ Waiting for payment confirmation...
 *       404:
 *         description: Transaction not found
 */
router.get('/status/:reference', protect, pollPaymentStatus)

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
 *       Receives and processes real-time payment events from Nomba.
 *       No authentication required — uses HMAC signature verification instead.
 *
 *       **Supported events:**
 *       - `virtual_account.credit` — Student transfers to virtual account
 *       - `transfer.success` — Bank transfer confirmed
 *       - `checkout.success` — Card payment completed
 *       - `payment.success` — General payment success
 *
 *       **Processing pipeline:**
 *       1. Verify HMAC SHA-512 signature
 *       2. Log webhook received to audit trail
 *       3. Check idempotency — ignore duplicates
 *       4. Find user by virtual account number
 *       5. Credit wallet atomically via MongoDB session
 *       6. Create reconciliation record
 *       7. Send email notification
 *       8. Create in-app notification
 *
 *       Always returns HTTP 200 to prevent Nomba retries.
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               event:
 *                 type: string
 *                 enum:
 *                   - virtual_account.credit
 *                   - transfer.success
 *                   - checkout.success
 *                   - payment.success
 *                 example: virtual_account.credit
 *               data:
 *                 type: object
 *                 properties:
 *                   accountNumber:
 *                     type: string
 *                     description: Student virtual account number
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
 *         description: Invalid HMAC signature
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
 *       Compares expected vs actual payment amounts for a given day.
 *       Shows unreconciled transactions, discrepancies, and reconciliation rate.
 *
 *       Use this to verify Nomba settlement matches internal records.
 *       Run daily as part of financial operations.
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
 *         description: Reconciliation summary with discrepancy details
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
 *                       example: "2026-06-25"
 *                     totalTransactions:
 *                       type: number
 *                       example: 145
 *                     totalExpected:
 *                       type: number
 *                       example: 125000
 *                     totalActual:
 *                       type: number
 *                       example: 124500
 *                     totalDiscrepancy:
 *                       type: number
 *                       example: 500
 *                     unreconciledCount:
 *                       type: number
 *                       example: 2
 *                     reconciliationRate:
 *                       type: string
 *                       example: "98.62%"
 *                 unreconciled:
 *                   type: object
 *                   properties:
 *                     count:
 *                       type: number
 *                     items:
 *                       type: array
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
 *       Full immutable audit trail of all payment actions.
 *       Every wallet credit, checkout, webhook, refund, and failure is logged.
 *       Includes who did it, when, what changed before and after, and the result.
 *
 *       Use for dispute resolution, financial auditing, and compliance.
 *     parameters:
 *       - in: query
 *         name: userId
 *         schema:
 *           type: string
 *         description: Filter by specific user ID
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
 *         name: status
 *         schema:
 *           type: string
 *           enum: [success, failed, warning]
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
 *                         example: WALLET_FUNDED
 *                       userId:
 *                         type: object
 *                         properties:
 *                           name:
 *                             type: string
 *                           email:
 *                             type: string
 *                           role:
 *                             type: string
 *                       resourceType:
 *                         type: string
 *                         example: Transaction
 *                       previousState:
 *                         type: object
 *                       newState:
 *                         type: object
 *                       metadata:
 *                         type: object
 *                       status:
 *                         type: string
 *                         example: success
 *                       ipAddress:
 *                         type: string
 *                       createdAt:
 *                         type: string
 *                         format: date-time
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