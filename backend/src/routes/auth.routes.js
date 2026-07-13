const express = require('express')
const router = express.Router()
const {
  sendRegistrationOTP,
  verifyRegistrationOTP,
  completeRegistration,
  loginStudent,
  resendOTP,
  forgotPassword,
  verifyResetOTP,
  resetPassword,
  changePassword,
  registerAdmin,
  loginAdmin,
  registerOperator,
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
 *     Operators self-register but require admin approval before they can log in.
 *
 *     ### Student Registration Flow
 *     1. POST /send-otp — send OTP to email
 *     2. POST /verify-otp — verify OTP
 *     3. POST /complete-registration — create account (studentId required)
 *
 *     ### Password Reset Flow
 *     1. POST /forgot-password — send reset OTP to email
 *     2. POST /verify-reset-otp — verify OTP
 *     3. POST /reset-password — set new password
 *
 *     ### Operator Onboarding Flow
 *     1. POST /operator/register — operator submits registration (status: pending)
 *     2. Admin reviews via GET /operators/pending
 *     3. Admin calls POST /operators/:id/approve or /operators/:id/reject
 *     4. Approved operators can POST /operator/login
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
 *       studentId is compulsory. Nomba virtual account provisioned automatically.
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

// ─── Password Reset ───────────────────────────────────────────────────────────

/**
 * @swagger
 * /api/v1/auth/forgot-password:
 *   post:
 *     summary: "Reset Step 1 — Send password reset OTP"
 *     tags: [Authentication]
 *     description: |
 *       Sends a 6-digit reset code to the registered email.
 *       Always returns 200 regardless of whether the email exists — prevents user enumeration.
 *       Rate limited to once per 60 seconds.
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
 *         description: Reset code sent if email is registered
 *       429:
 *         description: Please wait before requesting another code
 */
router.post('/forgot-password', forgotPassword)

/**
 * @swagger
 * /api/v1/auth/verify-reset-otp:
 *   post:
 *     summary: "Reset Step 2 — Verify reset OTP"
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
 *                 example: "739201"
 *     responses:
 *       200:
 *         description: OTP verified. Proceed to set new password.
 *       400:
 *         description: Invalid or expired OTP
 */
router.post('/verify-reset-otp', verifyResetOTP)

/**
 * @swagger
 * /api/v1/auth/reset-password:
 *   post:
 *     summary: "Reset Step 3 — Set new password"
 *     tags: [Authentication]
 *     description: |
 *       Sets a new password after OTP verification.
 *       Requires the same email and OTP from step 2 — prevents skipping the verification step.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, otp, newPassword]
 *             properties:
 *               email:
 *                 type: string
 *                 example: tolu@lasu.edu.ng
 *               otp:
 *                 type: string
 *                 example: "739201"
 *               newPassword:
 *                 type: string
 *                 example: myNewSecurePassword123
 *                 description: Minimum 6 characters
 *     responses:
 *       200:
 *         description: Password reset successfully
 *       400:
 *         description: OTP not verified or missing fields
 *       404:
 *         description: User not found
 */
router.post('/reset-password', resetPassword)

// ─── Admin ────────────────────────────────────────────────────────────────────

/**
 * @swagger
 * /api/v1/auth/admin/register:
 *   post:
 *     summary: Register admin — requires adminSecret
 *     tags: [Authentication]
 *     description: Admin accounts get a Nomba virtual account and welcome email.
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
 * /api/v1/auth/operator/register:
 *   post:
 *     summary: Operator self-registration — requires admin approval before login
 *     tags: [Authentication]
 *     description: |
 *       Operators submit their own registration, but the account is created with
 *       a pending status. Login is blocked until an admin approves the operator
 *       via POST /api/v1/admin/operators/:id/approve.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, email, phone, password, campus]
 *             properties:
 *               name:
 *                 type: string
 *                 example: Bode Fashola
 *               email:
 *                 type: string
 *                 example: operator@wakacharge.com
 *               phone:
 *                 type: string
 *                 example: "08123456789"
 *               password:
 *                 type: string
 *                 example: operator123
 *               campus:
 *                 type: string
 *                 example: UNILAG
 *     responses:
 *       201:
 *         description: Operator registered successfully. Awaiting admin approval.
 *       400:
 *         description: Missing fields
 *       409:
 *         description: Email or phone already registered
 */
router.post('/operator/register', registerOperator)

/**
 * @swagger
 * /api/v1/auth/operator/login:
 *   post:
 *     summary: Operator login — email and password
 *     tags: [Authentication]
 *     description: |
 *       Operators self-register via POST /operator/register but must be approved
 *       by an admin before they can log in. Unapproved or rejected accounts
 *       receive a 401.
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
 *         description: Invalid credentials, account deactivated, not yet approved, or rejected
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
 * /api/v1/auth/change-password:
 *   put:
 *     summary: Change password — requires current password (authenticated)
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     description: For logged-in users who know their current password. For forgotten passwords use the reset flow instead.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [currentPassword, newPassword]
 *             properties:
 *               currentPassword:
 *                 type: string
 *                 example: oldPassword123
 *               newPassword:
 *                 type: string
 *                 example: newSecurePassword456
 *                 description: Minimum 6 characters
 *     responses:
 *       200:
 *         description: Password changed successfully
 *       401:
 *         description: Current password is incorrect
 *       400:
 *         description: Missing fields or password too short
 */
router.put('/change-password', protect, changePassword)

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