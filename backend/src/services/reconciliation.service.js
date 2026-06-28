const ReconciliationLog = require('../models/ReconciliationLog')
const Transaction = require('../models/Transaction')
const User = require('../models/User')

// Create reconciliation record for every payment
const createReconciliationRecord = async ({
  reference,
  type,
  expectedAmount,
  actualAmount,
  userId,
  transactionId,
  nombaReference,
  walletBalanceBefore,
  walletBalanceAfter,
  rawWebhookPayload = {}
}) => {
  try {
    const discrepancy = expectedAmount - actualAmount
    const isReconciled = discrepancy === 0

    const record = await ReconciliationLog.create({
      reference,
      type,
      expectedAmount,
      actualAmount,
      userId,
      transactionId,
      nombaReference,
      walletBalanceBefore,
      walletBalanceAfter,
      isReconciled,
      discrepancy,
      discrepancyReason: isReconciled
        ? null
        : `Amount mismatch: expected ${expectedAmount}, got ${actualAmount}`,
      reconciledAt: isReconciled ? new Date() : null,
      rawWebhookPayload
    })

    if (!isReconciled) {
      console.warn(
        `⚠️ Reconciliation discrepancy detected:`,
        {
          reference,
          expected: expectedAmount,
          actual: actualAmount,
          discrepancy
        }
      )
    }

    return record
  } catch (error) {
    console.error(
      '❌ Reconciliation log failed:',
      error.message
    )
    return null
  }
}

// Get unreconciled transactions
const getUnreconciledTransactions = async () => {
  return await ReconciliationLog.find({
    isReconciled: false
  })
    .populate('userId', 'name email phone')
    .populate('transactionId')
    .sort({ createdAt: -1 })
}

// Daily reconciliation summary
const getDailyReconciliationSummary = async (date) => {
  const startOfDay = new Date(date)
  startOfDay.setHours(0, 0, 0, 0)

  const endOfDay = new Date(date)
  endOfDay.setHours(23, 59, 59, 999)

  const records = await ReconciliationLog.find({
    createdAt: { $gte: startOfDay, $lte: endOfDay }
  })

  const totalExpected = records.reduce(
    (sum, r) => sum + r.expectedAmount, 0
  )
  const totalActual = records.reduce(
    (sum, r) => sum + r.actualAmount, 0
  )
  const totalDiscrepancy = records.reduce(
    (sum, r) => sum + Math.abs(r.discrepancy), 0
  )
  const unreconciled = records.filter(r => !r.isReconciled)

  return {
    date: date.toISOString().split('T')[0],
    totalTransactions: records.length,
    totalExpected,
    totalActual,
    totalDiscrepancy,
    unreconciledCount: unreconciled.length,
    reconciliationRate: records.length > 0
      ? ((records.length - unreconciled.length) /
         records.length * 100).toFixed(2) + '%'
      : '100%',
    unreconciled
  }
}

module.exports = {
  createReconciliationRecord,
  getUnreconciledTransactions,
  getDailyReconciliationSummary
}