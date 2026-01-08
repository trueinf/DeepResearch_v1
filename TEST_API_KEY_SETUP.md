# ✅ Test API Key Setup

## 🔍 Verification Checklist

### 1. Supabase Secrets (Edge Functions)
**Location**: https://supabase.com/dashboard/project/vvrulvxeaejxhwnafwrq/functions → Secrets tab

- [ ] `GEMINI_API_KEY` is set
- [ ] Secret name is exactly `GEMINI_API_KEY` (case-sensitive)
- [ ] Value is your actual Gemini API key (starts with `AIza...`)
- [ ] Secret shows as "Active" or "Saved"

### 2. Frontend .env File
**Location**: `.env` in project root

- [ ] `VITE_SUPABASE_URL` is set (your Supabase project URL)
- [ ] `VITE_SUPABASE_ANON_KEY` is set (your Supabase anon key)
- [ ] **Note**: GEMINI_API_KEY should NOT be in .env (it's only for Supabase Secrets)

### 3. Functions Deployed
**Location**: https://supabase.com/dashboard/project/vvrulvxeaejxhwnafwrq/functions

- [ ] `deep-Research-gemini` is deployed
- [ ] `stream-research` is deployed
- [ ] `clarify-Questions-gemini` is deployed
- [ ] All functions show "Active" status

---

## 🧪 How to Test

### Test 1: Check Function Logs
1. Go to Supabase Dashboard → Edge Functions
2. Click on `deep-Research-gemini`
3. Click "Logs" tab
4. Start a research in your app
5. Check logs for:
   - ✅ `hasGeminiKey: true` (should be true)
   - ❌ `hasGeminiKey: false` (means key is missing)

### Test 2: Test in Browser
1. Open your app: http://localhost:5184
2. Open Browser Console (F12)
3. Start a research
4. Check for errors:
   - ✅ No "API key error" = Working!
   - ❌ "API key error" = Key not set correctly

### Test 3: Direct API Test
1. Go to: https://aistudio.google.com/app/apikey
2. Verify your API key is active
3. Test the key works (should show as valid)

---

## 🐛 Common Issues

### Issue: "API key error" still appears
**Possible causes:**
1. Secret name is wrong (must be exactly `GEMINI_API_KEY`)
2. Function not redeployed after setting secret
3. Secret value has extra spaces or characters
4. Wrong Supabase project

**Fix:**
1. Verify secret name is exactly `GEMINI_API_KEY`
2. Redeploy the function after setting secret
3. Check secret value (no spaces, correct key)
4. Verify you're in the correct Supabase project

### Issue: Function logs show `hasGeminiKey: false`
**Fix:**
1. Go to Secrets tab
2. Delete and recreate `GEMINI_API_KEY` secret
3. Make sure value is correct
4. Redeploy function
5. Wait 30 seconds and test again

---

## ✅ Success Indicators

When everything is working:
- ✅ No "API key error" in browser
- ✅ Research completes successfully
- ✅ Function logs show `hasGeminiKey: true`
- ✅ API calls to Gemini succeed

---

## 📋 Quick Test Command

After setting up, test by:
1. Starting a research in your app
2. Checking browser console for errors
3. Checking Supabase function logs
4. Verifying research completes

