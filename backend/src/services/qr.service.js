const QRCode = require('qrcode')

const generateStationQR = async (stationId) => {
  try {
    const url = `${process.env.FRONTEND_URL}/stations/${stationId}`
    const qrCode = await QRCode.toDataURL(url, {
      errorCorrectionLevel: 'H',
      type: 'image/png',
      margin: 1,
      color: {
        dark: '#0D1B2A',
        light: '#FFFFFF'
      }
    })
    return qrCode
  } catch (error) {
    console.error('QR generation error:', error.message)
    throw new Error('Failed to generate QR code')
  }
}

const generateStationQRString = (stationId) => {
  return `${process.env.FRONTEND_URL}/stations/${stationId}`
}

module.exports = { generateStationQR, generateStationQRString }