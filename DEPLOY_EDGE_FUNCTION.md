# Deploy Clarify Questions Edge Function

## Prerequisites

1. Install Supabase CLI:
```bash
npm install -g supabase
```

2. Login to Supabase:
```bash
supabase login
```

3. Link your project:
```bash
supabase link --project-ref vvrulvxeaejxhwnafwrq
```

## Set Environment Variable

Set your Anthropic API key as a secret:

```bash
supabase secrets set clarify-Questions=sk-your-anthropic-api-key-here
```

Or use the Supabase Dashboard:
- Go to: https://supabase.com/dashboard/project/vvrulvxeaejxhwnafwrq/settings/functions
- Click "Secrets" tab
- Add `clarify-Questions` with your Anthropic API key value

## Deploy the Function

```bash
supabase functions deploy clarify-Questions
```

## Test the Function

After deployment, test it:

```bash
curl -X POST https://vvrulvxeaejxhwnafwrq.supabase.co/functions/v1/clarify-Questions \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"input": "Research surfboards for me. I am interested in..."}'
```

## Local Development (Optional)

To test locally before deploying:

```bash
supabase functions serve clarify-Questions --env-file supabase/.env.local
```

Create `supabase/.env.local`:
```
ANTHROPIC_API_KEY=sk-your-key-here
```

## Verify in Frontend

Once deployed, the frontend will automatically use the Edge Function. Make sure your `.env` file has:

```env
VITE_SUPABASE_URL=https://vvrulvxeaejxhwnafwrq.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

The function endpoint will be automatically constructed as:
`${VITE_SUPABASE_URL}/functions/v1/clarify-Questions`

