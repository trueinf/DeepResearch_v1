# 🔧 Fix All Errors - Complete Guide

## ❌ Current Errors:
1. **"GEMINI_API_KEY secret not configured"** - Functions can't access API key
2. **500 Internal Server Error** - From `clarify-Questions-gemini` and `deep-Research-gemini`
3. **"Failed to fetch"** - From `stream-research` (CORS/404)

---

## ✅ Complete Fix Steps

### Step 1: Verify API Key in Supabase Secrets

1. **Go to**: https://supabase.com/dashboard/project/vvrulvxeaejxhwnafwrq/functions
2. **Click "Secrets" tab**
3. **Verify**:
   - ✅ Secret name is **exactly**: `GEMINI_API_KEY` (case-sensitive, no spaces)
   - ✅ Value is your actual Gemini API key (starts with `AIza...`)
   - ✅ Secret shows as "Active" or "Saved"

**If secret doesn't exist or is wrong:**
1. Click "Add secret" or "New secret"
2. Name: `GEMINI_API_KEY`
3. Value: Your Gemini API key
4. Click "Save"

---

### Step 2: Redeploy ALL Functions

**Functions MUST be redeployed after setting secrets!**

1. **Go to**: https://supabase.com/dashboard/project/vvrulvxeaejxhwnafwrq/functions
2. **For each function, redeploy:**

   **a. clarify-Questions-gemini:**
   - Click on `clarify-Questions-gemini`
   - Click "Edit" or "Redeploy"
   - Copy code from: `supabase/functions/clarify-Questions-gemini/index.ts`
   - Paste and click "Deploy"

   **b. deep-Research-gemini:**
   - Click on `deep-Research-gemini`
   - Click "Edit" or "Redeploy"
   - Copy code from: `supabase/functions/deep-Research-gemini/index.ts`
   - Paste and click "Deploy"

   **c. stream-research:**
   - Click on `stream-research` (or create if doesn't exist)
   - Click "Edit" or "Deploy"
   - Copy code from: `supabase/functions/stream-research/index.ts`
   - Paste and click "Deploy"

---

### Step 3: Wait for Propagation

1. **Wait 30-60 seconds** after:
   - Setting secrets
   - Deploying functions

2. This allows secrets to propagate to all function instances

---

### Step 4: Test

1. **Refresh browser** (hard refresh: Ctrl+F5)
2. **Clear browser cache** (optional but recommended)
3. **Start a new research**
4. **Check browser console** (F12) for errors
5. **Check Supabase function logs** for detailed errors

---

## 🔍 Troubleshooting

### If still getting "GEMINI_API_KEY secret not configured":

1. **Verify secret name**:
   - Must be exactly: `GEMINI_API_KEY`
   - No spaces, correct case
   - Not `GEMINI_API_KEY ` (with trailing space)
   - Not `gemini_api_key` (wrong case)

2. **Verify secret value**:
   - Should start with `AIza...`
   - No extra spaces or characters
   - Full key copied correctly

3. **Redeploy function**:
   - Functions must be redeployed after setting secrets
   - Just saving the secret isn't enough

4. **Check function logs**:
   - Go to function → Logs tab
   - Look for: `hasGeminiKey: false` or `hasGeminiKey: true`
   - If `false`, secret is not accessible

### If getting 500 errors:

1. **Check function logs** in Supabase Dashboard
2. **Look for specific error messages**
3. **Verify function code is correct** (no syntax errors)
4. **Ensure function is deployed** (not just saved)

### If getting CORS errors:

1. **Verify `stream-research` function is deployed**
2. **Check OPTIONS handler returns 200 with CORS headers**
3. **Ensure function name is exactly**: `stream-research`

---

## ✅ Success Checklist

After completing all steps:

- [ ] GEMINI_API_KEY is set in Supabase Secrets
- [ ] Secret name is exactly `GEMINI_API_KEY`
- [ ] All 3 functions are deployed
- [ ] Waited 30-60 seconds after deployment
- [ ] Browser refreshed (hard refresh)
- [ ] Started a new research
- [ ] No "API key error" in browser
- [ ] No 500 errors in Network tab
- [ ] Research completes successfully

---

## 🎯 Quick Fix Summary

1. **Set secret**: `GEMINI_API_KEY` in Supabase Secrets
2. **Redeploy**: All 3 functions
3. **Wait**: 30-60 seconds
4. **Test**: Refresh browser and start research

---

## 📞 If Still Not Working

Check Supabase function logs for the exact error:
1. Go to function → Logs tab
2. Look for error messages
3. Share the error message for further debugging

