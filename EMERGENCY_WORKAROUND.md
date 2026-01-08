# Emergency Workaround: Use Existing User or Create New Project

## If Database is Completely Broken

If Supabase Dashboard can't create users, here are emergency workarounds:

## Option 1: Check for Existing Users

1. Go to **Authentication** → **Users**
2. Check if there are any existing users
3. If yes:
   - Try to login with those credentials
   - Or reset password for an existing user

## Option 2: Create New Supabase Project

If the current project is broken:

### Step 1: Create New Project

1. Go to https://supabase.com/dashboard
2. Click **"New Project"**
3. Fill in:
   - Name: `askdepth-new`
   - Database Password: (generate strong password)
   - Region: (choose closest)
4. Click **"Create new project"**
5. Wait 2-3 minutes for setup

### Step 2: Update Environment Variables

1. Get new project credentials:
   - Go to **Settings** → **API**
   - Copy:
     - Project URL
     - `anon` `public` key
     - `service_role` `secret` key

2. Update your `.env` file:
```env
VITE_SUPABASE_URL=https://NEW_PROJECT_REF.supabase.co
VITE_SUPABASE_ANON_KEY=NEW_ANON_KEY
```

3. Restart your dev server

### Step 3: Recreate Database Schema

If you had custom tables, recreate them:

1. Go to **SQL Editor**
2. Run your schema creation SQL (if you have it)
3. Or recreate tables via **Table Editor**

### Step 4: Redeploy Edge Functions

1. Update Edge Function secrets with new project URL and service_role key
2. Redeploy all functions

### Step 5: Test

1. Try creating user via Dashboard
2. Should work now! ✅

## Option 3: Use Supabase CLI to Migrate

If you have Supabase CLI set up:

```bash
# Link to old project
supabase link --project-ref vvrulvxeaejxhwnafwrq

# Create new project
supabase projects create askdepth-new

# Link to new project
supabase link --project-ref NEW_PROJECT_REF

# Push schema (if you have migrations)
supabase db push
```

## Option 4: Contact Supabase Support

If you need to keep the current project:

1. Go to: https://supabase.com/support
2. Explain: "Database error creating new user - even Dashboard fails"
3. Provide project reference: `vvrulvxeaejxhwnafwrq`
4. They can investigate and fix database-level issues

## Quick Decision Tree

- **Project paused?** → Resume it
- **Billing issue?** → Fix payment
- **Database down?** → Wait or contact support
- **Nothing works?** → Create new project (Option 2)

The fastest path is usually creating a new project if the current one is broken.

