const nodemailer = require('nodemailer')

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
})

transporter.verify((error) => {
  if (error) {
    console.error('❌ Email service error:', error.message)
  } else {
    console.log('✅ Email service ready')
  }
})

module.exports = transporter