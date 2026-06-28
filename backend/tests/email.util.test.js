const test = require('node:test')
const assert = require('node:assert/strict')

test('email util does not crash when resend api key is missing', () => {
  delete process.env.RESEND_API_KEY
  delete require.cache[require.resolve('../src/utils/email.util')]

  assert.doesNotThrow(() => require('../src/utils/email.util'))
})
