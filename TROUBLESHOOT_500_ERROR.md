# Troubleshoot 500 Error - Step by Step

## You've Already Verified:
- ✅ Site URL = `http://localhost:5184`
- ✅ Redirect URLs = `http://localhost:5184`
- ✅ Database = Healthy
- ✅ Email confirmation = OFF
- ✅ Email provider = Enabled

## But Still Getting 500 Error

### Step 1: Verify Site URL is Actually Saved

1. **Go to**: Authentication → URL Configuration
2. **Check "Site URL" field**:
   - Is it exactly: `http://localhost:5184`? (no trailing slash)
   - If it's different, change it and **click "Save changes"**
3. **Check "Redirect URLs"**:
   - Should have: `http://localhost:5184/**`
   - If missing, add it and **click "Save changes"**
4. **Wait 30 seconds** after saving (changes need time to propagate)

### Step 2: Clear Browser Cache

The error might be cached:

1. **Open browser DevTools** (F12)
2. **Right-click the refresh button**
3. **Select "Empty Cache and Hard Reload"**
4. **Or**: Press `Ctrl + Shift + Delete` → Clear cache
5. **Try signup again**

### Step 3: Fix Billing Warning (Most Likely Cause)

The red "Missing Billing Information" banner can cause 500 errors:

1. **Click the red banner** at top of Supabase Dashboard
2. **Or go to**: Settings → Billing
3. **Add billing address**:
   - Enter any address (can be test address)
   - For business: Add tax ID (optional)
4. **Save**
5. **Wait 1-2 minutes**
6. **Try signup again**

### Step 4: Check Postgres Logs for Exact Error

1. **Go to**: Logs → Postgres Logs
2. **Try to signup** (while logs are open)
3. **Look for new ERROR messages**
4. **Copy the exact error** - it will tell you the real cause

### Step 5: Try Creating User via Dashboard

Test if it's a code issue or Supabase issue:

1. **Go to**: Authentication → Users → Add user
2. **Fill in**:
   - Email: `test@example.com`
   - Password: `test123`
   - ✅ Auto Confirm User
   - ❌ Send invitation email
3. **Click "Create user"**

**If Dashboard also fails**: It's a Supabase project issue (billing/restrictions)
**If Dashboard works**: It's a code/API issue

### Step 6: Check Authentication Settings Again

1. **Go to**: Authentication → Settings (or "Policies")
2. **Verify**:
   - ✅ "Allow new users to sign up" = **ON** (green toggle)
   - ✅ "Confirm email" = **OFF** (gray toggle)
3. **If different, change and save**

### Step 7: Test with Different Email

Maybe the email already exists:

1. **Try a different email**: `test2@example.com`
2. **Use same password**: `test123`
3. **See if it works**

### Step 8: Check Network Tab for Exact Error

1. **Open DevTools** → **Network tab**
2. **Try signup**
3. **Find the failed request** (red, status 500)
4. **Click it** → **Check "Response" tab**
5. **Copy the exact error message**

## Most Likely Fixes (In Order)

1. **Billing warning** → Add billing info (90% chance)
2. **Site URL not saved** → Re-save it
3. **Browser cache** → Clear cache
4. **Email already exists** → Try different email
5. **Project paused** → Resume project

## Quick Test

After fixing billing:

1. **Wait 2 minutes**
2. **Go to**: `http://localhost:5184/signup`
3. **Enter**: `test@example.com` / `test123`
4. **Click "Create Account"**
5. **Should work!** ✅

## If Nothing Works

Contact Supabase Support with:
- Project: `vvrulvxeaejxhwnafwrq`
- Error: "Database error saving new user" (500)
- What you've tried: (list all steps)
- Postgres log errors: (copy from Step 4)

