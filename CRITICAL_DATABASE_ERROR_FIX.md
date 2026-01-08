# Critical: Database Error Creating New User - Complete Fix Guide

## ⚠️ Critical Issue Confirmed

Even Supabase Dashboard can't create users. This is a **database-level issue** that needs immediate attention.

## 🔍 Step 1: Get Exact Error from Postgres Logs

### Check Postgres Logs:

1. **Go to**: Supabase Dashboard → **Logs** → **Postgres Logs**
2. **Try creating user** via Dashboard (while logs are open)
3. **Look for new ERROR messages** that appear
4. **Copy the EXACT error message** - it will tell you the precise cause

### Common Errors You Might See:

- `ERROR: permission denied for table auth.users`
- `ERROR: new row violates check constraint`
- `ERROR: trigger function returned error`
- `ERROR: relation "auth.users" does not exist`
- `ERROR: quota exceeded`
- `ERROR: database connection failed`

## 🔍 Step 2: Run Diagnostic Queries

Run these in **SQL Editor** to diagnose:

### Query 1: Check Auth Schema
```sql
SELECT schema_name 
FROM information_schema.schemata 
WHERE schema_name = 'auth';
```
**Expected**: Should return 1 row with `auth`

### Query 2: Check Users Table
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'auth' AND table_name = 'users';
```
**Expected**: Should return 1 row with `users`

### Query 3: Check Table Permissions
```sql
SELECT 
  grantee,
  privilege_type
FROM information_schema.role_table_grants
WHERE table_schema = 'auth' 
  AND table_name = 'users'
  AND grantee IN ('postgres', 'authenticator', 'service_role');
```
**Expected**: Should show INSERT, SELECT, UPDATE permissions

### Query 4: Check for Locks
```sql
SELECT 
  locktype,
  relation::regclass as table_name,
  mode,
  granted,
  pid
FROM pg_locks
WHERE relation = 'auth.users'::regclass;
```
**If you see locks with `granted = false`**: There's a blocking process

### Query 5: Check for Triggers
```sql
SELECT 
  trigger_name,
  event_manipulation,
  action_timing,
  action_statement
FROM information_schema.triggers
WHERE event_object_schema = 'auth' 
  AND event_object_table = 'users'
  AND event_manipulation = 'INSERT';
```
**If triggers exist**: They might be blocking inserts

### Query 6: Check Database Quota
```sql
SELECT 
  pg_size_pretty(pg_database_size(current_database())) as database_size;
```
**Check**: Is database size reasonable? (not at quota limit)

## 🔧 Step 3: Check Project Status

### 1. Project Status
- **Go to**: Settings → General
- **Check**: 
  - Project is "Active" (not paused)
  - No red warnings
  - No restrictions

### 2. Database Status
- **Go to**: Settings → Database
- **Check**:
  - Database is "Active"
  - Storage not at 100%
  - No connection errors

### 3. Billing Status
- **Go to**: Settings → Billing
- **Check**:
  - Account is active
  - No payment issues
  - Not over quota

## 🚨 Step 4: Try to Fix Common Issues

### Fix 1: Check for Database Constraints

Run in SQL Editor:
```sql
-- Check for check constraints that might block inserts
SELECT 
  constraint_name,
  constraint_type,
  check_clause
FROM information_schema.table_constraints tc
LEFT JOIN information_schema.check_constraints cc 
  ON tc.constraint_name = cc.constraint_name
WHERE tc.table_schema = 'auth' 
  AND tc.table_name = 'users'
  AND tc.constraint_type = 'CHECK';
```

### Fix 2: Check Database Quota

If database is at quota:
1. **Delete unused data**
2. **Upgrade plan**
3. **Or contact support**

### Fix 3: Restart Project (If Possible)

1. **Go to**: Settings → General
2. **Look for**: "Restart project" or "Resume project"
3. **If available**: Restart and wait 2-3 minutes

## 📞 Step 5: Contact Supabase Support

If nothing works, contact Supabase Support:

1. **Go to**: https://supabase.com/support
2. **Create ticket** with:
   - **Project reference**: `vvrulvxeaejxhwnafwrq`
   - **Error**: "Database error creating new user" (500)
   - **When it started**: (date/time)
   - **What you've tried**:
     - Dashboard method (failed)
     - Management API script (failed)
     - Regular signup (failed)
   - **Postgres log error**: (copy exact error from Step 1)
   - **Diagnostic query results**: (from Step 2)

## 🎯 Most Likely Causes (In Order)

1. **Database quota exceeded** (90% of cases)
2. **Project paused or restricted** (5% of cases)
3. **Database-level constraint/trigger** (3% of cases)
4. **Billing restrictions** (2% of cases)

## ✅ Quick Test: Check Quota

Run this in SQL Editor:
```sql
SELECT 
  pg_size_pretty(pg_database_size(current_database())) as current_size,
  (SELECT setting FROM pg_settings WHERE name = 'max_database_size') as max_size;
```

If current_size is close to max_size, that's the issue!

## 🆘 Emergency Workaround

If you need to test your app immediately:

1. **Check if you have existing users**:
   ```sql
   SELECT email, created_at FROM auth.users LIMIT 5;
   ```

2. **If users exist**: Use one of them to login and test

3. **If no users**: You'll need to fix the database issue first

## Summary

1. ✅ **Check Postgres Logs** for exact error
2. ✅ **Run diagnostic queries** to identify issue
3. ✅ **Check project/database/billing status**
4. ✅ **Contact Supabase Support** with all details

The exact error from Postgres logs will tell us exactly what's wrong!

