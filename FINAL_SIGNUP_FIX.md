# Final Fix for 500 Signup Error

## Current Status Check

You've verified:
- ✅ "Confirm email" is OFF
- ✅ Email templates exist (but won't be used)
- ❌ Still getting 500 error

## Most Likely Causes (In Order)

### 1. Site URL Not Set (90% of cases)

**Check:**
1. Go to **Authentication** → **URL Configuration**
2. Is **"Site URL"** set? 
   - Should be: `http://localhost:5184` (or your app URL)
3. Are **"Redirect URLs"** configured?
   - Should include: `http://localhost:5184/**`

**If not set:**
- Set Site URL to: `http://localhost:5184`
- Add Redirect URL: `http://localhost:5184/**`
- Click **"Save"**
- Try signup again

### 2. Email Service Configuration Issue

Even with confirmation OFF, Supabase might still try to process emails.

**Check:**
1. Go to **Authentication** → **Emails** → **SMTP Settings**
2. Is custom SMTP configured?
   - If not, you're using built-in service (has rate limits)
   - This can cause 500 errors if rate limit is hit

**Fix:**
- The orange warning says "Set up custom SMTP" - you can ignore this for testing
- Built-in service should work for a few signups

### 3. Check Auth Logs for Exact Error

**Steps:**
1. Go to **Logs** → **Auth Logs** (or **Postgres Logs**)
2. Try to signup again
3. Immediately check logs
4. Look for the exact error message
5. This will tell you the real cause

### 4. Project Database Issues

**Check:**
1. Go to **Settings** → **Database**
2. Verify database is running
3. Check for any connection errors

## Quick Test: Check Site URL

**This is the #1 fix:**

1. Go to **Authentication** → **URL Configuration**
2. Set **"Site URL"**: `http://localhost:5184`
3. Add **"Redirect URLs"**: 
   ```
   http://localhost:5184/**
   http://localhost:5184
   ```
4. Click **"Save"**
5. Wait 10 seconds
6. Try signup again

## Alternative: Create User via Dashboard

If signup API still fails:

1. Go to **Authentication** → **Users**
2. Click **"Add user"**
3. Fill in:
   - Email: `test@example.com`
   - Password: `test123`
   - ✅ **Auto Confirm User**: Check this
   - ❌ **Send invitation email**: Uncheck
4. Click **"Create user"**
5. Now login with these credentials

## Verify Settings Checklist

Run through this checklist:

- [ ] **Sign In / Providers**:
  - [ ] "Allow new users to sign up" = ON
  - [ ] "Confirm email" = OFF ✅ (you verified this)

- [ ] **URL Configuration**:
  - [ ] "Site URL" = `http://localhost:5184` ⚠️ **CHECK THIS**
  - [ ] "Redirect URLs" includes `http://localhost:5184/**` ⚠️ **CHECK THIS**

- [ ] **Emails**:
  - [ ] Templates exist (OK, won't be used if confirmation is OFF)
  - [ ] SMTP can be unconfigured for testing

- [ ] **Project Status**:
  - [ ] No warnings in dashboard
  - [ ] Database is running

## Most Likely Fix

**Set the Site URL!** This is the #1 cause of 500 errors even when email confirmation is disabled.

1. **Authentication** → **URL Configuration**
2. Set **"Site URL"** to `http://localhost:5184`
3. Save
4. Try signup

If that doesn't work, check the Auth Logs for the exact error message.

