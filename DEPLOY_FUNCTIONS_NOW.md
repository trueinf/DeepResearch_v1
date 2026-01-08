# Deploy Edge Functions - Quick Guide

## Method 1: Via Supabase Dashboard (Easiest)

1. Go to https://supabase.com/dashboard
2. Select your project: `vvrulvxeaejxhwnafwrq`
3. Navigate to **Edge Functions** in the left sidebar
4. For each function, click **"Deploy"** or **"Redeploy"**:
   - `deep-Research-gemini`
   - `chat-Research`
   - `generate-ppt-agent`

## Method 2: Via CLI (If .env is fixed)

If you want to use CLI, first fix the .env encoding issue, then run:

```bash
npx supabase functions deploy deep-Research-gemini --project-ref vvrulvxeaejxhwnafwrq
npx supabase functions deploy chat-Research --project-ref vvrulvxeaejxhwnafwrq
npx supabase functions deploy generate-ppt-agent --project-ref vvrulvxeaejxhwnafwrq
```

## What Changed

All three functions now:
- ✅ Use generic error messages (no rate limit mentions)
- ✅ Don't pass through API error details
- ✅ Show "API request failed. Please try again." for all errors

