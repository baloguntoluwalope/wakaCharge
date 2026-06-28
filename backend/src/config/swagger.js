const swaggerJsdoc = require('swagger-jsdoc')

const options = {
  definition: {
    openapi: '3.0.3',
    info: {
      title: 'Waka Charge API',
      version: '1.0.0',
      description: `
⚡ **Waka Charge** — Campus Power. Anytime.

Rent powerbanks, study lamps, survival kits and comfort kits across Nigerian campuses.

---

### Base URLs
| Environment | URL |
|-------------|-----|
| 🚀 Production | https://wakacharge.onrender.com |
| 🛠️ Local | http://localhost:5000 |

---

### Authentication
All protected routes require a Bearer JWT token obtained from login:
\`\`\`
Authorization: Bearer <your_jwt_token>
\`\`\`

---

### Student Registration Flow
| Step | Endpoint |
|------|----------|
| 1 | \`POST /api/v1/auth/send-otp\` — Send OTP to email |
| 2 | \`POST /api/v1/auth/verify-otp\` — Verify OTP |
| 3 | \`POST /api/v1/auth/complete-registration\` — Create account |

### Student Login
\`POST /api/v1/auth/login\` — Email + password

### Admin Login
\`POST /api/v1/auth/admin/login\` — Email + password

### Operator Login
\`POST /api/v1/auth/operator/login\` — Email + password
      `
    },
    servers: [
      {
        url: 'https://wakacharge.onrender.com',
        description: '🚀 Production'
      },
      {
        url: 'http://localhost:5000',
        description: '🛠️ Local Development'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Paste your JWT token from the login response'
        }
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            _id:                  { type: 'string',  example: '64b1f2c3d4e5f6a7b8c9d0e1' },
            name:                 { type: 'string',  example: 'Toluwalope Adeleke' },
            email:                { type: 'string',  example: 'tolu@lasu.edu.ng' },
            phone:                { type: 'string',  example: '08012345678' },
            role:                 { type: 'string',  enum: ['student', 'operator', 'admin'] },
            campus:               { type: 'string',  example: 'LASU' },
            studentId:            { type: 'string',  example: 'LSC/2021/001' },
            walletBalance:        { type: 'number',  example: 2500 },
            virtualAccountNumber: { type: 'string',  example: '9012345678' },
            virtualAccountBank:   { type: 'string',  example: 'Nomba MFB' },
            trustScore:           { type: 'number',  example: 8 },
            trustLevel:           { type: 'string',  example: 'trusted' },
            rnplEnabled:          { type: 'boolean', example: false },
            rnplLimit:            { type: 'number',  example: 500 },
            rnplOutstanding:      { type: 'number',  example: 0 },
            isPhoneVerified:      { type: 'boolean', example: true },
            lastLogin:            { type: 'string',  format: 'date-time' },
            createdAt:            { type: 'string',  format: 'date-time' }
          }
        },
        Error: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            message: { type: 'string',  example: 'Error message' }
          }
        }
      }
    }
  },
  apis: [
    './routes/*.js',
    './controllers/*.js'
  ]
}

module.exports = swaggerJsdoc(options)