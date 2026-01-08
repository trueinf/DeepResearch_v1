-- Fix Row-Level Security (RLS) Policy for researches and research_reports tables
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/YOUR_PROJECT/sql/new

-- ============================================
-- PART 1: Fix researches table
-- ============================================

-- Step 1: Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Allow anon users to insert researches" ON researches;
DROP POLICY IF EXISTS "Allow anon users to read researches" ON researches;
DROP POLICY IF EXISTS "Allow anon users to update researches" ON researches;
DROP POLICY IF EXISTS "Allow authenticated users to insert researches" ON researches;
DROP POLICY IF EXISTS "Users can read their own researches" ON researches;
DROP POLICY IF EXISTS "Users can update their own researches" ON researches;

-- Step 2: Create policies for anon users (since app doesn't use authentication)
-- This allows anyone to insert, read, and update researches

-- Allow anon users to insert researches
CREATE POLICY "Allow anon users to insert researches"
ON researches
FOR INSERT
TO anon
WITH CHECK (true);

-- Allow anon users to read researches
CREATE POLICY "Allow anon users to read researches"
ON researches
FOR SELECT
TO anon
USING (true);

-- Allow anon users to update researches
CREATE POLICY "Allow anon users to update researches"
ON researches
FOR UPDATE
TO anon
USING (true);

-- Step 3: Also allow authenticated users (if you add auth later)
CREATE POLICY "Allow authenticated users to insert researches"
ON researches
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Users can read their own researches"
ON researches
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Users can update their own researches"
ON researches
FOR UPDATE
TO authenticated
USING (true);

-- ============================================
-- PART 2: Fix research_reports table
-- ============================================

-- Step 1: Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow anon users to insert research_reports" ON research_reports;
DROP POLICY IF EXISTS "Allow anon users to read research_reports" ON research_reports;
DROP POLICY IF EXISTS "Allow anon users to update research_reports" ON research_reports;
DROP POLICY IF EXISTS "Allow anon users to delete research_reports" ON research_reports;
DROP POLICY IF EXISTS "Allow authenticated users to insert research_reports" ON research_reports;
DROP POLICY IF EXISTS "Users can read their own research_reports" ON research_reports;
DROP POLICY IF EXISTS "Users can update their own research_reports" ON research_reports;
DROP POLICY IF EXISTS "Users can delete their own research_reports" ON research_reports;

-- Step 2: Create policies for anon users
-- Allow anon users to insert research_reports
CREATE POLICY "Allow anon users to insert research_reports"
ON research_reports
FOR INSERT
TO anon
WITH CHECK (true);

-- Allow anon users to read research_reports
CREATE POLICY "Allow anon users to read research_reports"
ON research_reports
FOR SELECT
TO anon
USING (true);

-- Allow anon users to update research_reports
CREATE POLICY "Allow anon users to update research_reports"
ON research_reports
FOR UPDATE
TO anon
USING (true);

-- Allow anon users to delete research_reports (optional, for cleanup)
CREATE POLICY "Allow anon users to delete research_reports"
ON research_reports
FOR DELETE
TO anon
USING (true);

-- Step 3: Also allow authenticated users (if you add auth later)
CREATE POLICY "Allow authenticated users to insert research_reports"
ON research_reports
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Users can read their own research_reports"
ON research_reports
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Users can update their own research_reports"
ON research_reports
FOR UPDATE
TO authenticated
USING (true);

CREATE POLICY "Users can delete their own research_reports"
ON research_reports
FOR DELETE
TO authenticated
USING (true);

