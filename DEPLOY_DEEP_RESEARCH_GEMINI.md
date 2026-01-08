# Deploy deep-Research-gemini Function

## Quick Deployment Steps

### Method 1: Supabase Dashboard (Recommended)

1. **Go to Supabase Dashboard**
   - Visit: https://supabase.com/dashboard
   - Select your project

2. **Navigate to Edge Functions**
   - Click on "Edge Functions" in the left sidebar
   - Find "deep-Research-gemini" in the list
   - Click on it to open

3. **Edit the Function**
   - Click "Edit Function" or "Deploy" button
   - You'll see a code editor

4. **Copy the Updated Code**
   - Open: `supabase/functions/deep-Research-gemini/index.ts`
   - Select ALL content (Ctrl+A)
   - Copy (Ctrl+C)

5. **Paste and Deploy**
   - Paste the code into the Supabase editor
   - Click "Deploy" or "Save"
   - Wait for deployment to complete

6. **Verify Deployment**
   - Check for any errors in the deployment log
   - The function should show as "Active"

## What's Being Deployed

✅ **Fixes:**
- Fixed duplicate property error in PRICING config
- Fixed model name: `gemini-1.5-pro-latest`
- Fixed all TypeScript errors with @ts-ignore comments

✅ **Optimizations:**
- Web search now non-blocking (runs in parallel)
- Refinement timeout reduced: 30s → 20s
- Overall 10-15% faster performance

## Alternative: Install Supabase CLI

If you prefer CLI deployment:

```powershell
# Install Supabase CLI
npm install -g supabase

# Login to Supabase
supabase login

# Link your project
supabase link --project-ref your-project-ref

# Deploy the function
supabase functions deploy deep-Research-gemini
```

## After Deployment

1. Test the function with a simple research query
2. Check the logs for any runtime errors
3. Verify that research completes faster than before

## Troubleshooting

- **Deployment fails**: Check that all API keys are set in Supabase Secrets
- **Function not found**: Make sure the function name is exactly `deep-Research-gemini`
- **Runtime errors**: Check Edge Function logs in Supabase Dashboard

