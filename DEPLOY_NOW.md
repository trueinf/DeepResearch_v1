# 🚀 Quick Deploy to Fix "Model Not Found" Error

## ✅ The Fix is Ready!

The code has been updated with fallback logic:
- Tries `gemini-2.5-pro` first
- Falls back to `gemini-pro-latest` if not available
- Max 2 API calls (50% reduction)

## 📋 Deploy Steps

### 1. Deploy the Function

```bash
supabase functions deploy deep-Research-gemini
```

### 2. Verify Deployment

After deployment, check Supabase logs:
- Go to: Supabase Dashboard → Edge Functions → deep-Research-gemini → Logs
- Look for: "Using Gemini model: gemini-2.5-pro (attempt 1/2)"

### 3. Test Again

Try starting a new research. The function will:
1. Try `gemini-2.5-pro` first
2. If 404, automatically try `gemini-pro-latest`
3. Show available models in error if both fail

## 🔍 If Error Persists

### Check API Key

1. Go to: Supabase Dashboard → Settings → Edge Functions → Secrets
2. Verify `GEMINI_API_KEY` is set
3. Ensure it's a valid Gemini API key (starts with `AIza...`)

### Test Which Models Work

```powershell
# Set your API key
$env:GEMINI_API_KEY="your_actual_api_key_here"

# Test models
node test-gemini-models.js
```

This will show which models are available for your API key.

## 💡 Expected Behavior After Deploy

- ✅ Tries `gemini-2.5-pro` first
- ✅ Falls back to `gemini-pro-latest` if needed
- ✅ Shows available models in error message if both fail
- ✅ Much fewer API calls (max 2 instead of 4)
