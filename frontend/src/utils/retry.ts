import type { AxiosError } from 'axios'

interface RetryOptions {
  maxAttempts?: number
  delayMs?: number
  backoffMultiplier?: number
  onRetry?: (attempt: number, error: AxiosError) => void
}

/**
 * Retry a function with exponential backoff
 * Only retries on network errors or 5xx errors, NOT on 4xx errors (like 404)
 */
export const retryWithBackoff = async <T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> => {
  const {
    maxAttempts = 3,
    delayMs = 1000,
    backoffMultiplier = 2,
    onRetry
  } = options

  let lastError: Error | null = null

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn()
    } catch (error) {
      const axiosError = error as AxiosError
      lastError = error as Error

      // Don't retry on 4xx errors (client errors like 404, 400, etc.)
      if (axiosError.response?.status && axiosError.response.status >= 400 && axiosError.response.status < 500) {
        throw error
      }

      // Only retry if we haven't exhausted attempts
      if (attempt < maxAttempts) {
        const delay = delayMs * Math.pow(backoffMultiplier, attempt - 1)
        onRetry?.(attempt, axiosError)
        console.log(`Attempt ${attempt} failed. Retrying in ${delay}ms...`)
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }
  }

  throw lastError || new Error('All retry attempts failed')
}

/**
 * Handle API errors and return user-friendly messages
 */
export const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error) {
    // Axios error
    const axiosError = error as AxiosError
    
    if (axiosError.response?.status === 404) {
      return 'Resource not found'
    }
    if (axiosError.response?.status === 400) {
      return 'Invalid request. Please check your input.'
    }
    if (axiosError.response?.status === 401) {
      return 'Unauthorized. Please login again.'
    }
    if (axiosError.response?.status === 403) {
      return 'You do not have permission to access this resource.'
    }
    if (axiosError.response?.status && axiosError.response.status >= 500) {
      return 'Server error. Please try again later.'
    }
    if (axiosError.message === 'timeout of 30000ms exceeded') {
      return 'Request timeout. Please check your connection.'
    }
    if (!axiosError.response) {
      return 'Connection failed. Please check your internet.'
    }

    return error.message
  }

  return 'An unexpected error occurred'
}
