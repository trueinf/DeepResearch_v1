# 🔑 How to Update GEMINI_API_KEY in Your Project

## Your New API Key
```
Get your API key from: https://aistudio.google.com/app/apikey
```

---

## ✅ Step 1: Set in Supabase Edge Functions Secrets (REQUIRED)

This is the **ONLY place** that matters for Edge Functions. The `.env` file does NOT work for Edge Functions.

### Method 1: Via Supabase Dashboard (Easiest)

1. **Go to Supabase Dashboard**:
   - URL: https://supabase.com/dashboard/project/vvrulvxeaejxhwnafwrq/functions

2. **Click on "Secrets" tab** (top navigation)

3. **Add or Update Secret**:
   - If `GEMINI_API_KEY` exists: Click on it → Edit → Update value
   - If it doesn't exist: Click "Add Secret" → Enter:
     - **Name**: `GEMINI_API_KEY` (exactly, case-sensitive)
     - **Value**: `YOUR_ACTUAL_API_KEY_HERE` (get from https://aistudio.google.com/app/apikey)
   - Click "Save"

4. **Redeploy ALL Functions** (CRITICAL!):
   - Functions must be redeployed after setting/updating secrets
   - Go to "Functions" tab
   - For each function, click "Edit" → "Deploy":
     - `clarify-Questions-gemini`
     - `deep-Research-gemini`
     - `stream-research`
     - `chat-Research`
     - `build-research-graph`
     - `generate-ppt-agent`

5. **Wait 30-60 seconds** for secrets to propagate

6. **Test**: Refresh browser (Ctrl+F5) and try a research

---

### Method 2: Via Supabase CLI (Alternative)

If you have Supabase CLI installed:

```bash
# Set the secret
npx supabase@latest secrets set GEMINI_API_KEY="YOUR_ACTUAL_API_KEY_HERE"

# Redeploy functions (if using CLI)
npx supabase@latest functions deploy clarify-Questions-gemini
npx supabase@latest functions deploy deep-Research-gemini
npx supabase@latest functions deploy stream-research
npx supabase@latest functions deploy chat-Research
npx supabase@latest functions deploy build-research-graph
npx supabase@latest functions deploy generate-ppt-agent
```

---

## ✅ Step 2: Update .env File (Optional - For Local Development Only)

**Note**: Edge Functions don't use `.env` files. This is only for local frontend development if needed.

1. **Create or edit `.env` file** in project root:

```bash
# .env file (in project root)
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key

# Note: GEMINI_API_KEY is NOT used here - it's only in Supabase Secrets
```

**Important**: The `.env` file is NOT used by Edge Functions. They only read from Supabase Secrets.

---

## ✅ Step 3: Verify No Hardcoded Keys

I've already removed the hardcoded key from `chat-Research/index.ts`. 

**All functions now use**: `Deno.env.get('GEMINI_API_KEY')` (reads from Supabase Secrets only)

---

## ✅ Step 4: Verification Checklist

After updating:

- [ ] `GEMINI_API_KEY` secret exists in Supabase Secrets
- [ ] Secret value is set correctly (get from https://aistudio.google.com/app/apikey)
- [ ] All 6 functions are redeployed
- [ ] Waited 30-60 seconds after deployment
- [ ] Browser refreshed (Ctrl+F5)
- [ ] No more "API key not configured" errors
- [ ] Research works correctly

---

## 🚨 Common Mistakes to Avoid

1. ❌ **Don't put API key in `.env` file** - Edge Functions can't read it
2. ❌ **Don't forget to redeploy functions** - Secrets only load on deployment
3. ❌ **Don't use wrong secret name** - Must be exactly `GEMINI_API_KEY` (case-sensitive)
4. ❌ **Don't add spaces** - Secret name should be `GEMINI_API_KEY` not `GEMINI_API_KEY ` (with space)

---

## 📋 Functions That Use GEMINI_API_KEY

All these functions need the secret set:

1. ✅ `clarify-Questions-gemini` - Generates clarifying questions
2. ✅ `deep-Research-gemini` - Performs deep research
3. ✅ `stream-research` - Streams AI responses
4. ✅ `chat-Research` - Answers follow-up questions
5. ✅ `build-research-graph` - Builds research graphs
6. ✅ `generate-ppt-agent` - Generates presentations

---

## 🎯 Quick Test

After updating, test by:

1. Starting a new research
2. Check browser console (F12) - should see no 500 errors
3. Research should progress past "Synthesizing" stage
4. Live Reasoning should work

---

## ✅ Summary

**What I've Done**:
- ✅ Removed hardcoded API key from `chat-Research/index.ts`
- ✅ All functions now properly read from Supabase Secrets

**What You Need to Do**:
1. Set `GEMINI_API_KEY` in Supabase Dashboard → Secrets
2. Redeploy all 6 functions
3. Wait 30-60 seconds
4. Test

---

**Your API Key**: Get it from https://aistudio.google.com/app/apikey

**Set it in**: Supabase Dashboard → Edge Functions → Secrets → `GEMINI_API_KEY`

