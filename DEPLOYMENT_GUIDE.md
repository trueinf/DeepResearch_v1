# Deployment Guide - Standardized to Gemini 1.5 Pro

## 📋 Functions That Need Deployment

### Updated Functions (9 total):

1. **deep-Research-gemini** ⭐ **MAIN FUNCTION** (HIGH PRIORITY)
   - Changed: Simplified to use only `gemini-1.5-pro`
   - Removed: Complex fallback logic
   - Location: `supabase/functions/deep-Research-gemini/index.ts`

2. **chat-Research**
   - Changed: `gemini-2.0-flash-lite` → `gemini-1.5-pro`
   - Location: `supabase/functions/chat-Research/index.ts`

3. **clarify-Questions-gemini**
   - Changed: `gemini-2.0-flash-lite` → `gemini-1.5-pro`
   - Location: `supabase/functions/clarify-Questions-gemini/index.ts`

4. **graph-entities**
   - Changed: `gemini-2.0-flash-lite` → `gemini-1.5-pro`
   - Location: `supabase/functions/graph-entities/index.ts`

5. **build-research-graph**
   - Changed: `gemini-2.0-flash-lite` → `gemini-1.5-pro`
   - Location: `supabase/functions/build-research-graph/index.ts`

6. **extract-causal-relationships**
   - Changed: `gemini-2.0-flash-lite` → `gemini-1.5-pro`
   - Location: `supabase/functions/extract-causal-relationships/index.ts`

7. **extract-trend-signals**
   - Changed: `gemini-2.0-flash-lite` → `gemini-1.5-pro`
   - Location: `supabase/functions/extract-trend-signals/index.ts`

8. **graph-relationships**
   - Changed: `gemini-2.0-flash-lite` → `gemini-1.5-pro`
   - Location: `supabase/functions/graph-relationships/index.ts`

9. **stream-research**
   - Changed: `gemini-1.5-pro-latest` → `gemini-1.5-pro`
   - Location: `supabase/functions/stream-research/index.ts`

## 🚀 Deployment Methods

### Method 1: Deploy All Functions (Recommended)

**Using Supabase CLI:**
```bash
# Deploy all functions at once
supabase functions deploy deep-Research-gemini
supabase functions deploy chat-Research
supabase functions deploy clarify-Questions-gemini
supabase functions deploy graph-entities
supabase functions deploy build-research-graph
supabase functions deploy extract-causal-relationships
supabase functions deploy extract-trend-signals
supabase functions deploy graph-relationships
supabase functions deploy stream-research
```

**Or deploy all in one command:**
```bash
supabase functions deploy deep-Research-gemini chat-Research clarify-Questions-gemini graph-entities build-research-graph extract-causal-relationships extract-trend-signals graph-relationships stream-research
```

### Method 2: Deploy via Supabase Dashboard

1. Go to **Supabase Dashboard** → **Edge Functions**
2. For each function:
   - Click on the function name
   - Click **"Edit Function"** or **"Deploy"**
   - Copy the entire content from the corresponding `index.ts` file
   - Paste and click **"Deploy"**

### Method 3: Priority Deployment (If Limited Time)

**Deploy these first (most critical):**
1. `deep-Research-gemini` - Core research functionality
2. `clarify-Questions-gemini` - Question clarification
3. `chat-Research` - Chat functionality

**Then deploy the rest:**
4. `graph-entities`
5. `build-research-graph`
6. `extract-causal-relationships`
7. `extract-trend-signals`
8. `graph-relationships`
9. `stream-research`

## ✅ Verification Steps

After deployment:

1. **Test Main Research:**
   - Start a new research
   - Check Supabase logs for model usage
   - Verify it uses `gemini-1.5-pro`

2. **Check Function Logs:**
   - Go to Supabase Dashboard → Edge Functions → Logs
   - Look for: `Using Gemini model: gemini-1.5-pro`

3. **Test Other Features:**
   - Clarifying questions
   - Chat functionality
   - Graph features (if used)

## 🔍 What Changed

### Before:
- Multiple models: `gemini-3.0-pro-preview`, `gemini-2.0-flash-lite`, `gemini-1.5-pro-latest`
- Complex fallback logic
- Inconsistent model usage

### After:
- **ONE model everywhere:** `gemini-1.5-pro`
- Simplified code
- Consistent behavior
- No more "model not found" errors

## 📝 Notes

- **Frontend changes** don't need deployment (they're in your React app)
- Only **Edge Functions** need to be deployed to Supabase
- Make sure your **GEMINI_API_KEY** is set in Supabase Secrets
- The model `gemini-1.5-pro` should be available globally

## 🆘 Troubleshooting

If you get "Model not found" errors:
1. Verify `GEMINI_API_KEY` is set in Supabase Secrets
2. Check that the function was deployed successfully
3. Verify the model name is exactly `gemini-1.5-pro` (not `gemini-1.5-pro-latest`)
4. Check Supabase function logs for detailed error messages
