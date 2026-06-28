const mongoose = require('mongoose')

const StationSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    campus: {
      type: String,
      required: true,
      enum: [
        'LASU', 'UI', 'UNILAG', 'OAU',
        'FUTA', 'UNIBEN', 'ABU', 'UNN',
        'UNIPORT', 'LAUTECH'
      ]
    },
    location: { type: String, required: true },
    description: { type: String, default: '' },
    qrCode: { type: String, default: null },
    qrCodeUrl: { type: String, default: null },
    operatorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    isActive: { type: Boolean, default: true },
    coordinates: {
      lat: { type: Number, default: null },
      lng: { type: Number, default: null }
    }
  },
  { timestamps: true }
)

module.exports = mongoose.model('Station', StationSchema)