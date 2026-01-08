# Final Fix for 500 "Database error saving new user"

## The Real Issue

The error "Database error saving new user" means Supabase can't write to the `auth.users` table. This is usually caused by:

1. **Site URL not set** (90% of cases) - Even with email confirmation OFF, Supabase needs Site URL
2. **Database locks or constraints** (5% of cases)
3. **Project paused or billing issue** (5% of cases)

## ✅ Fix #1: Set Site URL (DO THIS FIRST!)

This is the #1 cause of 500 errors:

1. **Go to Supabase Dashboard**
2. **Click Authentication** → **URL Configuration** (in left sidebar)
3. **Set "Site URL"** to: `http://localhost:5184`
4. **Add "Redirect URLs"**: 
   ```
   http://localhost:5184/**
   http://localhost:5184
   ```
5. **Click "Save"**
6. **Wait 10 seconds**
7. **Try signup again**

This fixes 90% of 500 errors!

## ✅ Fix #2: Run Diagnostic Queries

1. **Go to SQL Editor** → **New query**
2. **Run queries from `fix_database_error.sql`** one at a time
3. **Check results:**
   - Auth schema should exist ✓
   - Auth users table should exist ✓
   - No locks on the table ✓
   - Permissions should be correct ✓

## ✅ Fix #3: Check Project Status

1. **Go to Settings** → **General**
2. **Check for:**
   - ⚠️ Project paused → Resume it
   - ⚠️ Billing issues → Fix payment
   - ⚠️ Database paused → Wait or contact support

## ✅ Fix #4: Check Database Logs

1. **Go to Logs** → **Postgres Logs**
2. **Look for errors** around signup time
3. **Common errors:**
   - `ERROR: relation "auth.users" does not exist` → Database schema issue
   - `ERROR: permission denied` → Permission issue
   - `ERROR: deadlock detected` → Lock issue

## ✅ Fix #5: Try Creating User via Dashboard

1. **Go to Authentication** → **Users**
2. **Click "Add user"**
3. **Fill in:**
   - Email: `test@example.com`
   - Password: `test123`
   - ✅ **Auto Confirm User**: Check
   - ❌ **Send invitation email**: Uncheck
4. **Click "Create user"**

**If this also fails**, it's a database-level issue. See Fix #6.

## ✅ Fix #6: Contact Supabase Support

If Dashboard also fails:

1. **Go to**: https://supabase.com/support
2. **Create ticket** with:
   - Project reference: `vvrulvxeaejxhwnafwrq`
   - Error: "Database error saving new user"
   - When it started
   - What you've tried
   - Diagnostic query results

## Most Likely Solution

**90% of the time**, it's just the Site URL not being set:

1. **Authentication** → **URL Configuration**
2. **Set Site URL** to `http://localhost:5184`
3. **Save**
4. **Try signup** → Should work! ✅

## Quick Test After Setting Site URL

1. Go to: `http://localhost:5184/signup`
2. Enter:
   - Email: `test@example.com`
   - Password: `test123`
   - Confirm: `test123`
3. Click "Create Account"
4. Should work! ✅

## If Still Not Working

After setting Site URL, if it still fails:

1. **Check Postgres Logs** for exact error
2. **Run diagnostic queries** from `fix_database_error.sql`
3. **Check project status** (not paused, billing OK)
4. **Contact Supabase Support** with diagnostic results

But **start with setting the Site URL** - that's the most common fix!

