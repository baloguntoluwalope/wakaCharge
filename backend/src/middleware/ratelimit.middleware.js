// src/middleware/ratelimit.middleware.js

const rateLimit = require('express-rate-limit');
const { cache } = require('../services/cache.service');

// ─── Custom Store Factory (Solves ERR_ERL_STORE_REUSE) ───────────────
class CacheStore {
  constructor(prefix) {
    this.prefix = prefix; // Differentiates tiers (e.g., rl:auth, rl:otp)
  }

  async increment(key) {
    const cacheKey = `rl:${this.prefix}:${key}`;
    const current = cache.get(cacheKey) || { count: 0, resetTime: Date.now() + 60000 };
    
    current.count++;
    const ttl = Math.ceil((current.resetTime - Date.now()) / 1000);
    
    if (ttl > 0) {
      cache.set(cacheKey, current, ttl);
    }
    
    return {
      totalHits: current.count,
      resetTime: new Date(current.resetTime),
    };
  }

  async decrement(key) {
    const cacheKey = `rl:${this.prefix}:${key}`;
    const current = cache.get(cacheKey);
    if (current && current.count > 0) {
      current.count--;
      cache.set(cacheKey, current, 60);
    }
  }

  async resetKey(key) {
    cache.delete(`rl:${this.prefix}:${key}`);
  }
}

// Helper to safely fall back to standardized IP keys (Solves ERR_ERL_KEY_GEN_IPV6)
const getIpKey = (req) => req.ip;

// ─── Rate Limit Tiers ───────────────────────────────────────────────

// General API — 100 req/min per IP
const general = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  store: new CacheStore('general'),
  message: { success: false, message: 'Too many requests. Please slow down.' }
});

// Auth endpoints — 10 req/min per IP
const auth = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  store: new CacheStore('auth'),
  message: { success: false, message: 'Too many login attempts. Try again in a minute.' }
});

// OTP — 3 per 60 seconds per IP
const otp = rateLimit({
  windowMs: 60 * 1000,
  max: 3,
  store: new CacheStore('otp'),
  message: { success: false, message: 'OTP rate limit reached. Wait 60 seconds.' }
});

// Payments — 20 per minute per user (or fallback to standardized IP)
const payment = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  store: new CacheStore('payment'),
  keyGenerator: (req) => req.user?._id?.toString() || getIpKey(req),
  message: { success: false, message: 'Payment rate limit exceeded.' }
});

// Checkout — 5 per minute per user (expensive Nomba calls)
const checkout = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  store: new CacheStore('checkout'),
  keyGenerator: (req) => req.user?._id?.toString() || getIpKey(req),
  message: { success: false, message: 'Too many checkout attempts. Wait a moment.' }
});

// Scan/rental — 30 per minute per user
const rental = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  store: new CacheStore('rental'),
  keyGenerator: (req) => req.user?._id?.toString() || getIpKey(req),
  message: { success: false, message: 'Too many rental requests.' }
});

// ─── Correct Exports (Solves ReferenceError) ─────────────────────────
module.exports = { 
  general, 
  auth, 
  otp, 
  payment, 
  checkout, 
  rental,
  // Mapping fallback mappings if your routes explicitly import old names:
  apiLimiter: general,
  otpLimiter: otp,
  paymentLimiter: payment
};