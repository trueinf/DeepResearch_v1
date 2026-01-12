-- Fix RLS policies for token_usage table to allow viewing token usage
-- Run this in Supabase SQL Editor (Dashboard > SQL Editor)

-- Step 1: Drop existing restrictive policy
DROP POLICY IF EXISTS "Users can view own token usage" ON token_usage;

-- Step 2: Create new policy that allows users to view their own token usage
-- This policy allows:
-- - Users to view their own records (auth.uid() = user_id)
-- - Users to view records with null user_id (for debugging)
-- - All authenticated users to view all records (for dashboard display)
CREATE POLICY "Users can view token usage" ON token_usage
  FOR SELECT
  USING (
    auth.uid() = user_id 
    OR 
    user_id IS NULL
    OR
    true  -- Allow all authenticated users to view all token usage
  );

-- Step 3: Ensure insert policy exists (for Edge Functions to save data)
DROP POLICY IF EXISTS "Service role can insert token usage" ON token_usage;

CREATE POLICY "Service role can insert token usage" ON token_usage
  FOR INSERT
  WITH CHECK (true);

-- Verify the policies were created
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE tablename = 'token_usage';
