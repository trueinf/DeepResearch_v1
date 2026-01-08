# 📊 Rate Limit Calculation & Tracking Guide

## Understanding Rate Limits

### Gemini API Rate Limits

**Free Tier:**
- **Requests per minute (RPM):** ~15 requests/minute
- **Requests per day (RPD):** ~1,500 requests/day
- **Tokens per minute (TPM):** ~32,000 tokens/minute

**Paid Tier:**
- **Requests per minute (RPM):** ~60 requests/minute
- **Requests per day (RPD):** Unlimited (based on quota)
- **Tokens per minute (TPM):** ~1,000,000 tokens/minute

### Rate Limit Headers

Gemini API returns rate limit information in response headers:
```
x-ratelimit-limit: 60          // Max requests per window
x-ratelimit-remaining: 45     // Remaining requests
x-ratelimit-reset: 1640995200  // Unix timestamp when limit resets
```

---

## Rate Limit Calculation Methods

### 1. **Simple Request Counting**

Track requests in a time window:

```javascript
class RateLimitTracker {
  constructor(maxRequests = 15, windowMs = 60000) {
    this.maxRequests = maxRequests
    this.windowMs = windowMs
    this.requests = []
  }

  // Add a request timestamp
  recordRequest() {
    const now = Date.now()
    this.requests.push(now)
    this.cleanOldRequests(now)
  }

  // Remove requests outside the window
  cleanOldRequests(now) {
    this.requests = this.requests.filter(
      timestamp => now - timestamp < this.windowMs
    )
  }

  // Check if we can make a request
  canMakeRequest() {
    const now = Date.now()
    this.cleanOldRequests(now)
    return this.requests.length < this.maxRequests
  }

  // Get remaining requests
  getRemaining() {
    const now = Date.now()
    this.cleanOldRequests(now)
    return Math.max(0, this.maxRequests - this.requests.length)
  }

  // Get time until next request available
  getTimeUntilNext() {
    if (this.canMakeRequest()) return 0
    
    const now = Date.now()
    this.cleanOldRequests(now)
    
    if (this.requests.length === 0) return 0
    
    const oldestRequest = Math.min(...this.requests)
    const timeSinceOldest = now - oldestRequest
    return Math.max(0, this.windowMs - timeSinceOldest)
  }

  // Get requests per minute
  getRequestsPerMinute() {
    const now = Date.now()
    this.cleanOldRequests(now)
    return this.requests.length
  }
}
```

---

### 2. **Token-Based Calculation**

Calculate rate limits based on token usage:

```javascript
class TokenRateLimitTracker {
  constructor(maxTokens = 32000, windowMs = 60000) {
    this.maxTokens = maxTokens
    this.windowMs = windowMs
    this.tokenUsage = [] // Array of { tokens, timestamp }
  }

  // Record token usage
  recordTokens(tokens, timestamp = Date.now()) {
    this.tokenUsage.push({ tokens, timestamp })
    this.cleanOldUsage(timestamp)
  }

  cleanOldUsage(now) {
    this.tokenUsage = this.tokenUsage.filter(
      usage => now - usage.timestamp < this.windowMs
    )
  }

  // Get current token usage
  getCurrentUsage() {
    const now = Date.now()
    this.cleanOldUsage(now)
    return this.tokenUsage.reduce((sum, usage) => sum + usage.tokens, 0)
  }

  // Check if we can use tokens
  canUseTokens(requiredTokens) {
    return this.getCurrentUsage() + requiredTokens <= this.maxTokens
  }

  // Get remaining tokens
  getRemainingTokens() {
    return Math.max(0, this.maxTokens - this.getCurrentUsage())
  }

  // Estimate tokens in text (rough calculation)
  estimateTokens(text) {
    // Rough estimate: ~4 characters per token
    return Math.ceil(text.length / 4)
  }
}
```

---

### 3. **Advanced Rate Limit Calculator**

Complete solution with multiple windows:

```javascript
class AdvancedRateLimitCalculator {
  constructor() {
    // Multiple rate limit windows
    this.windows = {
      perMinute: { max: 15, window: 60000, requests: [] },
      perHour: { max: 900, window: 3600000, requests: [] },
      perDay: { max: 1500, window: 86400000, requests: [] }
    }
  }

  recordRequest() {
    const now = Date.now()
    Object.values(this.windows).forEach(window => {
      window.requests.push(now)
      this.cleanWindow(window, now)
    })
  }

  cleanWindow(window, now) {
    window.requests = window.requests.filter(
      timestamp => now - timestamp < window.window
    )
  }

  // Check all windows
  canMakeRequest() {
    const now = Date.now()
    return Object.values(this.windows).every(window => {
      this.cleanWindow(window, now)
      return window.requests.length < window.max
    })
  }

  // Get status for all windows
  getStatus() {
    const now = Date.now()
    return Object.entries(this.windows).map(([name, window]) => {
      this.cleanWindow(window, now)
      return {
        name,
        used: window.requests.length,
        max: window.max,
        remaining: window.max - window.requests.length,
        percentage: (window.requests.length / window.max) * 100,
        resetTime: window.requests.length > 0 
          ? Math.min(...window.requests) + window.window 
          : now
      }
    })
  }

  // Get recommended delay
  getRecommendedDelay() {
    const status = this.getStatus()
    const now = Date.now()
    
    // Find the window that's closest to limit
    const criticalWindow = status.reduce((prev, curr) => {
      const prevTimeToReset = prev.resetTime - now
      const currTimeToReset = curr.resetTime - now
      return currTimeToReset < prevTimeToReset ? curr : prev
    })

    if (criticalWindow.remaining === 0) {
      return Math.max(0, criticalWindow.resetTime - now)
    }

    // Distribute remaining requests over the window
    const timeRemaining = criticalWindow.resetTime - now
    const requestsRemaining = criticalWindow.remaining
    return timeRemaining / (requestsRemaining + 1)
  }
}
```

---

## Implementation in Your Project

### Add to `src/utils/rateLimitHandler.js`

```javascript
// Add rate limit tracking
class RateLimitTracker {
  constructor() {
    this.requests = []
    this.maxRequests = 15 // Adjust based on your tier
    this.windowMs = 60000 // 1 minute
  }

  recordRequest() {
    const now = Date.now()
    this.requests.push(now)
    this.cleanOldRequests(now)
    
    // Persist to localStorage
    try {
      localStorage.setItem('rateLimitRequests', JSON.stringify(this.requests))
    } catch (e) {
      console.warn('Could not save rate limit data:', e)
    }
  }

  cleanOldRequests(now) {
    this.requests = this.requests.filter(
      timestamp => now - timestamp < this.windowMs
    )
  }

  loadFromStorage() {
    try {
      const stored = localStorage.getItem('rateLimitRequests')
      if (stored) {
        this.requests = JSON.parse(stored)
        this.cleanOldRequests(Date.now())
      }
    } catch (e) {
      console.warn('Could not load rate limit data:', e)
    }
  }

  getRemaining() {
    const now = Date.now()
    this.cleanOldRequests(now)
    return Math.max(0, this.maxRequests - this.requests.length)
  }

  getUsagePercentage() {
    return (this.requests.length / this.maxRequests) * 100
  }

  getTimeUntilReset() {
    if (this.requests.length === 0) return 0
    const now = Date.now()
    this.cleanOldRequests(now)
    const oldestRequest = Math.min(...this.requests)
    return Math.max(0, this.windowMs - (now - oldestRequest))
  }

  getRequestsPerMinute() {
    const now = Date.now()
    this.cleanOldRequests(now)
    return this.requests.length
  }
}

// Export tracker
export const rateLimitTracker = new RateLimitTracker()
rateLimitTracker.loadFromStorage() // Load on init
```

---

## Rate Limit Monitoring UI

### Add Rate Limit Status Component

```javascript
// src/components/RateLimitStatus.jsx
import { useState, useEffect } from 'react'
import { rateLimitTracker } from '../utils/rateLimitHandler'
import { AlertCircle, CheckCircle, Clock } from 'lucide-react'

export default function RateLimitStatus() {
  const [status, setStatus] = useState({
    remaining: rateLimitTracker.getRemaining(),
    used: rateLimitTracker.getRequestsPerMinute(),
    percentage: rateLimitTracker.getUsagePercentage(),
    timeUntilReset: rateLimitTracker.getTimeUntilReset()
  })

  useEffect(() => {
    const interval = setInterval(() => {
      setStatus({
        remaining: rateLimitTracker.getRemaining(),
        used: rateLimitTracker.getRequestsPerMinute(),
        percentage: rateLimitTracker.getUsagePercentage(),
        timeUntilReset: rateLimitTracker.getTimeUntilReset()
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  const isWarning = status.percentage > 70
  const isCritical = status.percentage > 90

  return (
    <div className={`p-3 rounded-lg border ${
      isCritical ? 'bg-red-50 border-red-300' :
      isWarning ? 'bg-yellow-50 border-yellow-300' :
      'bg-green-50 border-green-300'
    }`}>
      <div className="flex items-center gap-2">
        {isCritical ? (
          <AlertCircle className="w-5 h-5 text-red-600" />
        ) : isWarning ? (
          <Clock className="w-5 h-5 text-yellow-600" />
        ) : (
          <CheckCircle className="w-5 h-5 text-green-600" />
        )}
        <div className="flex-1">
          <div className="text-sm font-semibold">
            Rate Limit: {status.used}/{rateLimitTracker.maxRequests} requests/min
          </div>
          <div className="text-xs text-gray-600">
            {status.remaining} remaining • Resets in {Math.ceil(status.timeUntilReset / 1000)}s
          </div>
          <div className="mt-1 bg-gray-200 rounded-full h-1.5">
            <div
              className={`h-1.5 rounded-full transition-all ${
                isCritical ? 'bg-red-600' :
                isWarning ? 'bg-yellow-600' :
                'bg-green-600'
              }`}
              style={{ width: `${status.percentage}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
```

---

## Backend Rate Limit Tracking

### Add to Supabase Function

```typescript
// In deep-Research-gemini/index.ts

// Track requests per API key
const requestHistory = new Map<string, {
  requests: number[],
  tokens: number[]
}>()

function trackRequest(apiKey: string, tokens: number = 0) {
  const key = apiKey?.substring(0, 10) || 'default'
  const now = Date.now()
  
  if (!requestHistory.has(key)) {
    requestHistory.set(key, { requests: [], tokens: [] })
  }
  
  const history = requestHistory.get(key)!
  
  // Add request timestamp
  history.requests.push(now)
  
  // Add token usage
  if (tokens > 0) {
    history.tokens.push({ tokens, timestamp: now })
  }
  
  // Clean old data (keep last hour)
  history.requests = history.requests.filter(t => now - t < 3600000)
  history.tokens = history.tokens.filter(t => now - t.timestamp < 3600000)
  
  return history
}

function getRateLimitStatus(apiKey: string) {
  const history = trackRequest(apiKey)
  const now = Date.now()
  
  // Requests in last minute
  const requestsLastMinute = history.requests.filter(
    t => now - t < 60000
  ).length
  
  // Tokens in last minute
  const tokensLastMinute = history.tokens
    .filter(t => now - t.timestamp < 60000)
    .reduce((sum, t) => sum + t.tokens, 0)
  
  return {
    requestsPerMinute: requestsLastMinute,
    tokensPerMinute: tokensLastMinute,
    requestsPerHour: history.requests.length,
    canMakeRequest: requestsLastMinute < 15, // Adjust based on tier
    canUseTokens: tokensLastMinute < 32000, // Adjust based on tier
    remainingRequests: Math.max(0, 15 - requestsLastMinute),
    remainingTokens: Math.max(0, 32000 - tokensLastMinute)
  }
}

// Use in your API calls
const status = getRateLimitStatus(GEMINI_API_KEY)
console.log('Rate Limit Status:', status)

if (!status.canMakeRequest) {
  const waitTime = 60000 - (Date.now() - Math.min(...requestHistory.get(key)!.requests))
  await new Promise(resolve => setTimeout(resolve, waitTime))
}
```

---

## Rate Limit Calculation Formulas

### 1. **Requests Per Minute (RPM)**
```
RPM = Total Requests in Last 60 Seconds
```

### 2. **Tokens Per Minute (TPM)**
```
TPM = Sum of All Tokens Used in Last 60 Seconds
```

### 3. **Estimated Wait Time**
```
Wait Time = (Window Duration) - (Time Since Oldest Request)
```

### 4. **Safe Request Interval**
```
Interval = Window Duration / Max Requests
Example: 60000ms / 15 requests = 4000ms (4 seconds)
```

### 5. **Remaining Capacity**
```
Remaining = Max Limit - Current Usage
```

---

## Quick Reference

### Gemini API Limits (Free Tier)
- **RPM:** 15 requests/minute
- **TPM:** 32,000 tokens/minute
- **RPD:** 1,500 requests/day

### Recommended Settings
- **Throttle Delay:** 4 seconds (60s / 15 = 4s)
- **Safe Delay:** 2-3 seconds (buffer)
- **Cache TTL:** 1 hour (reduce API calls)

### Monitoring Checklist
- ✅ Track requests per minute
- ✅ Track token usage
- ✅ Monitor remaining capacity
- ✅ Alert when > 70% used
- ✅ Auto-throttle when > 90% used

---

## Testing Rate Limits

```javascript
// Test script
async function testRateLimits() {
  const tracker = new RateLimitTracker(15, 60000)
  
  console.log('Testing rate limits...')
  
  for (let i = 0; i < 20; i++) {
    tracker.recordRequest()
    console.log(`Request ${i + 1}:`, {
      remaining: tracker.getRemaining(),
      canMake: tracker.canMakeRequest(),
      waitTime: tracker.getTimeUntilNext()
    })
    
    if (!tracker.canMakeRequest()) {
      const wait = tracker.getTimeUntilNext()
      console.log(`Waiting ${wait}ms...`)
      await new Promise(resolve => setTimeout(resolve, wait))
    }
  }
}
```

---

## Next Steps

1. **Implement tracking** in your rateLimitHandler
2. **Add UI component** to show rate limit status
3. **Monitor in production** to optimize
4. **Adjust throttling** based on actual usage

