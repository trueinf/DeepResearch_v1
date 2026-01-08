# Check Errors Via SQL (Alternative to Logs)

## ✅ If You Can't Access Postgres Logs UI

Use SQL Editor to check for issues:

## Step 1: Open SQL Editor

1. **Go to**: Supabase Dashboard
2. **Click**: "SQL Editor" in left sidebar
3. **Click**: "New query"

## Step 2: Run Diagnostic Queries

### Query 1: Check Database Size (Most Common Issue)
```sql
SELECT 
  pg_size_pretty(pg_database_size(current_database())) as database_size,
  pg_size_pretty(
    (SELECT setting::bigint FROM pg_settings WHERE name = 'max_database_size')
  ) as max_size;
```

**If database_size is close to max_size**: That's the problem!

### Query 2: Check Auth Users Table
```sql
SELECT 
  COUNT(*) as total_users,
  MAX(created_at) as last_user_created
FROM auth.users;
```

**If this fails**: Table might have issues

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

**Should show**: INSERT, SELECT, UPDATE permissions

### Query 4: Try to See What Blocks Inserts
```sql
-- Check for constraints
SELECT 
  constraint_name,
  constraint_type
FROM information_schema.table_constraints
WHERE table_schema = 'auth' 
  AND table_name = 'users'
  AND constraint_type = 'CHECK';
```

### Query 5: Check Database Connection
```sql
SELECT 
  current_database() as db_name,
  current_user as current_user,
  version() as postgres_version,
  now() as current_time;
```

**If this works**: Database is accessible

## Step 3: Check Project Status via SQL

```sql
-- Check if database is in read-only mode
SHOW default_transaction_read_only;

-- Should return: off (if on, that's the problem!)
```

## 🎯 What to Look For

After running queries:

1. **Database size** - Is it at quota?
2. **Table exists** - Does auth.users exist?
3. **Permissions** - Are INSERT permissions present?
4. **Constraints** - Are there blocking constraints?
5. **Read-only** - Is database in read-only mode?

## 💡 If SQL Editor Also Doesn't Work

Then the issue might be:
- **Project paused**
- **Billing issue**
- **Account restrictions**

Check: **Settings → General** for project status

