# ✅ Test Storyboard Generation - Quick Checklist

## After Updating the Function

### Step 1: Verify Deployment ✅
- [ ] Function is **deployed** (not just saved)
- [ ] Status shows "Active" or "Deployed"
- [ ] No deployment errors in the logs

### Step 2: Verify API Key ✅
- [ ] Go to **Edge Functions → Secrets**
- [ ] Check `GEMINI_API_KEY` exists
- [ ] Verify it's correct (not expired/invalid)

### Step 3: Test in Supabase Dashboard
1. Go to **Edge Functions → `generate-storyboard` → Invoke** tab
2. Use this test payload:
```json
{
  "report": {
    "topic": "Test Research",
    "executiveSummary": "This is a test summary for storyboard generation.",
    "keyFindings": [
      {"text": "Finding 1: Important discovery", "citations": [1]},
      {"text": "Finding 2: Significant insight", "citations": [2]}
    ],
    "detailedAnalysis": "Detailed analysis content here.",
    "insights": "Key insights from research.",
    "conclusion": "Research conclusion."
  },
  "storySpine": "problem-insight-resolution",
  "audience": "general"
}
```
3. Click **"Invoke"**
4. Check response:
   - ✅ `status: 'success'` → Function works!
   - ❌ `status: 'error'` → Check the `error` field for details

### Step 4: Test from Frontend
1. **Refresh your browser** (hard refresh: Ctrl+Shift+R / Cmd+Shift+R)
2. Go to a research report
3. Click **"Generate Storyboard"** button
4. **Check browser console** (F12 → Console):
   - Look for: `Starting storyboard generation...`
   - Look for: `Storyboard API response:`
   - Check for any errors

### Step 5: Check Function Logs
1. Go to **Edge Functions → `generate-storyboard` → Logs**
2. Look for:
   - `Calling Gemini API for storyboard generation`
   - `Prompt length: X characters`
   - `Trying Gemini model: ...`
   - `Successfully using model: ...` OR error messages
   - `Storyboard generated successfully:` OR error details

## What Should Happen Now

With the updated code, the function will:
1. ✅ Try multiple Gemini models automatically (`gemini-1.5-pro-latest`, `gemini-1.5-pro`, `gemini-pro`)
2. ✅ Skip `responseMimeType` for older models that don't support it
3. ✅ Try next model if one returns 400 or 404
4. ✅ Show detailed error messages if all models fail

## Common Issues & Quick Fixes

### "GEMINI_API_KEY secret not configured"
→ Add API key in **Edge Functions → Secrets**

### "No available Gemini model found"
→ Check your API key has access to Gemini models
→ Try getting a new API key from https://aistudio.google.com/app/apikey

### "Invalid request to Gemini API"
→ Check function logs for the actual error
→ May need to reduce prompt size or adjust parameters

### Still getting CORS error
→ Function might not be deployed
→ Check deployment status in Supabase Dashboard

## Success Indicators ✅

You'll know it's working when:
- ✅ No CORS errors in browser console
- ✅ Function logs show "Successfully using model: ..."
- ✅ Function logs show "Storyboard generated successfully"
- ✅ Browser shows storyboard modal with content
- ✅ No error messages in console

## If It Still Doesn't Work

1. **Check browser console** - Look for the detailed error message
2. **Check Supabase function logs** - See which model was tried and what error occurred
3. **Test with the Invoke tab** - This helps isolate if it's a frontend or backend issue
4. **Share the error message** - The improved error handling will show the exact issue

The code should work now! The improvements handle model availability issues and provide better error messages. 🚀
