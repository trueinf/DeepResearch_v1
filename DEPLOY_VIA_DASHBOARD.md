# Deploy Edge Functions via Supabase Dashboard

## Quick Steps:

1. **Go to Supabase Dashboard:**
   - Open: https://supabase.com/dashboard/project/vvrulvxeaejxhwnafwrq/functions

2. **Deploy each function:**
   - Find `deep-Research-gemini` → Click **"Deploy"** or **"Redeploy"**
   - Find `chat-Research` → Click **"Deploy"** or **"Redeploy"**
   - Find `generate-ppt-agent` → Click **"Deploy"** or **"Redeploy"**

3. **Wait for deployment to complete** (usually 10-30 seconds per function)

4. **Test your application** - the rate limit errors should now show generic messages

## What Changed:

All functions now return generic error messages:
- ❌ Old: "Rate limit exceeded. Please try again in a moment."
- ✅ New: "API request failed. Please try again."

## Alternative: Manual Upload

If the dashboard doesn't have a deploy button, you can:
1. Go to Edge Functions
2. Click on each function name
3. Click "Edit" or "Upload"
4. Copy the code from your local files and paste/upload
