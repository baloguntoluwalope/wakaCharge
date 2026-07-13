const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')

const UserSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true
    },
    phone: {
      type: String,
      required: [true, 'Phone is required'],
      unique: true,
      trim: true
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: 6,
      select: false
    },
    role: {
      type: String,
      enum: ['student', 'operator', 'admin'],
      default: 'student'
    },
    campus: {
      type: String,
      required: [true, 'Campus is required'],
      enum: [
        'LASU', 'UI', 'UNILAG', 'OAU',
        'FUTA', 'UNIBEN', 'ABU', 'UNN',
        'UNIPORT', 'LAUTECH'
      ]
    },
    // Add inside UserSchema
trustScore: {
  type: Number,
  default: 0
},
totalSuccessfulRentals: {
  type: Number,
  default: 0
},
totalLateReturns: {
  type: Number,
  default: 0
},
rnplEnabled: {
  type: Boolean,
  default: false
},
rnplLimit: {
  type: Number,
  default: 0
},
rnplOutstanding: {
  type: Number,
  default: 0
},
rnplDueDate: {
  type: Date,
  default: null
},
registeredByOperator: {
  type: mongoose.Schema.Types.ObjectId,
  ref: 'User',
  default: null
},
approvalStatus: {
  type: String,
  enum: ['pending', 'approved', 'rejected'],
  default: 'approved'  // Students auto-approved, operators start pending
},
approvedBy: {
  type: mongoose.Schema.Types.ObjectId,
  ref: 'User',
  default: null
},
approvedAt: {
  type: Date,
  default: null
},
trustLevel: {
  type: String,
  enum: ['basic', 'trusted', 'silver', 'gold'],
  default: 'basic'
},
    studentId: { type: String, default: null },
    walletBalance: { type: Number, default: 0 },
    virtualAccountNumber: { type: String, default: null },
    virtualAccountBank: { type: String, default: null },
    virtualAccountReference: { type: String, default: null },
    stationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Station',
      default: null
    },
    isActive: { type: Boolean, default: true },
    lastLogin: { type: Date, default: null }
  },
  { timestamps: true }
)

UserSchema.pre('save', async function () {
  if (!this.isModified('password')) return
  const salt = await bcrypt.genSalt(10)
  this.password = await bcrypt.hash(this.password, salt)
})

UserSchema.methods.comparePassword = async function (entered) {
  return await bcrypt.compare(entered, this.password)
}

module.exports = mongoose.model('User', UserSchema)
