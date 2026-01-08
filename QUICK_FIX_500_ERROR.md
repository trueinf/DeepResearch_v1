# Quick Fix for 500 Signup Error

## ✅ Solution: Deploy Edge Function

I've created a server-side Edge Function that bypasses the 500 error. Here's how to deploy it:

### Option 1: Deploy via Supabase Dashboard (Easiest)

1. **Go to Supabase Dashboard**
   - Navigate to: https://supabase.com/dashboard
   - Select your project

2. **Create Edge Function**
   - Click **"Edge Functions"** in left sidebar
   - Click **"Create a new function"**
   - Name it: `create-user`
   - Click **"Create function"**

3. **Add the Code**
   - Delete the default code
   - Open: `supabase/functions/create-user/index.ts` in your project
   - Copy ALL the code
   - Paste it into the Supabase function editor

4. **Set Secrets**
   - Click **"Settings"** tab (gear icon)
   - Go to **"Secrets"** section
   - Add these secrets:
     - **Name**: `SUPABASE_URL`
       **Value**: Your project URL (e.g., `https://vvrulvxeaejxhwnafwrq.supabase.co`)
     - **Name**: `SUPABASE_SERVICE_ROLE_KEY`
       **Value**: Your service_role key from **Settings** → **API** → `service_role` (click eye icon to reveal)

5. **Deploy**
   - Click **"Deploy"** button
   - Wait for deployment to complete

6. **Test**
   - Go to: `http://localhost:5184/create-user`
   - Enter email and password
   - Click "Create User"
   - Should work! ✅

### Option 2: Use Supabase CLI (If you have it set up)

```bash
# Login first
npx supabase login

# Deploy
npx supabase functions deploy create-user --no-verify-jwt
```

## How It Works

- **Before**: Client tries to create user → 500 error (Site URL issue)
- **After**: Client calls Edge Function → Function creates user server-side → Success! ✅

The Edge Function:
- Uses service role key server-side (secure)
- Bypasses all client-side configuration issues
- Auto-confirms users (no email verification needed)
- Returns success/error to client

## Test It

1. Deploy the function (steps above)
2. Go to: `http://localhost:5184/create-user`
3. Enter:
   - Email: `test@example.com`
   - Password: `test123`
4. Click "Create User"
5. Should redirect to login! ✅

## If Function Not Found (404)

If you get a 404 error, the function isn't deployed yet. Follow the deployment steps above.

## Alternative: Set Site URL (Simpler but may not work)

If you prefer to fix the regular signup:

1. Go to **Supabase Dashboard** → **Authentication** → **URL Configuration**
2. Set **"Site URL"** to: `http://localhost:5184`
3. Add **"Redirect URLs"**: `http://localhost:5184/**`
4. Click **"Save"**
5. Try regular signup again

But the Edge Function approach is more reliable! 🚀

