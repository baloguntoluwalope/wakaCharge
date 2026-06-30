require('dotenv').config()

const mongoose = require('mongoose')
const { v4: uuidv4 } = require('uuid')

const User = require('../models/User')
const Transaction = require('../models/Transaction')
const Notification = require('../models/Notification')

const {
  createCheckoutSession,
  verifyPayment,
  verifyWebhookSignature,
  createVirtualAccount
} = require('../services/nomba.service')

const {
  sendWalletFundedEmail
} = require('../utils/email.util')

const {
  createAuditLog
} = require('../services/audit.service')

const {
  createReconciliationRecord,
  getUnreconciledTransactions,
  getDailyReconciliationSummary
} = require('../services/reconciliation.service')

const {
  checkIdempotency,
  saveIdempotencyKey,
  completeIdempotencyKey,
  failIdempotencyKey
} = require('../services/idempotency.service')

// ─────────────────────────────────────────────────
// GET WALLET BALANCE + VIRTUAL ACCOUNT
// GET /api/v1/payments/wallet
// ─────────────────────────────────────────────────
const getWalletBalance = async (req, res) => {
  const user = await User.findById(req.user._id)

  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    })
  }

  res.status(200).json({
    success: true,
    walletBalance: user.walletBalance,
    virtualAccount: {
      accountNumber: user.virtualAccountNumber,
      bankName: user.virtualAccountBank || 'Nomba',
      accountName: user.name
    }
  })
}

// ─────────────────────────────────────────────────
// GET OR CREATE VIRTUAL ACCOUNT
// GET /api/v1/payments/virtual-account
// ─────────────────────────────────────────────────
const getVirtualAccount = async (req, res) => {
  const user = await User.findById(req.user._id)

  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    })
  }

  if (user.virtualAccountNumber) {
    return res.status(200).json({
      success: true,
      virtualAccount: {
        accountNumber: user.virtualAccountNumber,
        bankName: user.virtualAccountBank || 'Nomba',
        accountName: user.name,
        reference: user.virtualAccountReference
      },
      instruction:
        'Transfer any amount to this account to fund your wallet instantly.'
    })
  }

  try {
    const account = await createVirtualAccount(user)

    user.virtualAccountNumber = account.accountNumber
    user.virtualAccountBank = account.bankName
    user.virtualAccountReference = account.accountReference
    await user.save({ validateBeforeSave: false })

    await createAuditLog({
      userId: user._id,
      role: user.role,
      action: 'WALLET_FUNDED',
      resourceType: 'User',
      resourceId: user._id,
      metadata: {
        step: 'virtual_account_created',
        accountNumber: account.accountNumber,
        bankName: account.bankName,
        isMock: account.isMock || false
      },
      ipAddress: req.ip,
      status: 'success'
    })

    return res.status(200).json({
      success: true,
      virtualAccount: {
        accountNumber: user.virtualAccountNumber,
        bankName: user.virtualAccountBank || 'Nomba',
        accountName: user.name
      },
      instruction:
        'Transfer any amount to this account to fund your wallet instantly.'
    })

  } catch (err) {
    await createAuditLog({
      userId: user._id,
      role: user.role,
      action: 'PAYMENT_FAILED',
      resourceType: 'User',
      resourceId: user._id,
      metadata: { step: 'virtual_account_creation' },
      ipAddress: req.ip,
      status: 'failed',
      errorMessage: err.message
    })

    return res.status(500).json({
      success: false,
      message: 'Failed to generate virtual account. Please try again.'
    })
  }
}

// ─────────────────────────────────────────────────
// CREATE CHECKOUT SESSION — with Idempotency
// POST /api/v1/payments/checkout
// ─────────────────────────────────────────────────
const createCheckout = async (req, res) => {
  const { amount, idempotencyKey } = req.body
  const user = req.user

  if (!amount || amount < 100) {
    return res.status(400).json({
      success: false,
      message: 'Minimum amount is ₦100'
    })
  }

  // ── Idempotency check ──────────────────────────
  if (idempotencyKey) {
    const existing = await checkIdempotency(
      idempotencyKey, user._id, 'checkout'
    )

    if (existing?.isDuplicate) {
      if (existing.isProcessing) {
        return res.status(409).json({
          success: false,
          message: 'Request already processing'
        })
      }
      return res.status(200).json(existing.cachedResponse)
    }

    await saveIdempotencyKey(
      idempotencyKey, user._id, 'checkout', { amount }
    )
  }

  const reference = `WAKA-CHECKOUT-${uuidv4()
    .slice(0, 12).toUpperCase()}`

  try {
    const session = await createCheckoutSession({
      amount,
      email: user.email,
      reference,
      callbackUrl:
        `${process.env.FRONTEND_URL}/payment/verify?reference=${reference}`,
      description: `Waka Wallet funding for ${user.name}`
    })

    // Create pending transaction
    const transaction = await Transaction.create({
      userId: user._id,
      amount,
      type: 'checkout_payment',
      status: 'pending',
      reference,
      provider: 'nomba_checkout',
      description: 'Wallet funding via Nomba checkout',
      balanceBefore: user.walletBalance,
      balanceAfter: user.walletBalance,
      metadata: {
        checkoutLink: session.checkoutLink,
        isMock: session.isMock || false,
        initiatedAt: new Date()
      }
    })

    await createAuditLog({
      userId: user._id,
      role: user.role,
      action: 'CHECKOUT_INITIATED',
      resourceType: 'Transaction',
      resourceId: transaction._id,
      metadata: {
        amount, reference,
        isMock: session.isMock || false
      },
      ipAddress: req.ip,
      status: 'success'
    })

    const response = {
      success: true,
      reference,
      checkoutUrl: session.checkoutLink,
      amount,
      message: 'Checkout created. Complete payment to fund wallet.'
    }

    if (idempotencyKey) {
      await completeIdempotencyKey(idempotencyKey, response)
    }

    res.status(200).json(response)

  } catch (error) {
    if (idempotencyKey) {
      await failIdempotencyKey(idempotencyKey, error)
    }

    await createAuditLog({
      userId: user._id,
      role: user.role,
      action: 'PAYMENT_FAILED',
      metadata: { amount, reference, step: 'checkout_creation' },
      ipAddress: req.ip,
      status: 'failed',
      errorMessage: error.message
    })

    throw error
  }
}

// ─────────────────────────────────────────────────
// VERIFY CHECKOUT PAYMENT
// GET /api/v1/payments/verify/:reference
// ─────────────────────────────────────────────────
const verifyCheckoutPayment = async (req, res) => {
  const { reference } = req.params

  const transaction = await Transaction.findOne({ reference })

  if (!transaction) {
    return res.status(404).json({
      success: false,
      message: 'Transaction not found'
    })
  }

  if (transaction.status === 'success') {
    return res.status(200).json({
      success: true,
      message: 'Payment already confirmed',
      transaction
    })
  }

  const payment = await verifyPayment(reference)

  const isSuccessful =
    payment.status === 'successful' ||
    payment.status === 'success' ||
    payment.status === 'SUCCESS'

  if (!isSuccessful) {
    return res.status(400).json({
      success: false,
      message: 'Payment not yet confirmed',
      currentStatus: payment.status
    })
  }

  const session = await mongoose.startSession()
  session.startTransaction()

  try {
    const user = await User.findById(transaction.userId).session(session)

    if (!user) {
      throw new Error('User not found for this transaction')
    }

    const balanceBefore = user.walletBalance
    user.walletBalance += transaction.amount
    await user.save({ validateBeforeSave: false, session })

    transaction.status = 'success'
    transaction.balanceBefore = balanceBefore
    transaction.balanceAfter = user.walletBalance
    transaction.metadata = {
      ...transaction.metadata,
      verifiedAt: new Date(),
      nombaResponse: payment
    }
    await transaction.save({ session })

    await session.commitTransaction()

    await createReconciliationRecord({
      reference,
      type: 'checkout_payment',
      expectedAmount: transaction.amount,
      actualAmount: Number(payment.amount) || transaction.amount,
      userId: user._id,
      transactionId: transaction._id,
      nombaReference: payment.orderReference || reference,
      walletBalanceBefore: balanceBefore,
      walletBalanceAfter: user.walletBalance,
      rawWebhookPayload: payment
    })

    await createAuditLog({
      userId: user._id,
      role: 'student',
      action: 'WALLET_FUNDED',
      resourceType: 'Transaction',
      resourceId: transaction._id,
      previousState: { walletBalance: balanceBefore },
      newState: { walletBalance: user.walletBalance },
      metadata: { amount: transaction.amount, reference, method: 'checkout' },
      ipAddress: req.ip,
      status: 'success'
    })

    await Notification.create({
      userId: user._id,
      title: '💰 Wallet Funded',
      message: `₦${transaction.amount.toLocaleString()} added to your wallet via checkout.`,
      type: 'wallet_funded'
    })

    await sendWalletFundedEmail(
      user.email, user.name,
      transaction.amount, user.walletBalance
    )

    return res.status(200).json({
      success: true,
      message: 'Payment verified. Wallet funded.',
      walletBalance: user.walletBalance,
      transaction: {
        reference,
        amount: transaction.amount,
        status: 'success'
      }
    })

  } catch (error) {
    await session.abortTransaction()

    await createAuditLog({
      userId: transaction.userId,
      role: 'student',
      action: 'PAYMENT_FAILED',
      resourceType: 'Transaction',
      resourceId: transaction._id,
      metadata: { reference, step: 'wallet_credit' },
      status: 'failed',
      errorMessage: error.message
    })

    throw error
  } finally {
    session.endSession()
  }
}

// ─────────────────────────────────────────────────
// POLL PAYMENT STATUS — lightweight, no Nomba call
// GET /api/v1/payments/status/:reference
// ─────────────────────────────────────────────────
const pollPaymentStatus = async (req, res) => {
  const { reference } = req.params

  const transaction = await Transaction.findOne({
    reference,
    userId: req.user._id
  })

  if (!transaction) {
    return res.status(404).json({
      success: false,
      message: 'Transaction not found'
    })
  }

  let walletBalance = null
  if (transaction.status === 'success') {
    const user = await User.findById(req.user._id)
    walletBalance = user.walletBalance
  }

  res.status(200).json({
    success: true,
    reference,
    status: transaction.status,
    amount: transaction.amount,
    walletBalance,
    message:
      transaction.status === 'success'
        ? '✅ Payment confirmed. Wallet funded!'
        : transaction.status === 'pending'
        ? '⏳ Waiting for payment confirmation...'
        : '❌ Payment failed'
  })
}

// ─────────────────────────────────────────────────
// NOMBA WEBHOOK HANDLER
// POST /api/v1/payments/webhook
// ─────────────────────────────────────────────────
const handleWebhook = async (req, res) => {
  const signature =
    req.headers['x-nomba-signature'] ||
    req.headers['x-signature']

  if (signature && !verifyWebhookSignature(signature, req.body)) {
    await createAuditLog({
      action: 'WEBHOOK_FAILED',
      metadata: { reason: 'Invalid signature' },
      status: 'failed',
      errorMessage: 'Webhook signature verification failed'
    })

    return res.status(400).json({
      success: false,
      message: 'Invalid webhook signature'
    })
  }

  const { event, data } = req.body
  const webhookReference =
    data?.reference ||
    data?.orderReference ||
    data?.transactionReference ||
    `WEBHOOK-${uuidv4().slice(0, 12)}`

  await createAuditLog({
    action: 'WEBHOOK_RECEIVED',
    resourceType: 'Webhook',
    metadata: { event, reference: webhookReference, rawData: data },
    status: 'success'
  })

  console.log('📡 Webhook received:', event, webhookReference)

  // ── Virtual Account Credit ──────────────────────
  if (
    event === 'virtual_account.credit' ||
    event === 'transfer.success'
  ) {
    const { accountNumber, amount, reference } = data

    const existingTransaction = await Transaction.findOne({
      reference,
      status: 'success'
    })

    if (existingTransaction) {
      await createAuditLog({
        action: 'WEBHOOK_DUPLICATE',
        metadata: { event, reference, amount },
        status: 'warning'
      })
      console.warn('⚠️ Duplicate webhook ignored:', reference)
      return res.status(200).json({
        success: true,
        message: 'Duplicate webhook acknowledged'
      })
    }

    const user = await User.findOne({
      virtualAccountNumber: accountNumber
    })

    if (!user) {
      await createAuditLog({
        action: 'WEBHOOK_FAILED',
        metadata: { reason: 'Virtual account not found', accountNumber, amount, reference },
        status: 'warning'
      })
      return res.status(200).json({
        success: true,
        message: 'Account not found. Webhook acknowledged.'
      })
    }

    const session = await mongoose.startSession()
    session.startTransaction()

    try {
      const balanceBefore = user.walletBalance
      user.walletBalance += amount
      await user.save({ validateBeforeSave: false, session })

      const transaction = await Transaction.create(
        [{
          userId: user._id,
          amount,
          type: 'wallet_funding',
          status: 'success',
          reference,
          provider: 'nomba_virtual_account',
          description: 'Wallet funding via virtual account',
          balanceBefore,
          balanceAfter: user.walletBalance,
          metadata: {
            accountNumber,
            webhookEvent: event,
            receivedAt: new Date(),
            rawData: data
          }
        }],
        { session }
      )

      await session.commitTransaction()

      await createReconciliationRecord({
        reference,
        type: 'virtual_account_credit',
        expectedAmount: amount,
        actualAmount: amount,
        userId: user._id,
        transactionId: transaction[0]._id,
        nombaReference: reference,
        walletBalanceBefore: balanceBefore,
        walletBalanceAfter: user.walletBalance,
        rawWebhookPayload: data
      })

      await createAuditLog({
        userId: user._id,
        role: 'student',
        action: 'WALLET_FUNDED',
        resourceType: 'Transaction',
        resourceId: transaction[0]._id,
        previousState: { walletBalance: balanceBefore },
        newState: { walletBalance: user.walletBalance },
        metadata: { amount, reference, method: 'virtual_account', accountNumber },
        status: 'success'
      })

      await Notification.create({
        userId: user._id,
        title: '💰 Wallet Funded',
        message: `₦${amount.toLocaleString()} added to your wallet.`,
        type: 'wallet_funded'
      })

      await sendWalletFundedEmail(
        user.email, user.name, amount, user.walletBalance
      )

      console.log(`✅ Wallet funded: ${user.name} +₦${amount}`)

    } catch (error) {
      await session.abortTransaction()

      await createAuditLog({
        userId: user._id,
        action: 'PAYMENT_FAILED',
        metadata: { reference, amount, step: 'webhook_processing' },
        status: 'failed',
        errorMessage: error.message
      })

      console.error('❌ Webhook processing failed:', error.message)
    } finally {
      session.endSession()
    }
  }

  // ── Checkout Payment Success ────────────────────
  if (
    event === 'checkout.success' ||
    event === 'payment.success'
  ) {
    const reference = data.reference || data.orderReference
    const amount = Number(data.amount)

    const transaction = await Transaction.findOne({ reference })

    if (!transaction || transaction.status === 'success') {
      await createAuditLog({
        action: 'WEBHOOK_DUPLICATE',
        metadata: { event, reference },
        status: 'warning'
      })
      return res.status(200).json({
        success: true,
        message: 'Already processed or not found'
      })
    }

    const session = await mongoose.startSession()
    session.startTransaction()

    try {
      const user = await User.findById(transaction.userId).session(session)

      const balanceBefore = user.walletBalance
      user.walletBalance += amount
      await user.save({ validateBeforeSave: false, session })

      transaction.status = 'success'
      transaction.balanceBefore = balanceBefore
      transaction.balanceAfter = user.walletBalance
      transaction.metadata = {
        ...transaction.metadata,
        webhookReceivedAt: new Date(),
        rawData: data
      }
      await transaction.save({ session })

      await session.commitTransaction()

      await createReconciliationRecord({
        reference,
        type: 'checkout_payment',
        expectedAmount: transaction.amount,
        actualAmount: amount,
        userId: user._id,
        transactionId: transaction._id,
        nombaReference: data.orderReference || reference,
        walletBalanceBefore: balanceBefore,
        walletBalanceAfter: user.walletBalance,
        rawWebhookPayload: data
      })

      await createAuditLog({
        userId: user._id,
        role: 'student',
        action: 'WALLET_FUNDED',
        resourceType: 'Transaction',
        resourceId: transaction._id,
        previousState: { walletBalance: balanceBefore },
        newState: { walletBalance: user.walletBalance },
        metadata: { amount, reference, method: 'checkout_webhook' },
        status: 'success'
      })

      await Notification.create({
        userId: user._id,
        title: '✅ Payment Confirmed',
        message: `₦${amount.toLocaleString()} added to your wallet.`,
        type: 'payment_success'
      })

      await sendWalletFundedEmail(
        user.email, user.name, amount, user.walletBalance
      )

    } catch (error) {
      await session.abortTransaction()
      console.error('❌ Checkout webhook failed:', error.message)
    } finally {
      session.endSession()
    }
  }

  res.status(200).json({
    success: true,
    message: 'Webhook processed'
  })
}

// ─────────────────────────────────────────────────
// GET TRANSACTION HISTORY
// GET /api/v1/payments/transactions
// ─────────────────────────────────────────────────
const getTransactions = async (req, res) => {
  const { type, status, page = 1, limit = 20 } = req.query

  const filter = { userId: req.user._id }
  if (type) filter.type = type
  if (status) filter.status = status

  const transactions = await Transaction.find(filter)
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(Number(limit))

  const total = await Transaction.countDocuments(filter)

  res.status(200).json({
    success: true,
    count: transactions.length,
    total,
    page: Number(page),
    transactions
  })
}

// ─────────────────────────────────────────────────
// ADMIN — RECONCILIATION REPORT
// GET /api/v1/payments/reconciliation
// ─────────────────────────────────────────────────
const getReconciliationReport = async (req, res) => {
  const { date } = req.query
  const reportDate = date ? new Date(date) : new Date()

  const [dailySummary, unreconciled] = await Promise.all([
    getDailyReconciliationSummary(reportDate),
    getUnreconciledTransactions()
  ])

  res.status(200).json({
    success: true,
    dailySummary,
    unreconciled: {
      count: unreconciled.length,
      items: unreconciled
    }
  })
}

// ─────────────────────────────────────────────────
// ADMIN — AUDIT LOGS
// GET /api/v1/payments/audit-logs
// ─────────────────────────────────────────────────
const getAuditLogs = async (req, res) => {
  const AuditLog = require('../models/AuditLog')
  const { userId, action, status, page = 1, limit = 50 } = req.query

  const filter = {}
  if (userId) filter.userId = userId
  if (action) filter.action = action
  if (status) filter.status = status

  const logs = await AuditLog.find(filter)
    .populate('userId', 'name email role')
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(Number(limit))

  const total = await AuditLog.countDocuments(filter)

  res.status(200).json({
    success: true,
    count: logs.length,
    total,
    logs
  })
}

module.exports = {
  getWalletBalance,
  getVirtualAccount,
  createCheckout,
  verifyCheckoutPayment,
  pollPaymentStatus,
  handleWebhook,
  getTransactions,
  getReconciliationReport,
  getAuditLogs
}