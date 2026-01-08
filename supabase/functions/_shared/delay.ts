// Delay and Retry Utilities for Edge Functions

/**
 * Sleep/delay function
 * @param ms - Milliseconds to wait
 */
export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * Retry with exponential backoff
 * @param fn - Function to retry
 * @param maxRetries - Maximum number of retries
 * @param initialDelay - Initial delay in ms (default: 1000)
 * @param maxDelay - Maximum delay in ms (default: 30000)
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  initialDelay: number = 1000,
  maxDelay: number = 30000
): Promise<T> {
  let lastError: Error | null = null
  let delay = initialDelay

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error as Error
      
      if (attempt === maxRetries) {
        throw lastError
      }

      // Wait before retrying (exponential backoff)
      await sleep(delay)
      delay = Math.min(delay * 2, maxDelay) // Double delay, cap at maxDelay
    }
  }

  throw lastError || new Error('Retry failed')
}

/**
 * Sleep alias (same as delay)
 */
export function sleep(ms: number): Promise<void> {
  return delay(ms)
}

/**
 * Rate limiter - ensures minimum time between calls
 */
export class RateLimiter {
  private lastCall: number = 0
  private minInterval: number

  constructor(minIntervalMs: number) {
    this.minInterval = minIntervalMs
  }

  async wait(): Promise<void> {
    const now = Date.now()
    const timeSinceLastCall = now - this.lastCall
    
    if (timeSinceLastCall < this.minInterval) {
      await delay(this.minInterval - timeSinceLastCall)
    }
    
    this.lastCall = Date.now()
  }
}

/**
 * Batch processor with delay between batches
 */
export async function processBatches<T, R>(
  items: T[],
  batchSize: number,
  processor: (batch: T[]) => Promise<R[]>,
  delayBetweenBatches: number = 1000
): Promise<R[]> {
  const results: R[] = []
  
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize)
    const batchResults = await processor(batch)
    results.push(...batchResults)
    
    // Delay before next batch (except for last batch)
    if (i + batchSize < items.length) {
      await delay(delayBetweenBatches)
    }
  }
  
  return results
}

