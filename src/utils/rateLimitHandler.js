// Rate Limit Handler with Proactive Throttling and Caching

class RateLimitHandler {
  constructor() {
    this.lastRequestTime = 0
    this.minDelay = 2000 // 2 seconds between requests
    this.cache = new Map()
    this.cacheTTL = 60 * 60 * 1000 // 1 hour cache
    
    // Rate limit tracking
    this.requests = [] // Array of request timestamps
    this.maxRequests = 15 // Free tier: 15 requests/minute
    this.windowMs = 60000 // 1 minute window
    
    // Load from localStorage
    this.loadRequestHistory()
  }

  // Load request history from localStorage
  loadRequestHistory() {
    try {
      const stored = localStorage.getItem('rateLimitRequests')
      if (stored) {
        this.requests = JSON.parse(stored)
        this.cleanOldRequests(Date.now())
      }
    } catch (error) {
      console.warn('Could not load rate limit history:', error)
    }
  }

  // Save request history to localStorage
  saveRequestHistory() {
    try {
      localStorage.setItem('rateLimitRequests', JSON.stringify(this.requests))
    } catch (error) {
      console.warn('Could not save rate limit history:', error)
    }
  }

  // Record a request timestamp
  recordRequest() {
    const now = Date.now()
    this.requests.push(now)
    this.cleanOldRequests(now)
    this.saveRequestHistory()
  }

  // Remove requests outside the time window
  cleanOldRequests(now) {
    this.requests = this.requests.filter(
      timestamp => now - timestamp < this.windowMs
    )
  }

  // Get current request count in window
  getRequestCount() {
    const now = Date.now()
    this.cleanOldRequests(now)
    return this.requests.length
  }

  // Get remaining requests
  getRemainingRequests() {
    return Math.max(0, this.maxRequests - this.getRequestCount())
  }

  // Get usage percentage
  getUsagePercentage() {
    return (this.getRequestCount() / this.maxRequests) * 100
  }

  // Get time until next request slot available
  getTimeUntilNext() {
    const now = Date.now()
    this.cleanOldRequests(now)
    
    if (this.requests.length < this.maxRequests) {
      return 0
    }
    
    // Find oldest request in window
    const oldestRequest = Math.min(...this.requests)
    const timeSinceOldest = now - oldestRequest
    return Math.max(0, this.windowMs - timeSinceOldest)
  }

  // Get requests per minute
  getRequestsPerMinute() {
    return this.getRequestCount()
  }

  // Check if we can make a request
  canMakeRequest() {
    return this.getRequestCount() < this.maxRequests
  }

  // Get rate limit status
  getStatus() {
    const now = Date.now()
    this.cleanOldRequests(now)
    
    const used = this.requests.length
    const remaining = this.maxRequests - used
    const percentage = (used / this.maxRequests) * 100
    const timeUntilReset = this.getTimeUntilNext()
    
    return {
      used,
      max: this.maxRequests,
      remaining,
      percentage: Math.round(percentage * 100) / 100,
      requestsPerMinute: used,
      timeUntilReset,
      canMakeRequest: remaining > 0,
      isWarning: percentage > 70,
      isCritical: percentage > 90
    }
  }

  // Get cached data
  getCache(key) {
    try {
      const cached = localStorage.getItem(`rateLimitCache_${key}`)
      if (cached) {
        const { data, timestamp } = JSON.parse(cached)
        if (Date.now() - timestamp < this.cacheTTL) {
          return data
        }
        // Expired - remove from cache
        localStorage.removeItem(`rateLimitCache_${key}`)
      }
    } catch (error) {
      console.error('Cache read error:', error)
    }
    return null
  }

  // Set cache
  setCache(key, data) {
    try {
      localStorage.setItem(`rateLimitCache_${key}`, JSON.stringify({
        data,
        timestamp: Date.now()
      }))
    } catch (error) {
      console.error('Cache write error:', error)
      // If storage is full, clear old entries
      this.clearOldCache()
    }
  }

  // Clear old cache entries
  clearOldCache() {
    try {
      const keys = Object.keys(localStorage)
      keys.forEach(key => {
        if (key.startsWith('rateLimitCache_')) {
          const cached = localStorage.getItem(key)
          if (cached) {
            const { timestamp } = JSON.parse(cached)
            if (Date.now() - timestamp >= this.cacheTTL) {
              localStorage.removeItem(key)
            }
          }
        }
      })
    } catch (error) {
      console.error('Cache cleanup error:', error)
    }
  }

  // Clear specific cache entry
  clearCache(key) {
    try {
      localStorage.removeItem(`rateLimitCache_${key}`)
    } catch (error) {
      console.error('Cache clear error:', error)
    }
  }

  // Clear all cache
  clearAllCache() {
    try {
      const keys = Object.keys(localStorage)
      keys.forEach(key => {
        if (key.startsWith('rateLimitCache_')) {
          localStorage.removeItem(key)
        }
      })
    } catch (error) {
      console.error('Cache clear all error:', error)
    }
  }

  // Throttle: ensure minimum delay since last request
  async throttle() {
    const now = Date.now()
    
    // Check rate limit first
    if (!this.canMakeRequest()) {
      const waitTime = this.getTimeUntilNext()
      if (waitTime > 0) {
        console.log(`Rate limit: waiting ${Math.ceil(waitTime / 1000)}s before request (${this.getRequestCount()}/${this.maxRequests} used)`)
        await new Promise(resolve => setTimeout(resolve, waitTime))
      }
    }
    
    // Then apply minimum delay
    const timeSinceLastRequest = now - this.lastRequestTime
    if (timeSinceLastRequest < this.minDelay) {
      const waitTime = this.minDelay - timeSinceLastRequest
      console.log(`Throttling: waiting ${waitTime}ms before request`)
      await new Promise(resolve => setTimeout(resolve, waitTime))
    }
    
    this.lastRequestTime = Date.now()
    this.recordRequest() // Track this request
  }

  // Make a throttled and cached request
  async request(key, requestFn, useCache = true) {
    // Check cache first
    if (useCache) {
      const cached = this.getCache(key)
      if (cached !== null) {
        console.log(`Cache hit for: ${key}`)
        return cached
      }
    }

    // Throttle before request
    await this.throttle()

    // Make request
    try {
      const result = await requestFn()
      
      // Cache successful response
      if (useCache && result) {
        this.setCache(key, result)
      }
      
      return result
    } catch (error) {
      // Don't cache errors
      throw error
    }
  }
}

// Export singleton instance
export const rateLimitHandler = new RateLimitHandler()

