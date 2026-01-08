# 🔧 Fix Root Directory Error in Vercel

## ❌ Error You're Seeing

```
The specified Root Directory ".\" does not exist. Please update your Project Settings.
```

---

## 📍 Where to Fix It

### Step-by-Step Instructions:

1. **Go to Vercel Dashboard:**
   - Visit: https://vercel.com/dashboard
   - Or directly: https://vercel.com/trueinfs-projects/askdepth-gemini

2. **Navigate to Settings:**
   - Click on your project: **`askdepth-gemini`**
   - Click on **"Settings"** tab (in the top navigation)

3. **Find Root Directory:**
   - Scroll down to **"General"** section
   - Look for **"Root Directory"** field
   - It currently shows: `.\`

4. **Fix It:**
   - **Delete** the value `.\` (make it empty)
   - Or change it to: `/` (just a forward slash)
   - **Click:** "Save" button

5. **Redeploy:**
   - Go to **"Deployments"** tab
   - Click on the failed deployment
   - Click **"Redeploy"** button (top right)
   - Or click **"..."** → **"Redeploy"**

---

## 🎯 Direct Link to Settings

**Quick Access:**
https://vercel.com/trueinfs-projects/askdepth-gemini/settings

**Then:**
1. Scroll to "General" section
2. Find "Root Directory"
3. Clear it (make empty)
4. Save
5. Redeploy

---

## 📸 Visual Guide

**Navigation Path:**
```
Vercel Dashboard
  → Click "askdepth-gemini" project
    → Click "Settings" tab
      → Scroll to "General" section
        → Find "Root Directory"
          → Clear the value (make empty)
            → Click "Save"
              → Go to "Deployments" tab
                → Click "Redeploy"
```

---

## ✅ What to Set

**Root Directory should be:**
- **Empty** (blank) - Recommended
- OR `/` (just forward slash)
- **NOT** `.\` (this is Windows path, doesn't work on Vercel)

---

## 🔄 After Fixing

1. **Save** the settings
2. **Go to:** Deployments tab
3. **Click:** "Redeploy" on the failed deployment
4. **Wait:** 1-2 minutes
5. **Check:** Build should succeed now!

---

## 🎉 Quick Fix Summary

**Location:** 
- Vercel Dashboard → Your Project → Settings → General → Root Directory

**Action:**
- Clear the value (make it empty)
- Save
- Redeploy

**That's it!** ✅

