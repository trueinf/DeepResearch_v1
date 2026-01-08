# 🚀 Complete Deployment Guide

## 📋 Overview

Your project has two parts that need deployment:
1. **Frontend (Vercel)** - React app
2. **Backend (Supabase)** - Edge Functions

---

## ✅ Step 1: Frontend Deployment (Vercel)

### Automatic Deployment (Recommended)
Vercel should automatically deploy when you push to `main` branch.

**Check Status:**
- Go to: https://vercel.com/trueinfs-projects/askdepth_gemini/deployments
- Look for the latest deployment with commit `ec78e885` or `b504f372`
- Wait for it to show "Ready" status

### Manual Trigger (If Needed)
If auto-deployment didn't trigger:

1. **Via Dashboard:**
   - Go to: https://vercel.com/trueinfs-projects/askdepth_gemini
   - Click "Deployments" tab
   - Click "Redeploy" on the latest deployment
   - Or click "Create Deployment" → Select `main` branch

2. **Via Git (Trigger):**
   ```bash
   git commit --allow-empty -m "chore: Trigger Vercel deployment"
   git push origin main
   ```

---

## ✅ Step 2: Backend Deployment (Supabase Edge Functions)

### Function 1: clarify-Questions-gemini (FIXED - 5 Questions)

**Option A: Via Supabase Dashboard (Easiest)**

1. Go to: https://supabase.com/dashboard/project/vvrulvxeaejxhwnafwrq/functions
2. Find `clarify-Questions-gemini` in the list
3. Click on it
4. Click **"Edit"** or **"Update"** button
5. Copy ALL code from: `supabase/functions/clarify-Questions-gemini/index.ts`
6. Paste into the code editor
7. Click **"Deploy"** or **"Save"**
8. Wait for deployment to complete (check logs)

**Option B: Via CLI**

```bash
# Make sure you're in the project directory
cd "C:\Users\karth\Downloads\askDepth_gemini\askDepth_gemini"

# Deploy the function
supabase functions deploy clarify-Questions-gemini --project-ref vvrulvxeaejxhwnafwrq
```

**Verify:**
- Check function logs in Supabase Dashboard
- Test by starting a new research and checking if 5 questions appear

---

### Function 2: generate-ppt-agent (PPT Generation with Retry Logic)

**Option A: Via Supabase Dashboard**

1. Go to: https://supabase.com/dashboard/project/vvrulvxeaejxhwnafwrq/functions
2. Find or create `generate-ppt-agent`
3. Copy code from: `supabase/functions/generate-ppt-agent/index.ts`
4. Paste and Deploy

**Option B: Via CLI**

```bash
supabase functions deploy generate-ppt-agent --project-ref vvrulvxeaejxhwnafwrq
```

---

### Function 3: deep-Research-gemini (Main Research Function)

**Option A: Via Supabase Dashboard**

1. Go to: https://supabase.com/dashboard/project/vvrulvxeaejxhwnafwrq/functions
2. Find `deep-Research-gemini`
3. Copy code from: `supabase/functions/deep-Research-gemini/index.ts`
4. Paste and Deploy

**Option B: Via CLI**

```bash
supabase functions deploy deep-Research-gemini --project-ref vvrulvxeaejxhwnafwrq
```

---

## 🔐 Step 3: Verify Environment Variables

Make sure these secrets are set in Supabase:

1. Go to: https://supabase.com/dashboard/project/vvrulvxeaejxhwnafwrq/settings/secrets
2. Verify these secrets exist:
   - `GEMINI_API_KEY` - Your Gemini API key
   - `ANTHROPIC_API_KEY` - (Optional) If using Claude models

**To set/update a secret via CLI:**
```bash
supabase secrets set GEMINI_API_KEY="your-api-key-here" --project-ref vvrulvxeaejxhwnafwrq
```

---

## 📊 Deployment Checklist

### Frontend (Vercel)
- [ ] Latest commit deployed (check: `ec78e885` or `b504f372`)
- [ ] Deployment status: "Ready"
- [ ] Test the app: https://askdepthgemini.vercel.app

### Backend (Supabase)
- [ ] `clarify-Questions-gemini` deployed
- [ ] `generate-ppt-agent` deployed
- [ ] `deep-Research-gemini` deployed (if updated)
- [ ] `GEMINI_API_KEY` secret is set
- [ ] Test: Start new research → Should see 5 clarifying questions
- [ ] Test: Generate PPT → Should have retry logic

---

## 🧪 Testing After Deployment

1. **Test Clarifying Questions:**
   - Start a new research
   - Should see exactly **5 clarifying questions** (not 3)

2. **Test PPT Generation:**
   - Complete a research
   - Click "Generate PPT"
   - Should work with retry logic on rate limits

3. **Test Slide Padding:**
   - Generate PPT
   - Check slide outline modal
   - Should have improved padding and spacing

---

## 🆘 Troubleshooting

### Vercel Deployment Issues

**Problem:** Deployment shows old commit
- **Solution:** Wait a few minutes, or manually trigger redeploy

**Problem:** Build fails
- **Solution:** Check build logs in Vercel dashboard for errors

### Supabase Function Issues

**Problem:** "Function not found" error
- **Solution:** Make sure function is deployed and name matches exactly

**Problem:** "GEMINI_API_KEY not configured"
- **Solution:** Set the secret in Supabase Dashboard → Settings → Edge Functions → Secrets

**Problem:** Function deployed but not working
- **Solution:** 
  1. Check function logs in Supabase Dashboard
  2. Verify code was copied completely
  3. Make sure secrets are set correctly

---

## 📞 Quick Links

- **Vercel Dashboard:** https://vercel.com/trueinfs-projects/askdepth_gemini
- **Supabase Functions:** https://supabase.com/dashboard/project/vvrulvxeaejxhwnafwrq/functions
- **Supabase Secrets:** https://supabase.com/dashboard/project/vvrulvxeaejxhwnafwrq/settings/secrets
- **Project Reference ID:** `vvrulvxeaejxhwnafwrq`

---

## 🎯 Quick Deploy All Functions (CLI)

If you have Supabase CLI set up:

```bash
# Deploy all three main functions
supabase functions deploy clarify-Questions-gemini --project-ref vvrulvxeaejxhwnafwrq
supabase functions deploy generate-ppt-agent --project-ref vvrulvxeaejxhwnafwrq
supabase functions deploy deep-Research-gemini --project-ref vvrulvxeaejxhwnafwrq
```

---

**Last Updated:** Based on commits `b504f372` (clarifying questions fix) and `ec78e885` (trigger)

