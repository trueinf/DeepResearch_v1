# 🚀 Complete Deployment Guide

## 📋 Deployment Overview

Your project has **2 parts** to deploy:
1. **Frontend** (React/Vite) → Vercel
2. **Backend Functions** (Supabase Edge Functions) → Supabase

---

## 🌐 Part 1: Deploy Frontend to Vercel

### Option A: Deploy via Vercel Dashboard (Recommended - No Permission Issues)

1. **Go to Vercel Dashboard:**
   - Visit: https://vercel.com/dashboard
   - Sign in with your account

2. **Import Project:**
   - Click **"Add New"** → **"Project"**
   - Select **"Import Git Repository"**
   - Choose your repository: `askDepth_gemini`
   - Click **"Import"**

3. **Configure Project:**
   - **Framework Preset:** Vite
   - **Root Directory:** `./` (root)
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
   - Click **"Deploy"**

4. **Add Environment Variables:**
   After deployment, go to **Settings** → **Environment Variables** and add:
   ```
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

5. **Redeploy:**
   - Go to **Deployments** tab
   - Click **"..."** on latest deployment → **"Redeploy"**

### Option B: Fix Vercel CLI Permissions

If you want to use CLI:

1. **Login to Vercel:**
   ```bash
   vercel login
   ```

2. **Link to your team:**
   - Contact team owner to add your email: `karthyshridhar@gmail.com`
   - Or create your own Vercel project

3. **Deploy:**
   ```bash
   vercel --prod
   ```

---

## 🔧 Part 2: Deploy Supabase Edge Functions

### Method 1: Deploy via Supabase Dashboard (Easiest)

1. **Go to Supabase Dashboard:**
   - Visit: https://supabase.com/dashboard
   - Select your project

2. **Navigate to Edge Functions:**
   - Click **"Edge Functions"** in left sidebar

3. **Deploy Each Function:**

   For each function below, follow these steps:
   - Click on the function name
   - Click **"Edit Function"** or **"Code"** tab
   - Copy entire content from the file path shown
   - Paste into editor
   - Click **"Deploy"**

   **Functions to Deploy (9 total):**

   | Function Name | File Path |
   |--------------|-----------|
   | `deep-Research-gemini` ⭐ | `supabase/functions/deep-Research-gemini/index.ts` |
   | `chat-Research` | `supabase/functions/chat-Research/index.ts` |
   | `clarify-Questions-gemini` | `supabase/functions/clarify-Questions-gemini/index.ts` |
   | `graph-entities` | `supabase/functions/graph-entities/index.ts` |
   | `build-research-graph` | `supabase/functions/build-research-graph/index.ts` |
   | `extract-causal-relationships` | `supabase/functions/extract-causal-relationships/index.ts` |
   | `extract-trend-signals` | `supabase/functions/extract-trend-signals/index.ts` |
   | `graph-relationships` | `supabase/functions/graph-relationships/index.ts` |
   | `stream-research` | `supabase/functions/stream-research/index.ts` |

### Method 2: Deploy via Supabase CLI (If Installed)

```bash
# Install Supabase CLI (if not installed)
npm install -g supabase

# Login
supabase login

# Link project
supabase link --project-ref your-project-ref

# Deploy all functions
supabase functions deploy deep-Research-gemini
supabase functions deploy chat-Research
supabase functions deploy clarify-Questions-gemini
supabase functions deploy graph-entities
supabase functions deploy build-research-graph
supabase functions deploy extract-causal-relationships
supabase functions deploy extract-trend-signals
supabase functions deploy graph-relationships
supabase functions deploy stream-research
```

---

## 🔑 Part 3: Verify Environment Variables

### Vercel Environment Variables:
- `VITE_SUPABASE_URL` - Your Supabase project URL
- `VITE_SUPABASE_ANON_KEY` - Your Supabase anonymous key

### Supabase Secrets (Edge Functions):
- `GEMINI_API_KEY` - Your Gemini API key
- `SERPAPI_KEY` (optional) - For web search features

**To add Supabase Secrets:**
1. Go to Supabase Dashboard → **Project Settings** → **Secrets**
2. Click **"Add Secret"**
3. Add each secret with its value

---

## ✅ Verification Checklist

After deployment:

- [ ] Frontend deployed to Vercel
- [ ] Vercel environment variables set
- [ ] All 9 Supabase functions deployed
- [ ] Supabase secrets configured
- [ ] Test frontend URL works
- [ ] Test research creation works
- [ ] Check Supabase function logs for errors

---

## 🧪 Test Your Deployment

1. **Visit your Vercel URL:**
   - Example: `https://askdepth-gemini.vercel.app`

2. **Test Features:**
   - Sign up / Login
   - Create a research
   - Check if research completes successfully

3. **Check Logs:**
   - Vercel: Dashboard → Deployments → View Logs
   - Supabase: Edge Functions → Function Name → Logs

---

## 🆘 Troubleshooting

### Frontend Issues:
- **"Cannot connect to Supabase"** → Check environment variables in Vercel
- **"404 errors"** → Verify `vercel.json` is deployed
- **"Build fails"** → Check Vercel build logs

### Backend Issues:
- **"Model not found"** → Verify `GEMINI_API_KEY` in Supabase Secrets
- **"Function timeout"** → Check function logs in Supabase
- **"CORS errors"** → Verify function is deployed correctly

---

## 📝 Quick Commands Reference

```bash
# Build frontend
npm run build

# Deploy to Vercel (if permissions fixed)
vercel --prod

# Check Supabase functions (if CLI installed)
supabase functions list
```

---

## 🎉 Success!

Once deployed, you'll have:
- ✅ Live frontend URL (from Vercel)
- ✅ Working backend functions (in Supabase)
- ✅ Full-stack application ready to use!

