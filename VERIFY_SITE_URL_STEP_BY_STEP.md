# Step-by-Step: Verify Site URL and Fix 500 Error

## ✅ Database is Healthy!

Since your diagnostic queries show:
- ✓ Auth schema exists
- ✓ Auth users table exists  
- ✓ No locks on the table
- ✓ Permissions are correct

The database is fine! The issue is likely **Site URL not set**.

## Step 1: Check Site URL Setting

### Visual Guide:

1. **Go to Supabase Dashboard**
   - URL: https://supabase.com/dashboard
   - Select your project: `vvrulvxeaejxhwnafwrq`

2. **Click "Authentication"** in the left sidebar
   - It's under the "CONFIGURATION" section
   - Has a key icon 🔑

3. **Click "URL Configuration"**
   - It's below "Emails" in the left sidebar
   - Or go directly: **Authentication** → **URL Configuration**

4. **Check "Site URL" field**
   - Is it empty? → **This is the problem!**
   - Does it say something else? → Might be wrong URL
   - Should be: `http://localhost:5184`

5. **Check "Redirect URLs"**
   - Should include: `http://localhost:5184/**`
   - Or at least: `http://localhost:5184`

## Step 2: Set Site URL (If Not Set)

1. **In "Site URL" field**, enter:
   ```
   http://localhost:5184
   ```

2. **In "Redirect URLs"**, click "Add URL" and enter:
   ```
   http://localhost:5184/**
   ```
   Then click "Add URL" again and enter:
   ```
   http://localhost:5184
   ```

3. **Click "Save"** button (usually at bottom of page)

4. **Wait 10-15 seconds** for changes to propagate

## Step 3: Verify Other Settings

While you're in Authentication settings, also check:

1. **Go to Authentication → Settings** (or "Policies")
2. **Verify:**
   - ✅ "Allow new users to sign up" = **ON** (green toggle)
   - ✅ "Confirm email" = **OFF** (gray toggle)
   - ✅ "Email" provider = **Enabled** (green checkmark)

## Step 4: Test Signup

1. **Go to your app**: `http://localhost:5184/signup`
2. **Enter:**
   - Email: `test@example.com`
   - Password: `test123`
   - Confirm Password: `test123`
3. **Click "Create Account"**
4. **Should work now!** ✅

## Step 5: If Still Fails - Check Logs

1. **Go to Supabase Dashboard** → **Logs** → **Postgres Logs**
2. **Try to signup again** (while logs are open)
3. **Look for new error messages** that appear
4. **Copy the exact error** - it will tell you what's wrong

## Step 6: Check Project Status

1. **Go to Settings** → **General**
2. **Check for:**
   - ⚠️ Red banner saying "Project paused" → Click "Resume"
   - ⚠️ Red banner saying "Billing issue" → Fix payment
   - ⚠️ Any warnings or errors

## Quick Checklist

Before testing signup, verify:

- [ ] **Site URL** = `http://localhost:5184` ✓
- [ ] **Redirect URLs** includes `http://localhost:5184/**` ✓
- [ ] **Settings saved** (clicked Save button) ✓
- [ ] **Waited 10 seconds** after saving ✓
- [ ] **"Allow new users to sign up"** = ON ✓
- [ ] **"Confirm email"** = OFF ✓
- [ ] **Project is not paused** ✓

## Most Likely Fix

**90% chance**: Site URL is not set or wrong.

**Fix**: Set it to `http://localhost:5184` and save.

## If Site URL is Already Set

If Site URL is already set correctly, check:

1. **Postgres Logs** for exact error message
2. **Project status** (not paused, billing OK)
3. **Try different email** (maybe email already exists)
4. **Contact Supabase Support** with:
   - Project: `vvrulvxeaejxhwnafwrq`
   - Error: "Database error saving new user"
   - Database checks: All passed ✓
   - Site URL: (tell them what it's set to)

## Visual Location

```
Supabase Dashboard
├── Authentication (left sidebar)
    ├── Users
    ├── Policies
    ├── Sign In / Providers
    ├── Sessions
    ├── Rate Limits
    ├── Emails
    └── URL Configuration ← GO HERE!
        ├── Site URL ← SET THIS!
        └── Redirect URLs ← ADD THESE!
```

