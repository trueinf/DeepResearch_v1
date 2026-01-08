-- Fix "Database error saving new user" issue
-- Run these queries in Supabase SQL Editor one at a time

-- ============================================
-- STEP 1: Check if auth schema and users table exist
-- ============================================
SELECT 
  'Auth schema exists' as check_name,
  CASE WHEN COUNT(*) > 0 THEN '✓ PASS' ELSE '✗ FAIL' END as status
FROM information_schema.schemata 
WHERE schema_name = 'auth';

SELECT 
  'Auth users table exists' as check_name,
  CASE WHEN COUNT(*) > 0 THEN '✓ PASS' ELSE '✗ FAIL' END as status
FROM information_schema.tables 
WHERE table_schema = 'auth' AND table_name = 'users';

-- ============================================
-- STEP 2: Check for problematic triggers or constraints
-- ============================================
-- List all triggers on auth.users
SELECT 
  trigger_name,
  event_manipulation,
  action_timing,
  action_statement
FROM information_schema.triggers
WHERE event_object_schema = 'auth' 
  AND event_object_table = 'users';

-- ============================================
-- STEP 3: Check table permissions
-- ============================================
SELECT 
  grantee,
  privilege_type
FROM information_schema.role_table_grants
WHERE table_schema = 'auth' 
  AND table_name = 'users'
ORDER BY grantee, privilege_type;

-- ============================================
-- STEP 4: Check for locks on auth.users table
-- ============================================
SELECT 
  locktype,
  relation::regclass as table_name,
  mode,
  granted,
  pid
FROM pg_locks
WHERE relation = 'auth.users'::regclass;

-- If you see locks with granted = false, that might be the issue
-- You may need to kill the blocking process (contact Supabase support)

-- ============================================
-- STEP 5: Check database connection and health
-- ============================================
SELECT 
  current_database() as database_name,
  current_user as current_user,
  version() as postgres_version;

-- ============================================
-- STEP 6: Check if there are any check constraints blocking inserts
-- ============================================
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

-- ============================================
-- STEP 7: Try to see recent errors (if log is accessible)
-- ============================================
-- This might not work on all Supabase projects
SELECT 
  schemaname,
  relname as tablename,
  n_tup_ins as total_inserts,
  n_tup_upd as total_updates,
  n_tup_del as total_deletes,
  last_vacuum,
  last_autovacuum
FROM pg_stat_user_tables
WHERE schemaname = 'auth' AND relname = 'users';

-- ============================================
-- STEP 8: Check for any custom functions that might interfere
-- ============================================
SELECT 
  routine_name,
  routine_type,
  routine_definition
FROM information_schema.routines
WHERE routine_schema = 'auth'
  AND (routine_definition LIKE '%users%' OR routine_definition LIKE '%INSERT%');

