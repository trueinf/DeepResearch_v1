# Final Checklist - Everything to Verify

## ✅ 1. API Keys Set in Supabase

**Location**: https://supabase.com/dashboard/project/vvrulvxeaejxhwnafwrq/functions → Secrets tab

- [ ] `GEMINI_API_KEY` is set
- [ ] `ANTHROPIC_API_KEY` is set (if using Claude)
- [ ] Keys are valid and active

**How to verify**: Check Edge Functions → Secrets tab

---

## ✅ 2. Edge Functions Deployed

**Location**: https://supabase.com/dashboard/project/vvrulvxeaejxhwnafwrq/functions

Deploy these functions (if not already deployed):
- [ ] `deep-Research-gemini` - Main research function
- [ ] `chat-Research` - Follow-up chat
- [ ] `generate-ppt-agent` - PPT generation
- [ ] `clarify-Questions-gemini` - Clarifying questions
- [ ] `create-user` - User creation (if using)

**How to verify**: Check that all functions show "Active" status

---

## ✅ 3. Frontend Environment Variables

**File**: `.env` in project root

Check these are set:
- [ ] `VITE_SUPABASE_URL` - Your Supabase project URL
- [ ] `VITE_SUPABASE_ANON_KEY` - Your Supabase anon key

**How to verify**: Check `.env` file exists and has correct values

---

## ✅ 4. Database Tables Created

**Location**: Supabase Dashboard → SQL Editor

Verify these tables exist:
- [ ] `researches` - Stores research topics
- [ ] `research_reports` - Stores research reports
- [ ] `chat_messages` - Stores chat messages
- [ ] `profiles` - User profiles

**How to verify**: Go to Table Editor and check tables exist

---

## ✅ 5. Row Level Security (RLS) Policies

**Location**: Supabase Dashboard → Authentication → Policies

Verify RLS is enabled and policies exist for:
- [ ] `researches` table
- [ ] `research_reports` table
- [ ] `chat_messages` table
- [ ] `profiles` table

**How to verify**: Check that policies allow authenticated users to read/write

---

## ✅ 6. Model Names Updated

**Files to check**:
- [ ] `src/components/TopBar.jsx` - Uses `gemini-1.5-pro-latest`
- [ ] `src/App.jsx` - Default model is `gemini-1.5-pro-latest`
- [ ] `supabase/functions/deep-Research-gemini/index.ts` - Has fallback logic

**How to verify**: Check that model names are correct (not `gemini-3.0-pro-preview`)

---

## ✅ 7. Error Handling

**Verify**:
- [ ] No rate limit error messages in code
- [ ] Generic error messages: "API request failed. Please try again."
- [ ] Fallback logic for Gemini 3 Pro → Gemini 1.5 Pro

**How to verify**: Check function code doesn't mention "rate limit"

---

## ✅ 8. Port Configuration

**File**: `vite.config.js`

Verify:
- [ ] Port is set to `5184`
- [ ] `strictPort: true` is set

**How to verify**: Check `vite.config.js` file

---

## ✅ 9. Authentication Settings

**Location**: Supabase Dashboard → Authentication → URL Configuration

Verify:
- [ ] Site URL is set to: `http://localhost:5184`
- [ ] Redirect URLs include: `http://localhost:5184/**`
- [ ] Email confirmation is disabled (for testing) or enabled (for production)

**How to verify**: Check Authentication → URL Configuration

---

## ✅ 10. Test the Application

**Test these flows**:
- [ ] User can sign up
- [ ] User can log in
- [ ] User can create research
- [ ] Research completes successfully
- [ ] Report is displayed
- [ ] PPT can be generated
- [ ] Chat works with research

**How to verify**: Run through the entire user flow

---

## 🔍 Common Issues to Check

### Issue 1: "Model not found" Error
**Fix**: Deploy updated `deep-Research-gemini` function with fallback logic

### Issue 2: "Rate limit exceeded" Error
**Fix**: Deploy updated functions (all rate limit handling removed)

### Issue 3: "401 Unauthorized" Error
**Fix**: Check API keys are set correctly in Supabase secrets

### Issue 4: "Database error" on Signup
**Fix**: Run `create_profiles_table.sql` in SQL Editor

### Issue 5: Port conflicts
**Fix**: Check `vite.config.js` has `port: 5184` and `strictPort: true`

---

## 📋 Quick Verification Commands

```powershell
# Check if server is running
Get-NetTCPConnection -LocalPort 5184

# Check environment variables
Get-Content .env

# Check if functions are deployed
# Go to Supabase Dashboard → Edge Functions
```

---

## 🚀 After Everything is Set

1. **Restart your dev server**: `npm run dev`
2. **Test a complete research flow**
3. **Check browser console** for any errors
4. **Check Supabase logs** for function errors

---

## 📝 Summary

**Most Important**:
1. ✅ API keys set in Supabase secrets
2. ✅ Functions deployed with latest code
3. ✅ Frontend `.env` file configured
4. ✅ Database tables created
5. ✅ Test the application

If all these are done, your application should work! 🎉

