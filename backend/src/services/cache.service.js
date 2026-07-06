// src/services/cache.service.js — complete file

/**
 * In-memory LRU cache
 * Replaces Redis for a single-instance server
 * Works on Render free tier, zero cost
 */

class MemoryCache {
  constructor() {
    this.store = new Map()
    this.timers = new Map()
    
    // Clean expired entries every 5 minutes
    setInterval(() => this.cleanup(), 5 * 60 * 1000)
    
    console.log('💾 In-memory cache initialized')
  }

  set(key, value, ttlSeconds = 300) {
    // Clear existing timer if key exists
    if (this.timers.has(key)) {
      clearTimeout(this.timers.get(key))
    }

    this.store.set(key, {
      value,
      expiresAt: Date.now() + (ttlSeconds * 1000),
      createdAt: Date.now(),
    })

    // Auto-expire
    const timer = setTimeout(() => {
      this.store.delete(key)
      this.timers.delete(key)
    }, ttlSeconds * 1000)

    this.timers.set(key, timer)
  }

  get(key) {
    const entry = this.store.get(key)
    if (!entry) return null
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key)
      return null
    }
    return entry.value
  }

  delete(key) {
    if (this.timers.has(key)) {
      clearTimeout(this.timers.get(key))
      this.timers.delete(key)
    }
    this.store.delete(key)
  }

  // Delete all keys matching a pattern
  invalidate(pattern) {
    const regex = new RegExp(pattern)
    for (const key of this.store.keys()) {
      if (regex.test(key)) {
        this.delete(key)
      }
    }
  }

  cleanup() {
    const now = Date.now()
    let cleaned = 0
    for (const [key, entry] of this.store.entries()) {
      if (now > entry.expiresAt) {
        this.store.delete(key)
        this.timers.delete(key)
        cleaned++
      }
    }
    if (cleaned > 0) {
      console.log(`🧹 Cache cleanup: removed ${cleaned} expired entries`)
    }
  }

  stats() {
    return {
      size: this.store.size,
      keys: [...this.store.keys()],
      memoryUsage: process.memoryUsage().heapUsed / 1024 / 1024,
    }
  }
}

// Singleton
const cache = new MemoryCache()

// ─── Cache middleware factory ─────────────────────────────
const cacheMiddleware = (ttlSeconds = 60, keyFn = null) => {
  return (req, res, next) => {
    const key = keyFn
      ? keyFn(req)
      : `${req.method}:${req.originalUrl}:${req.user?._id || 'anon'}`

    const cached = cache.get(key)
    if (cached) {
      res.setHeader('X-Cache', 'HIT')
      return res.json(cached)
    }

    // Intercept res.json to cache the response
    const originalJson = res.json.bind(res)
    res.json = (data) => {
      if (res.statusCode === 200) {
        cache.set(key, data, ttlSeconds)
        res.setHeader('X-Cache', 'MISS')
      }
      return originalJson(data)
    }

    next()
  }
}

module.exports = { cache, cacheMiddleware }