# 🚨 URGENT: Deploy Storyboard Function NOW

## ❌ Current Error
```
Access to fetch at 'https://vvrulvxeaejxhwnafwrq.supabase.co/functions/v1/generate-storyboard' 
from origin 'http://localhost:5184' has been blocked by CORS policy
```

**The function is NOT deployed. Follow these steps:**

---

## ✅ Step-by-Step Deployment

### Step 1: Open Supabase Dashboard
1. Go to: https://supabase.com/dashboard/project/vvrulvxeaejxhwnafwrq/functions
2. Or navigate: Dashboard → Your Project → Edge Functions

### Step 2: Create the Function

**Option A: If function doesn't exist**
1. Click **"Create a new function"** or **"New Function"** button
2. Function name: `generate-storyboard` (EXACTLY - with hyphen, lowercase)
3. Click **"Create function"**

**Option B: If function already exists**
1. Click on `generate-storyboard` in the functions list
2. Click **"Edit"** button

### Step 3: Copy and Paste Code
1. Open this file: `supabase/functions/generate-storyboard/index.ts`
2. Select ALL code (Ctrl+A / Cmd+A)
3. Copy (Ctrl+C / Cmd+C)
4. Go back to Supabase Dashboard
5. Delete any existing code in the editor
6. Paste the code (Ctrl+V / Cmd+V)

### Step 4: Deploy
1. Click **"Deploy"** button (usually top-right)
2. Wait for deployment to complete (30-60 seconds)
3. You should see "Deployed successfully" or similar message

### Step 5: Verify Secrets
1. Go to **Edge Functions → Secrets** (in left sidebar)
2. Check if `GEMINI_API_KEY` exists
3. If not, click **"Add secret"**:
   - Name: `GEMINI_API_KEY`
   - Value: Your Gemini API key from https://aistudio.google.com/app/apikey
   - Click **"Save"**

### Step 6: Test Deployment
1. In Supabase Dashboard, go to the `generate-storyboard` function
2. Click **"Invoke"** tab
3. Use this test payload:
```json
{
  "report": {
    "topic": "Test Research",
    "executiveSummary": "This is a test summary",
    "keyFindings": [
      {"text": "Finding 1", "citations": [1]}
    ]
  },
  "storySpine": "problem-insight-resolution"
}
```
4. Click **"Invoke"**
5. Should return a storyboard structure (not an error)

### Step 7: Test from Frontend
1. Refresh your browser (http://localhost:5184)
2. Go to a research report
3. Click **"Generate Storyboard"** button
4. Should work now! ✅

---

## 🔍 Verification Checklist

Before testing, verify:
- [ ] Function `generate-storyboard` exists in Supabase Dashboard
- [ ] Function shows "Active" or "Deployed" status
- [ ] Function code matches `supabase/functions/generate-storyboard/index.ts`
- [ ] `GEMINI_API_KEY` secret is set in Edge Functions → Secrets
- [ ] Function was deployed (not just saved)

---

## 🐛 If Still Getting CORS Error

### Check 1: Function Name
- ✅ Must be: `generate-storyboard` (lowercase, with hyphen)
- ❌ NOT: `generate_storyboard` (underscore)
- ❌ NOT: `GenerateStoryboard` (camelCase)
- ❌ NOT: `generate-story-board` (extra hyphen)

### Check 2: Deployment Status
- Function must show "Active" or "Deployed"
- If it shows "Draft" or "Saved", click "Deploy" again

### Check 3: Function URL
- Correct: `https://vvrulvxeaejxhwnafwrq.supabase.co/functions/v1/generate-storyboard`
- Check in Network tab - should return 200 for OPTIONS, not 404

### Check 4: Hard Refresh Browser
- Press `Ctrl+Shift+R` (Windows) or `Cmd+Shift+R` (Mac)
- This clears cache and forces reload

### Check 5: Check Function Logs
- In Supabase Dashboard → `generate-storyboard` → Logs
- Look for any deployment errors
- Check if OPTIONS requests are being received

---

## 📝 Quick Test Command

You can test if the function is deployed using curl:

```bash
curl -X OPTIONS https://vvrulvxeaejxhwnafwrq.supabase.co/functions/v1/generate-storyboard \
  -H "Origin: http://localhost:5184" \
  -H "Access-Control-Request-Method: POST" \
  -v
```

Should return:
- Status: `200 OK`
- Headers include: `Access-Control-Allow-Origin: *`

If you get `404 Not Found`, the function is not deployed.

---

## ✅ Success Indicators

After deployment, you should see:
1. ✅ No CORS error in browser console
2. ✅ Network tab shows `generate-storyboard` with status 200
3. ✅ Storyboard generation starts (loading spinner)
4. ✅ Storyboard appears in modal after 30-60 seconds

---

## 🆘 Still Having Issues?

1. **Check Supabase project** - Make sure you're in the correct project
2. **Check function logs** - Look for errors in Supabase Dashboard
3. **Try redeploying** - Delete and recreate the function
4. **Check API key** - Verify `GEMINI_API_KEY` is correct in secrets

The function code is correct - it just needs to be deployed! 🚀
