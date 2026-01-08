# Fix 500 Internal Server Error on Signup

## The Problem

Getting `500 Internal Server Error` when trying to sign up. This is a Supabase server-side error, usually caused by:

1. **Email confirmation enabled but email service not configured**
2. **Missing Site URL configuration**
3. **Database/auth schema issues**

## Quick Fix: Disable Email Confirmation

### Step 1: Go to Supabase Dashboard
1. Navigate to: https://supabase.com/dashboard
2. Select your project

### Step 2: Disable Email Confirmation
1. Go to **Authentication** → **Settings** (or **URL Configuration**)
2. Find **"Enable email confirmations"** or **"Confirm email"**
3. **Disable** it (uncheck/turn off)
4. Click **"Save"** or **"Update"**

### Step 3: Test Again
1. Go back to your app: `http://localhost:5184/signup`
2. Try creating an account again
3. Should work now!

## Alternative: Configure Site URL

If you want to keep email confirmation enabled:

1. Go to **Authentication** → **URL Configuration**
2. Set **"Site URL"** to: `http://localhost:5184` (or your app URL)
3. Add **"Redirect URLs"**: `http://localhost:5184/**`
4. Save changes

## Check Supabase Logs

To see the exact error:

1. Go to **Logs** → **Postgres Logs** (or **Auth Logs**)
2. Look for errors around the time you tried to sign up
3. The error message will tell you exactly what's wrong

## Common Error Messages & Fixes

### "Email service not configured"
- **Fix**: Disable email confirmation OR configure SMTP in Supabase

### "Site URL not set"
- **Fix**: Set Site URL in Authentication → URL Configuration

### "Database connection error"
- **Fix**: Check project status, verify database is running

### "Auth schema missing"
- **Fix**: This is rare - contact Supabase support

## Test After Fix

1. Go to `/signup`
2. Enter:
   - Email: `test@example.com`
   - Password: `test123`
   - Confirm: `test123`
3. Click "Create Account"
4. Should succeed and redirect to login

## If Still Not Working

1. **Check Supabase Status**: https://status.supabase.com
2. **Verify Project is Active**: No warnings in dashboard
3. **Try Management API** (see below)

## Use Management API (Bypass Dashboard Issues)

If the signup page still fails, create users via Management API:

### Get Service Role Key
1. Go to **Settings** → **API**
2. Copy **`service_role`** key (keep this secret!)

### Create User via API

```bash
curl -X POST 'https://vvrulvxeaejxhwnafwrq.supabase.co/auth/v1/admin/users' \
  -H "apikey: YOUR_SERVICE_ROLE_KEY" \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "test123456",
    "email_confirm": true,
    "user_metadata": {}
  }'
```

Replace `YOUR_SERVICE_ROLE_KEY` with your actual service role key.

## Most Likely Solution

**90% of the time**, the fix is:
1. Go to **Authentication** → **Settings**
2. **Disable "Enable email confirmations"**
3. Save
4. Try signup again

This works because email confirmation requires SMTP to be configured, which isn't set up by default on free tier projects.

