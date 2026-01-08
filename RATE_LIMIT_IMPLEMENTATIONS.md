# 📝 Rate Limit Implementation Examples

## 1. Proactive Throttling (Simplest)

Add to `src/pages/ReportView.jsx`:

```typescript
// Add at top of component
const THROTTLE_DELAY = 2000 // 2 seconds

// Modify generateUniversalFramework
const generateUniversalFramework = async () => {
  // ... existing code ...
  
  // Add delay before request
  await new Promise(resolve => setTimeout(resolve, THROTTLE_DELAY))
  
  const response = await fetch(...)
  // ... rest of code ...
}
```

---

## 2. Request Queue (Recommended)

Create `src/utils/requestQueue.ts`:

```typescript
class RequestQueue {
  private queue: Array<{ request: () => Promise<any>, resolve: (value: any) => void, reject: (error: any) => void }> = []
  private processing = false
  private minDelay = 2000

  async add<T>(request: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queue.push({ request, resolve, reject })
      this.process()
    })
  }

  private async process() {
    if (this.processing || this.queue.length === 0) return
    this.processing = true

    while (this.queue.length > 0) {
      const { request, resolve, reject } = this.queue.shift()!
      
      try {
        const result = await request()
        resolve(result)
      } catch (error) {
        reject(error)
      }

      // Wait before next request
      if (this.queue.length > 0) {
        await new Promise(resolve => setTimeout(resolve, this.minDelay))
      }
    }

    this.processing = false
  }
}

export const requestQueue = new RequestQueue()
```

Use in `ReportView.jsx`:

```typescript
import { requestQueue } from '../utils/requestQueue'

const generateUniversalFramework = async () => {
  // ... existing setup ...
  
  const result = await requestQueue.add(async () => {
    return await fetch(`${SUPABASE_URL}/functions/v1/deep-Research-gemini`, {
      // ... request config ...
    })
  })
  
  // ... handle result ...
}
```

---

## 3. Response Caching

Add to `src/pages/ReportView.jsx`:

```typescript
const CACHE_TTL = 60 * 60 * 1000 // 1 hour

const getCachedFramework = (researchId: string) => {
  const cacheKey = `universal_framework_${researchId}`
  const cached = localStorage.getItem(cacheKey)
  
  if (cached) {
    const { data, timestamp } = JSON.parse(cached)
    if (Date.now() - timestamp < CACHE_TTL) {
      return data
    }
    localStorage.removeItem(cacheKey)
  }
  return null
}

const setCachedFramework = (researchId: string, data: any) => {
  const cacheKey = `universal_framework_${researchId}`
  localStorage.setItem(cacheKey, JSON.stringify({
    data,
    timestamp: Date.now()
  }))
}

// In generateUniversalFramework:
const cached = getCachedFramework(id)
if (cached) {
  setUniversalFramework(cached)
  return
}

// After successful generation:
if (data.report) {
  setCachedFramework(id, data.report)
  setUniversalFramework(data.report)
}
```

---

## 4. Backend Rate Limiting

Add to `supabase/functions/deep-Research-gemini/index.ts`:

```typescript
// Track requests per API key
const requestHistory = new Map<string, number[]>()

function shouldThrottle(apiKey: string): boolean {
  const now = Date.now()
  const key = apiKey?.substring(0, 10) || 'default'
  
  if (!requestHistory.has(key)) {
    requestHistory.set(key, [])
  }
  
  const requests = requestHistory.get(key)!
  const recentRequests = requests.filter(time => now - time < 60000) // Last minute
  
  // Allow max 10 requests per minute
  if (recentRequests.length >= 10) {
    return true
  }
  
  requests.push(now)
  // Keep only last 100 timestamps
  if (requests.length > 100) {
    requests.shift()
  }
  requestHistory.set(key, requests)
  
  return false
}

// Before making Gemini API call:
if (shouldThrottle(GEMINI_API_KEY)) {
  console.log('Rate limit: Throttling request')
  await new Promise(resolve => setTimeout(resolve, 5000)) // Wait 5 seconds
}
```

---

## 5. Combined Approach (Best)

Create `src/utils/rateLimitHandler.ts`:

```typescript
class RateLimitHandler {
  private queue: Array<() => Promise<any>> = []
  private processing = false
  private lastRequestTime = 0
  private minDelay = 2000
  private cache = new Map<string, { data: any, timestamp: number }>()
  private cacheTTL = 60 * 60 * 1000 // 1 hour

  async request<T>(
    key: string,
    requestFn: () => Promise<T>,
    useCache = true
  ): Promise<T> {
    // Check cache
    if (useCache) {
      const cached = this.cache.get(key)
      if (cached && Date.now() - cached.timestamp < this.cacheTTL) {
        return cached.data
      }
    }

    // Queue request
    return new Promise((resolve, reject) => {
      this.queue.push(async () => {
        try {
          // Throttle: ensure min delay since last request
          const timeSinceLastRequest = Date.now() - this.lastRequestTime
          if (timeSinceLastRequest < this.minDelay) {
            await new Promise(resolve => setTimeout(resolve, this.minDelay - timeSinceLastRequest))
          }

          const result = await requestFn()
          this.lastRequestTime = Date.now()

          // Cache result
          if (useCache) {
            this.cache.set(key, { data: result, timestamp: Date.now() })
          }

          resolve(result)
        } catch (error) {
          reject(error)
        }
      })

      this.process()
    })
  }

  private async process() {
    if (this.processing || this.queue.length === 0) return
    this.processing = true

    while (this.queue.length > 0) {
      const request = this.queue.shift()!
      await request()
    }

    this.processing = false
  }

  clearCache() {
    this.cache.clear()
  }
}

export const rateLimitHandler = new RateLimitHandler()
```

Use in components:

```typescript
import { rateLimitHandler } from '../utils/rateLimitHandler'

const generateUniversalFramework = async () => {
  const cacheKey = `universal_framework_${id}`
  
  try {
    const response = await rateLimitHandler.request(
      cacheKey,
      async () => {
        return await fetch(`${SUPABASE_URL}/functions/v1/deep-Research-gemini`, {
          // ... config ...
        })
      },
      true // Use cache
    )

    const data = await response.json()
    // ... handle response ...
  } catch (error) {
    // ... handle error ...
  }
}
```

---

## Quick Implementation Guide

### Step 1: Add Proactive Throttling (5 minutes)
1. Add 2-second delay before API calls
2. Test and verify

### Step 2: Add Caching (15 minutes)
1. Create cache utility
2. Cache successful responses
3. Check cache before making requests

### Step 3: Add Request Queue (30 minutes)
1. Create RequestQueue class
2. Wrap API calls in queue
3. Test sequential processing

### Step 4: Backend Rate Limiting (1 hour)
1. Add rate limit tracking in Supabase function
2. Implement throttling logic
3. Deploy and test

---

## Testing

After implementing, test with:
1. Multiple rapid requests
2. Network tab to verify delays
3. Console logs to track queue processing
4. Cache behavior (refresh page)

