# Debug "Model Not Found" Error

## ✅ Enhanced Logging Added

I've added comprehensive logging to help identify the exact issue:

### Frontend Logs (Browser Console - F12)
- `=== SENDING RESEARCH REQUEST ===`
- Shows: Model being sent, Research ID, Model type

### Backend Logs (Supabase Edge Function Logs)
- `=== DEEP RESEARCH REQUEST ===`
- Shows: Request body, Model received, API keys available
- `=== GEMINI API CALL ===`
- Shows: Exact model name, API key status, Full endpoint URL

## 🔍 How to Debug

### Step 1: Check Browser Console
1. Open browser console (F12)
2. Start a research
3. Look for: `=== SENDING RESEARCH REQUEST ===`
4. Check: `Model being sent:` - should show `gemini-3.0-pro-preview` or `gemini-1.5-pro-latest`

### Step 2: Check Supabase Function Logs
1. Go to: https://supabase.com/dashboard/project/vvrulvxeaejxhwnafwrq/functions/deep-Research-gemini
2. Click "Logs" tab
3. Look for:
   - `=== DEEP RESEARCH REQUEST ===`
   - `Model selection (STRICT):`
   - `=== GEMINI API CALL ===`
   - `Using Gemini model:`

### Step 3: Verify API Key
In the logs, check:
- `hasGeminiKey: true` (should be true)
- `API Key length:` (should be > 0, typically 39 characters for Gemini)

### Step 4: Verify Model Name
In the logs, check:
- `Using Gemini model:` should show a valid model name like:
  - `gemini-3.0-pro-preview`
  - `gemini-1.5-pro-latest`
  - `gemini-1.5-flash-latest`

## 🚨 Common Issues & Fixes

### Issue 1: Model is `undefined`
**Log shows**: `Model being sent: undefined`
**Fix**: Check that `research?.model` or `location.state?.model` has a value

### Issue 2: API Key is `undefined`
**Log shows**: `hasGeminiKey: false` or `API Key length: 0`
**Fix**: 
1. Go to Supabase Dashboard → Edge Functions → Secrets
2. Verify `GEMINI_API_KEY` exists and has a value
3. Check the key starts with `AIza...` (Gemini keys start with this)

### Issue 3: Wrong Model Name Format
**Log shows**: `Using Gemini model: gemini-3-pro` (wrong format)
**Fix**: Should be exactly:
- `gemini-3.0-pro-preview` (with dots and dashes)
- `gemini-1.5-pro-latest`
- NOT `gemini-3-pro` or `gemini-3.5-pro`

### Issue 4: Model Not Available (404)
**Log shows**: `404` error from Gemini API
**Fix**: The code automatically falls back to `gemini-1.5-pro-latest` if Gemini 3 Pro is not available

## ✅ Valid Gemini Model Names

These are the EXACT model names that work:

1. **gemini-1.5-pro-latest** ✅ (Most reliable)
2. **gemini-1.5-flash-latest** ✅ (Faster)
3. **gemini-3.0-pro-preview** ⚠️ (May not be available in all regions)

## 🔧 Quick Test

After deploying the updated function:

1. **Start a research** with "Gemini 3 Pro" selected
2. **Check browser console** - should see model name
3. **Check Supabase logs** - should see API key status
4. **If 404 error** - it will auto-fallback to Gemini 1.5 Pro

## 📋 Checklist

- [ ] API key set in Supabase secrets
- [ ] Function deployed with latest code
- [ ] Browser console shows model name
- [ ] Supabase logs show API key is available
- [ ] Model name format is correct

