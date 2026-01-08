-- Diagnostic SQL queries to check Supabase Auth database health
-- Run these in Supabase SQL Editor: https://supabase.com/dashboard/project/YOUR_PROJECT/sql/new

-- ============================================
-- PART 1: Check Auth Schema Exists
-- ============================================
SELECT 
  schema_name,
  schema_owner
FROM information_schema.schemata 
WHERE schema_name = 'auth';

-- Expected: Should return 1 row with schema_name = 'auth'

-- ============================================
-- PART 2: Check Auth Users Table
-- ============================================
SELECT 
  table_name,
  table_schema
FROM information_schema.tables 
WHERE table_schema = 'auth' AND table_name = 'users';

-- Expected: Should return 1 row with table_name = 'users'

-- ============================================
-- PART 3: Check Table Structure
-- ============================================
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'auth' 
  AND table_name = 'users'
ORDER BY ordinal_position;

-- Expected: Should return many columns including: id, email, encrypted_password, etc.

-- ============================================
-- PART 4: Check for Constraints/Triggers
-- ============================================
-- Check constraints on auth.users
SELECT 
  constraint_name,
  constraint_type
FROM information_schema.table_constraints
WHERE table_schema = 'auth' 
  AND table_name = 'users';

-- Check triggers on auth.users
SELECT 
  trigger_name,
  event_manipulation,
  action_statement
FROM information_schema.triggers
WHERE event_object_schema = 'auth' 
  AND event_object_table = 'users';

-- ============================================
-- PART 5: Check Current Users Count
-- ============================================
SELECT COUNT(*) as total_users FROM auth.users;

-- ============================================
-- PART 6: Check Database Permissions
-- ============================================
SELECT 
  grantee,
  privilege_type
FROM information_schema.role_table_grants
WHERE table_schema = 'auth' 
  AND table_name = 'users'
  AND grantee IN ('postgres', 'authenticator', 'service_role');

-- ============================================
-- PART 7: Check for Recent Errors (if available)
-- ============================================
-- This might not work on all Supabase projects, but worth trying
SELECT 
  schemaname,
  relname as tablename,
  n_tup_ins as inserts,
  n_tup_upd as updates,
  n_tup_del as deletes
FROM pg_stat_user_tables
WHERE schemaname = 'auth' AND relname = 'users';

-- ============================================
-- PART 8: Test Basic Database Connection
-- ============================================
SELECT 
  current_database() as database_name,
  current_user as current_user,
  version() as postgres_version;

-- ============================================
-- PART 9: Check for Locked Tables
-- ============================================
SELECT 
  locktype,
  relation::regclass,
  mode,
  granted
FROM pg_locks
WHERE relation = 'auth.users'::regclass;

-- If this returns rows with granted = false, there might be a lock issue

