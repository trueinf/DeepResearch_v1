# 🔐 Add Environment Variables to Vercel - Detailed Guide

## 📋 Step-by-Step Instructions

### Step 1: Navigate to Environment Variables

1. **Go to Vercel Dashboard:**
   - Visit: https://vercel.com/dashboard
   - Or directly: https://vercel.com/trueinfs-projects/askdepth-gemini

2. **Click on Your Project:**
   - Click: **`askdepth-gemini`** (your project name)

3. **Go to Settings:**
   - Click: **"Settings"** tab (in the top navigation bar)

4. **Find Environment Variables:**
   - In the **left sidebar**, look for **"Environment Variables"**
   - Click: **"Environment Variables"**

**Direct Link:** https://vercel.com/trueinfs-projects/askdepth-gemini/settings/environment-variables

---

### Step 2: Add First Environment Variable (VITE_SUPABASE_URL)

1. **Click "Add New" Button:**
   - You'll see a button labeled **"Add New"** or **"Add Environment Variable"**
   - Click it

2. **Fill in the Details:**
   - **Key (Name):** Type exactly: `VITE_SUPABASE_URL`
     - ⚠️ **Important:** Must be exact, case-sensitive!
   - **Value:** Type: `https://vvrulvxeaejxhwnafwrq.supabase.co`
     - ⚠️ **Important:** Include `https://` at the beginning!

3. **Select Environments:**
   - Check all three boxes:
     - ✅ **Production**
     - ✅ **Preview**
     - ✅ **Development**
   - (This ensures it works in all environments)

4. **Click "Save":**
   - Click the **"Save"** button

---

### Step 3: Add Second Environment Variable (VITE_SUPABASE_ANON_KEY)

1. **Click "Add New" Again:**
   - Click **"Add New"** button again

2. **Fill in the Details:**
   - **Key (Name):** Type exactly: `VITE_SUPABASE_ANON_KEY`
     - ⚠️ **Important:** Must be exact, case-sensitive!
   - **Value:** Get this from your `.env` file:
     - Open your project folder
     - Open `.env` file
     - Find the line: `VITE_SUPABASE_ANON_KEY=...`
     - Copy the value after the `=` sign
     - Paste it here
     - **Example:** `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` (long string)

3. **Select Environments:**
   - Check all three boxes:
     - ✅ **Production**
     - ✅ **Preview**
     - ✅ **Development**

4. **Click "Save":**
   - Click the **"Save"** button

---

### Step 4: Verify Environment Variables

After adding both, you should see:

```
VITE_SUPABASE_URL
  Production, Preview, Development
  https://vvrulvxeaejxhwnafwrq.supabase.co

VITE_SUPABASE_ANON_KEY
  Production, Preview, Development
  eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... (your key)
```

---

### Step 5: Redeploy Your Application

**Important:** Environment variables only take effect after redeployment!

#### Option A: Redeploy via Dashboard (Easiest)

1. **Go to Deployments:**
   - Click: **"Deployments"** tab (top navigation)

2. **Find Latest Deployment:**
   - You'll see your latest deployment

3. **Click Redeploy:**
   - Click the **"..."** (three dots) button on the deployment
   - Click: **"Redeploy"**
   - OR click the **"Redeploy"** button at the top right

4. **Wait for Deployment:**
   - Wait 1-2 minutes
   - Status will change to "Ready"

#### Option B: Redeploy via CLI

```powershell
vercel --prod
```

---

## 🔍 How to Find Your Supabase Anon Key

### Method 1: From .env File

1. **Open your project folder:**
   - Navigate to: `C:\Users\karth\Downloads\askDepth_gemini\askDepth_gemini`

2. **Open `.env` file:**
   - Look for a file named `.env`
   - Open it with a text editor

3. **Find the key:**
   - Look for: `VITE_SUPABASE_ANON_KEY=`
   - Copy everything after the `=` sign

### Method 2: From Supabase Dashboard

1. **Go to Supabase:**
   - Visit: https://supabase.com/dashboard
   - Login to your account

2. **Select Your Project:**
   - Click on your project

3. **Go to Settings:**
   - Click: **"Settings"** (gear icon in sidebar)
   - Click: **"API"**

4. **Copy Anon Key:**
   - Find: **"anon"** or **"public"** key
   - Click the copy icon
   - This is your `VITE_SUPABASE_ANON_KEY`

---

## ✅ Verification Checklist

After adding environment variables, verify:

- [ ] `VITE_SUPABASE_URL` is added
- [ ] `VITE_SUPABASE_ANON_KEY` is added
- [ ] Both are set for Production, Preview, and Development
- [ ] You've redeployed the application
- [ ] Deployment status is "Ready"
- [ ] You've tested the live URL

---

## 🧪 Test Your Application

1. **Visit your live URL:**
   - Go to: https://askdepth-gemini.vercel.app

2. **Test Features:**
   - Try to sign up/login
   - Try to create a research query
   - Check if Supabase connection works

3. **Check Browser Console:**
   - Press `F12` to open Developer Tools
   - Go to "Console" tab
   - Look for any errors related to Supabase

---

## ⚠️ Common Mistakes to Avoid

### ❌ Wrong Variable Names
- ❌ `SUPABASE_URL` (missing `VITE_` prefix)
- ❌ `vite_supabase_url` (wrong case)
- ✅ `VITE_SUPABASE_URL` (correct!)

### ❌ Missing HTTPS
- ❌ `vvrulvxeaejxhwnafwrq.supabase.co` (missing https://)
- ✅ `https://vvrulvxeaejxhwnafwrq.supabase.co` (correct!)

### ❌ Not Selecting All Environments
- ❌ Only Production selected
- ✅ Production, Preview, Development all selected

### ❌ Forgetting to Redeploy
- ❌ Adding variables but not redeploying
- ✅ Always redeploy after adding variables!

---

## 🔧 Troubleshooting

### Issue: Variables not working after redeploy

**Solution:**
1. Double-check variable names (case-sensitive!)
2. Verify values are correct (no extra spaces)
3. Make sure all environments are selected
4. Try redeploying again

### Issue: Can't find .env file

**Solution:**
- Get the key from Supabase Dashboard instead
- Go to: Supabase → Settings → API → Copy "anon" key

### Issue: App still shows errors

**Solution:**
1. Check browser console for specific errors
2. Verify Supabase project is active
3. Check if Supabase URL is correct
4. Make sure anon key is correct

---

## 📝 Quick Reference

**Environment Variables to Add:**

```
VITE_SUPABASE_URL
Value: https://vvrulvxeaejxhwnafwrq.supabase.co
Environments: Production, Preview, Development

VITE_SUPABASE_ANON_KEY
Value: (your anon key from .env or Supabase Dashboard)
Environments: Production, Preview, Development
```

**After Adding:**
1. Save both variables
2. Go to Deployments tab
3. Click Redeploy
4. Wait for deployment
5. Test your app!

---

## 🎉 Success!

Once you've:
- ✅ Added both environment variables
- ✅ Selected all environments
- ✅ Redeployed
- ✅ Tested the app

Your application is ready to share! 🚀

**Share this URL:** https://askdepth-gemini.vercel.app

