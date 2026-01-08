# Fix Deep Research 400 Error

## Current Issue

The deep research function is getting a **400 Bad Request** error when using `gemini-2.5-flash` model. The function was stopping on 400 errors instead of trying fallback models.

## What I Fixed

### 1. Added 400 Error Fallback
- Now tries the next model if one returns 400 (not just 404)
- Similar to the storyboard function fix

### 2. Improved Error Messages
- Extracts actual error message from Gemini API response
- Shows which models were tried
- Includes API error details

### 3. Better Error Logging
- Logs the actual API error response
- Shows model attempt numbers
- Includes full error details

## Next Steps

### 1. Redeploy the Function
1. Go to **Supabase Dashboard → Edge Functions → `deep-Research-gemini`**
2. Copy the updated code from `supabase/functions/deep-Research-gemini/index.ts`
3. Paste into Supabase editor
4. Click **"Deploy"**
5. Wait for deployment (30-60 seconds)

### 2. Test Again
1. **Refresh your browser** (hard refresh: Ctrl+Shift+R)
2. Start a new research
3. The function will now:
   - Try `gemini-2.5-flash` first
   - If it gets 400, automatically try `gemini-2.5-pro`
   - Then try `gemini-pro-latest`
   - Then try `gemini-flash-latest`
   - Then try `gemini-2.5-flash-lite`

### 3. Check Logs
After testing, check **Supabase function logs** to see:
- Which model was tried
- What error occurred
- Which model eventually worked (if any)

## Expected Behavior

With the fix, the function will:
- ✅ Try multiple models automatically
- ✅ Show detailed error messages if all models fail
- ✅ Work even if `gemini-2.5-flash` has issues

## Common Causes of 400 Errors

1. **Model not available** - The model name might not be correct for your API key
2. **Request too large** - Prompt might exceed token limits
3. **Invalid parameters** - Some parameters might not be supported
4. **API key limitations** - Your API key might not have access to that model

The fallback logic should handle most of these automatically now!

## If Still Getting Errors

Check the browser console for:
- `Deep research API response:` - Shows the full response
- `Deep research API returned error:` - Shows error details
- Look for the `details` object which contains the actual API error

The improved error handling will show exactly what went wrong! 🚀
