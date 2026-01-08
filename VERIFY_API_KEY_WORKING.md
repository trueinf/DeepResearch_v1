# ✅ Verify API Key is Working

## 📋 Quick Verification Steps

### Step 1: Check Supabase Secrets
1. Go to: https://supabase.com/dashboard/project/vvrulvxeaejxhwnafwrq/functions
2. Click **"Secrets"** tab
3. Verify:
   - ✅ `GEMINI_API_KEY` exists
   - ✅ Value is your actual API key (starts with `AIza...`)
   - ✅ Secret is saved/active

### Step 2: Check Functions Are Deployed
1. In the same page, click **"Functions"** tab
2. Verify these functions exist and are "Active":
   - ✅ `deep-Research-gemini`
   - ✅ `stream-research`
   - ✅ `clarify-Questions-gemini`

### Step 3: Test in Browser
1. **Refresh your browser** (http://localhost:5184)
2. **Open Browser Console** (F12)
3. **Start a research** with a simple query
4. **Check for errors:**
   - ✅ No "API key error" = Working!
   - ❌ "API key error" = Still not working

### Step 4: Check Function Logs
1. Go to Supabase Dashboard → Edge Functions
2. Click on `deep-Research-gemini`
3. Click **"Logs"** tab
4. Start a research in your app
5. Check logs for:
   - ✅ `hasGeminiKey: true` = Key is accessible
   - ❌ `hasGeminiKey: false` = Key is missing

---

## 🔍 Important Notes

### ✅ GEMINI_API_KEY Location:
- **✅ CORRECT**: Supabase Dashboard → Edge Functions → Secrets
- **❌ WRONG**: `.env` file (frontend can't access Edge Function secrets)

### ✅ .env File Should Only Have:
```
VITE_SUPABASE_URL=https://vvrulvxeaejxhwnafwrq.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

### ❌ .env File Should NOT Have:
```
GEMINI_API_KEY=...  # ❌ Don't put this here!
```

**Why?** Edge Functions run on Supabase servers, not in your browser. They can only access secrets set in Supabase Secrets, not environment variables from your `.env` file.

---

## 🧪 Test Results

### ✅ Success Indicators:
- No "API key error" in browser
- Research completes successfully
- Function logs show `hasGeminiKey: true`
- API calls to Gemini succeed

### ❌ If Still Getting Errors:

1. **Verify secret name is exactly**: `GEMINI_API_KEY` (case-sensitive)
2. **Redeploy functions** after setting secrets
3. **Wait 30 seconds** for secrets to propagate
4. **Check function logs** for detailed error messages
5. **Verify API key is valid** at https://aistudio.google.com/app/apikey

---

## 📋 Quick Test Checklist

- [ ] GEMINI_API_KEY is set in Supabase Secrets (not .env)
- [ ] Secret name is exactly `GEMINI_API_KEY`
- [ ] Functions are deployed
- [ ] Browser refreshed
- [ ] Started a research
- [ ] No "API key error" appears
- [ ] Research completes successfully

---

## 🎯 Next Steps

1. **Test now**: Start a research in your app
2. **Check console**: Look for any errors
3. **Check logs**: Verify function can access the key
4. **Report results**: Let me know if it's working!

