# Fixing CORS Error with Supabase

## The Issue
You're getting a CORS error when trying to save research reports to Supabase:
```
Cross-Origin Request Blocked: The Same Origin Policy disallows reading the remote resource
```

## Solutions

### Option 1: Configure Supabase CORS (Recommended)

1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Select your project
3. Go to **Settings** → **API** (or **Project Settings** → **API**)
4. Scroll down to **CORS** section
5. Add your local development URL to "Allowed Origins":
   - `http://localhost:5173` (default Vite port)
   - `http://localhost:3000` (if you're using a different port)
   - Or add `*` for development (not recommended for production)

### Option 2: Verify Environment Variables

Make sure your `.env` file has the correct values:

```env
VITE_SUPABASE_URL=https://vvrulvxeaejxhwnafwrq.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

**Important:** 
- Restart your dev server after changing `.env` file
- Make sure there are no spaces around the `=` sign
- Make sure the URL doesn't have a trailing slash

### Option 3: Check Browser Network Tab

1. Open Developer Tools (F12)
2. Go to **Network** tab
3. Try to save a research report
4. Look for the failed request to `research_reports`
5. Check:
   - **Request Headers**: Should include `Authorization: Bearer ...`
   - **Response Headers**: Should include `Access-Control-Allow-Origin`
   - **Status**: If it's 0 or null, it's a CORS issue

### Option 4: Verify Database Migration

Make sure you've run the migration to add the new columns:

```sql
-- Run this in Supabase SQL Editor
ALTER TABLE research_reports 
ADD COLUMN IF NOT EXISTS detailed_analysis TEXT;

ALTER TABLE research_reports 
ADD COLUMN IF NOT EXISTS insights TEXT;

ALTER TABLE research_reports 
ADD COLUMN IF NOT EXISTS conclusion TEXT;
```

### Option 5: Check RLS Policies

Make sure your RLS policies allow INSERT/UPDATE operations:

```sql
-- Check current policies
SELECT * FROM pg_policies WHERE tablename = 'research_reports';

-- If needed, ensure policies allow all operations (for development)
-- This should already be set in your schema.sql
```

## Testing

After making changes:
1. Clear browser cache
2. Restart your dev server
3. Try saving a research report again
4. Check the console for the new detailed logs

