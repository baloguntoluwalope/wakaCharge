// const path = require('path')
// const dotenv = require('dotenv')

// dotenv.config({ path: path.resolve(__dirname, '../../.env') })

// const getFromAddress = () => {
//   const fromName = process.env.RESEND_FROM_NAME?.trim() || 'Waka Charge'
//   const fromEmail = process.env.RESEND_FROM_EMAIL?.trim() || 'onboarding@resend.dev'
//   return `${fromName} <${fromEmail}>`
// }

// const sendEmail = async ({ to, subject, html }) => {
//   const apiKey = process.env.RESEND_API_KEY?.trim()

//   if (!apiKey) {
//     console.warn('⚠️ RESEND_API_KEY is not configured. Email delivery skipped.')
//     return { skipped: true, reason: 'missing_api_key' }
//   }

//   const { Resend } = require('resend')
//   const resend = new Resend(apiKey)

//   try {
//     const { data, error } = await resend.emails.send({
//       from: getFromAddress(),
//       to,
//       subject,
//       html
//     })

//     if (error) {
//       console.error('Email error:', error)
//       return { skipped: true, reason: 'resend_error', error }
//     }

//     return { skipped: false, data }
//   } catch (error) {
//     console.error('Email send exception:', error?.message || error)
//     return { skipped: true, reason: 'send_exception', error }
//   }
// }

// // ─── Base layout ──────────────────────────────────────────────────────────────

// const baseTemplate = (content) => `
// <!DOCTYPE html>
// <html lang="en">
// <head>
//   <meta charset="UTF-8" />
//   <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
//   <title>Waka Charge</title>
// </head>
// <body style="margin:0;padding:0;background-color:#f0f2f5;font-family:'Segoe UI',Arial,sans-serif;">
//   <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0f2f5;padding:40px 0;">
//     <tr>
//       <td align="center">
//         <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

//           <!-- Header -->
//           <tr>
//             <td style="background:linear-gradient(135deg,#1a1a2e 0%,#16213e 50%,#0f3460 100%);border-radius:16px 16px 0 0;padding:32px 40px;text-align:center;">
//               <table width="100%" cellpadding="0" cellspacing="0">
//                 <tr>
//                   <td align="center">
//                     <div style="display:inline-block;">
//                       <span style="font-size:28px;font-weight:800;color:#ffffff;letter-spacing:-0.5px;">
//                         ⚡ Waka<span style="color:#f59e0b;">Charge</span>
//                       </span>
//                     </div>
//                     <p style="margin:6px 0 0;color:#94a3b8;font-size:13px;letter-spacing:1px;text-transform:uppercase;">
//                       Campus Power. Anytime.
//                     </p>
//                   </td>
//                 </tr>
//               </table>
//             </td>
//           </tr>

//           <!-- Body -->
//           <tr>
//             <td style="background:#ffffff;padding:40px;border-left:1px solid #e2e8f0;border-right:1px solid #e2e8f0;">
//               ${content}
//             </td>
//           </tr>

//           <!-- Footer -->
//           <tr>
//             <td style="background:#1a1a2e;border-radius:0 0 16px 16px;padding:28px 40px;text-align:center;">
//               <p style="margin:0 0 8px;color:#94a3b8;font-size:12px;">
//                 © ${new Date().getFullYear()} Waka Charge Technologies Ltd. All rights reserved.
//               </p>
//               <p style="margin:0 0 8px;color:#64748b;font-size:11px;">
//                 Campus Energy Solutions · Nigeria
//               </p>
//               <p style="margin:0;color:#64748b;font-size:11px;">
//                 <a href="#" style="color:#f59e0b;text-decoration:none;">Privacy Policy</a>
//                 &nbsp;·&nbsp;
//                 <a href="#" style="color:#f59e0b;text-decoration:none;">Terms of Service</a>
//                 &nbsp;·&nbsp;
//                 <a href="#" style="color:#f59e0b;text-decoration:none;">Support</a>
//               </p>
//             </td>
//           </tr>

//         </table>
//       </td>
//     </tr>
//   </table>
// </body>
// </html>
// `

// // ─── Reusable components ──────────────────────────────────────────────────────

// const infoCard = (rows) => `
//   <table width="100%" cellpadding="0" cellspacing="0"
//     style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;margin:24px 0;overflow:hidden;">
//     ${rows.map((row, i) => `
//       <tr style="border-bottom:${i < rows.length - 1 ? '1px solid #e2e8f0' : 'none'};">
//         <td style="padding:14px 20px;color:#64748b;font-size:13px;font-weight:500;width:45%;">${row.label}</td>
//         <td style="padding:14px 20px;color:#1e293b;font-size:13px;font-weight:600;text-align:right;">${row.value}</td>
//       </tr>
//     `).join('')}
//   </table>
// `

// const amountBadge = (amount, color = '#16a34a') => `
//   <div style="background:#f0fdf4;border:2px solid #bbf7d0;border-radius:12px;padding:20px;text-align:center;margin:24px 0;">
//     <p style="margin:0 0 4px;color:#64748b;font-size:12px;text-transform:uppercase;letter-spacing:1px;font-weight:600;">Amount</p>
//     <p style="margin:0;color:${color};font-size:36px;font-weight:800;letter-spacing:-1px;">
//       ₦${Number(amount).toLocaleString()}
//     </p>
//   </div>
// `

// const alertBox = (message, type = 'info') => {
//   const styles = {
//     info:    { bg: '#eff6ff', border: '#bfdbfe', text: '#1d4ed8', icon: 'ℹ️' },
//     warning: { bg: '#fffbeb', border: '#fde68a', text: '#92400e', icon: '⚠️' },
//     success: { bg: '#f0fdf4', border: '#bbf7d0', text: '#166534', icon: '✅' },
//     danger:  { bg: '#fef2f2', border: '#fecaca', text: '#991b1b', icon: '🚨' }
//   }
//   const s = styles[type]
//   return `
//     <div style="background:${s.bg};border:1px solid ${s.border};border-radius:10px;padding:16px 20px;margin:20px 0;">
//       <p style="margin:0;color:${s.text};font-size:13px;font-weight:500;">
//         ${s.icon}&nbsp;&nbsp;${message}
//       </p>
//     </div>
//   `
// }

// const divider = () => `
//   <hr style="border:none;border-top:1px solid #e2e8f0;margin:28px 0;" />
// `

// const ctaButton = (text, url) => `
//   <div style="text-align:center;margin:28px 0;">
//     <a href="${url}" style="display:inline-block;background:linear-gradient(135deg,#f59e0b,#d97706);color:#ffffff;font-size:15px;font-weight:700;padding:14px 36px;border-radius:10px;text-decoration:none;letter-spacing:0.3px;">
//       ${text}
//     </a>
//   </div>
// `

// const greeting = (name) => `
//   <p style="margin:0 0 8px;color:#64748b;font-size:13px;text-transform:uppercase;letter-spacing:1px;font-weight:600;">
//     Hello,
//   </p>
//   <h2 style="margin:0 0 24px;color:#1e293b;font-size:22px;font-weight:700;">
//     ${name} 👋
//   </h2>
// `

// const signOff = () => `
//   ${divider()}
//   <p style="margin:0 0 4px;color:#64748b;font-size:13px;">Warm regards,</p>
//   <p style="margin:0;color:#1e293b;font-size:14px;font-weight:700;">The Waka Charge Team ⚡</p>
//   <p style="margin:8px 0 0;color:#94a3b8;font-size:12px;">
//     Questions? Reply to this email or visit our support page.
//   </p>
// `

// // ─── Welcome email ────────────────────────────────────────────────────────────

// const sendWelcomeEmail = async (email, name, accountNumber, bankName) => {
//   const content = `
//     ${greeting(name)}
//     <p style="margin:0 0 20px;color:#475569;font-size:15px;line-height:1.7;">
//       Welcome to <strong>Waka Charge</strong> — your campus companion for powerbanks,
//       study lamps, survival kits and more. Your account is fully set up and ready to go.
//     </p>

//     ${accountNumber ? `
//       <div style="background:linear-gradient(135deg,#1a1a2e,#0f3460);border-radius:14px;padding:28px;margin:24px 0;text-align:center;">
//         <p style="margin:0 0 6px;color:#94a3b8;font-size:11px;text-transform:uppercase;letter-spacing:2px;font-weight:600;">
//           Your Virtual Account
//         </p>
//         <p style="margin:0 0 4px;color:#ffffff;font-size:32px;font-weight:800;letter-spacing:4px;">
//           ${accountNumber}
//         </p>
//         <p style="margin:0;color:#f59e0b;font-size:13px;font-weight:600;">
//           ${bankName || 'Nomba MFB'}
//         </p>
//         <p style="margin:16px 0 0;color:#64748b;font-size:12px;">
//           Account Name: <span style="color:#94a3b8;font-weight:600;">WAKA CHARGE / ${name.toUpperCase()}</span>
//         </p>
//       </div>
//       ${alertBox('Transfer any amount to this account number to fund your wallet instantly. No charges.', 'info')}
//     ` : ''}

//     <h3 style="margin:28px 0 16px;color:#1e293b;font-size:16px;font-weight:700;">
//       What you can do with Waka Charge
//     </h3>
//     ${infoCard([
//       { label: '⚡ Rent Powerbanks',    value: 'Charge on the go' },
//       { label: '💡 Study Lamps',        value: 'Light up your hustle' },
//       { label: '🎒 Survival Kits',      value: 'Stay campus-ready' },
//       { label: '💳 Instant Wallet',     value: 'Fund & pay in seconds' }
//     ])}

//     ${signOff()}
//   `

//   const result = await sendEmail({
//     to: email,
//     subject: '⚡ Welcome to Waka Charge — Your Account is Ready',
//     html: baseTemplate(content)
//   })

//   if (result?.skipped) {
//     console.warn(`⚠️ Welcome email skipped for ${email} (${result.reason})`)
//     return
//   }

//   console.log('✅ Welcome email sent to', email)
// }

// // ─── Login notification ───────────────────────────────────────────────────────

// const sendLoginEmail = async (email, name) => {
//   const time = new Date().toLocaleString('en-NG', {
//     timeZone: 'Africa/Lagos',
//     dateStyle: 'full',
//     timeStyle: 'short'
//   })

//   const content = `
//     ${greeting(name)}
//     <p style="margin:0 0 20px;color:#475569;font-size:15px;line-height:1.7;">
//       A new login to your Waka Charge account was just detected.
//     </p>
//     ${infoCard([
//       { label: '📅 Date & Time', value: time },
//       { label: '📍 Platform',    value: 'Waka Charge App' },
//       { label: '✅ Status',      value: 'Successful' }
//     ])}
//     ${alertBox('If this login wasn\'t you, please contact our support team immediately and change your password.', 'warning')}
//     ${signOff()}
//   `

//   const result = await sendEmail({
//     to: email,
//     subject: '🔐 New Login Detected — Waka Charge',
//     html: baseTemplate(content)
//   })

//   if (result?.skipped) {
//     console.warn(`⚠️ Login email skipped for ${email} (${result.reason})`)
//     return
//   }

//   console.log('✅ Login email sent to', email)
// }

// // ─── OTP email ────────────────────────────────────────────────────────────────

// const sendOTPEmail = async (email, otp, type) => {
//   const meta = {
//     registration: {
//       subject: '🔐 Verify Your Email — Waka Charge',
//       heading: 'Verify your email address',
//       body: 'Enter the code below to verify your email and complete your Waka Charge registration.'
//     },
//     login: {
//       subject: '🔐 Your Login Code — Waka Charge',
//       heading: 'Your login verification code',
//       body: 'Use the code below to complete your login. This code is valid for 10 minutes.'
//     },
//     reset: {
//       subject: '🔐 Password Reset Code — Waka Charge',
//       heading: 'Reset your password',
//       body: 'You requested a password reset. Use the code below to proceed.'
//     }
//   }

//   const { subject, heading, body } = meta[type] || meta.registration

//   const content = `
//     <h2 style="margin:0 0 12px;color:#1e293b;font-size:22px;font-weight:700;">${heading}</h2>
//     <p style="margin:0 0 28px;color:#475569;font-size:15px;line-height:1.7;">${body}</p>

//     <div style="background:linear-gradient(135deg,#1a1a2e,#0f3460);border-radius:14px;padding:32px;text-align:center;margin:24px 0;">
//       <p style="margin:0 0 8px;color:#94a3b8;font-size:11px;text-transform:uppercase;letter-spacing:3px;font-weight:600;">
//         Verification Code
//       </p>
//       <p style="margin:0;color:#f59e0b;font-size:48px;font-weight:800;letter-spacing:12px;">
//         ${otp}
//       </p>
//     </div>

//     ${infoCard([
//       { label: '⏱ Expires in', value: '10 minutes' },
//       { label: '🔒 One-time use', value: 'Do not share this code' }
//     ])}

//     ${alertBox('If you did not request this code, please ignore this email. Your account is safe.', 'warning')}
//     ${signOff()}
//   `

//   const result = await sendEmail({
//     to: email,
//     subject,
//     html: baseTemplate(content)
//   })

//   if (result?.skipped) {
//     console.warn(`⚠️ OTP email skipped for ${email} (${result.reason})`)
//     return
//   }

//   console.log('✅ OTP email sent to', email)
// }

// // ─── Wallet funded ────────────────────────────────────────────────────────────

// const sendWalletFundedEmail = async (email, name, amount, balance) => {
//   const time = new Date().toLocaleString('en-NG', {
//     timeZone: 'Africa/Lagos',
//     dateStyle: 'medium',
//     timeStyle: 'short'
//   })

//   const content = `
//     ${greeting(name)}
//     <p style="margin:0 0 20px;color:#475569;font-size:15px;line-height:1.7;">
//       Great news! Your Waka Charge wallet has been credited successfully.
//     </p>

//     ${amountBadge(amount)}

//     ${infoCard([
//       { label: '💳 Transaction Type', value: 'Wallet Top-up' },
//       { label: '📅 Date & Time',      value: time },
//       { label: '✅ Status',           value: 'Successful' },
//       { label: '💰 New Balance',      value: `₦${Number(balance).toLocaleString()}` }
//     ])}

//     ${alertBox('Your wallet is funded and ready. Start renting campus devices now.', 'success')}
//     ${signOff()}
//   `

//   const result = await sendEmail({
//     to: email,
//     subject: '💰 Wallet Credited — Waka Charge',
//     html: baseTemplate(content)
//   })

//   if (result?.skipped) {
//     console.warn(`⚠️ Wallet email skipped for ${email} (${result.reason})`)
//     return
//   }

//   console.log('✅ Wallet funded email sent to', email)
// }

// // ─── Rental started ───────────────────────────────────────────────────────────

// const sendRentalStartedEmail = async (email, name, rental, deviceType) => {
//   const returnTime = new Date(rental.expectedReturnTime).toLocaleString('en-NG', {
//     timeZone: 'Africa/Lagos',
//     dateStyle: 'medium',
//     timeStyle: 'short'
//   })

//   const deviceNames = {
//     powerbank:   'Powerbank 🔋',
//     studylamp:   'Study Lamp 💡',
//     survivalkit: 'Survival Kit 🎒',
//     comfortkit:  'Comfort Kit 🛋️'
//   }

//   const content = `
//     ${greeting(name)}
//     <p style="margin:0 0 20px;color:#475569;font-size:15px;line-height:1.7;">
//       Your rental is now active. Head to your assigned locker and collect your device.
//     </p>

//     <div style="background:linear-gradient(135deg,#1a1a2e,#0f3460);border-radius:14px;padding:28px;text-align:center;margin:24px 0;">
//       <p style="margin:0 0 4px;color:#94a3b8;font-size:11px;text-transform:uppercase;letter-spacing:2px;">
//         Locker Assignment
//       </p>
//       <p style="margin:0;color:#ffffff;font-size:42px;font-weight:800;letter-spacing:4px;">
//         ${rental.lockerAssigned}
//       </p>
//       <p style="margin:12px 0 0;color:#94a3b8;font-size:12px;">
//         Confirmation Code: <span style="color:#f59e0b;font-weight:700;font-size:18px;letter-spacing:3px;">${rental.confirmationCode}</span>
//       </p>
//     </div>

//     ${infoCard([
//       { label: '📦 Device',         value: deviceNames[deviceType] || deviceType },
//       { label: '⏱ Duration',        value: `${rental.selectedHours} hour${rental.selectedHours > 1 ? 's' : ''}` },
//       { label: '⏰ Return By',       value: returnTime },
//       { label: '💳 Rental Fee',      value: `₦${Number(rental.rentalAmount).toLocaleString()}` },
//       { label: '🔒 Deposit Held',    value: `₦${Number(rental.depositAmount).toLocaleString()}` },
//       { label: '💰 Total Charged',   value: `₦${Number(rental.totalPaid).toLocaleString()}` }
//     ])}

//     ${alertBox('Return your device on time to receive your full deposit back. Late returns attract a penalty fee.', 'warning')}
//     ${signOff()}
//   `

//   const result = await sendEmail({
//     to: email,
//     subject: `⚡ Rental Started — ${deviceNames[deviceType] || deviceType} | Waka Charge`,
//     html: baseTemplate(content)
//   })

//   if (result?.skipped) {
//     console.warn(`⚠️ Rental email skipped for ${email} (${result.reason})`)
//     return
//   }

//   console.log('✅ Rental started email sent to', email)
// }

// // ─── Deposit refunded ─────────────────────────────────────────────────────────

// const sendDepositRefundedEmail = async (email, name, amount, balance, lateFee = 0) => {
//   const content = `
//     ${greeting(name)}
//     <p style="margin:0 0 20px;color:#475569;font-size:15px;line-height:1.7;">
//       Your device has been returned successfully. Here's your transaction summary.
//     </p>

//     ${amountBadge(amount)}

//     ${infoCard([
//       { label: '✅ Return Status',   value: 'Confirmed' },
//       { label: '💰 Deposit Refunded', value: `₦${Number(amount).toLocaleString()}` },
//       ...(lateFee > 0 ? [{ label: '⚠️ Late Fee Deducted', value: `₦${Number(lateFee).toLocaleString()}` }] : []),
//       { label: '💳 New Balance',     value: `₦${Number(balance).toLocaleString()}` }
//     ])}

//     ${lateFee > 0
//       ? alertBox(`A late fee of ₦${Number(lateFee).toLocaleString()} was deducted from your deposit. Return on time next time to avoid fees.`, 'warning')
//       : alertBox('Great job returning on time! Your full deposit has been refunded.', 'success')
//     }

//     ${signOff()}
//   `

//   const result = await sendEmail({
//     to: email,
//     subject: '💰 Deposit Refunded — Waka Charge',
//     html: baseTemplate(content)
//   })

//   if (result?.skipped) {
//     console.warn(`⚠️ Deposit refund email skipped for ${email} (${result.reason})`)
//     return
//   }

//   console.log('✅ Deposit refunded email sent to', email)
// }

// // ─── Exports ──────────────────────────────────────────────────────────────────

// module.exports = {
//   sendWelcomeEmail,
//   sendLoginEmail,
//   sendOTPEmail,
//   sendWalletFundedEmail,
//   sendRentalStartedEmail,
//   sendDepositRefundedEmail
// }



// const transporter = require('../config/email')

// const header = `
//   <div style="background:#0D1B2A;padding:30px;text-align:center;">
//     <h1 style="color:#1DB954;margin:0;">⚡ WAKA CHARGE</h1>
//     <p style="color:#fff;margin:5px 0 0;">Campus Energy Rental</p>
//   </div>
// `

// const footer = `
//   <div style="background:#0D1B2A;padding:15px;text-align:center;">
//     <p style="color:#888;margin:0;font-size:12px;">
//       © 2026 Waka Charge. All rights reserved.
//     </p>
//   </div>
// `

// const wrap = (content) => `
//   <body style="font-family:Arial,sans-serif;background:#f4f6f8;padding:20px;">
//     <div style="max-width:500px;margin:0 auto;background:#fff;
//       border-radius:10px;overflow:hidden;">
//       ${header}
//       <div style="padding:30px;">${content}</div>
//       ${footer}
//     </div>
//   </body>
// `

// const sendWelcomeEmail = async (
//   email, name,
//   virtualAccountNumber,
//   virtualAccountBank
// ) => {
//   try {
//     const accountSection = virtualAccountNumber
//       ? `<div style="background:#EAF9EE;border-left:4px solid #1DB954;
//            border-radius:8px;padding:20px;margin:20px 0;">
//            <h3 style="color:#0D1B2A;margin:0 0 10px;">
//              💳 Your Waka Wallet Account
//            </h3>
//            <p style="margin:5px 0;color:#555;">
//              <strong>Bank:</strong> ${virtualAccountBank || 'Nomba'}
//            </p>
//            <p style="margin:5px 0;color:#555;">
//              <strong>Account Number:</strong> ${virtualAccountNumber}
//            </p>
//            <p style="margin:5px 0;color:#555;">
//              <strong>Account Name:</strong> ${name}
//            </p>
//            <p style="margin:15px 0 0;color:#1DB954;font-size:13px;">
//              Transfer any amount here to fund your wallet instantly.
//            </p>
//          </div>`
//       : `<div style="background:#FFF9E6;border-left:4px solid #FFC107;
//            border-radius:8px;padding:15px;margin:20px 0;">
//            <p style="margin:0;color:#555;">
//              ⚠️ Your virtual account is being set up.
//              Check your profile shortly.
//            </p>
//          </div>`

//     await transporter.sendMail({
//       from: `"Waka Charge ⚡" <${process.env.EMAIL_USER}>`,
//       to: email,
//       subject: 'Welcome to Waka Charge ⚡',
//       html: wrap(`
//         <h2 style="color:#0D1B2A;">Welcome, ${name}! 🎉</h2>
//         <p style="color:#555;line-height:1.6;">
//           Your account has been created successfully.
//         </p>
//         ${accountSection}
//         <ul style="color:#555;line-height:2;">
//           <li>🔋 Power Banks — ₦300</li>
//           <li>💡 Study Lamps — ₦300</li>
//           <li>🎒 Survival Kits — ₦500</li>
//           <li>🛋️ Comfort Kits — ₦700</li>
//         </ul>
//         <p style="color:#555;">The Waka Charge Team ⚡</p>
//       `)
//     })
//     console.log(`✅ Welcome email sent to ${email}`)
//   } catch (error) {
//     console.error('❌ Welcome email error:', error.message)
//   }
// }

// const sendWalletFundedEmail = async (
//   email, name, amount, balance
// ) => {
//   try {
//     await transporter.sendMail({
//       from: `"Waka Charge ⚡" <${process.env.EMAIL_USER}>`,
//       to: email,
//       subject: '✅ Wallet Funded Successfully',
//       html: wrap(`
//         <h2 style="color:#0D1B2A;">Wallet Funded! 💰</h2>
//         <p style="color:#555;">Hi ${name},</p>
//         <div style="background:#EAF9EE;border-radius:8px;
//           padding:20px;margin:20px 0;">
//           <p style="margin:5px 0;color:#555;">
//             <strong>Amount:</strong> ₦${amount.toLocaleString()}
//           </p>
//           <p style="margin:5px 0;color:#555;">
//             <strong>New Balance:</strong> ₦${balance.toLocaleString()}
//           </p>
//         </div>
//         <p style="color:#555;">
//           Head to your nearest Waka Charge station!
//         </p>
//         <p style="color:#555;">The Waka Charge Team ⚡</p>
//       `)
//     })
//   } catch (error) {
//     console.error('❌ Wallet email error:', error.message)
//   }
// }

// const sendRentalStartedEmail = async (
//   email, name, rental, device
// ) => {
//   try {
//     await transporter.sendMail({
//       from: `"Waka Charge ⚡" <${process.env.EMAIL_USER}>`,
//       to: email,
//       subject: '⚡ Rental Started',
//       html: wrap(`
//         <h2 style="color:#0D1B2A;">Rental Active! ⚡</h2>
//         <p style="color:#555;">Hi ${name},</p>
//         <div style="background:#EAF9EE;border-radius:8px;
//           padding:20px;margin:20px 0;">
//           <p style="margin:5px 0;color:#555;">
//             <strong>Device:</strong> ${device}
//           </p>
//           <p style="margin:5px 0;color:#555;">
//             <strong>Duration:</strong> ${rental.selectedHours} hours
//           </p>
//           <p style="margin:5px 0;color:#555;">
//             <strong>Return By:</strong>
//             ${new Date(rental.expectedReturnTime).toLocaleString()}
//           </p>
//           <p style="margin:5px 0;color:#555;">
//             <strong>Deposit:</strong>
//             ₦${rental.depositAmount.toLocaleString()} (refundable)
//           </p>
//         </div>
//         <div style="background:#FFF9E6;border-left:4px solid #FFC107;
//           border-radius:8px;padding:15px;">
//           <p style="margin:0;color:#555;">
//             ⚠️ Return on time to get full deposit back.
//           </p>
//         </div>
//         <p style="color:#555;margin-top:20px;">
//           The Waka Charge Team ⚡
//         </p>
//       `)
//     })
//   } catch (error) {
//     console.error('❌ Rental email error:', error.message)
//   }
// }

// const sendDepositRefundedEmail = async (
//   email, name, amount, balance
// ) => {
//   try {
//     await transporter.sendMail({
//       from: `"Waka Charge ⚡" <${process.env.EMAIL_USER}>`,
//       to: email,
//       subject: '💰 Deposit Refunded',
//       html: wrap(`
//         <h2 style="color:#0D1B2A;">Deposit Refunded! 💰</h2>
//         <p style="color:#555;">Hi ${name},</p>
//         <div style="background:#EAF9EE;border-radius:8px;
//           padding:20px;margin:20px 0;">
//           <p style="margin:5px 0;color:#555;">
//             <strong>Refunded:</strong> ₦${amount.toLocaleString()}
//           </p>
//           <p style="margin:5px 0;color:#555;">
//             <strong>Wallet Balance:</strong>
//             ₦${balance.toLocaleString()}
//           </p>
//         </div>
//         <p style="color:#555;">
//           Thank you for returning on time. See you next time!
//         </p>
//         <p style="color:#555;">The Waka Charge Team ⚡</p>
//       `)
//     })
//   } catch (error) {
//     console.error('❌ Refund email error:', error.message)
//   }
// }

// const sendLoginEmail = async (email, name) => {
//   try {
//     await transporter.sendMail({
//       from: `"Waka Charge ⚡" <${process.env.EMAIL_USER}>`,
//       to: email,
//       subject: 'New Login Detected',
//       html: wrap(`
//         <h2 style="color:#0D1B2A;">New Login</h2>
//         <p style="color:#555;">Hi ${name},</p>
//         <p style="color:#555;">
//           A new login was detected at
//           ${new Date().toLocaleString()}.
//         </p>
//         <p style="color:#555;">
//           If this was not you, contact us immediately.
//         </p>
//         <p style="color:#555;">The Waka Charge Team ⚡</p>
//       `)
//     })
//   } catch (error) {
//     console.error('❌ Login email error:', error.message)
//   }
// }

// module.exports = {
//   sendWelcomeEmail,
//   sendWalletFundedEmail,
//   sendRentalStartedEmail,
//   sendDepositRefundedEmail,
//   sendLoginEmail
// }


const SibApiV3Sdk = require('sib-api-v3-sdk')
const transactionalEmailApi = require('../config/email')

const FROM_NAME = process.env.BREVO_FROM_NAME || 'Waka Charge'
const FROM_EMAIL = process.env.BREVO_FROM_EMAIL

const header = `
  <div style="background:#0D1B2A;padding:30px;text-align:center;">
    <h1 style="color:#1DB954;margin:0;">⚡ WAKA CHARGE</h1>
    <p style="color:#fff;margin:5px 0 0;">Campus Energy Rental</p>
  </div>
`

const footer = `
  <div style="background:#0D1B2A;padding:15px;text-align:center;">
    <p style="color:#888;margin:0;font-size:12px;">
      © 2026 Waka Charge. All rights reserved.
    </p>
  </div>
`

const wrap = (content) => `
  <body style="font-family:Arial,sans-serif;background:#f4f6f8;padding:20px;">
    <div style="max-width:500px;margin:0 auto;background:#fff;
      border-radius:10px;overflow:hidden;">
      ${header}
      <div style="padding:30px;">${content}</div>
      ${footer}
    </div>
  </body>
`

// ─────────────────────────────────────────────────
// Core sender — used by every email function below
// ─────────────────────────────────────────────────
const sendEmail = async ({ to, subject, html }) => {
  try {
    const message = new SibApiV3Sdk.SendSmtpEmail()
    message.sender = { name: FROM_NAME, email: FROM_EMAIL }
    message.to = [{ email: to }]
    message.subject = subject
    message.htmlContent = html

    const result = await transactionalEmailApi.sendTransacEmail(message)
    console.log(`✅ Email sent to ${to} — messageId: ${result.messageId}`)
    return result
  } catch (error) {
    console.error(
      '❌ Brevo email error:',
      error.response?.body || error.message
    )
    throw error
  }
}

// ─────────────────────────────────────────────────
// Welcome Email
// ─────────────────────────────────────────────────
const sendWelcomeEmail = async (
  email, name,
  virtualAccountNumber,
  virtualAccountBank
) => {
  const accountSection = virtualAccountNumber
    ? `<div style="background:#EAF9EE;border-left:4px solid #1DB954;
         border-radius:8px;padding:20px;margin:20px 0;">
         <h3 style="color:#0D1B2A;margin:0 0 10px;">
           💳 Your Waka Wallet Account
         </h3>
         <p style="margin:5px 0;color:#555;">
           <strong>Bank:</strong> ${virtualAccountBank || 'Nomba'}
         </p>
         <p style="margin:5px 0;color:#555;">
           <strong>Account Number:</strong> ${virtualAccountNumber}
         </p>
         <p style="margin:5px 0;color:#555;">
           <strong>Account Name:</strong> ${name}
         </p>
         <p style="margin:15px 0 0;color:#1DB954;font-size:13px;">
           Transfer any amount here to fund your wallet instantly.
         </p>
       </div>`
    : `<div style="background:#FFF9E6;border-left:4px solid #FFC107;
         border-radius:8px;padding:15px;margin:20px 0;">
         <p style="margin:0;color:#555;">
           ⚠️ Your virtual account is being set up.
           Check your profile shortly.
         </p>
       </div>`

  try {
    await sendEmail({
      to: email,
      subject: 'Welcome to Waka Charge ⚡',
      html: wrap(`
        <h2 style="color:#0D1B2A;">Welcome, ${name}! 🎉</h2>
        <p style="color:#555;line-height:1.6;">
          Your account has been created successfully.
        </p>
        ${accountSection}
        <ul style="color:#555;line-height:2;">
          <li>🔋 Power Banks — ₦300</li>
          <li>💡 Study Lamps — ₦300</li>
          <li>🎒 Survival Kits — ₦500</li>
          <li>🛋️ Comfort Kits — ₦700</li>
        </ul>
        <p style="color:#555;">The Waka Charge Team ⚡</p>
      `)
    })
  } catch (error) {
    console.error('❌ Welcome email failed:', error.message)
  }
}

// ─────────────────────────────────────────────────
// OTP Email
// ─────────────────────────────────────────────────
const sendOTPEmail = async (email, otp, type = 'registration') => {
  const expireMinutes = process.env.OTP_EXPIRE_MINUTES || 5

  const subjects = {
    registration: '⚡ Verify Your Waka Charge Account',
    login:        '🔐 Your Waka Charge Login Code',
    reset:        '🔑 Your Waka Charge Password Reset Code'
  }

  const intros = {
    registration: 'You are almost there! Use this code to verify your email and complete your Waka Charge registration.',
    login:        'Use this code to complete your login to Waka Charge.',
    reset:        'Use this code to reset your Waka Charge password.'
  }

  await sendEmail({
    to: email,
    subject: subjects[type] || subjects.registration,
    html: wrap(`
      <h2 style="color:#0D1B2A;">Verification Code</h2>
      <p style="color:#555;line-height:1.6;">
        ${intros[type] || intros.registration}
      </p>
      <div style="background:#0D1B2A;border-radius:12px;
        padding:30px;text-align:center;margin:25px 0;">
        <p style="color:#888;margin:0 0 10px;font-size:13px;
          letter-spacing:2px;">
          YOUR VERIFICATION CODE
        </p>
        <h1 style="color:#1DB954;font-size:48px;margin:0;
          letter-spacing:10px;font-family:monospace;">
          ${otp}
        </h1>
        <p style="color:#888;margin:15px 0 0;font-size:13px;">
          Expires in ${expireMinutes} minutes
        </p>
      </div>
      <div style="background:#FFF9E6;border-left:4px solid #FFC107;
        border-radius:8px;padding:15px;margin:20px 0;">
        <p style="margin:0;color:#555;font-size:13px;">
          🔒 <strong>Never share this code</strong> with anyone.
        </p>
      </div>
      <p style="color:#555;">The Waka Charge Team ⚡</p>
    `)
  })
}

// ─────────────────────────────────────────────────
// Wallet Funded Email
// ─────────────────────────────────────────────────
const sendWalletFundedEmail = async (
  email, name, amount, balance
) => {
  try {
    await sendEmail({
      to: email,
      subject: '✅ Wallet Funded Successfully',
      html: wrap(`
        <h2 style="color:#0D1B2A;">Wallet Funded! 💰</h2>
        <p style="color:#555;">Hi ${name},</p>
        <div style="background:#EAF9EE;border-radius:8px;
          padding:20px;margin:20px 0;">
          <p style="margin:5px 0;color:#555;">
            <strong>Amount:</strong> ₦${amount.toLocaleString()}
          </p>
          <p style="margin:5px 0;color:#555;">
            <strong>New Balance:</strong> ₦${balance.toLocaleString()}
          </p>
        </div>
        <p style="color:#555;">
          Head to your nearest Waka Charge station!
        </p>
        <p style="color:#555;">The Waka Charge Team ⚡</p>
      `)
    })
  } catch (error) {
    console.error('❌ Wallet email failed:', error.message)
  }
}

// ─────────────────────────────────────────────────
// Rental Started Email
// ─────────────────────────────────────────────────
const sendRentalStartedEmail = async (
  email, name, rental, device
) => {
  try {
    await sendEmail({
      to: email,
      subject: '⚡ Rental Started',
      html: wrap(`
        <h2 style="color:#0D1B2A;">Rental Active! ⚡</h2>
        <p style="color:#555;">Hi ${name},</p>
        <div style="background:#EAF9EE;border-radius:8px;
          padding:20px;margin:20px 0;">
          <p style="margin:5px 0;color:#555;">
            <strong>Device:</strong> ${device}
          </p>
          <p style="margin:5px 0;color:#555;">
            <strong>Duration:</strong> ${rental.selectedHours} hours
          </p>
          <p style="margin:5px 0;color:#555;">
            <strong>Return By:</strong>
            ${new Date(rental.expectedReturnTime).toLocaleString()}
          </p>
          <p style="margin:5px 0;color:#555;">
            <strong>Deposit:</strong>
            ₦${rental.depositAmount.toLocaleString()} (refundable)
          </p>
        </div>
        <div style="background:#FFF9E6;border-left:4px solid #FFC107;
          border-radius:8px;padding:15px;">
          <p style="margin:0;color:#555;">
            ⚠️ Return on time to get full deposit back.
          </p>
        </div>
        <p style="color:#555;margin-top:20px;">
          The Waka Charge Team ⚡
        </p>
      `)
    })
  } catch (error) {
    console.error('❌ Rental email failed:', error.message)
  }
}

// ─────────────────────────────────────────────────
// Deposit Refunded Email
// ─────────────────────────────────────────────────
const sendDepositRefundedEmail = async (
  email, name, amount, balance
) => {
  try {
    await sendEmail({
      to: email,
      subject: '💰 Deposit Refunded',
      html: wrap(`
        <h2 style="color:#0D1B2A;">Deposit Refunded! 💰</h2>
        <p style="color:#555;">Hi ${name},</p>
        <div style="background:#EAF9EE;border-radius:8px;
          padding:20px;margin:20px 0;">
          <p style="margin:5px 0;color:#555;">
            <strong>Refunded:</strong> ₦${amount.toLocaleString()}
          </p>
          <p style="margin:5px 0;color:#555;">
            <strong>Wallet Balance:</strong>
            ₦${balance.toLocaleString()}
          </p>
        </div>
        <p style="color:#555;">
          Thank you for returning on time. See you next time!
        </p>
        <p style="color:#555;">The Waka Charge Team ⚡</p>
      `)
    })
  } catch (error) {
    console.error('❌ Refund email failed:', error.message)
  }
}

const sendPasswordResetEmail = async (email, name, otp) => {
  return await sendOTPEmail(email, otp, 'reset')
}

// ─────────────────────────────────────────────────
// Login Notification Email
// ─────────────────────────────────────────────────
const sendLoginEmail = async (email, name) => {
  try {
    await sendEmail({
      to: email,
      subject: 'New Login Detected',
      html: wrap(`
        <h2 style="color:#0D1B2A;">New Login</h2>
        <p style="color:#555;">Hi ${name},</p>
        <p style="color:#555;">
          A new login was detected at ${new Date().toLocaleString()}.
        </p>
        <p style="color:#555;">
          If this was not you, contact us immediately.
        </p>
        <p style="color:#555;">The Waka Charge Team ⚡</p>
      `)
    })
  } catch (error) {
    console.error('❌ Login email failed:', error.message)
  }
}

module.exports = {
  sendWelcomeEmail,
  sendOTPEmail,
  sendWalletFundedEmail,
  sendRentalStartedEmail,
  sendDepositRefundedEmail,
  sendLoginEmail,
  sendPasswordResetEmail
}