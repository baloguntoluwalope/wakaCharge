const User = require('../models/User')

// Calculate trust level based on score
const getTrustLevel = (score) => {
  if (score >= 31) return 'gold'
  if (score >= 18) return 'silver'
  if (score >= 10) return 'trusted'
  return 'basic'
}

// Calculate RNPL limit based on trust level
const getRNPLLimit = (trustLevel) => {
  const limits = {
    basic:   0,
    trusted: 1000,
    silver:  2500,
    gold:    5000
  }
  return limits[trustLevel] || 0
}

// Add score after successful return
const rewardSuccessfulReturn = async (userId, isEarly = false) => {
  const user = await User.findById(userId)

  const points = isEarly ? 2 : 1
  user.trustScore += points
  user.totalSuccessfulRentals += 1
  user.trustLevel = getTrustLevel(user.trustScore)
  user.rnplLimit = getRNPLLimit(user.trustLevel)

  // Unlock RNPL when trusted level reached
  if (
    user.trustLevel !== 'basic' &&
    !user.rnplEnabled
  ) {
    user.rnplEnabled = true
    console.log(
      `🎉 RNPL unlocked for ${user.name} 
      at trust score ${user.trustScore}`
    )
  }

  await user.save({ validateBeforeSave: false })

  return {
    trustScore: user.trustScore,
    trustLevel: user.trustLevel,
    rnplEnabled: user.rnplEnabled,
    rnplLimit: user.rnplLimit,
    pointsEarned: points
  }
}

// Deduct score for late return
const penaliseLateReturn = async (userId) => {
  const user = await User.findById(userId)

  user.trustScore = Math.max(0, user.trustScore - 1)
  user.totalLateReturns += 1
  user.trustLevel = getTrustLevel(user.trustScore)
  user.rnplLimit = getRNPLLimit(user.trustLevel)

  // Disable RNPL if score drops below 10
  if (user.trustScore < 10) {
    user.rnplEnabled = false
    user.rnplLimit = 0
  }

  await user.save({ validateBeforeSave: false })

  return {
    trustScore: user.trustScore,
    trustLevel: user.trustLevel,
    rnplEnabled: user.rnplEnabled
  }
}

// Deduct score for forfeited device
const penaliseForfeiture = async (userId) => {
  const user = await User.findById(userId)

  user.trustScore = Math.max(0, user.trustScore - 3)
  user.trustLevel = getTrustLevel(user.trustScore)
  user.rnplLimit = getRNPLLimit(user.trustLevel)

  if (user.trustScore < 10) {
    user.rnplEnabled = false
    user.rnplLimit = 0
  }

  await user.save({ validateBeforeSave: false })

  return {
    trustScore: user.trustScore,
    trustLevel: user.trustLevel,
    rnplEnabled: user.rnplEnabled
  }
}

// Get trust score summary
const getTrustSummary = (user) => {
  const nextLevel = {
    basic:   { level: 'trusted', needed: 10 - user.trustScore },
    trusted: { level: 'silver',  needed: 18 - user.trustScore },
    silver:  { level: 'gold',    needed: 31 - user.trustScore },
    gold:    { level: 'gold',    needed: 0 }
  }

  return {
    trustScore: user.trustScore,
    trustLevel: user.trustLevel,
    totalSuccessfulRentals: user.totalSuccessfulRentals,
    totalLateReturns: user.totalLateReturns,
    rnplEnabled: user.rnplEnabled,
    rnplLimit: user.rnplLimit,
    rnplOutstanding: user.rnplOutstanding,
    nextLevel: nextLevel[user.trustLevel],
    badges: {
      isTrusted: user.trustScore >= 10,
      isSilver:  user.trustScore >= 18,
      isGold:    user.trustScore >= 31
    }
  }
}

module.exports = {
  getTrustLevel,
  getRNPLLimit,
  rewardSuccessfulReturn,
  penaliseLateReturn,
  penaliseForfeiture,
  getTrustSummary
}