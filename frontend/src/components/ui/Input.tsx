import { forwardRef } from 'react'

interface InputProps extends React.ComponentPropsWithoutRef<'input'> {
  label?: string
  error?: string
  hint?: string
  containerClassName?: string
}

interface SelectOption {
  value: string
  label: string
}

interface SelectProps extends React.ComponentPropsWithoutRef<'select'> {
  label?: string
  error?: string
  hint?: string
  options: SelectOption[]
  placeholder?: string
  containerClassName?: string
}

interface OTPInputProps {
  length?: number
  value: string
  onChange: (value: string) => void
  error?: string
}

const inputBaseClassName =
  'w-full px-4 py-3.5 rounded-2xl border border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-green-500 focus:ring-2 focus:ring-green-100 disabled:opacity-60'

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, error, hint, containerClassName = '', className = '', ...props },
  ref
) {
  return (
    <div className={containerClassName}>
      {label ? (
        <label className="text-sm font-semibold text-slate-700 mb-1.5 block">
          {label}
        </label>
      ) : null}
      <input
        ref={ref}
        className={`${inputBaseClassName} ${error ? 'border-red-300 focus:border-red-500 focus:ring-red-100' : ''} ${className}`.trim()}
        {...props}
      />
      {hint ? <p className="text-xs text-slate-500 mt-1.5">{hint}</p> : null}
      {error ? <p className="text-xs text-red-500 mt-1.5">{error}</p> : null}
    </div>
  )
})

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { label, error, hint, options, placeholder = 'Select an option', containerClassName = '', className = '', ...props },
  ref
) {
  return (
    <div className={containerClassName}>
      {label ? (
        <label className="text-sm font-semibold text-slate-700 mb-1.5 block">
          {label}
        </label>
      ) : null}
      <select
        ref={ref}
        className={`${inputBaseClassName} appearance-none ${error ? 'border-red-300 focus:border-red-500 focus:ring-red-100' : ''} ${className}`.trim()}
        {...props}
      >
        <option value="" disabled>
          {placeholder}
        </option>
        {options.map(option => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {hint ? <p className="text-xs text-slate-500 mt-1.5">{hint}</p> : null}
      {error ? <p className="text-xs text-red-500 mt-1.5">{error}</p> : null}
    </div>
  )
})

export function OTPInput({ length = 6, value, onChange, error }: OTPInputProps) {
  const digits = value.split('')

  const handleChange = (index: number, nextValue: string) => {
    const normalized = nextValue.replace(/\D/g, '').slice(0, 1)
    const nextDigits = [...digits]
    nextDigits[index] = normalized
    onChange(nextDigits.slice(0, length).join(''))
  }

  const handleKeyDown = (index: number, event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Backspace' && !digits[index] && index > 0) {
      const previousDigits = [...digits]
      previousDigits[index - 1] = ''
      onChange(previousDigits.slice(0, length).join(''))
    }
  }

  return (
    <div className="w-full">
      <div className="flex items-center justify-between gap-2">
        {Array.from({ length }).map((_, index) => (
          <input
            key={index}
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={1}
            value={digits[index] ?? ''}
            onChange={event => handleChange(index, event.target.value)}
            onKeyDown={event => handleKeyDown(index, event)}
            className={`h-14 w-full rounded-2xl border text-center text-xl font-semibold outline-none transition ${error ? 'border-red-300 focus:border-red-500' : 'border-slate-200 focus:border-green-500'}`}
          />
        ))}
      </div>
      {error ? <p className="mt-3 text-center text-sm text-red-500">{error}</p> : null}
    </div>
  )
}
