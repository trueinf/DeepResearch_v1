# Fix: Missing "profiles" Table Error

## ✅ Error Found!

**Exact Error**: `relation "profiles" does not exist`

This is blocking user creation! When a user is created, a trigger tries to create a profile, but the `profiles` table doesn't exist.

## 🔧 Solution: Create Profiles Table

### Step 1: Create the Profiles Table

1. **Go to**: SQL Editor → New query
2. **Run this SQL**:

```sql
-- Create profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create policy to allow users to read their own profile
CREATE POLICY "Users can view own profile"
  ON public.profiles
  FOR SELECT
  USING (auth.uid() = id);

-- Create policy to allow users to update their own profile
CREATE POLICY "Users can update own profile"
  ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id);

-- Create policy to allow users to insert their own profile
CREATE POLICY "Users can insert own profile"
  ON public.profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Create function to automatically create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to call function on user creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
```

3. **Click "Run"** (or press Ctrl+Enter)

### Step 2: Verify Table Created

Run this to verify:
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name = 'profiles';
```

Should return 1 row with `profiles`.

### Step 3: Test User Creation

1. **Go to**: Authentication → Users → Add user
2. **Try creating user**:
   - Email: `test@example.com`
   - Password: `test123`
   - Auto Confirm: Checked
3. **Should work now!** ✅

## 🎯 Why This Happened

Supabase often uses a `profiles` table pattern:
- When user is created → Trigger creates profile
- But if `profiles` table doesn't exist → User creation fails

## ✅ After Fixing

1. **Table created** ✅
2. **Trigger set up** ✅
3. **User creation should work** ✅
4. **Profile auto-created** when user signs up ✅

## Quick Fix

Just run the SQL above in SQL Editor - that should fix the issue!

