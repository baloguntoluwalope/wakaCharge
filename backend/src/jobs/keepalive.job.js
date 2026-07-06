// Pings the server every 14 minutes to prevent Render free tier sleep
// Add this to your app startup in server.js/index.js

const keepAlive = () => {
  const url = process.env.BACKEND_URL || 'https://wakacharge.onrender.com'
  
  setInterval(async () => {
    try {
      const res = await fetch(`${url}/health`)
      const data = await res.json()
      console.log(`[KeepAlive] ✅ ${new Date().toISOString()} — ${data.status}`)
    } catch (err) {
      console.log(`[KeepAlive] ⚠️ Ping failed: ${err.message}`)
    }
  }, 14 * 60 * 1000) // 14 minutes
}

module.exports = keepAlive