# How to Run the Database Migration

## File: `supabase/migrations/20250120000000_create_slide_jobs.sql`

This migration creates the database structure needed for Level-6 PPT rendering.

---

## Option 1: Via Supabase Dashboard (Easiest)

### Steps:

1. **Open Supabase Dashboard**
   - Go to [https://app.supabase.com](https://app.supabase.com)
   - Select your project

2. **Navigate to SQL Editor**
   - Click "SQL Editor" in the left sidebar
   - Click "New query" button (top right)

3. **Copy Migration SQL**
   - Open the file: `supabase/migrations/20250120000000_create_slide_jobs.sql`
   - Copy **ALL** the contents (Ctrl+A, Ctrl+C)

4. **Paste and Run**
   - Paste into the SQL Editor
   - Click "Run" button (or press `Ctrl+Enter`)
   - Wait for "Success" message

5. **Verify**
   - Run this query to check:
   ```sql
   SELECT table_name 
   FROM information_schema.tables 
   WHERE table_name = 'slide_jobs';
   ```
   - Should return 1 row

---

## Option 2: Via Supabase CLI

### Prerequisites:
```bash
# Install Supabase CLI (if not installed)
npm install -g supabase

# Or via other methods (see LEVEL6_DETAILED_SETUP_GUIDE.md)
```

### Steps:

1. **Login to Supabase**
   ```bash
   supabase login
   ```

2. **Link Your Project**
   ```bash
   supabase link --project-ref YOUR_PROJECT_REF
   ```
   - Find project ref in: Dashboard → Settings → General → Reference ID

3. **Run Migration**
   ```bash
   supabase db push
   ```
   - Or run specific migration:
   ```bash
   supabase migration up
   ```

---

## Option 3: Manual SQL Execution

If you prefer to run sections separately:

### Step 1: Create Table
```sql
CREATE TABLE IF NOT EXISTS slide_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  framework_id UUID REFERENCES research(id) ON DELETE SET NULL,
  research_id UUID REFERENCES research(id) ON DELETE SET NULL,
  ppt_plan JSONB NOT NULL,
  template TEXT DEFAULT 'default',
  template_drive_id TEXT,
  presentation_style TEXT DEFAULT 'executive' CHECK (presentation_style IN ('executive', 'technical', 'visual', 'academic')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'done', 'failed')),
  final_ppt_url TEXT,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Step 2: Create Indexes
```sql
CREATE INDEX IF NOT EXISTS idx_slide_jobs_user_id ON slide_jobs(user_id);
CREATE INDEX IF NOT EXISTS idx_slide_jobs_status ON slide_jobs(status);
CREATE INDEX IF NOT EXISTS idx_slide_jobs_research_id ON slide_jobs(research_id);
```

### Step 3: Enable RLS
```sql
ALTER TABLE slide_jobs ENABLE ROW LEVEL SECURITY;
```

### Step 4: Create Policies
```sql
CREATE POLICY "Users can view own slide jobs"
  ON slide_jobs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own slide jobs"
  ON slide_jobs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Service role full access"
  ON slide_jobs FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');
```

### Step 5: Create Trigger
```sql
CREATE OR REPLACE FUNCTION update_slide_jobs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_slide_jobs_updated_at
  BEFORE UPDATE ON slide_jobs
  FOR EACH ROW
  EXECUTE FUNCTION update_slide_jobs_updated_at();
```

### Step 6: Create Storage Bucket
```sql
INSERT INTO storage.buckets (id, name, public)
VALUES ('ppt-results', 'ppt-results', true)
ON CONFLICT (id) DO NOTHING;
```

### Step 7: Storage Policies
```sql
CREATE POLICY "Users can upload own PPTs"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'ppt-results' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Public can view PPTs"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'ppt-results');
```

---

## Verification Queries

After running the migration, verify everything is set up:

### Check Table Exists
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_name = 'slide_jobs';
```

### Check Bucket Exists
```sql
SELECT * FROM storage.buckets WHERE id = 'ppt-results';
```

### Check Policies
```sql
SELECT * FROM pg_policies WHERE tablename = 'slide_jobs';
```

### Check Storage Policies
```sql
SELECT * FROM pg_policies 
WHERE tablename = 'objects' 
AND schemaname = 'storage';
```

### Test Insert (as authenticated user)
```sql
-- This should work if you're logged in
INSERT INTO slide_jobs (user_id, ppt_plan, status)
VALUES (auth.uid(), '{"slides": []}'::jsonb, 'pending')
RETURNING id;
```

---

## Troubleshooting

### Error: "relation already exists"
- The table already exists - this is OK
- The migration uses `IF NOT EXISTS` so it's safe to run again

### Error: "permission denied"
- Make sure you're using the SQL Editor (has admin access)
- Or use service role key for CLI

### Error: "bucket already exists"
- This is OK - the migration uses `ON CONFLICT DO NOTHING`
- The bucket is already set up

### Error: "policy already exists"
- Policies might already exist
- Drop and recreate if needed:
  ```sql
  DROP POLICY IF EXISTS "Users can view own slide jobs" ON slide_jobs;
  -- Then recreate
  ```

---

## What This Migration Creates

✅ **`slide_jobs` table** - Stores PPT generation jobs  
✅ **Indexes** - For fast queries  
✅ **RLS Policies** - Security for user data  
✅ **Auto-update trigger** - Updates `updated_at` automatically  
✅ **Storage bucket** - `ppt-results` for storing PPTX files  
✅ **Storage policies** - Public read, user upload  

---

## Next Steps

After migration is complete:

1. ✅ Verify all checks pass
2. ✅ Deploy Edge Function: `create-ppt-job`
3. ✅ Setup Google Service Account
4. ✅ Deploy Level-6 Renderer
5. ✅ Configure Webhook URL

See `LEVEL6_DETAILED_SETUP_GUIDE.md` for complete setup instructions.

