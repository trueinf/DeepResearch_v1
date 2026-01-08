# 🚨 Fix Storyboard CORS Error

## ❌ Current Error
```
Access to fetch at 'https://vvrulvxeaejxhwnafwrq.supabase.co/functions/v1/generate-storyboard' 
from origin 'http://localhost:5184' has been blocked by CORS policy: 
Response to preflight request doesn't pass access control check: 
It does not have HTTP ok status.
```

**This means the `generate-storyboard` function is NOT deployed yet!**

---

## ✅ Solution: Deploy the Function

### Step 1: Go to Supabase Dashboard
1. Open: https://supabase.com/dashboard/project/vvrulvxeaejxhwnafwrq/functions
2. Look for `generate-storyboard` function

### Step 2: Create the Function

**If function doesn't exist:**
1. Click **"Deploy a new function"** or **"Create function"**
2. Name it: `generate-storyboard` (exactly, with hyphen)
3. Copy ALL code from: `supabase/functions/generate-storyboard/index.ts`
4. Paste into the code editor
5. Click **"Deploy"**

**If function exists but isn't working:**
1. Click on `generate-storyboard` function
2. Click **"Edit"** or **"Update"**
3. Replace ALL code with content from: `supabase/functions/generate-storyboard/index.ts`
4. Click **"Deploy"** or **"Save"**

### Step 3: Verify Deployment
1. Check function logs for any errors
2. Test the endpoint:
   - URL: `https://vvrulvxeaejxhwnafwrq.supabase.co/functions/v1/generate-storyboard`
   - Should return 200 OK for OPTIONS request

### Step 4: Set Environment Variables (Secrets)
Make sure this is set in Supabase Dashboard → Edge Functions → Secrets:
- `GEMINI_API_KEY` - Your Gemini API key (required)

### Step 5: Test
1. Refresh your browser (http://localhost:5184)
2. Go to a research report
3. Click **"Generate Storyboard"** button
4. Check Network tab - `generate-storyboard` should return 200, not 404 or CORS error

---

## 🔍 Verification Checklist

- [ ] Function `generate-storyboard` exists in Supabase Dashboard
- [ ] Function code matches `supabase/functions/generate-storyboard/index.ts`
- [ ] Function is deployed (not just saved)
- [ ] `GEMINI_API_KEY` secret is set
- [ ] OPTIONS request returns 200 (not 404)
- [ ] CORS headers are present in response

---

## 📝 Function Name Must Match
- ✅ Correct: `generate-storyboard` (with hyphen)
- ❌ Wrong: `generate_storyboard` (with underscore)
- ❌ Wrong: `generateStoryboard` (camelCase)

The URL path is: `/functions/v1/generate-storyboard`

---

## 🐛 If Still Getting CORS Error After Deployment

1. **Check function name** - Must be exactly `generate-storyboard`
2. **Check deployment status** - Function must be "Active" or "Deployed"
3. **Check Supabase project** - Make sure you're in the correct project
4. **Check function logs** - Look for deployment errors
5. **Verify OPTIONS handler** - Should return status 200 with CORS headers
6. **Hard refresh browser** - Clear cache (Ctrl+Shift+R or Cmd+Shift+R)

---

## ✅ After Deployment

Once deployed, the CORS error should be fixed and storyboard generation should work!

The function code is correct - it just needs to be deployed to Supabase.
