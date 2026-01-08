# 💰 Cost Tracking & Pricing Guide

## Overview
This guide explains how to calculate and track the cost of each AI API call (Gemini, Claude) in your application.

---

## 📊 Current API Pricing (as of 2025)

### Gemini Models
| Model | Input (per 1M tokens) | Output (per 1M tokens) |
|-------|----------------------|------------------------|
| `gemini-2.0-flash-lite` | $0.075 | $0.30 |
| `gemini-1.5-pro-latest` | $1.25 | $5.00 |
| `gemini-1.5-flash` | $0.075 | $0.30 |

### Claude Models
| Model | Input (per 1M tokens) | Output (per 1M tokens) |
|-------|----------------------|------------------------|
| `claude-sonnet-4-20250514` | $3.00 | $15.00 |

---

## 🧮 Cost Calculation Formula

```typescript
// Cost = (Input Tokens / 1,000,000) × Input Price + (Output Tokens / 1,000,000) × Output Price

function calculateCost(
  model: string,
  inputTokens: number,
  outputTokens: number
): number {
  const PRICING = {
    'gemini-2.0-flash-lite': { input: 0.075, output: 0.30 },
    'gemini-1.5-pro-latest': { input: 1.25, output: 5.00 },
    'gemini-1.5-flash': { input: 0.075, output: 0.30 },
    'claude-sonnet-4-20250514': { input: 3.00, output: 15.00 },
  }

  const prices = PRICING[model] || PRICING['gemini-2.0-flash-lite']
  
  const inputCost = (inputTokens / 1_000_000) * prices.input
  const outputCost = (outputTokens / 1_000_000) * prices.output
  
  return inputCost + outputCost
}
```

---

## 📋 Database Schema

### Create `token_usage` Table

```sql
CREATE TABLE IF NOT EXISTS token_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  research_id UUID REFERENCES researches(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  function_name TEXT NOT NULL, -- e.g., 'deep-Research-gemini', 'build-research-graph'
  model TEXT NOT NULL, -- e.g., 'gemini-2.0-flash-lite'
  input_tokens INTEGER NOT NULL,
  output_tokens INTEGER NOT NULL,
  total_tokens INTEGER NOT NULL,
  input_cost_usd DECIMAL(10, 8) NOT NULL,
  output_cost_usd DECIMAL(10, 8) NOT NULL,
  total_cost_usd DECIMAL(10, 8) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  metadata JSONB -- Store additional info like prompt length, response length, etc.
);

-- Indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_token_usage_research_id ON token_usage(research_id);
CREATE INDEX IF NOT EXISTS idx_token_usage_user_id ON token_usage(user_id);
CREATE INDEX IF NOT EXISTS idx_token_usage_created_at ON token_usage(created_at);
CREATE INDEX IF NOT EXISTS idx_token_usage_function_name ON token_usage(function_name);
```

### Create `cost_summary` View (Optional)

```sql
CREATE OR REPLACE VIEW cost_summary AS
SELECT 
  research_id,
  user_id,
  function_name,
  model,
  SUM(input_tokens) as total_input_tokens,
  SUM(output_tokens) as total_output_tokens,
  SUM(total_tokens) as total_tokens,
  SUM(input_cost_usd) as total_input_cost,
  SUM(output_cost_usd) as total_output_cost,
  SUM(total_cost_usd) as total_cost_usd,
  COUNT(*) as api_calls_count,
  MIN(created_at) as first_call,
  MAX(created_at) as last_call
FROM token_usage
GROUP BY research_id, user_id, function_name, model;
```

---

## 🔧 Implementation Steps

### Step 1: Create Shared Cost Tracking Utility

Create `supabase/functions/_shared/costTracking.ts`:

```typescript
// @ts-ignore - Deno runtime
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
// @ts-ignore - Deno runtime
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

interface Pricing {
  input: number
  output: number
}

const PRICING: Record<string, Pricing> = {
  'gemini-2.0-flash-lite': { input: 0.075, output: 0.30 },
  'gemini-1.5-pro-latest': { input: 1.25, output: 5.00 },
  'gemini-1.5-flash': { input: 0.075, output: 0.30 },
  'claude-sonnet-4-20250514': { input: 3.00, output: 15.00 },
}

export function calculateCost(
  model: string,
  inputTokens: number,
  outputTokens: number
): { inputCost: number; outputCost: number; totalCost: number } {
  const prices = PRICING[model] || PRICING['gemini-2.0-flash-lite']
  
  const inputCost = (inputTokens / 1_000_000) * prices.input
  const outputCost = (outputTokens / 1_000_000) * prices.output
  const totalCost = inputCost + outputCost
  
  return {
    inputCost: Number(inputCost.toFixed(8)),
    outputCost: Number(outputCost.toFixed(8)),
    totalCost: Number(totalCost.toFixed(8))
  }
}

export async function saveTokenUsage(
  researchId: string | undefined,
  userId: string | undefined,
  functionName: string,
  model: string,
  inputTokens: number,
  outputTokens: number,
  metadata?: Record<string, any>
): Promise<void> {
  if (!researchId && !userId) {
    console.warn('⚠️ Token usage not saved: researchId and userId are missing')
    return
  }

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error('❌ Token usage not saved: Supabase credentials not configured')
    return
  }

  try {
    const { inputCost, outputCost, totalCost } = calculateCost(model, inputTokens, outputTokens)
    const totalTokens = inputTokens + outputTokens

    console.log(`💾 Saving token usage: ${inputTokens} input, ${outputTokens} output, $${totalCost.toFixed(6)}`)

    // @ts-ignore - Deno runtime supports URL imports
    const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2')
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    const { error } = await supabase
      .from('token_usage')
      .insert({
        research_id: researchId || null,
        user_id: userId || null,
        function_name: functionName,
        model: model,
        input_tokens: inputTokens,
        output_tokens: outputTokens,
        total_tokens: totalTokens,
        input_cost_usd: inputCost,
        output_cost_usd: outputCost,
        total_cost_usd: totalCost,
        metadata: metadata || {}
      })

    if (error) {
      console.error('❌ Error saving token usage:', error)
    } else {
      console.log('✅ Token usage saved successfully')
    }
  } catch (error) {
    console.error('❌ Error in saveTokenUsage:', error)
  }
}
```

### Step 2: Extract Token Counts from API Responses

#### For Gemini API:
```typescript
// Gemini API response structure
const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
  method: 'POST',
  headers: {
    'x-goog-api-key': GEMINI_API_KEY,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ contents: [...] })
})

const data = await response.json()

// Extract tokens from response
const inputTokens = data.usageMetadata?.promptTokenCount || 0
const outputTokens = data.usageMetadata?.candidatesTokenCount || 0
const totalTokens = data.usageMetadata?.totalTokenCount || 0

// Calculate and save cost
await saveTokenUsage(
  researchId,
  userId,
  'deep-Research-gemini',
  model,
  inputTokens,
  outputTokens,
  { prompt_length: researchPrompt.length, response_length: outputText.length }
)
```

#### For Claude API:
```typescript
// Claude API response structure
const response = await fetch('https://api.anthropic.com/v1/messages', {
  method: 'POST',
  headers: {
    'x-api-key': ANTHROPIC_API_KEY,
    'anthropic-version': '2023-06-01',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ model, messages: [...] })
})

const data = await response.json()

// Extract tokens from response
const inputTokens = data.usage?.input_tokens || 0
const outputTokens = data.usage?.output_tokens || 0

// Calculate and save cost
await saveTokenUsage(
  researchId,
  userId,
  'deep-Research-gemini',
  model,
  inputTokens,
  outputTokens,
  { prompt_length: researchPrompt.length, response_length: outputText.length }
)
```

---

## 📝 Implementation Examples

### Example 1: Add Cost Tracking to `deep-Research-gemini`

Add this after the API call:

```typescript
// After getting response from Gemini/Claude
const data = await response.json()

// Extract tokens
let inputTokens = 0
let outputTokens = 0

if (useGemini) {
  inputTokens = data.usageMetadata?.promptTokenCount || 0
  outputTokens = data.usageMetadata?.candidatesTokenCount || 0
} else {
  inputTokens = data.usage?.input_tokens || 0
  outputTokens = data.usage?.output_tokens || 0
}

// Save token usage
await saveTokenUsage(
  researchId,
  userId, // Extract from request headers if available
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

// Include cost in response
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

### Example 2: Add Cost Tracking to `build-research-graph`

```typescript
// After entity extraction
const entities = await extractEntities(report)
const entityResponse = await entityApiResponse.json()
const entityInputTokens = entityResponse.usageMetadata?.promptTokenCount || 0
const entityOutputTokens = entityResponse.usageMetadata?.candidatesTokenCount || 0

await saveTokenUsage(
  researchId,
  userId,
  'build-research-graph-entities',
  'gemini-2.0-flash-lite',
  entityInputTokens,
  entityOutputTokens
)

// After relationship extraction
const relationships = await extractRelationships(report, entities)
const relResponse = await relApiResponse.json()
const relInputTokens = relResponse.usageMetadata?.promptTokenCount || 0
const relOutputTokens = relResponse.usageMetadata?.candidatesTokenCount || 0

await saveTokenUsage(
  researchId,
  userId,
  'build-research-graph-relationships',
  'gemini-2.0-flash-lite',
  relInputTokens,
  relOutputTokens
)
```

---

## 📊 Frontend: Display Costs

### Create Cost Display Component

```jsx
// src/components/CostDisplay.jsx
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export default function CostDisplay({ researchId }) {
  const [costs, setCosts] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!researchId) return

    async function fetchCosts() {
      try {
        const { data, error } = await supabase
          .from('token_usage')
          .select('*')
          .eq('research_id', researchId)
          .order('created_at', { ascending: false })

        if (error) throw error

        const totalCost = data.reduce((sum, usage) => sum + parseFloat(usage.total_cost_usd), 0)
        const totalTokens = data.reduce((sum, usage) => sum + usage.total_tokens, 0)

        setCosts({
          totalCost,
          totalTokens,
          breakdown: data,
          callCount: data.length
        })
      } catch (error) {
        console.error('Error fetching costs:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchCosts()
  }, [researchId])

  if (loading) return <div>Loading costs...</div>
  if (!costs) return null

  return (
    <div className="bg-white rounded-lg border p-4">
      <h3 className="text-lg font-semibold mb-4">Cost Summary</h3>
      <div className="grid grid-cols-3 gap-4 mb-4">
        <div>
          <p className="text-sm text-gray-600">Total Cost</p>
          <p className="text-2xl font-bold text-blue-600">
            ${costs.totalCost.toFixed(4)}
          </p>
        </div>
        <div>
          <p className="text-sm text-gray-600">Total Tokens</p>
          <p className="text-2xl font-bold">
            {costs.totalTokens.toLocaleString()}
          </p>
        </div>
        <div>
          <p className="text-sm text-gray-600">API Calls</p>
          <p className="text-2xl font-bold">{costs.callCount}</p>
        </div>
      </div>

      <div className="mt-4">
        <h4 className="font-semibold mb-2">Breakdown</h4>
        <div className="space-y-2">
          {costs.breakdown.map((usage) => (
            <div key={usage.id} className="flex justify-between text-sm">
              <span>{usage.function_name}</span>
              <span className="font-medium">
                ${parseFloat(usage.total_cost_usd).toFixed(6)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
```

---

## 🔍 Query Examples

### Get Total Cost for a Research
```sql
SELECT 
  SUM(total_cost_usd) as total_cost,
  SUM(total_tokens) as total_tokens,
  COUNT(*) as api_calls
FROM token_usage
WHERE research_id = 'your-research-id';
```

### Get Cost by Function
```sql
SELECT 
  function_name,
  SUM(total_cost_usd) as cost,
  SUM(total_tokens) as tokens,
  COUNT(*) as calls
FROM token_usage
WHERE research_id = 'your-research-id'
GROUP BY function_name
ORDER BY cost DESC;
```

### Get Daily Cost Summary
```sql
SELECT 
  DATE(created_at) as date,
  SUM(total_cost_usd) as daily_cost,
  SUM(total_tokens) as daily_tokens,
  COUNT(*) as daily_calls
FROM token_usage
WHERE user_id = 'your-user-id'
GROUP BY DATE(created_at)
ORDER BY date DESC;
```

---

## ⚠️ Important Notes

1. **Token Counting**: Always extract tokens from API responses, don't estimate
2. **Pricing Updates**: Update pricing constants when API prices change
3. **User ID**: Extract user ID from Supabase auth token in Edge Functions
4. **Error Handling**: Don't fail the main request if cost tracking fails
5. **Privacy**: Consider GDPR/privacy implications of tracking usage

---

## 🚀 Quick Start Checklist

- [ ] Create `token_usage` table in Supabase
- [ ] Create `costTracking.ts` utility (or inline the functions)
- [ ] Add cost tracking to `deep-Research-gemini`
- [ ] Add cost tracking to `build-research-graph`
- [ ] Add cost tracking to `clarify-Questions-gemini`
- [ ] Add cost tracking to `stream-research`
- [ ] Add cost tracking to `chat-Research`
- [ ] Add cost tracking to `generate-ppt-agent`
- [ ] Add cost tracking to `extract-trend-signals`
- [ ] Add cost tracking to `extract-causal-relationships`
- [ ] Add cost tracking to `graph-entities`
- [ ] Add cost tracking to `graph-relationships`
- [ ] Create frontend cost display component
- [ ] Test cost tracking with sample requests

---

## 📚 Additional Resources

- [Gemini API Pricing](https://ai.google.dev/pricing)
- [Claude API Pricing](https://www.anthropic.com/pricing)
- [Supabase Database Docs](https://supabase.com/docs/guides/database)

