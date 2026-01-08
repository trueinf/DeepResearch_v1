# Deploy Create User Edge Function

## Quick Deploy

This Edge Function creates users server-side, bypassing the 500 signup error.

### Step 1: Deploy the Function

```bash
# Make sure you're in the project root
cd c:\Users\karth\Downloads\askDepth_gemini\askDepth_gemini

# Deploy the function
npx supabase functions deploy create-user
```

### Step 2: Set Environment Variables

The function needs these secrets in Supabase:

1. Go to **Supabase Dashboard** → **Edge Functions** → **Settings**
2. Add these secrets:
   - `SUPABASE_URL` = Your Supabase project URL (e.g., `https://vvrulvxeaejxhwnafwrq.supabase.co`)
   - `SUPABASE_SERVICE_ROLE_KEY` = Your service_role key from **Settings** → **API**

### Step 3: Test

1. Go to: `http://localhost:5184/create-user`
2. Enter email and password
3. Click "Create User"
4. Should work! ✅

## Alternative: Manual Setup

If you don't have Supabase CLI:

1. Go to **Supabase Dashboard** → **Edge Functions**
2. Click **"Create a new function"**
3. Name it: `create-user`
4. Copy the code from `supabase/functions/create-user/index.ts`
5. Paste it into the function editor
6. Set the secrets (SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY)
7. Deploy

## How It Works

- Client calls Edge Function (no service role key needed in frontend)
- Edge Function uses service role key server-side (secure)
- Creates user with `email_confirm: true` (skips email verification)
- Returns success/error to client

This bypasses all client-side 500 errors!

