const test = require('node:test')
const assert = require('node:assert/strict')

process.env.EMAIL_USER = ''
process.env.EMAIL_PASS = ''
process.env.EMAIL_HOST = ''
process.env.EMAIL_PORT = ''
process.env.EMAIL_SECURE = ''

delete require.cache[require.resolve('../src/config/email')]
const emailConfig = require('../src/config/email')

test('email config reports when SMTP credentials are not configured', () => {
  assert.equal(emailConfig.isEmailConfigured, false)
})
