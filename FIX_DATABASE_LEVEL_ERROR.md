# Fix "Database error creating new user" - Project Level Issue

## ⚠️ Critical Issue

If **even the Supabase Dashboard** can't create users, this is a **project-level database issue**, not a code issue.

## Immediate Actions

### 1. Check Project Status

1. Go to **Supabase Dashboard** → **Settings** → **General**
2. Check for:
   - ⚠️ **Project paused** warning
   - ⚠️ **Billing issues** (red banner at top)
   - ⚠️ **Database paused** status
   - ⚠️ **Any error messages**

### 2. Check Database Status

1. Go to **Settings** → **Database**
2. Verify:
   - Database is **"Active"** (not paused)
   - No connection errors
   - No storage quota exceeded

### 3. Check Billing

1. Go to **Settings** → **Billing**
2. Verify:
   - Account is active
   - No payment issues
   - Not over quota

### 4. Run Diagnostic Queries

1. Go to **SQL Editor** → **New query**
2. Copy and run queries from `diagnose_auth_issue.sql`
3. Check results:
   - Auth schema should exist
   - Auth.users table should exist
   - Should have proper permissions

### 5. Check Project Logs

1. Go to **Logs** → **Postgres Logs**
2. Look for errors around the time you tried to create user
3. Look for:
   - `ERROR` messages
   - `FATAL` messages
   - Database connection issues
   - Permission denied errors

## Common Causes & Fixes

### Cause 1: Project Paused (Most Common)

**Symptom**: Project shows "Paused" status

**Fix**:
1. Go to **Settings** → **General**
2. Click **"Resume project"** or **"Restore project"**
3. Wait for project to restart
4. Try creating user again

### Cause 2: Database Storage Full

**Symptom**: Storage quota exceeded

**Fix**:
1. Go to **Settings** → **Database**
2. Check storage usage
3. If full:
   - Delete unused data
   - Upgrade plan
   - Contact support

### Cause 3: Auth Schema Corrupted

**Symptom**: Diagnostic queries fail or return unexpected results

**Fix**:
1. **DO NOT** try to fix manually (can break everything)
2. Contact Supabase Support immediately
3. Provide:
   - Project reference: `vvrulvxeaejxhwnafwrq`
   - Error message: "Database error creating new user"
   - Steps to reproduce

### Cause 4: Database Connection Issues

**Symptom**: Database shows as "Unavailable" or connection errors

**Fix**:
1. Wait 5-10 minutes (might be temporary)
2. Check Supabase Status: https://status.supabase.com
3. If status is down, wait for fix
4. If status is up, contact support

## Workaround: Create New Project

If nothing works, you might need to:

1. **Create a new Supabase project**
2. **Copy your schema** (if you have custom tables)
3. **Update your `.env`** with new project credentials
4. **Redeploy Edge Functions**

This is a last resort, but sometimes a fresh project fixes database issues.

## Contact Supabase Support

If none of the above work:

1. Go to: https://supabase.com/support
2. Create a support ticket
3. Include:
   - Project reference: `vvrulvxeaejxhwnafwrq`
   - Error: "Database error creating new user"
   - When it started
   - What you've tried
   - Diagnostic query results (from step 4 above)

## Quick Test: Check Other Operations

Try these to see if it's just user creation or broader issue:

1. **Can you query data?**
   - Go to **Table Editor**
   - Try to read from any table
   - If this fails, database is down

2. **Can you create other resources?**
   - Try creating a table
   - If this fails, database has write issues

3. **Check API access**
   - Try a simple query via API
   - If this fails, there's a broader issue

## Most Likely Fix

**90% of the time**, this is:
- Project paused → Resume it
- Billing issue → Fix payment
- Temporary outage → Wait 10 minutes

Check these first before contacting support!

