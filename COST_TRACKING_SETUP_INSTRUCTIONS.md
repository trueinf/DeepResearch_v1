# 🚀 Cost Tracking Setup Instructions

## ✅ Implementation Complete!

Cost tracking has been implemented for `deep-Research-gemini`. Here's how to set it up:

---

## Step 1: Create Database Table

1. Open **Supabase Dashboard** → **SQL Editor**
2. Copy and paste the contents of `supabase/migrations/create_token_usage_table.sql`
3. Click **Run** to execute the SQL
4. Verify the table was created: Go to **Table Editor** → Look for `token_usage` table

---

## Step 2: Set Supabase Environment Variables

The Edge Function needs these secrets:

1. Go to **Supabase Dashboard** → **Edge Functions** → **Settings** → **Secrets**
2. Ensure these are set:
   - `SUPABASE_URL` - Your Supabase project URL
   - `SUPABASE_SERVICE_ROLE_KEY` - Your service role key (found in Settings → API)

---

## Step 3: Deploy Updated Function

1. Copy the code from `supabase/functions/deep-Research-gemini/index.ts`
2. Go to **Supabase Dashboard** → **Edge Functions** → **deep-Research-gemini**
3. Paste the updated code
4. Click **Deploy**

---

## Step 4: Add CostDisplay Component to Frontend

### Option A: Add to ReportView

Edit `src/pages/ReportView.jsx`:

```jsx
import CostDisplay from '../components/CostDisplay'

// Inside the component, add:
<CostDisplay researchId={report.id} />
```

### Option B: Add to Dashboard

Edit `src/pages/Dashboard.jsx`:

```jsx
import CostDisplay from '../components/CostDisplay'

// Show cost for latest research or all researches
```

---

## Step 5: Test Cost Tracking

1. **Run a research query** in your app
2. **Check the console** for cost tracking logs:
   - Look for: `✅ Cost tracked: $X.XXXXXX for deep-Research-gemini`
3. **View costs in frontend**:
   - The CostDisplay component will show total cost, tokens, and breakdown
4. **Verify in database**:
   - Go to **Supabase Dashboard** → **Table Editor** → `token_usage`
   - You should see a new row with the API call details

---

## 📊 What Gets Tracked

For each API call, the system tracks:
- **Input tokens** - Tokens sent to the API
- **Output tokens** - Tokens received from the API
- **Total tokens** - Sum of input + output
- **Input cost** - Cost for input tokens
- **Output cost** - Cost for output tokens
- **Total cost** - Total cost in USD
- **Model used** - Which AI model (Gemini/Claude)
- **Function name** - Which Edge Function made the call
- **Research ID** - Links to the research
- **User ID** - Links to the user
- **Metadata** - Additional info (prompt length, response length, etc.)

---

## 💰 Cost Examples

### Small Query (Gemini Flash-Lite)
- Input: 1,000 tokens
- Output: 500 tokens
- **Cost**: ~$0.0002

### Large Report (Gemini Pro)
- Input: 10,000 tokens
- Output: 5,000 tokens
- **Cost**: ~$0.04

### Claude Research
- Input: 5,000 tokens
- Output: 2,000 tokens
- **Cost**: ~$0.05

---

## 🔍 Query Costs in Database

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

## ⚠️ Troubleshooting

### No costs being tracked?
1. Check Edge Function logs in Supabase Dashboard
2. Verify `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are set
3. Check console for error messages
4. Verify `token_usage` table exists

### Costs showing as $0.0000?
- This is normal for very small queries (< 100 tokens)
- Check the actual token counts in the database

### User ID is null?
- This is expected if the user is not authenticated
- Costs will still be tracked, just not linked to a user

---

## 🎯 Next Steps (Optional)

Add cost tracking to other functions:
- `clarify-Questions-gemini`
- `stream-research`
- `chat-Research`
- `build-research-graph`
- `generate-ppt-agent`
- `extract-trend-signals`
- `graph-entities`
- `graph-relationships`

Use the same pattern from `deep-Research-gemini` - copy the helper functions and add cost tracking after each API call.

---

## 📚 Files Created

1. ✅ `supabase/migrations/create_token_usage_table.sql` - Database schema
2. ✅ `supabase/functions/deep-Research-gemini/index.ts` - Updated with cost tracking
3. ✅ `src/components/CostDisplay.jsx` - Frontend component
4. ✅ `COST_TRACKING_GUIDE.md` - Complete reference guide
5. ✅ `COST_TRACKING_IMPLEMENTATION.md` - Step-by-step guide

---

## ✅ Checklist

- [ ] Database table created
- [ ] Supabase secrets configured
- [ ] Edge Function deployed
- [ ] CostDisplay component added to frontend
- [ ] Tested with a research query
- [ ] Verified costs in database

---

**You're all set!** Cost tracking is now active for `deep-Research-gemini`. 🎉

