# 🚀 Deploy generate-ppt-agent Function - Quick Guide

## ⚠️ The function is not deployed yet!

You're seeing this error because `generate-ppt-agent` needs to be deployed to Supabase.

---

## ✅ Method 1: Via Supabase Dashboard (Easiest - Recommended)

### Step 1: Go to Edge Functions Dashboard
1. Open: https://supabase.com/dashboard/project/vvrulvxeaejxhwnafwrq/functions
2. Or navigate: Dashboard → Your Project → Edge Functions (left sidebar)

### Step 2: Create/Deploy the Function
**Option A: If function already exists:**
- Find `generate-ppt-agent` in the list
- Click on it
- Click **"Redeploy"** or **"Update"**

**Option B: If function doesn't exist:**
- Click **"Create a new function"** or **"New Function"**
- Name it: `generate-ppt-agent`
- Copy ALL code from: `supabase/functions/generate-ppt-agent/index.ts`
- Paste into the code editor
- Click **"Deploy"**

### Step 3: Set Environment Variable (GEMINI_API_KEY)
1. In the function page, go to **"Settings"** or **"Secrets"**
2. Add secret: `GEMINI_API_KEY`
3. Value: Your Gemini API key
4. Save

**OR use CLI:**
```bash
supabase secrets set GEMINI_API_KEY="your-api-key-here" --project-ref vvrulvxeaejxhwnafwrq
```

### Step 4: Test
1. Go back to your app
2. Try generating PPT again
3. Should work now! ✅

---

## ✅ Method 2: Via CLI (If you have Supabase CLI)

### Step 1: Make sure you're logged in
```bash
supabase login
```

### Step 2: Link to your project (if not already linked)
```bash
supabase link --project-ref vvrulvxeaejxhwnafwrq
```

### Step 3: Deploy the function
```bash
supabase functions deploy generate-ppt-agent --project-ref vvrulvxeaejxhwnafwrq
```

### Step 4: Set the secret
```bash
supabase secrets set GEMINI_API_KEY="your-api-key-here" --project-ref vvrulvxeaejxhwnafwrq
```

---

## 🔍 Verify Deployment

After deploying, you should see:
- Function appears in Edge Functions list
- Status shows "Active" or "Deployed"
- No errors in function logs

---

## ❌ Troubleshooting

### "Function not found" error
- Make sure the function name is exactly: `generate-ppt-agent`
- Check spelling (case-sensitive)

### "GEMINI_API_KEY not configured"
- Go to function Settings/Secrets
- Add `GEMINI_API_KEY` secret
- Make sure it's set correctly

### Still getting errors?
1. Check function logs in Supabase Dashboard
2. Verify the code was copied completely
3. Make sure GEMINI_API_KEY is set

---

## 📝 Quick Checklist

- [ ] Function `generate-ppt-agent` exists in Supabase Dashboard
- [ ] Function code is deployed (from `supabase/functions/generate-ppt-agent/index.ts`)
- [ ] `GEMINI_API_KEY` secret is set in function settings
- [ ] Function status shows "Active" or "Deployed"
- [ ] Tested PPT generation in app

---

**After deployment, refresh your browser and try generating PPT again!** 🎉

