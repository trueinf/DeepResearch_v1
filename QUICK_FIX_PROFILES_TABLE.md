# Quick Fix: Missing Profiles Table

## ✅ Error Identified!

**Error**: `relation "profiles" does not exist`

This is blocking user creation. A trigger tries to create a profile when a user is created, but the table doesn't exist.

## 🚀 Quick Fix (2 Minutes)

### Step 1: Open SQL Editor

1. **Go to**: Supabase Dashboard
2. **Click**: "SQL Editor" in left sidebar
3. **Click**: "New query"

### Step 2: Run the SQL

1. **Open**: `create_profiles_table.sql` file
2. **Copy ALL the SQL**
3. **Paste into SQL Editor**
4. **Click "Run"** (or press Ctrl+Enter)

### Step 3: Test

1. **Go to**: Authentication → Users → Add user
2. **Create user**: `test@example.com` / `test123`
3. **Should work now!** ✅

## What This Does

- ✅ Creates `profiles` table
- ✅ Sets up RLS policies
- ✅ Creates trigger to auto-create profile on user signup
- ✅ Fixes the "relation does not exist" error

## After Running SQL

1. **Table created** ✅
2. **User creation should work** ✅
3. **Profile auto-created** when user signs up ✅

Just run the SQL and test user creation - should work now!

