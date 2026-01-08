# ✅ Add Environment Variables to Vercel - Step by Step

## 🎯 The Problem
Your app shows a blank page because these environment variables are missing:
- `VITE_SUPABASE_URL` ❌ Missing
- `VITE_SUPABASE_ANON_KEY` ❌ Missing

## 📋 Step-by-Step Solution

### Step 1: Get Your Supabase Credentials

1. **Go to Supabase Dashboard:**
   - Visit: https://supabase.com/dashboard
   - Sign in and select your project

2. **Navigate to API Settings:**
   - Click **"Settings"** (gear icon) in left sidebar
   - Click **"API"** in the settings menu

3. **Copy Your Credentials:**
   - **Project URL** → This is your `VITE_SUPABASE_URL`
     - Example: `https://xxxxxxxxxxxxx.supabase.co`
   - **anon public** key → This is your `VITE_SUPABASE_ANON_KEY`
     - Example: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` (long string)

---

### Step 2: Add Variables to Vercel

1. **Go to Vercel Dashboard:**
   - Visit: https://vercel.com/dashboard
   - Click on your project: **`askDepth_gemini`**

2. **Navigate to Environment Variables:**
   - Click **"Settings"** tab (top navigation)
   - Click **"Environment Variables"** in left sidebar

3. **Add First Variable:**
   - Click **"Add New"** button
   - **Key:** `VITE_SUPABASE_URL`
   - **Value:** Paste your Supabase Project URL
   - **Environment:** Check all three:
     - ☑ Production
     - ☑ Preview  
     - ☑ Development
   - Click **"Save"**

4. **Add Second Variable:**
   - Click **"Add New"** button again
   - **Key:** `VITE_SUPABASE_ANON_KEY`
   - **Value:** Paste your Supabase anon public key
   - **Environment:** Check all three:
     - ☑ Production
     - ☑ Preview
     - ☑ Development
   - Click **"Save"**

---

### Step 3: Redeploy Your Application

**Important:** After adding environment variables, you MUST redeploy!

1. **Go to Deployments Tab:**
   - Click **"Deployments"** in top navigation
   - Find your latest deployment

2. **Redeploy:**
   - Click the **"..."** (three dots) menu on the latest deployment
   - Click **"Redeploy"**
   - Confirm by clicking **"Redeploy"** again

3. **Wait for Deployment:**
   - Wait 2-3 minutes for deployment to complete
   - You'll see a progress indicator

---

### Step 4: Verify It Works

1. **Hard Refresh Your Browser:**
   - Press `Ctrl + Shift + R` (Windows)
   - Or `Cmd + Shift + R` (Mac)
   - This clears cached files

2. **Check the Console:**
   - Press `F12` to open Developer Tools
   - Go to **Console** tab
   - You should see **NO red errors** about missing variables

3. **Test Your App:**
   - The page should now load properly
   - You should see the login/signup page or dashboard

---

## ✅ Verification Checklist

After completing the steps above:

- [ ] Both environment variables added in Vercel
- [ ] Variables set for Production, Preview, and Development
- [ ] Application redeployed after adding variables
- [ ] Browser hard refreshed (`Ctrl+Shift+R`)
- [ ] Console shows no environment variable errors
- [ ] App loads successfully

---

## 🔍 How to Verify Variables Are Set

1. **In Vercel Dashboard:**
   - Go to **Settings** → **Environment Variables**
   - You should see both variables listed:
     - `VITE_SUPABASE_URL` ✓
     - `VITE_SUPABASE_ANON_KEY` ✓

2. **In Browser Console:**
   - After redeploy, open console (`F12`)
   - Should NOT see "Missing Supabase environment variables"
   - Should NOT see red errors about `VITE_SUPABASE_URL` or `VITE_SUPABASE_ANON_KEY`

---

## 🆘 Still Not Working?

### Check These:

1. **Variables Format:**
   - Make sure there are NO spaces before/after values
   - Make sure you copied the ENTIRE key (it's very long)
   - Make sure URL starts with `https://`

2. **Redeployment:**
   - Did you redeploy after adding variables?
   - Check deployment logs for any errors

3. **Browser Cache:**
   - Try incognito/private window
   - Or clear browser cache completely

4. **Variable Names:**
   - Must be exactly: `VITE_SUPABASE_URL` (case-sensitive)
   - Must be exactly: `VITE_SUPABASE_ANON_KEY` (case-sensitive)

---

## 📝 Quick Reference

**Supabase Dashboard:**
- Settings → API → Project URL & anon public key

**Vercel Dashboard:**
- Settings → Environment Variables → Add New

**After Adding:**
- Deployments → Latest → ... → Redeploy

---

## 🎉 Success!

Once variables are added and redeployed, your app should work perfectly!

