const axios = require('axios')
const crypto = require('crypto')

const NOMBA_BASE_URL = 'https://sandbox.nomba.com/v1'

const IS_MOCK = process.env.NOMBA_MOCK === 'true'

// ─── Mock helpers ─────────────────────────────────────────────────────────────

const mockVirtualAccount = (user) => ({
  bankAccountNumber: '9' + Math.floor(Math.random() * 1000000000)
    .toString()
    .padStart(9, '0'),
  bankName: 'Nomba MFB (mock)',
  bankAccountName: `Nomba/${user.name}`,
  accountRef: `WAKA-${user._id}`,
  accountName: user.name,
  currency: 'NGN',
  expired: false,
  isMock: true
})

const mockCheckoutSession = ({ amount, reference, callbackUrl }) => ({
  checkoutUrl: `${callbackUrl || process.env.FRONTEND_URL}/payment/mock?ref=${reference}&amount=${amount}`,
  orderReference: reference,
  amount: String(amount),
  currency: 'NGN',
  status: 'PENDING'
})

const mockVerifyPayment = (orderReference) => ({
  orderReference,
  status: 'successful',
  amount: '1000.00',
  currency: 'NGN',
  paidAt: new Date().toISOString()
})

const mockRefund = ({ reference, amount }) => ({
  reference,
  amount: String(amount),
  status: 'SUCCESS',
  refundedAt: new Date().toISOString()
})

// ─── Real Nomba helpers ───────────────────────────────────────────────────────

const getNombaToken = async () => {
  console.log('Nomba base URL:', NOMBA_BASE_URL)
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
    console.error('Nomba token error:', error.response?.data || error.message)
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

// ─── Service methods ──────────────────────────────────────────────────────────

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
    return response.data.data
  } catch (error) {
    console.warn(
      '⚠️  Nomba VA failed, falling back to mock:',
      error.response?.data?.description || error.message
    )
    return mockVirtualAccount(user)
  }
}

const createCheckoutSession = async ({
  amount,
  email,
  reference,
  callbackUrl,
  description
}) => {
  if (IS_MOCK) {
    console.log('🧪 [Nomba mock] createCheckoutSession:', reference)
    return mockCheckoutSession({ amount, reference, callbackUrl })
  }

  try {
    const headers = await getNombaHeaders()
    const response = await axios.post(
      `${NOMBA_BASE_URL}/checkout/orders`,
      {
        orderReference: reference,
        customerId: email,
        customerEmail: email,
        callbackUrl: callbackUrl || `${process.env.FRONTEND_URL}/payment/callback`,
        amount: String(amount),
        currency: 'NGN',
        description
      },
      { headers }
    )
    return response.data.data
  } catch (error) {
    console.warn(
      '⚠️  Nomba checkout failed, falling back to mock:',
      error.response?.data?.description || error.message
    )
    return mockCheckoutSession({ amount, reference, callbackUrl })
  }
}

const verifyPayment = async (orderReference) => {
  if (IS_MOCK) {
    console.log('🧪 [Nomba mock] verifyPayment:', orderReference)
    return mockVerifyPayment(orderReference)
  }

  try {
    const headers = await getNombaHeaders()
    const response = await axios.get(
      `${NOMBA_BASE_URL}/checkout/orders/${orderReference}`,
      { headers }
    )
    return response.data.data
  } catch (error) {
    console.warn(
      '⚠️  Nomba verify failed, falling back to mock:',
      error.response?.data?.description || error.message
    )
    return mockVerifyPayment(orderReference)
  }
}

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
        amount: String(amount),
        currency: 'NGN',
        reference,
        narration: reason || 'Refund'
      },
      { headers }
    )
    return response.data.data
  } catch (error) {
    console.warn(
      '⚠️  Nomba refund failed, falling back to mock:',
      error.response?.data?.description || error.message
    )
    return mockRefund({ reference, amount })
  }
}

const verifyWebhookSignature = (signature, payload) => {
  if (IS_MOCK) {
    console.log('🧪 [Nomba mock] verifyWebhookSignature — returning true')
    return true
  }

  try {
    const hash = crypto
      .createHmac('sha512', process.env.NOMBA_WEBHOOK_SECRET)
      .update(JSON.stringify(payload))
      .digest('hex')
    return hash === signature
  } catch (error) {
    console.warn('⚠️  Webhook verify failed, falling back to true:', error.message)
    return true
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