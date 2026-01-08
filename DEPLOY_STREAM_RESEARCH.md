# Deploy stream-research Function - URGENT FIX

## 🚨 Issue
The `stream-research` function is returning **404** on preflight requests, which means it's **not deployed** to Supabase.

## ✅ Solution: Deploy the Function

### Step 1: Go to Supabase Dashboard
1. Open: https://supabase.com/dashboard/project/vvrulvxeaejxhwnafwrq/functions
2. Look for `stream-research` function

### Step 2: Create/Update the Function

**If function doesn't exist:**
1. Click **"Deploy a new function"** or **"Create function"**
2. Name it: `stream-research` (exactly, with hyphen)
3. Copy ALL code from: `supabase/functions/stream-research/index.ts`
4. Paste into the code editor
5. Click **"Deploy"**

**If function exists:**
1. Click on `stream-research` function
2. Click **"Edit"** or **"Update"**
3. Replace ALL code with content from: `supabase/functions/stream-research/index.ts`
4. Click **"Deploy"** or **"Save"**

### Step 3: Verify Deployment
1. Check function logs for any errors
2. Test the endpoint:
   - URL: `https://vvrulvxeaejxhwnafwrq.supabase.co/functions/v1/stream-research`
   - Should return 200 OK for OPTIONS request

### Step 4: Set Environment Variables (Secrets)
Make sure these are set in Supabase Dashboard → Edge Functions → Secrets:
- `GEMINI_API_KEY` - Your Gemini API key
- `ANTHROPIC_API_KEY` - Your Claude API key (optional, only if using Claude)

### Step 5: Test
1. Refresh your browser (http://localhost:5184)
2. Start a research
3. Check Network tab - `stream-research` should return 200, not 404

## 🔍 Verification Checklist

- [ ] Function `stream-research` exists in Supabase Dashboard
- [ ] Function code matches `supabase/functions/stream-research/index.ts`
- [ ] Function is deployed (not just saved)
- [ ] `GEMINI_API_KEY` secret is set
- [ ] OPTIONS request returns 200 (not 404)
- [ ] CORS headers are present in response

## 📝 Function Name Must Match
- ✅ Correct: `stream-research` (with hyphen)
- ❌ Wrong: `stream_research` (with underscore)
- ❌ Wrong: `streamResearch` (camelCase)

The URL path is: `/functions/v1/stream-research`

## 🐛 If Still Getting 404

1. **Check function name** - Must be exactly `stream-research`
2. **Check deployment status** - Function must be "Active" or "Deployed"
3. **Check Supabase project** - Make sure you're in the correct project
4. **Check function logs** - Look for deployment errors

## ✅ After Deployment

Once deployed, the CORS error should be fixed and streaming should work!

