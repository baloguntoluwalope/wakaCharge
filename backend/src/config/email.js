const SibApiV3Sdk = require('sib-api-v3-sdk')

const defaultClient = SibApiV3Sdk.ApiClient.instance
const apiKey = defaultClient.authentications['api-key']
apiKey.apiKey = process.env.BREVO_API_KEY

const transactionalEmailApi = new SibApiV3Sdk.TransactionalEmailsApi()

console.log(
  process.env.BREVO_API_KEY
    ? '✅ Brevo API key loaded'
    : '❌ BREVO_API_KEY missing from environment'
)

module.exports = transactionalEmailApi


// const nodemailer = require('nodemailer')

// const transporter = nodemailer.createTransport({
//   service: 'gmail',
//   auth: {
//     user: process.env.EMAIL_USER,
//     pass: process.env.EMAIL_PASS
//   }
// })

// transporter.verify((error) => {
//   if (error) {
//     console.error('❌ Email service error:', error.message)
//   } else {
//     console.log('✅ Email service ready')
//   }
// })

// module.exports = transporter