# 🚀 Alternative Rate Limit Handling Strategies

## Current Implementation
- ✅ Exponential backoff retry (60s, 120s, 180s, 240s, 300s)
- ✅ Visual countdown UI
- ✅ Automatic retries (up to 5 attempts)
- ✅ Smart delay tracking

## Alternative Approaches

### 1. **Proactive Request Throttling** ⭐ Recommended
Add delays BEFORE making requests to stay under rate limits.

**Benefits:**
- Prevents rate limits instead of reacting to them
- Smoother user experience
- More predictable behavior

**Implementation:**
```typescript
// Add delay before each API call
const THROTTLE_DELAY = 2000 // 2 seconds between requests

async function makeThrottledRequest() {
  await new Promise(resolve => setTimeout(resolve, THROTTLE_DELAY))
  return await fetch(...)
}
```

---

### 2. **Request Queuing System** ⭐⭐ Highly Recommended
Queue requests and process them sequentially with controlled rate.

**Benefits:**
- Prevents overwhelming the API
- Guarantees request order
- Better resource management

**Implementation:**
```typescript
class RequestQueue {
  private queue: Array<() => Promise<any>> = []
  private processing = false
  private minDelay = 2000 // 2 seconds between requests

  async add(request: () => Promise<any>) {
    return new Promise((resolve, reject) => {
      this.queue.push(async () => {
        try {
          const result = await request()
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
      const request = this.queue.shift()
      if (request) {
        await request()
        if (this.queue.length > 0) {
          await new Promise(resolve => setTimeout(resolve, this.minDelay))
        }
      }
    }

    this.processing = false
  }
}
```

---

### 3. **Backend Rate Limiting** ⭐⭐⭐ Best for Production
Handle rate limiting at the Supabase Edge Function level.

**Benefits:**
- Centralized control
- Works across all clients
- Can use shared state/Redis

**Implementation:**
```typescript
// In deep-Research-gemini/index.ts
const rateLimiter = new Map<string, number[]>() // Track request times per API key

function checkRateLimit(apiKey: string, maxRequests: number, windowMs: number): boolean {
  const now = Date.now()
  const key = apiKey.substring(0, 10) // Use partial key for tracking
  
  if (!rateLimiter.has(key)) {
    rateLimiter.set(key, [])
  }
  
  const requests = rateLimiter.get(key)!
  const recentRequests = requests.filter(time => now - time < windowMs)
  
  if (recentRequests.length >= maxRequests) {
    return false // Rate limit exceeded
  }
  
  recentRequests.push(now)
  rateLimiter.set(key, recentRequests)
  return true
}

// Before making API call:
if (!checkRateLimit(GEMINI_API_KEY, 10, 60000)) { // 10 requests per minute
  await delay(5000) // Wait 5 seconds
}
```

---

### 4. **Request Deduplication**
Prevent duplicate requests for the same content.

**Benefits:**
- Reduces unnecessary API calls
- Faster responses (cache hit)
- Lower costs

**Implementation:**
```typescript
const requestCache = new Map<string, { data: any, timestamp: number }>()
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

async function makeDeduplicatedRequest(key: string, requestFn: () => Promise<any>) {
  const cached = requestCache.get(key)
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data
  }
  
  const data = await requestFn()
  requestCache.set(key, { data, timestamp: Date.now() })
  return data
}
```

---

### 5. **Response Caching**
Cache successful responses to avoid redundant API calls.

**Benefits:**
- Instant responses for cached content
- Reduces API usage
- Better user experience

**Implementation:**
```typescript
// Cache in localStorage or IndexedDB
const cacheKey = `research_${researchId}_${mode}`
const cached = localStorage.getItem(cacheKey)

if (cached) {
  const { data, timestamp } = JSON.parse(cached)
  if (Date.now() - timestamp < 3600000) { // 1 hour cache
    return data
  }
}

// Make request and cache result
const result = await fetch(...)
localStorage.setItem(cacheKey, JSON.stringify({
  data: result,
  timestamp: Date.now()
}))
```

---

### 6. **Multiple API Key Rotation**
Rotate between multiple API keys to increase rate limits.

**Benefits:**
- Multiplies available rate limits
- Automatic failover
- Better reliability

**Implementation:**
```typescript
const API_KEYS = [
  Deno.env.get('GEMINI_API_KEY_1'),
  Deno.env.get('GEMINI_API_KEY_2'),
  Deno.env.get('GEMINI_API_KEY_3'),
].filter(Boolean)

let currentKeyIndex = 0

function getNextApiKey() {
  const key = API_KEYS[currentKeyIndex]
  currentKeyIndex = (currentKeyIndex + 1) % API_KEYS.length
  return key
}

// Use in API calls
const apiKey = getNextApiKey()
```

---

### 7. **Request Prioritization**
Prioritize important requests over less critical ones.

**Benefits:**
- Critical requests get through faster
- Better user experience for important actions
- Smart resource allocation

**Implementation:**
```typescript
class PriorityQueue {
  private high: Array<() => Promise<any>> = []
  private normal: Array<() => Promise<any>> = []
  private low: Array<() => Promise<any>> = []

  add(request: () => Promise<any>, priority: 'high' | 'normal' | 'low') {
    if (priority === 'high') this.high.push(request)
    else if (priority === 'normal') this.normal.push(request)
    else this.low.push(request)
  }

  async process() {
    // Process high priority first
    while (this.high.length > 0) {
      await this.high.shift()!()
    }
    // Then normal
    while (this.normal.length > 0) {
      await this.normal.shift()!()
    }
    // Finally low
    while (this.low.length > 0) {
      await this.low.shift()!()
    }
  }
}
```

---

### 8. **Adaptive Rate Limiting**
Dynamically adjust request rate based on API responses.

**Benefits:**
- Automatically adapts to API conditions
- Maximizes throughput
- Self-optimizing

**Implementation:**
```typescript
let currentDelay = 1000 // Start with 1 second
const MIN_DELAY = 500
const MAX_DELAY = 10000

async function adaptiveRequest(requestFn: () => Promise<any>) {
  try {
    const result = await requestFn()
    // Success - reduce delay slightly
    currentDelay = Math.max(MIN_DELAY, currentDelay * 0.9)
    return result
  } catch (error) {
    if (error.status === 429) {
      // Rate limit - increase delay significantly
      currentDelay = Math.min(MAX_DELAY, currentDelay * 2)
      throw error
    }
    throw error
  } finally {
    await new Promise(resolve => setTimeout(resolve, currentDelay))
  }
}
```

---

### 9. **User Notification & Options**
Give users control and better information.

**Benefits:**
- Better user experience
- User can make informed decisions
- Reduces frustration

**Implementation:**
```typescript
// Show rate limit status
function showRateLimitInfo() {
  return (
    <div className="rate-limit-info">
      <p>API Rate Limit Status:</p>
      <p>Requests remaining: {remainingRequests}</p>
      <p>Reset in: {resetTime}</p>
      <button onClick={upgradePlan}>Upgrade Plan</button>
      <button onClick={tryLater}>Try Again Later</button>
    </div>
  )
}
```

---

### 10. **Combined Strategy** ⭐⭐⭐ Best Overall
Combine multiple approaches for maximum effectiveness.

**Recommended Combination:**
1. **Proactive throttling** (2s delay between requests)
2. **Request queuing** (sequential processing)
3. **Response caching** (avoid duplicates)
4. **Exponential backoff** (fallback for failures)
5. **User notifications** (transparency)

---

## Implementation Priority

### Quick Wins (Easy to implement):
1. ✅ Proactive throttling (add 2s delay)
2. ✅ Response caching (localStorage)
3. ✅ Request deduplication

### Medium Effort (Moderate complexity):
4. ⭐ Request queuing
5. ⭐ Adaptive rate limiting
6. ⭐ User notifications

### Advanced (Requires more work):
7. ⭐⭐ Backend rate limiting (Supabase function)
8. ⭐⭐ Multiple API key rotation
9. ⭐⭐ Request prioritization

---

## Recommended Next Steps

1. **Immediate:** Add proactive throttling (2s delay)
2. **Short-term:** Implement request queuing
3. **Long-term:** Add backend rate limiting with Redis/DB

---

## Code Examples

See `RATE_LIMIT_IMPLEMENTATIONS.md` for full code examples of each approach.

