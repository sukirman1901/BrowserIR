export interface RetryOptions {
  maxAttempts: number
  delay: number
  backoff: 'linear' | 'exponential'
  onRetry?: (attempt: number, error: Error) => void
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions
): Promise<T> {
  let lastError: Error | undefined
  for (let attempt = 1; attempt <= options.maxAttempts; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error as Error
      if (attempt < options.maxAttempts) {
        const delay = options.backoff === 'exponential'
          ? options.delay * Math.pow(2, attempt - 1)
          : options.delay * attempt
        options.onRetry?.(attempt, lastError)
        await new Promise(r => setTimeout(r, delay))
      }
    }
  }
  throw lastError
}
