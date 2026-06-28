const express = require('express')
const router = express.Router()
const {
  sendRegistrationOTP,
  verifyRegistrationOTP,
  completeRegistration,
  loginStudent,
  resendOTP,
  registerAdmin,
  loginAdmin,
  loginOperator,
  getProfile,
  updateProfile,
  logout
} = require('../controllers/auth.controller')
const { protect } = require('../middleware/auth.middleware')

/**
 * @swagger
 * tags:
 *   name: Authentication
 *   description: |
 *     OTP-based registration for students. Email + password login for all roles.
 *     Operators are onboarded by admin — they do not self-register.
 *
 *     ### Student Registration Flow
 *     1. POST /send-otp — send OTP to email
 *     2. POST /verify-otp — verify OTP
 *     3. POST /complete-registration — create account (studentId required)
 *
 *     ### Student Login
 *     POST /login — email + password
 */

// ─── Student Registration ─────────────────────────────────────────────────────

/**
 * @swagger
 * /api/v1/auth/send-otp:
 *   post:
 *     summary: "Registration Step 1 — Send OTP to email"
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email]
 *             properties:
 *               email:
 *                 type: string
 *                 example: tolu@lasu.edu.ng
 *     responses:
 *       200:
 *         description: OTP sent successfully
 *       409:
 *         description: Email already registered
 */
router.post('/send-otp', sendRegistrationOTP)

/**
 * @swagger
 * /api/v1/auth/verify-otp:
 *   post:
 *     summary: "Registration Step 2 — Verify OTP"
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, otp]
 *             properties:
 *               email:
 *                 type: string
 *                 example: tolu@lasu.edu.ng
 *               otp:
 *                 type: string
 *                 example: "482951"
 *     responses:
 *       200:
 *         description: OTP verified. Proceed to complete registration.
 *       400:
 *         description: Invalid or expired OTP
 */
router.post('/verify-otp', verifyRegistrationOTP)

/**
 * @swagger
 * /api/v1/auth/complete-registration:
 *   post:
 *     summary: "Registration Step 3 — Complete profile and create account"
 *     tags: [Authentication]
 *     description: |
 *       Creates the student account after OTP verification.
 *       studentId is compulsory for students.
 *       Nomba virtual account is provisioned automatically.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, phone, name, password, campus, studentId]
 *             properties:
 *               email:
 *                 type: string
 *                 example: tolu@lasu.edu.ng
 *               phone:
 *                 type: string
 *                 example: "08012345678"
 *               name:
 *                 type: string
 *                 example: Toluwalope Adeleke
 *               password:
 *                 type: string
 *                 example: password123
 *               campus:
 *                 type: string
 *                 example: LASU
 *               studentId:
 *                 type: string
 *                 example: LSC/2021/001
 *                 description: Compulsory for student accounts
 *     responses:
 *       201:
 *         description: Account created. Virtual account provisioned. Welcome email sent.
 *       400:
 *         description: Missing fields or email not verified
 *       409:
 *         description: Email or phone already registered
 */
router.post('/complete-registration', completeRegistration)

/**
 * @swagger
 * /api/v1/auth/resend-otp:
 *   post:
 *     summary: Resend OTP — rate limited to once per 60 seconds
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, type]
 *             properties:
 *               email:
 *                 type: string
 *                 example: tolu@lasu.edu.ng
 *               type:
 *                 type: string
 *                 enum: [registration, reset]
 *                 example: registration
 *     responses:
 *       200:
 *         description: OTP resent successfully
 *       429:
 *         description: Please wait before resending
 */
router.post('/resend-otp', resendOTP)

// ─── Student Login ────────────────────────────────────────────────────────────

/**
 * @swagger
 * /api/v1/auth/login:
 *   post:
 *     summary: Student login — email and password
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:
 *                 type: string
 *                 example: tolu@lasu.edu.ng
 *               password:
 *                 type: string
 *                 example: password123
 *     responses:
 *       200:
 *         description: Login successful
 *       401:
 *         description: Invalid credentials or account deactivated
 */
router.post('/login', loginStudent)

// ─── Admin ────────────────────────────────────────────────────────────────────

/**
 * @swagger
 * /api/v1/auth/admin/register:
 *   post:
 *     summary: Register admin — requires adminSecret
 *     tags: [Authentication]
 *     description: Admin accounts get a Nomba virtual account and welcome email. Operators are onboarded by admin, not self-registered.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, email, phone, password, campus, adminSecret]
 *             properties:
 *               name:
 *                 type: string
 *                 example: Amaka Obi
 *               email:
 *                 type: string
 *                 example: amaka@wakacharge.com
 *               phone:
 *                 type: string
 *                 example: "09011223344"
 *               password:
 *                 type: string
 *                 example: adminSecure123
 *               campus:
 *                 type: string
 *                 example: OAU
 *               adminSecret:
 *                 type: string
 *                 example: your_secret_here
 *                 description: Must match ADMIN_REGISTRATION_SECRET in env
 *     responses:
 *       201:
 *         description: Admin registered successfully
 *       403:
 *         description: Invalid admin registration secret
 *       409:
 *         description: Email or phone already registered
 */
router.post('/admin/register', registerAdmin)

/**
 * @swagger
 * /api/v1/auth/admin/login:
 *   post:
 *     summary: Admin login — email and password
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:
 *                 type: string
 *                 example: amaka@wakacharge.com
 *               password:
 *                 type: string
 *                 example: adminSecure123
 *     responses:
 *       200:
 *         description: Admin login successful
 *       401:
 *         description: Invalid credentials or account deactivated
 */
router.post('/admin/login', loginAdmin)

// ─── Operator ─────────────────────────────────────────────────────────────────

/**
 * @swagger
 * /api/v1/auth/operator/login:
 *   post:
 *     summary: Operator login — email and password
 *     tags: [Authentication]
 *     description: Operators are onboarded by admin. They cannot self-register.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:
 *                 type: string
 *                 example: operator@wakacharge.com
 *               password:
 *                 type: string
 *                 example: operator123
 *     responses:
 *       200:
 *         description: Operator login successful
 *       401:
 *         description: Invalid credentials or account deactivated
 */
router.post('/operator/login', loginOperator)

// ─── Protected ────────────────────────────────────────────────────────────────

/**
 * @swagger
 * /api/v1/auth/profile:
 *   get:
 *     summary: Get current user profile with trust score
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Profile data including trust score for students
 *       401:
 *         description: Not authorized
 */
router.get('/profile', protect, getProfile)

/**
 * @swagger
 * /api/v1/auth/profile:
 *   put:
 *     summary: Update profile — name, phone, studentId only
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: Toluwalope Adeleke
 *               phone:
 *                 type: string
 *                 example: "08012345678"
 *               studentId:
 *                 type: string
 *                 example: LSC/2021/001
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *       409:
 *         description: Phone already in use
 */
router.put('/profile', protect, updateProfile)

/**
 * @swagger
 * /api/v1/auth/logout:
 *   post:
 *     summary: Logout
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Logged out successfully
 */
router.post('/logout', protect, logout)

module.exports = router