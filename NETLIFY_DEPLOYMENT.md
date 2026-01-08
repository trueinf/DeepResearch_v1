# 🚀 Deploy to Netlify - Complete Guide

## Prerequisites

1. **Netlify Account**: Sign up at https://app.netlify.com
2. **GitHub/GitLab/Bitbucket Repository**: Your code should be in a Git repository
3. **Supabase Credentials**: You'll need your Supabase URL and anon key

---

## Method 1: Deploy via Netlify UI (Recommended for First Time)

### Step 1: Prepare Your Repository

1. **Push your code to GitHub/GitLab/Bitbucket** (if not already done):
   ```bash
   git add .
   git commit -m "Prepare for Netlify deployment"
   git push origin main
   ```

### Step 2: Create Netlify Site

1. **Go to Netlify Dashboard**: https://app.netlify.com
2. **Click "Add new site"** → **"Import an existing project"**
3. **Connect to Git provider** (GitHub/GitLab/Bitbucket)
4. **Select your repository**: `askDepth_gemini`
5. **Configure build settings**:
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`
   - Click **"Deploy site"**

### Step 3: Configure Secrets Scanning (If Build Fails)

If your build fails due to secrets scanning detecting example keys in documentation:

1. **Go to Site Settings** → **Build & deploy** → **Environment variables**
2. **Add this variable**:
   - **Key**: `SECRETS_SCAN_SMART_DETECTION_OMIT_VALUES`
   - **Value**: `true`
   - **Scopes**: Check all (Production, Deploy previews, Branch deploys)
   - Click **"Save"**

**Note**: This allows example keys in documentation files. All actual API keys have been redacted from the codebase.

### Step 4: Add Environment Variables

**IMPORTANT**: After the first deployment, you MUST add environment variables!

1. **Go to Site Settings**:
   - Click on your site name
   - Go to **"Site settings"** → **"Environment variables"**

2. **Add Required Variables**:
   
   **Variable 1:**
   - **Key**: `VITE_SUPABASE_URL`
   - **Value**: Your Supabase project URL (e.g., `https://vvrulvxeaejxhwnafwrq.supabase.co`)
   - **Scopes**: Check all (Production, Deploy previews, Branch deploys)
   - Click **"Save"**

   **Variable 2:**
   - **Key**: `VITE_SUPABASE_ANON_KEY`
   - **Value**: Your Supabase anon public key
   - **Scopes**: Check all (Production, Deploy previews, Branch deploys)
   - Click **"Save"**

### Step 5: Redeploy

After adding environment variables:

1. Go to **"Deploys"** tab
2. Click **"Trigger deploy"** → **"Deploy site"**
3. Wait for deployment to complete

---

## Method 2: Deploy via Netlify CLI

### Step 1: Install Netlify CLI

```bash
npm install -g netlify-cli
```

### Step 2: Login to Netlify

```bash
netlify login
```

This will open your browser to authenticate.

### Step 3: Initialize Site

```bash
netlify init
```

Follow the prompts:
- **Create & configure a new site** or **Link this directory to an existing site**
- Select your team
- Choose a site name (or use default)

### Step 4: Configure Secrets Scanning (Optional)

If build fails due to secrets scanning:

```bash
netlify env:set SECRETS_SCAN_SMART_DETECTION_OMIT_VALUES "true"
```

### Step 5: Set Environment Variables

```bash
# Set Supabase URL
netlify env:set VITE_SUPABASE_URL "https://your-project.supabase.co"

# Set Supabase Anon Key
netlify env:set VITE_SUPABASE_ANON_KEY "your-anon-key-here"
```

### Step 6: Deploy

```bash
# Build and deploy
netlify deploy --prod
```

Or for a preview deployment:
```bash
netlify deploy
```

---

## Method 3: Continuous Deployment (Automatic)

If you've already connected your Git repository:

1. **Every push to main branch** = Automatic production deployment
2. **Every pull request** = Automatic preview deployment
3. **Environment variables** are automatically available in all deployments

---

## Configuration Details

### Build Settings (Already Configured in `netlify.toml`)

- **Build command**: `npm run build`
- **Publish directory**: `dist`
- **Node version**: 18
- **SPA redirects**: All routes redirect to `index.html` (for React Router)

### Environment Variables Required

| Variable | Description | Where to Get |
|----------|-------------|--------------|
| `VITE_SUPABASE_URL` | Your Supabase project URL | Supabase Dashboard → Settings → API |
| `VITE_SUPABASE_ANON_KEY` | Your Supabase anon public key | Supabase Dashboard → Settings → API |

---

## Verification Steps

After deployment:

1. **Visit your site URL** (e.g., `https://your-site.netlify.app`)
2. **Check browser console** for errors:
   - Open DevTools (F12)
   - Look for any red errors
   - Should see: `VITE_SUPABASE_URL: ✓ Set` and `VITE_SUPABASE_ANON_KEY: ✓ Set`
3. **Test the application**:
   - Try signing up/logging in
   - Create a research query
   - Verify API calls work

---

## Troubleshooting

### Issue: Blank Page After Deployment

**Solution**: Check environment variables
1. Go to Site Settings → Environment Variables
2. Verify both `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are set
3. Redeploy after adding variables

### Issue: 404 on Routes

**Solution**: The `netlify.toml` file includes redirects. Make sure it's in your repository root.

### Issue: Build Fails

**Common causes**:
- Missing dependencies → Check `package.json` is committed
- Node version mismatch → Netlify uses Node 18 (configured in `netlify.toml`)
- Build errors → Check build logs in Netlify dashboard

### Issue: Environment Variables Not Working

**Solution**:
1. Variables must start with `VITE_` to be available in Vite builds
2. Redeploy after adding/changing variables
3. Check variable names are exact (case-sensitive)

---

## Custom Domain (Optional)

1. Go to **Site settings** → **Domain management**
2. Click **"Add custom domain"**
3. Follow Netlify's DNS configuration instructions

---

## Performance Optimization

Netlify automatically:
- ✅ Serves static assets via CDN
- ✅ Enables gzip compression
- ✅ Provides HTTPS
- ✅ Handles caching headers

---

## Quick Reference

| Action | Command/URL |
|--------|-------------|
| **Netlify Dashboard** | https://app.netlify.com |
| **Deploy via CLI** | `netlify deploy --prod` |
| **View Logs** | Netlify Dashboard → Deploys → Click deployment |
| **Environment Variables** | Site Settings → Environment Variables |
| **Redeploy** | Deploys tab → Trigger deploy |

---

## Next Steps After Deployment

1. ✅ **Test all features** on the live site
2. ✅ **Set up custom domain** (optional)
3. ✅ **Configure Supabase CORS** to allow your Netlify domain
4. ✅ **Monitor deployments** in Netlify dashboard
5. ✅ **Set up branch previews** for testing (automatic with Git integration)

---

**Your site will be live at**: `https://your-site-name.netlify.app`
