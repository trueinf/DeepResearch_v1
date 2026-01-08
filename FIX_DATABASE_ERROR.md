# Fix "Database error creating new user"

## The Problem

You're getting "Database error creating new user" which means:
- The Edge Function is deployed and working
- But the Supabase admin API can't create users in the database

## Most Likely Causes

### 1. Edge Function Secrets Not Set (90% of cases)

The Edge Function needs these secrets:

1. **Go to Supabase Dashboard** → **Edge Functions** → **Settings** → **Secrets**
2. **Add these secrets:**
   - **Name**: `SUPABASE_URL`
     **Value**: Your project URL (e.g., `https://vvrulvxeaejxhwnafwrq.supabase.co`)
   - **Name**: `SUPABASE_SERVICE_ROLE_KEY`
     **Value**: Your service_role key from **Settings** → **API** → `service_role` (click eye icon to reveal)

3. **Redeploy the function** after adding secrets

### 2. Project Database Issue

Check if your Supabase project database is healthy:

1. Go to **Settings** → **Database**
2. Check for any warnings or errors
3. Verify database is running (not paused)

### 3. Auth Schema Issue

Run this in **SQL Editor** to check auth schema:

```sql
-- Check if auth schema exists
SELECT schema_name 
FROM information_schema.schemata 
WHERE schema_name = 'auth';

-- Check auth.users table
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'auth' AND table_name = 'users';
```

If these return no results, contact Supabase support.

## Quick Fix: Create User via Dashboard

While we fix the Edge Function, create a test user manually:

1. **Go to Supabase Dashboard** → **Authentication** → **Users**
2. Click **"Add user"** (top right)
3. Fill in:
   - Email: `test@example.com`
   - Password: `test123`
   - ✅ **Auto Confirm User**: Check this
   - ❌ **Send invitation email**: Uncheck
4. Click **"Create user"**
5. User created! ✅

Now you can login with these credentials.

## Verify Edge Function Secrets

1. Go to **Edge Functions** → **create-user** → **Settings**
2. Check **"Secrets"** section
3. Should see:
   - `SUPABASE_URL` = `https://vvrulvxeaejxhwnafwrq.supabase.co`
   - `SUPABASE_SERVICE_ROLE_KEY` = `eyJ...` (long JWT string)

If missing, add them and redeploy.

## Test After Fixing

1. Go to: `http://localhost:5184/create-user`
2. Enter email and password
3. Click "Create User"
4. Should work! ✅

## Alternative: Use Regular Signup (After Setting Site URL)

If you prefer to fix regular signup:

1. Go to **Authentication** → **URL Configuration**
2. Set **"Site URL"** to: `http://localhost:5184`
3. Add **"Redirect URLs"**: `http://localhost:5184/**`
4. Save
5. Try regular signup at `/signup`

But the Edge Function approach is more reliable once secrets are set!

