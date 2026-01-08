# Debug Storyboard Generation Error

## Current Error
```
Storyboard generation error: Error: Failed to generate storyboard. Please try again.
```

## What This Means

The function is deployed (no CORS error), but something is going wrong during generation. This could be:

1. **Gemini API Key Missing** - Most common issue
2. **Gemini API Error** - Rate limit, quota, or API issue
3. **JSON Parse Error** - AI returned invalid JSON
4. **Validation Error** - AI response missing required fields
5. **Timeout** - Request took too long

## How to Debug

### Step 1: Check Browser Console
1. Open browser DevTools (F12)
2. Go to Console tab
3. Look for:
   - `Starting storyboard generation...` - Shows request started
   - `Storyboard API response:` - Shows what the function returned
   - Any error messages with details

### Step 2: Check Supabase Function Logs
1. Go to Supabase Dashboard
2. Navigate to: Edge Functions → `generate-storyboard`
3. Click "Logs" tab
4. Look for:
   - `Calling Gemini API for storyboard generation` - Function started
   - `Gemini API error:` - API call failed
   - `JSON parse error:` - Response parsing failed
   - `Validation error:` - Response structure invalid
   - `Storyboard generated successfully:` - Success!

### Step 3: Verify API Key
1. Go to Supabase Dashboard → Edge Functions → Secrets
2. Check if `GEMINI_API_KEY` exists
3. Verify it's correct (get new key from https://aistudio.google.com/app/apikey if needed)

### Step 4: Test Function Directly
1. In Supabase Dashboard → `generate-storyboard` → "Invoke" tab
2. Use this test payload:
```json
{
  "report": {
    "topic": "Test Research Topic",
    "executiveSummary": "This is a test executive summary for storyboard generation.",
    "keyFindings": [
      {"text": "Finding 1: This is an important finding", "citations": [1]},
      {"text": "Finding 2: Another significant finding", "citations": [2]}
    ],
    "detailedAnalysis": "This is a detailed analysis section with more information.",
    "insights": "Key insights from the research.",
    "conclusion": "Conclusion of the research."
  },
  "storySpine": "problem-insight-resolution",
  "audience": "general"
}
```
3. Click "Invoke"
4. Check the response:
   - If `status: 'error'` → Check the `error` field
   - If `status: 'success'` → Function works, issue is in frontend

## Common Error Messages and Fixes

### "GEMINI_API_KEY secret not configured"
**Fix:** Add API key in Supabase Dashboard → Edge Functions → Secrets

### "Invalid Gemini API key"
**Fix:** 
1. Get new API key from https://aistudio.google.com/app/apikey
2. Update secret in Supabase
3. Redeploy function

### "Failed to parse storyboard response"
**Fix:** 
- AI returned invalid JSON
- Check function logs for the actual response
- Try again (may be temporary)

### "Invalid response: controlling insight missing"
**Fix:**
- AI didn't follow the format
- Check function logs for response structure
- Try with a simpler research report

### "API server error"
**Fix:**
- Gemini API is down or having issues
- Wait a few minutes and try again
- Check https://status.cloud.google.com/

## Next Steps

1. **Check the browser console** - Look for detailed error messages
2. **Check Supabase function logs** - See what the function is doing
3. **Verify API key** - Make sure it's set correctly
4. **Try test payload** - Test function directly in Supabase

The improved error handling will now show more specific error messages to help identify the exact issue.
