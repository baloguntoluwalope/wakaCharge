const swaggerJsdoc = require('swagger-jsdoc')

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Waka Charge API',
      version: '1.0.0',
      description: `
## ⚡ Waka Charge — Campus Energy Rental Platform

Students rent power banks, study lamps, survival kits
and comfort kits via QR code and pay with Nomba.

### User Roles
- Student — rent devices, fund wallet
- Operator — manage kiosk, confirm returns
- Admin — full platform management

### Payment Flow
1. Register → Nomba Virtual Account created
2. Transfer to virtual account → Wallet funded
3. Rent device → Payment from wallet
4. Return device → Deposit refunded instantly
      `,
      contact: {
        name: 'Waka Charge',
        email: 'support@wakacharge.com'
      }
    },
    servers: [
      {
        url: 'http://localhost:5000',
        description: 'Development'
      },
      {
        url: 'https://wakacharge.onrender.com',
        description: 'Production'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter JWT token from login'
        }
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            name: { type: 'string', example: 'Toluwalope Adeleke' },
            email: { type: 'string', example: 'tolu@lasu.edu.ng' },
            phone: { type: 'string', example: '08012345678' },
            role: {
              type: 'string',
              enum: ['student', 'operator', 'admin']
            },
            campus: { type: 'string', example: 'LASU' },
            walletBalance: { type: 'number', example: 1500 },
            virtualAccountNumber: {
              type: 'string',
              example: '9876543210'
            },
            virtualAccountBank: {
              type: 'string',
              example: 'Nomba'
            }
          }
        },
        Error: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            message: { type: 'string' }
          }
        }
      }
    },
    security: [{ bearerAuth: [] }]
  },
  apis: ['./src/routes/*.js']
}

module.exports = swaggerJsdoc(options)