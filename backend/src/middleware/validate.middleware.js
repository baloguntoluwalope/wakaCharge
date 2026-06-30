// src/middleware/validate.middleware.js

const { body, param, query, validationResult } =
  require('express-validator')

// Handle validation errors
const handleValidation = (req, res, next) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array().map(e => ({
        field: e.path,
        message: e.msg
      }))
    })
  }
  next()
}

// Registration validation rules
const validateSendOTP = [
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),
  handleValidation
]

const validateVerifyOTP = [
  body('email')
    .isEmail()
    .withMessage('Valid email required')
    .normalizeEmail(),
  body('otp')
    .isLength({ min: 6, max: 6 })
    .withMessage('OTP must be exactly 6 digits')
    .isNumeric()
    .withMessage('OTP must contain numbers only'),
  handleValidation
]

const validateCompleteRegistration = [
  body('email')
    .isEmail().withMessage('Valid email required')
    .normalizeEmail(),
  body('phone')
    .matches(/^0[789][01]\d{8}$/)
    .withMessage('Please provide a valid Nigerian phone number'),
  body('name')
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters')
    .trim(),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters'),
  body('campus')
    .isIn([
      'LASU', 'UI', 'UNILAG', 'OAU',
      'FUTA', 'UNIBEN', 'ABU', 'UNN',
      'UNIPORT', 'LAUTECH'
    ])
    .withMessage('Please select a valid campus'),
  handleValidation
]

const validateStartRental = [
  body('stationId')
    .isMongoId()
    .withMessage('Valid station ID required'),
  body('deviceType')
    .isIn(['powerbank', 'studylamp', 'survivalkit', 'comfortkit'])
    .withMessage('Invalid device type'),
  body('selectedHours')
    .isInt({ min: 1, max: 12 })
    .withMessage('Hours must be between 1 and 12'),
  handleValidation
]

const validateCheckout = [
  body('amount')
    .isFloat({ min: 100 })
    .withMessage('Minimum amount is ₦100'),
  handleValidation
]

module.exports = {
  validateSendOTP,
  validateVerifyOTP,
  validateCompleteRegistration,
  validateStartRental,
  validateCheckout
}