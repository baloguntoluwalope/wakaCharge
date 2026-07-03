import {
  FaBatteryFull,
  FaLightbulb,
  FaBagShopping,
  FaCouch,
  FaCircle,
  FaShieldHalved,
  FaMedal,
  FaAward,
  FaWallet,
  FaBolt,
  FaLock,
  FaRotateLeft,
  FaTriangleExclamation,
  FaCreditCard,
} from 'react-icons/fa6'
import type { IconType } from 'react-icons'

export const CAMPUSES = [
  'LASU', 'UI', 'UNILAG', 'OAU', 'FUTA',
  'UNIBEN', 'ABU', 'UNN', 'UNIPORT', 'LAUTECH'
] as const

export const DEVICE_CONFIG = {
  powerbank: {
    label: 'Power Bank',
    icon: FaBatteryFull,
    price: 300,
    deposit: 500,
    maxHours: 8,
    color: '#1db954',
    description: 'Keep your phone charged throughout the day'
  },
  studylamp: {
    label: 'Study Lamp',
    icon: FaLightbulb,
    price: 300,
    deposit: 500,
    maxHours: 12,
    color: '#f59e0b',
    description: 'Study through power outages without disruption'
  },
  survivalkit: {
    label: 'Survival Kit',
    icon: FaBagShopping,
    price: 500,
    deposit: 700,
    maxHours: 12,
    color: '#0ea5e9',
    description: 'Power bank + Study lamp combo for serious sessions'
  },
  comfortkit: {
    label: 'Comfort Kit',
    icon: FaCouch,
    price: 700,
    deposit: 1000,
    maxHours: 12,
    color: '#8b5cf6',
    description: 'Power bank + Lamp + Fan — the full experience'
  }
} as const

export const TRUST_LEVELS = {
  basic:   { label: 'Basic',   icon: FaCircle, color: '#64748b', threshold: 10,  rnpl: 0,    emoji: '⚪' },
  trusted: { label: 'Trusted', icon: FaShieldHalved, color: '#f59e0b', threshold: 18,  rnpl: 1000, emoji: '🛡️' },
  silver:  { label: 'Silver',  icon: FaMedal, color: '#94a3b8', threshold: 31,  rnpl: 2500, emoji: '🥈' },
  gold:    { label: 'Gold',    icon: FaAward, color: '#f59e0b', threshold: null, rnpl: 5000, emoji: '🥇' },
} as const



export const TRANSACTION_META: Record<string, { label: string; icon: IconType; isCredit: boolean }> = {
  wallet_funding:   { label: 'Wallet funded',    icon: FaWallet, isCredit: true  },
  rental_payment:   { label: 'Rental payment',   icon: FaBolt, isCredit: false },
  deposit_hold:     { label: 'Deposit held',     icon: FaLock, isCredit: false },
  deposit_refund:   { label: 'Deposit refunded', icon: FaRotateLeft, isCredit: true  },
  late_fee:         { label: 'Late return fee',  icon: FaTriangleExclamation, isCredit: false },
  checkout_payment: { label: 'Card payment',     icon: FaCreditCard, isCredit: true  },
}