# Deploy Extract File Text Function

## Option 1: Deploy via Supabase Dashboard (Easiest)

### Step 1: Go to Supabase Dashboard
1. Navigate to: https://supabase.com/dashboard/project/vvrulvxeaejxhwnafwrq/functions
2. Or go to your project → **Edge Functions** in the left sidebar

### Step 2: Create New Function
1. Click **"Create a new function"** or **"New Function"**
2. Function name: `extract-file-text` (must match exactly, case-sensitive)
3. Click **"Create function"**

### Step 3: Copy Function Code
1. Open the file: `supabase/functions/extract-file-text/index.ts`
2. Copy **ALL** the code from that file
3. Paste it into the Supabase Dashboard editor

### Step 4: Deploy
1. Click **"Deploy"** or **"Save"**
2. Wait for deployment to complete

### Step 5: Verify
- The function should be accessible at: `https://vvrulvxeaejxhwnafwrq.supabase.co/functions/v1/extract-file-text`
- Status should show as "Active"

## Option 2: Install Supabase CLI (For Future Deployments)

If you want to use CLI for easier deployments:

### Install Supabase CLI
```bash
# Using npm
npm install -g supabase

# Or using Scoop (Windows)
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase
```

### Login and Link Project
```bash
# Login to Supabase
supabase login

# Link your project
supabase link --project-ref vvrulvxeaejxhwnafwrq
```

### Deploy Function
```bash
supabase functions deploy extract-file-text
```

## Testing the Function

After deployment, test it by:
1. Going to your app
2. Uploading a file in the "New Research" form
3. Check browser console for any errors
4. File should show "✓ Processed" status

## Troubleshooting

- **Function not found (404)**: Make sure function name is exactly `extract-file-text`
- **CORS errors**: The function already includes CORS headers
- **File too large**: Frontend limits to 10MB per file
- **Extraction fails**: Check function logs in Supabase Dashboard

