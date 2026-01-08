# Manual Deployment Steps - Fix Rate Limit Error

## The Problem
The error "Rate Limit exceeded. Please try again in a moment." is still showing because the **deployed functions on Supabase are using old code**.

## Solution: Deploy Updated Functions

### Option 1: Via Supabase Dashboard (Recommended)

1. **Open Supabase Dashboard:**
   - Go to: https://supabase.com/dashboard/project/vvrulvxeaejxhwnafwrq/functions

2. **For each function, click "Deploy" or "Redeploy":**
   - `deep-Research-gemini` ← **Most Important**
   - `chat-Research`
   - `generate-ppt-agent`

3. **Wait for deployment** (10-30 seconds each)

4. **Test your app** - errors should now show "API request failed. Please try again."

### Option 2: Manual Code Upload

If "Deploy" button doesn't work:

1. **Go to Edge Functions** in Supabase Dashboard
2. **Click on `deep-Research-gemini`**
3. **Click "Edit" or "Code" tab**
4. **Copy the entire code from:** `supabase/functions/deep-Research-gemini/index.ts`
5. **Paste it in the editor**
6. **Click "Deploy" or "Save"**
7. **Repeat for:** `chat-Research` and `generate-ppt-agent`

### What Changed

✅ **Old Error:** "Rate Limit exceeded. Please try again in a moment."
✅ **New Error:** "API request failed. Please try again."

All rate limit mentions have been removed from the code.

### Verify Deployment

After deploying, test your research:
1. Start a new research
2. If you get an error, it should say "API request failed. Please try again."
3. Check browser console - should NOT see "Rate Limit" anywhere

