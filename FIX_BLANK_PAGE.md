# 🔧 Fix Blank Page on Vercel Deployment

## 🚨 Issue: Blank White Page

Your site is deployed but showing a blank page. This is usually caused by:
1. **Missing Environment Variables** (most common)
2. **JavaScript Errors** preventing app from loading
3. **Build Issues**

---

## ✅ Step 1: Check Browser Console for Errors

1. **Open Developer Tools:**
   - Press `F12` or `Ctrl+Shift+I` (Windows)
   - Or right-click → "Inspect"

2. **Go to Console Tab:**
   - Look for **red error messages**
   - Common errors:
     - `VITE_SUPABASE_URL is not defined`
     - `Cannot read property of undefined`
     - `Failed to fetch`

3. **Take a screenshot** of any errors you see

---

## ✅ Step 2: Verify Environment Variables in Vercel

1. **Go to Vercel Dashboard:**
   - Visit: https://vercel.com/dashboard
   - Click on your project: `askDepth_gemini`

2. **Go to Settings → Environment Variables:**
   - Check if these are set:
     - `VITE_SUPABASE_URL`
     - `VITE_SUPABASE_ANON_KEY`

3. **If Missing, Add Them:**
   - Click **"Add New"**
   - **Key:** `VITE_SUPABASE_URL`
   - **Value:** Your Supabase project URL
   - **Environment:** Production, Preview, Development (select all)
   - Click **"Save"**
   
   - Repeat for `VITE_SUPABASE_ANON_KEY`

4. **After Adding Variables:**
   - Go to **Deployments** tab
   - Click **"..."** on latest deployment
   - Click **"Redeploy"**
   - Wait for redeployment to complete

---

## ✅ Step 3: Check Vercel Build Logs

1. **In Vercel Dashboard:**
   - Go to **Deployments** tab
   - Click on the latest deployment
   - Click **"Build Logs"** or **"Function Logs"**

2. **Look for:**
   - Build errors
   - Missing dependencies
   - Environment variable warnings

---

## ✅ Step 4: Verify Supabase Connection

1. **Get Your Supabase Credentials:**
   - Go to: https://supabase.com/dashboard
   - Select your project
   - Go to **Settings** → **API**
   - Copy:
     - **Project URL** (for `VITE_SUPABASE_URL`)
     - **anon public** key (for `VITE_SUPABASE_ANON_KEY`)

2. **Format:**
   ```
   VITE_SUPABASE_URL=https://xxxxx.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

---

## ✅ Step 5: Quick Fix Checklist

- [ ] Environment variables added in Vercel
- [ ] Variables set for **Production** environment
- [ ] Redeployed after adding variables
- [ ] Checked browser console for errors
- [ ] Verified Supabase credentials are correct
- [ ] Checked Vercel build logs

---

## 🆘 Common Errors & Solutions

### Error: "VITE_SUPABASE_URL is not defined"
**Solution:** Add environment variable in Vercel Settings

### Error: "Failed to fetch" or "Network error"
**Solution:** 
- Check Supabase URL is correct
- Verify Supabase project is active
- Check CORS settings in Supabase

### Error: "Cannot read property of undefined"
**Solution:** 
- Check browser console for full error
- Usually means environment variable not loaded
- Redeploy after adding variables

### Blank page with no console errors
**Solution:**
- Check if `index.html` is loading (Network tab)
- Verify build output includes `dist/index.html`
- Check Vercel build logs for warnings

---

## 🔄 After Fixing: Redeploy

1. **Add/Update Environment Variables**
2. **Go to Deployments → Latest → Redeploy**
3. **Wait 2-3 minutes**
4. **Refresh your browser** (hard refresh: `Ctrl+Shift+R`)

---

## 📞 Still Not Working?

Share:
1. Browser console errors (screenshot)
2. Vercel build logs (any errors?)
3. Environment variables status (are they set?)

