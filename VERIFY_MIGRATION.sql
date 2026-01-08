-- Verification Queries for slide_jobs Migration
-- Run these in Supabase SQL Editor to check if migration was successful

-- 1. Check if slide_jobs table exists
SELECT table_name, table_schema
FROM information_schema.tables 
WHERE table_name = 'slide_jobs';

-- 2. Check table structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'slide_jobs'
ORDER BY ordinal_position;

-- 3. Check foreign key constraints
SELECT 
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.table_name = 'slide_jobs'
  AND tc.constraint_type = 'FOREIGN KEY';

-- 4. Check indexes
SELECT 
    indexname,
    indexdef
FROM pg_indexes
WHERE tablename = 'slide_jobs';

-- 5. Check RLS is enabled
SELECT 
    tablename,
    rowsecurity
FROM pg_tables
WHERE tablename = 'slide_jobs';

-- 6. Check RLS policies
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'slide_jobs';

-- 7. Check storage bucket exists
SELECT id, name, public, created_at
FROM storage.buckets
WHERE id = 'ppt-results';

-- 8. Check storage policies
SELECT 
    schemaname,
    tablename,
    policyname
FROM pg_policies
WHERE tablename = 'objects' 
  AND schemaname = 'storage'
  AND policyname LIKE '%PPT%' OR policyname LIKE '%ppt%';

-- 9. Test insert (if you're authenticated)
-- Uncomment and run if you want to test:
-- INSERT INTO slide_jobs (user_id, ppt_plan, status)
-- VALUES (auth.uid(), '{"slides": []}'::jsonb, 'pending')
-- RETURNING id, status, created_at;

-- 10. Count existing jobs
SELECT COUNT(*) as total_jobs FROM slide_jobs;

