# 🛠️ Step-by-Step Cost Tracking Implementation

## Quick Implementation Guide

### Step 1: Create Database Table

Run this SQL in Supabase SQL Editor:

```sql
CREATE TABLE IF NOT EXISTS token_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  research_id UUID REFERENCES researches(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  function_name TEXT NOT NULL,
  model TEXT NOT NULL,
  input_tokens INTEGER NOT NULL,
  output_tokens INTEGER NOT NULL,
  total_tokens INTEGER NOT NULL,
  input_cost_usd DECIMAL(10, 8) NOT NULL,
  output_cost_usd DECIMAL(10, 8) NOT NULL,
  total_cost_usd DECIMAL(10, 8) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  metadata JSONB
);

CREATE INDEX IF NOT EXISTS idx_token_usage_research_id ON token_usage(research_id);
CREATE INDEX IF NOT EXISTS idx_token_usage_user_id ON token_usage(user_id);
```

### Step 2: Add Cost Tracking Helper Functions

Since Supabase Edge Functions don't support `_shared` imports, **inline** these functions in each Edge Function:

```typescript
// Add this at the top of each Edge Function file

const PRICING: Record<string, { input: number; output: number }> = {
  'gemini-2.0-flash-lite': { input: 0.075, output: 0.30 },
  'gemini-1.5-pro-latest': { input: 1.25, output: 5.00 },
  'claude-sonnet-4-20250514': { input: 3.00, output: 15.00 },
}

function calculateCost(
  model: string,
  inputTokens: number,
  outputTokens: number
): { inputCost: number; outputCost: number; totalCost: number } {
  const prices = PRICING[model] || PRICING['gemini-2.0-flash-lite']
  const inputCost = (inputTokens / 1_000_000) * prices.input
  const outputCost = (outputTokens / 1_000_000) * prices.output
  return {
    inputCost: Number(inputCost.toFixed(8)),
    outputCost: Number(outputCost.toFixed(8)),
    totalCost: Number((inputCost + outputCost).toFixed(8))
  }
}

async function saveTokenUsage(
  researchId: string | undefined,
  userId: string | undefined,
  functionName: string,
  model: string,
  inputTokens: number,
  outputTokens: number,
  metadata?: Record<string, any>
): Promise<void> {
  const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
  const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.warn('⚠️ Cost tracking disabled: Supabase credentials not configured')
    return
  }

  try {
    const { inputCost, outputCost, totalCost } = calculateCost(model, inputTokens, outputTokens)
    
    const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2')
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    await supabase.from('token_usage').insert({
      research_id: researchId || null,
      user_id: userId || null,
      function_name: functionName,
      model: model,
      input_tokens: inputTokens,
      output_tokens: outputTokens,
      total_tokens: inputTokens + outputTokens,
      input_cost_usd: inputCost,
      output_cost_usd: outputCost,
      total_cost_usd: totalCost,
      metadata: metadata || {}
    })

    console.log(`✅ Cost tracked: $${totalCost.toFixed(6)} for ${functionName}`)
  } catch (error) {
    console.error('❌ Error saving token usage:', error)
    // Don't throw - cost tracking failure shouldn't break the main function
  }
}
```

### Step 3: Extract User ID from Request

Add this helper to extract user ID from Supabase auth token:

```typescript
async function getUserIdFromRequest(req: Request): Promise<string | undefined> {
  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) return undefined

    const token = authHeader.replace('Bearer ', '')
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
    const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY') || Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return undefined

    const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2')
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

    const { data: { user }, error } = await supabase.auth.getUser(token)
    if (error || !user) return undefined

    return user.id
  } catch (error) {
    console.error('Error extracting user ID:', error)
    return undefined
  }
}
```

### Step 4: Add to Each Function

**Example for `deep-Research-gemini/index.ts`:**

```typescript
// After API call and getting response
const data = await response.json()

// Extract tokens based on API type
let inputTokens = 0
let outputTokens = 0

if (useGemini) {
  // Gemini API
  inputTokens = data.usageMetadata?.promptTokenCount || 0
  outputTokens = data.usageMetadata?.candidatesTokenCount || 0
} else {
  // Claude API
  inputTokens = data.usage?.input_tokens || 0
  outputTokens = data.usage?.output_tokens || 0
}

// Extract user ID
const userId = await getUserIdFromRequest(req)

// Save cost tracking
await saveTokenUsage(
  researchId,
  userId,
  'deep-Research-gemini',
  selectedModel,
  inputTokens,
  outputTokens,
  {
    original_query: originalQuery,
    prompt_length: researchPrompt.length,
    response_length: outputText.length
  }
)

// Include in response (optional)
return new Response(
  JSON.stringify({
    success: true,
    report: outputText,
    usage: {
      inputTokens,
      outputTokens,
      totalTokens: inputTokens + outputTokens,
      cost: calculateCost(selectedModel, inputTokens, outputTokens).totalCost
    }
  }),
  { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
)
```

---

## 📋 Functions to Update

Add cost tracking to these functions:

1. ✅ `deep-Research-gemini` - Main research function
2. ✅ `clarify-Questions-gemini` - Question generation
3. ✅ `stream-research` - Streaming responses
4. ✅ `chat-Research` - Follow-up chat
5. ✅ `build-research-graph` - Graph building (2 API calls: entities + relationships)
6. ✅ `generate-ppt-agent` - PPT generation
7. ✅ `extract-trend-signals` - Trend extraction
8. ✅ `extract-causal-relationships` - Causal extraction
9. ✅ `graph-entities` - Entity extraction
10. ✅ `graph-relationships` - Relationship extraction

---

## 💡 Cost Calculation Examples

### Example 1: Small Research Query
- Model: `gemini-2.0-flash-lite`
- Input: 1,000 tokens
- Output: 500 tokens
- **Cost**: (1,000/1M × $0.075) + (500/1M × $0.30) = **$0.000225** (~$0.0002)

### Example 2: Large Research Report
- Model: `gemini-1.5-pro-latest`
- Input: 10,000 tokens
- Output: 5,000 tokens
- **Cost**: (10,000/1M × $1.25) + (5,000/1M × $5.00) = **$0.0375** (~$0.04)

### Example 3: Claude Research
- Model: `claude-sonnet-4-20250514`
- Input: 5,000 tokens
- Output: 2,000 tokens
- **Cost**: (5,000/1M × $3.00) + (2,000/1M × $15.00) = **$0.045** (~$0.05)

---

## 🎯 Next Steps

1. **Create the database table** (Step 1)
2. **Add helper functions** to one function first (test it)
3. **Add to all functions** one by one
4. **Create frontend component** to display costs
5. **Test with real API calls** and verify costs are tracked

---

## ⚠️ Important Reminders

- **Don't break existing functionality** - Cost tracking should be non-blocking
- **Handle errors gracefully** - If cost tracking fails, the main function should still work
- **Update pricing** when API prices change
- **Test thoroughly** with real API calls to verify token counts match

