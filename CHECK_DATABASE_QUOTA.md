# Check Database Quota - Most Likely Issue

## 🎯 Most Common Cause: Database Quota Exceeded

Since Postgres version is fine, check if database is at quota limit.

## Step 1: Check Database Storage

1. **Go to**: Settings → **Database** (in left sidebar)
2. **Look for**:
   - Storage usage percentage
   - Database size
   - Quota limit
3. **Check**: Is it at 100% or near the limit?

## Step 2: Check via SQL Editor

1. **Go to**: SQL Editor → New query
2. **Run this query**:
```sql
SELECT 
  pg_size_pretty(pg_database_size(current_database())) as current_size,
  (SELECT pg_size_pretty(setting::bigint) 
   FROM pg_settings 
   WHERE name = 'max_database_size') as max_size;
```

**If current_size is close to max_size**: That's the problem!

## Step 3: Check Project Plan Limits

1. **Go to**: Settings → **Billing** → **Usage**
2. **Check**:
   - Database storage usage
   - Any quota warnings
   - Plan limits

## If Quota is the Issue

### Free Tier Limits:
- **Database size**: Usually 500 MB limit
- **If exceeded**: Can't create new data (including users)

### Solutions:
1. **Delete unused data** (old researches, reports, etc.)
2. **Upgrade plan** (if needed)
3. **Contact Supabase Support** (if on free tier and need help)

## Quick Check: Delete Old Data

If database is full, delete old data:

```sql
-- Check what's taking space
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname NOT IN ('pg_catalog', 'information_schema')
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

Then delete old data from largest tables.

## Summary

- ✅ Postgres version is fine
- ⚠️ **Check database quota** - most likely cause!
- ⚠️ If at quota, delete old data or upgrade

Check your database storage usage - that's probably the issue!

