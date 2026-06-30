const axios = require('axios')
const crypto = require('crypto')

const NOMBA_BASE_URL =
  process.env.NOMBA_BASE_URL || 'https://sandbox.nomba.com/v1'

const IS_MOCK = process.env.NOMBA_MOCK === 'true'

// ─────────────────────────────────────────────────
// Mock helpers — used only when NOMBA_MOCK=true
// or as last-resort fallback if real call fails
// ─────────────────────────────────────────────────

const mockVirtualAccount = (user) => ({
  accountNumber:
    '9' + Math.floor(Math.random() * 1000000000)
      .toString()
      .padStart(9, '0'),
  bankName: 'Nomba MFB (mock)',
  accountName: user.name,
  accountReference: `WAKA-${user._id}`,
  currency: 'NGN',
  isMock: true
})

const mockCheckoutSession = ({ amount, reference }) => {
  const base = process.env.FRONTEND_URL || 'http://localhost:3000'
  return {
    checkoutLink: `${base}/payment/mock?ref=${reference}&amount=${amount}`,
    orderReference: reference,
    isMock: true
  }
}

const mockVerifyPayment = (orderReference) => ({
  orderReference,
  status: 'successful',
  amount: '1000.00',
  currency: 'NGN',
  paidAt: new Date().toISOString(),
  isMock: true
})

const mockRefund = ({ reference, amount }) => ({
  reference,
  amount: String(amount),
  status: 'SUCCESS',
  refundedAt: new Date().toISOString(),
  isMock: true
})

// ─────────────────────────────────────────────────
// Real Nomba auth
// ─────────────────────────────────────────────────

const getNombaToken = async () => {
  try {
    const response = await axios.post(
      `${NOMBA_BASE_URL}/auth/token/issue`,
      {
        grant_type: 'client_credentials',
        client_id: process.env.NOMBA_CLIENT_ID,
        client_secret: process.env.NOMBA_CLIENT_SECRET
      },
      {
        headers: {
          'Content-Type': 'application/json',
          accountId: process.env.NOMBA_ACCOUNT_ID
        }
      }
    )
    return response.data.data.access_token
  } catch (error) {
    console.error(
      '❌ Nomba token error:',
      error.response?.status,
      JSON.stringify(error.response?.data || error.message)
    )
    throw new Error('Failed to get Nomba access token')
  }
}

const getNombaHeaders = async () => {
  const token = await getNombaToken()
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
    accountId: process.env.NOMBA_ACCOUNT_ID
  }
}

// ─────────────────────────────────────────────────
// Create Virtual Account
// ─────────────────────────────────────────────────
const createVirtualAccount = async (user) => {
  if (IS_MOCK) {
    console.log('🧪 [Nomba mock] createVirtualAccount:', user.name)
    return mockVirtualAccount(user)
  }

  try {
    const headers = await getNombaHeaders()
    const response = await axios.post(
      `${NOMBA_BASE_URL}/accounts/virtual`,
      {
        accountRef: `WAKA-${user._id}`,
        accountName: user.name
      },
      { headers }
    )

    const data = response.data.data
    return {
      accountNumber: data.accountNumber || data.bankAccountNumber,
      bankName: data.bankName || 'Nomba',
      accountName: data.accountName || data.bankAccountName || user.name,
      accountReference: data.accountReference || data.accountRef
    }
  } catch (error) {
    console.error(
      '❌ NOMBA VIRTUAL ACCOUNT REAL ERROR:',
      'Status:', error.response?.status,
      'Data:', JSON.stringify(error.response?.data, null, 2),
      'Message:', error.message
    )
    console.warn('⚠️  Falling back to mock virtual account')
    return mockVirtualAccount(user)
  }
}

// ─────────────────────────────────────────────────
// Create Checkout Session
// Correct endpoint: POST /checkout/order (singular)
// Payload wrapped in "order" object
// Response field is "checkoutLink"
// ─────────────────────────────────────────────────
const createCheckoutSession = async ({
  amount,
  email,
  reference,
  callbackUrl,
  description
}) => {
  if (IS_MOCK) {
    console.log('🧪 [Nomba mock] createCheckoutSession:', reference)
    return mockCheckoutSession({ amount, reference })
  }

  try {
    const headers = await getNombaHeaders()

    const response = await axios.post(
      `${NOMBA_BASE_URL}/checkout/order`,
      {
        order: {
          callbackUrl:
            callbackUrl ||
            `${process.env.FRONTEND_URL}/payment/callback`,
          customerEmail: email,
          amount: Number(amount).toFixed(2),
          currency: 'NGN',
          orderReference: reference,
          customerId: email,
          accountId: process.env.NOMBA_ACCOUNT_ID,
          allowedPaymentMethods: ['Card', 'Transfer'],
          orderMetaData: {
            productName: 'Waka Wallet Funding',
            internalRef: reference,
            description: description || 'Wallet funding'
          }
        },
        tokenizeCard: false
      },
      { headers }
    )

    const data = response.data.data

    return {
      checkoutLink: data.checkoutLink,
      orderReference: data.orderReference || reference
    }

  } catch (error) {
    console.error(
      '❌ NOMBA CHECKOUT REAL ERROR:',
      'Status:', error.response?.status,
      'Data:', JSON.stringify(error.response?.data, null, 2),
      'Message:', error.message
    )
    console.warn('⚠️  Falling back to mock checkout')
    return mockCheckoutSession({ amount, reference })
  }
}

// ─────────────────────────────────────────────────
// Verify Payment
// ─────────────────────────────────────────────────
const verifyPayment = async (orderReference) => {
  if (IS_MOCK) {
    console.log('🧪 [Nomba mock] verifyPayment:', orderReference)
    return mockVerifyPayment(orderReference)
  }

  try {
    const headers = await getNombaHeaders()
    const response = await axios.get(
      `${NOMBA_BASE_URL}/checkout/order/${orderReference}`,
      { headers }
    )
    return response.data.data
  } catch (error) {
    console.error(
      '❌ NOMBA VERIFY REAL ERROR:',
      'Status:', error.response?.status,
      'Data:', JSON.stringify(error.response?.data, null, 2),
      'Message:', error.message
    )
    console.warn('⚠️  Falling back to mock verify')
    return mockVerifyPayment(orderReference)
  }
}

// ─────────────────────────────────────────────────
// Process Refund (via transfer)
// ─────────────────────────────────────────────────
const processRefund = async ({ reference, amount, reason }) => {
  if (IS_MOCK) {
    console.log('🧪 [Nomba mock] processRefund:', reference)
    return mockRefund({ reference, amount })
  }

  try {
    const headers = await getNombaHeaders()
    const response = await axios.post(
      `${NOMBA_BASE_URL}/transfers/single`,
      {
        amount: Number(amount).toFixed(2),
        currency: 'NGN',
        reference,
        narration: reason || 'Refund'
      },
      { headers }
    )
    return response.data.data
  } catch (error) {
    console.error(
      '❌ NOMBA REFUND REAL ERROR:',
      'Status:', error.response?.status,
      'Data:', JSON.stringify(error.response?.data, null, 2),
      'Message:', error.message
    )
    console.warn('⚠️  Falling back to mock refund')
    return mockRefund({ reference, amount })
  }
}

// ─────────────────────────────────────────────────
// Verify Webhook Signature
// ─────────────────────────────────────────────────
const verifyWebhookSignature = (signature, payload) => {
  if (IS_MOCK) {
    console.log('🧪 [Nomba mock] verifyWebhookSignature — returning true')
    return true
  }

  if (!process.env.NOMBA_WEBHOOK_SECRET) {
    console.warn('⚠️  NOMBA_WEBHOOK_SECRET not set — skipping verification')
    return true
  }

  try {
    const hash = crypto
      .createHmac('sha512', process.env.NOMBA_WEBHOOK_SECRET)
      .update(JSON.stringify(payload))
      .digest('hex')
    return hash === signature
  } catch (error) {
    console.error('❌ Webhook verify error:', error.message)
    return false
  }
}

module.exports = {
  getNombaToken,
  getNombaHeaders,
  createVirtualAccount,
  createCheckoutSession,
  verifyPayment,
  processRefund,
  verifyWebhookSignature
}

// const axios = require('axios')
// const crypto = require('crypto')

// const NOMBA_BASE_URL =
//   process.env.NOMBA_BASE_URL || 'https://api.nomba.com/v1'

// const getNombaToken = async () => {
//   try {
//     const response = await axios.post(
//       `${NOMBA_BASE_URL}/auth/token/issue`,
//       {
//         grant_type: 'client_credentials',
//         client_id: process.env.NOMBA_CLIENT_ID,
//         client_secret: process.env.NOMBA_CLIENT_SECRET
//       },
//       {
//         headers: {
//           'Content-Type': 'application/json',
//           accountId: process.env.NOMBA_ACCOUNT_ID
//         }
//       }
//     )
//     return response.data.data.access_token
//   } catch (error) {
//     console.error(
//       'Nomba token error:',
//       error.response?.data || error.message
//     )
//     throw new Error('Failed to get Nomba access token')
//   }
// }

// const getNombaHeaders = async () => {
//   const token = await getNombaToken()
//   return {
//     Authorization: `Bearer ${token}`,
//     'Content-Type': 'application/json',
//     accountId: process.env.NOMBA_ACCOUNT_ID
//   }
// }

// const createVirtualAccount = async (user) => {
//   try {
//     const headers = await getNombaHeaders()
//     const response = await axios.post(
//       `${NOMBA_BASE_URL}/accounts/virtual`,
//       {
//         accountRef: `WAKA-${user._id}`,
//         accountName: user.name
//       },
//       { headers }
//     )
//     return response.data.data
//   } catch (error) {
//     console.error(
//       'Nomba virtual account error:',
//       error.response?.data || error.message
//     )
//     throw new Error('Failed to create virtual account')
//   }
// }

// const createCheckoutSession = async ({
//   amount,
//   email,
//   reference,
//   callbackUrl,
//   description
// }) => {
//   try {
//     const headers = await getNombaHeaders()
//     const response = await axios.post(
//       `${NOMBA_BASE_URL}/checkout/orders`,
//       {
//         orderReference: reference,
//         customerId: email,
//         customerEmail: email,
//         callbackUrl:
//           callbackUrl ||
//           `${process.env.FRONTEND_URL}/payment/callback`,
//         amount: String(amount),
//         currency: 'NGN',
//         description
//       },
//       { headers }
//     )
//     return response.data.data
//   } catch (error) {
//     console.error(
//       'Nomba checkout error:',
//       error.response?.data || error.message
//     )
//     throw new Error('Failed to create checkout session')
//   }
// }

// const verifyPayment = async (orderReference) => {
//   try {
//     const headers = await getNombaHeaders()
//     const response = await axios.get(
//       `${NOMBA_BASE_URL}/checkout/orders/${orderReference}`,
//       { headers }
//     )
//     return response.data.data
//   } catch (error) {
//     console.error(
//       'Nomba verify error:',
//       error.response?.data || error.message
//     )
//     throw new Error('Failed to verify payment')
//   }
// }

// const processRefund = async ({ reference, amount, reason }) => {
//   try {
//     const headers = await getNombaHeaders()
//     // Nomba does not have a public refund endpoint at this time.
//     // This call will need to be confirmed with your Nomba account manager
//     // or replaced with a bank transfer to the customer's account via
//     // POST /v1/transfers/single if you have that permission on your plan.
//     const response = await axios.post(
//       `${NOMBA_BASE_URL}/transfers/single`,
//       {
//         amount: String(amount),
//         currency: 'NGN',
//         reference,
//         narration: reason || 'Refund'
//       },
//       { headers }
//     )
//     return response.data.data
//   } catch (error) {
//     console.error(
//       'Nomba refund error:',
//       error.response?.data || error.message
//     )
//     throw new Error('Failed to process refund')
//   }
// }

// const verifyWebhookSignature = (signature, payload) => {
//   try {
//     const hash = crypto
//       .createHmac('sha512', process.env.NOMBA_WEBHOOK_SECRET)
//       .update(JSON.stringify(payload))
//       .digest('hex')
//     return hash === signature
//   } catch (error) {
//     console.error('Webhook verify error:', error.message)
//     return false
//   }
// }

// module.exports = {
//   getNombaToken,
//   getNombaHeaders,
//   createVirtualAccount,
//   createCheckoutSession,
//   verifyPayment,
//   processRefund,
//   verifyWebhookSignature
// }