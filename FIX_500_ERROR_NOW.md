# Fix 500 Signup Error - Quick Guide

## ✅ What I've Added

1. **Workaround Page**: `/create-user` - Creates users directly via Management API
2. **Better Error Logging**: More detailed console errors
3. **Improved Error Messages**: Clearer instructions

## 🔧 Fix #1: Set Site URL (Most Common Fix)

**90% of 500 errors are caused by missing Site URL:**

1. Go to **Supabase Dashboard**
2. Click **Authentication** → **URL Configuration** (in left sidebar)
3. Set **"Site URL"** to: `http://localhost:5184`
4. Add **"Redirect URLs"**: `http://localhost:5184/**`
5. Click **"Save"**
6. Wait 10 seconds
7. Try signup again

## 🔧 Fix #2: Use Workaround Page

If Site URL fix doesn't work, use the Management API workaround:

1. **Get Service Role Key**:
   - Go to **Supabase Dashboard** → **Settings** → **API**
   - Copy the **`service_role`** key (NOT anon key - this is secret!)

2. **Use Workaround Page**:
   - Go to: `http://localhost:5184/create-user`
   - Enter:
     - Service Role Key (from step 1)
     - Email: `test@example.com`
     - Password: `test123`
   - Click **"Create User"**
   - User will be created and auto-confirmed
   - You'll be redirected to login

## 🔍 Debug: Check Exact Error

1. Open **Chrome DevTools** (F12)
2. Go to **Console** tab
3. Try to signup
4. Look for error message with details
5. Check the **Network** tab:
   - Find the `signup` request
   - Click it
   - Check **"Response"** tab for exact error

## 📋 Checklist

Before trying signup, verify:

- [ ] **Authentication** → **Settings**:
  - [ ] "Allow new users to sign up" = ON ✅
  - [ ] "Confirm email" = OFF ✅

- [ ] **Authentication** → **URL Configuration**:
  - [ ] "Site URL" = `http://localhost:5184` ⚠️ **CHECK THIS**
  - [ ] "Redirect URLs" includes `http://localhost:5184/**` ⚠️ **CHECK THIS**

- [ ] **Project Status**:
  - [ ] No warnings in dashboard
  - [ ] Database is running

## 🚀 Quick Test

**Option A: Regular Signup (after setting Site URL)**
1. Go to `/signup`
2. Fill form
3. Should work ✅

**Option B: Workaround (if Option A fails)**
1. Get Service Role Key from Supabase
2. Go to `/create-user`
3. Fill form with Service Role Key
4. User created ✅

## 💡 Why 500 Error Happens

Even with "Confirm email" OFF, Supabase still needs:
- **Site URL** set (for redirects and validation)
- **Valid project configuration**

Missing Site URL = 500 error, even if email confirmation is disabled.

## 🆘 Still Not Working?

1. Check **Supabase Logs**:
   - Go to **Logs** → **Auth Logs**
   - Look for errors at signup time
   - Copy the exact error message

2. Check **Network Tab**:
   - Open DevTools → Network
   - Try signup
   - Click the failed `signup` request
   - Check **Response** tab for exact error

3. Try **Different Email**:
   - Maybe email already exists
   - Try: `test2@example.com`

4. **Contact Support**:
   - Share exact error from logs
   - Share your Supabase project reference

