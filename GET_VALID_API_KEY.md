# 🔑 How to Get a Valid Gemini API Key

## ❌ Current Issue
Your API key is returning **400 (Bad Request)** errors, which means:
- The key is **invalid** or **incomplete**
- The key format is wrong
- The key may have been truncated when copied

## ✅ Solution: Get a New API Key

### Step 1: Go to Google AI Studio
1. Visit: **https://aistudio.google.com/app/apikey**
2. Sign in with your Google account

### Step 2: Create API Key
1. Click **"Create API Key"** or **"Get API Key"**
2. Select your Google Cloud project (or create a new one)
3. Click **"Create API key in new project"** or select existing project
4. **Copy the ENTIRE key** (it should be ~39 characters)

### Step 3: Verify Key Format
Valid Gemini API keys:
- ✅ Usually start with `AIza...`
- ✅ Are approximately **39 characters long**
- ✅ Look like: `AIzaSy...` (example format - get your actual key from https://aistudio.google.com/app/apikey)

### Step 4: Update in Supabase
1. Go to: **https://supabase.com/dashboard/project/vvrulvxeaejxhwnafwrq**
2. Navigate to: **Settings** → **Edge Functions** → **Secrets**
3. Find or create: `GEMINI_API_KEY`
4. Paste your **complete** API key
5. Click **Save**

### Step 5: Test the Key
After updating, run:
```bash
$env:GEMINI_API_KEY="your_complete_key_here"
node test-gemini-models.js
```

## 🔍 Troubleshooting

### If you get "API key not enabled"
1. Go to: **https://console.cloud.google.com/**
2. Navigate to: **APIs & Services** → **Library**
3. Search for: **"Generative Language API"**
4. Click **Enable**

### If you get "Billing required"
1. Go to: **Google Cloud Console**
2. Navigate to: **Billing**
3. Link a billing account (free tier available)

### If key still doesn't work
1. **Regenerate** the key in Google AI Studio
2. Make sure you copy the **entire key** (no spaces, no line breaks)
3. Update in Supabase Secrets
4. Wait 1-2 minutes for changes to propagate

## ⚠️ Security Note
- **Never share your API key publicly**
- **Don't commit keys to Git**
- **Use Supabase Secrets** for storage
- **Regenerate if exposed**

## 📋 Quick Checklist
- [ ] Got API key from https://aistudio.google.com/app/apikey
- [ ] Key is ~39 characters long
- [ ] Key starts with `AIza...`
- [ ] Updated in Supabase Secrets
- [ ] Tested with `test-gemini-models.js`
- [ ] Models are working

---

**Once you have a valid key, the "Model not found" error will be resolved!**

