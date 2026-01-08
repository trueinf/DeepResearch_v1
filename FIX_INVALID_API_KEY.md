# 🔑 Fix Invalid Gemini API Key Error

## Current Error
```
Failed to perform deep research: API key not valid... (tried models: gemini-2.5-flash)
```

## The Problem

Your **Gemini API key is invalid or expired**. The API is rejecting requests because the key is not valid.

## ✅ Solution: Update Your API Key

### Step 1: Get a New Gemini API Key

1. Go to **Google AI Studio**: https://aistudio.google.com/app/apikey
2. Sign in with your Google account
3. Click **"Create API Key"** or **"Get API Key"**
4. Copy the new API key (it will look like: `AIza...`)

### Step 2: Update in Supabase

1. Go to **Supabase Dashboard**
2. Navigate to: **Edge Functions → Secrets**
3. Find `GEMINI_API_KEY` in the list
4. Click **"Edit"** or **"Update"**
5. Paste your new API key
6. Click **"Save"**

**OR if it doesn't exist:**
1. Click **"Add secret"**
2. Name: `GEMINI_API_KEY`
3. Value: Paste your new API key
4. Click **"Save"**

### Step 3: Verify the Key Works

1. The key should start with `AIza`
2. It should be about 39 characters long
3. Make sure there are no extra spaces when copying

### Step 4: Test Again

1. **Refresh your browser** (hard refresh: Ctrl+Shift+R)
2. Start a new research
3. It should work now! ✅

## Common API Key Issues

### "API key not valid"
- **Cause**: Key is expired, revoked, or incorrect
- **Fix**: Get a new key from Google AI Studio

### "Invalid API key format"
- **Cause**: Key was copied incorrectly (extra spaces, missing characters)
- **Fix**: Copy the key again, make sure it's complete

### "API key has no quota"
- **Cause**: Key exists but has no credits/quota
- **Fix**: Check your Google Cloud billing/quota settings

### "API key not found"
- **Cause**: Key was deleted or never created
- **Fix**: Create a new key in Google AI Studio

## Quick Checklist

- [ ] Got new API key from https://aistudio.google.com/app/apikey
- [ ] Key starts with `AIza` and is ~39 characters
- [ ] Updated `GEMINI_API_KEY` in Supabase → Edge Functions → Secrets
- [ ] Saved the secret
- [ ] Refreshed browser and tested

## After Fixing

Once you update the API key:
1. ✅ Research generation should work
2. ✅ Storyboard generation should work
3. ✅ All Gemini-based features should work

The error message will now clearly indicate if it's an API key issue, making it easier to identify and fix! 🔑✅
