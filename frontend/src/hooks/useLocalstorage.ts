import { useState } from 'react'

export const useLocalStorage = <T>(key: string, initial: T) => {
  const [value, setValue] = useState<T>(() => {
    try {
      const item = localStorage.getItem(key)
      return item ? JSON.parse(item) : initial
    } catch {
      return initial
    }
  })

  const set = (val: T | ((prev: T) => T)) => {
    try {
      const next = val instanceof Function ? val(value) : val
      setValue(next)
      localStorage.setItem(key, JSON.stringify(next))
    } catch {}
  }

  return [value, set] as const
}