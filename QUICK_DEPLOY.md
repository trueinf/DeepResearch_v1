# 🚀 Quick Deploy Guide - Fix Model Not Found Error

## ⚠️ Current Issue
- Error: "Model not found: gemini-1.5-pro" (404)
- **Cause:** Updated function code not deployed to Supabase yet
- **Fix:** Already applied in local code (fallback logic added)

## ✅ What Was Fixed
The `deep-Research-gemini` function now:
1. Tries `gemini-1.5-pro-latest` first
2. Falls back to `gemini-1.5-pro` if first fails
3. Automatically handles both model name formats

## 🚀 Deploy Now (Choose One Method)

### Method 1: Supabase CLI (Fastest)
```bash
# Make sure you're in the project root
cd C:\Users\karth\Downloads\askDepth_gemini\askDepth_gemini

# Deploy the fixed function
supabase functions deploy deep-Research-gemini
```

### Method 2: Supabase Dashboard (Manual)
1. Go to: https://supabase.com/dashboard
2. Select your project
3. Navigate to: **Edge Functions** → **deep-Research-gemini**
4. Click **"Edit Function"** or **"Deploy"**
5. Copy entire content from: `supabase/functions/deep-Research-gemini/index.ts`
6. Paste into the editor
7. Click **"Deploy"**

## ✅ After Deployment
1. **Wait 30-60 seconds** for deployment to complete
2. **Refresh your browser** (or restart the research)
3. **Test again** - the error should be gone!

## 🔍 Verify Deployment
After deploying, check Supabase logs:
1. Go to: **Edge Functions** → **deep-Research-gemini** → **Logs**
2. Look for: `Trying Gemini model: gemini-1.5-pro-latest`
3. Should see: `✅ Successfully using model: [model-name]`

## 📋 Other Functions to Deploy (Later)
These also need deployment but are less critical:
- `chat-Research`
- `clarify-Questions-gemini`
- `graph-entities`
- `build-research-graph`
- `extract-causal-relationships`
- `extract-trend-signals`
- `graph-relationships`
- `stream-research`

## 🆘 If Error Persists After Deployment
1. Check Supabase function logs for detailed error
2. Verify `GEMINI_API_KEY` is set in Supabase Secrets
3. Test your API key at: https://ai.google.dev/models
4. Check which models your API key has access to
