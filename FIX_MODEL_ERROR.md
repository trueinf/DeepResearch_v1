# 🔧 Fix "Model Not Found" Error - Step by Step

## 🔍 Why You're Getting This Error

The error shows:
- ✅ Function IS deployed (it's trying both model names)
- ❌ But BOTH model names are failing: `gemini-1.5-pro-latest` and `gemini-1.5-pro`

**This means your API key doesn't recognize these model names.**

## 🎯 Root Cause

Your Gemini API key might:
1. Use a different model name format
2. Not have access to these specific models
3. Need a different model identifier

## ✅ Solution: Find Which Models Work

### Step 1: Get Your API Key from Supabase

1. Go to: https://supabase.com/dashboard/project/vvrulvxeaejxhwnafwrq
2. Navigate to: **Settings** → **Edge Functions** → **Secrets**
3. Find: `GEMINI_API_KEY`
4. Copy the value

### Step 2: Test Your API Key

I've created a test script. Run it:

```bash
# Set your API key
$env:GEMINI_API_KEY="your_actual_api_key_here"

# Run the test
node test-gemini-models.js
```

This will:
- ✅ List ALL available models for your API key
- ✅ Test each model name
- ✅ Tell you which ones work
- ✅ Give you the exact model name to use

### Step 3: Update Code with Working Model

Once you know which model works, I'll update the code to use that exact model name.

## 🚀 Quick Fix (If You Know Your API Key)

If you want to test right now:

1. **Get your API key from Supabase Secrets**
2. **Test it manually:**
   ```bash
   # Replace YOUR_KEY with your actual key
   curl "https://generativelanguage.googleapis.com/v1beta/models?key=YOUR_KEY"
   ```
3. **Check the response** - it will list all available models

## 📋 Alternative: Check Google AI Studio

1. Go to: https://aistudio.google.com/
2. Check which models are available in your account
3. Note the exact model names shown there
4. Share them with me and I'll update the code

## 💡 Most Likely Solutions

Based on common issues:

1. **Try `gemini-pro` instead** (older, more widely available)
2. **Try `gemini-1.5-flash`** (faster, more available)
3. **Check if your API key needs activation** in Google Cloud Console

## 🆘 If Nothing Works

1. **Verify API key is valid:**
   - Go to Google AI Studio
   - Check if you can use models there
   - If not, regenerate your API key

2. **Check billing/quota:**
   - Ensure your Google Cloud account has billing enabled
   - Check if you've exceeded quota limits

3. **Try a different API key:**
   - Generate a new key from Google AI Studio
   - Update it in Supabase Secrets

---

**The test script (`test-gemini-models.js`) will tell us exactly which model names work with your API key!**

