# How to Create a Test User

## Method 1: Supabase Dashboard (Easiest)

### Step-by-Step Instructions:

1. **Go to Supabase Dashboard**
   - Navigate to: https://supabase.com/dashboard
   - Select your project

2. **Open Authentication**
   - Click **"Authentication"** in the left sidebar
   - You should see the "Users" section

3. **Create New User**
   - Click **"Add user"** button (top right) or **"Create new user"**
   - A modal will appear

4. **Fill in User Details**
   - **Email**: Enter a test email (e.g., `test@example.com`)
   - **Password**: Enter a password (minimum 6 characters)
   - **Auto Confirm User**: ✅ **Check this box** (important for testing - skips email verification)
   - **Send invitation email**: ❌ Uncheck this (not needed for test user)

5. **Create User**
   - Click **"Create user"** button
   - User will be created immediately

6. **Verify User Created**
   - You should see the new user in the Users list
   - Status should show as "Confirmed" (if you checked Auto Confirm)

## Method 2: Using SQL Editor (Alternative)

1. **Go to SQL Editor**
   - Click **"SQL Editor"** in the left sidebar
   - Click **"New query"**

2. **Run SQL Command**
   ```sql
   -- Create a test user
   INSERT INTO auth.users (
     instance_id,
     id,
     aud,
     role,
     email,
     encrypted_password,
     email_confirmed_at,
     created_at,
     updated_at,
     confirmation_token,
     email_change,
     email_change_token_new,
     recovery_token
   )
   VALUES (
     '00000000-0000-0000-0000-000000000000',
     gen_random_uuid(),
     'authenticated',
     'authenticated',
     'test@example.com',
     crypt('your_password_here', gen_salt('bf')),
     now(),
     now(),
     now(),
     '',
     '',
     '',
     ''
   );
   ```

   **Note**: This method is more complex and not recommended. Use Method 1 instead.

## Method 3: Sign Up Through Your App (If Signup Page Exists)

1. **Navigate to Signup Page**
   - Go to `/signup` (if you've created a signup page)
   - Or use the signup link from login page

2. **Fill Registration Form**
   - Enter email
   - Enter password
   - Submit form

3. **Verify Email** (if email confirmation is enabled)
   - Check email inbox
   - Click confirmation link
   - User will be activated

## Quick Test User Credentials

For testing, you can use:

**Email**: `test@askdepth.com`  
**Password**: `Test123!` (or any password you set)

## Important Notes

### Auto Confirm User
- ✅ **Check "Auto Confirm User"** when creating test users
- This skips email verification and allows immediate login
- Perfect for development and testing

### Email Confirmation
- If email confirmation is **enabled** in Supabase settings:
  - Users must verify email before they can login
  - For test users, use "Auto Confirm" to skip this

### Password Requirements
- Minimum 6 characters (Supabase default)
- Can be simple for test users (e.g., `test123`)

## Verify User Can Login

1. **Go to your app's login page**
   - Navigate to `/login`

2. **Enter credentials**
   - Email: `test@example.com` (or your test email)
   - Password: The password you set

3. **Click "Sign In"**
   - Should redirect to `/dashboard` on success

## Troubleshooting

### "Invalid login credentials"
- Check email is correct
- Check password is correct
- Verify user exists in Supabase Users list
- Check user status is "Confirmed"

### "Email not confirmed"
- Enable "Auto Confirm User" when creating user
- Or verify email by clicking link in email inbox
- Or disable email confirmation in Supabase Auth settings

### "User not found"
- Verify user exists in Supabase Dashboard → Authentication → Users
- Check email spelling matches exactly

## Disable Email Confirmation (For Testing)

If you want to skip email verification for all users:

1. Go to **Authentication** → **Settings** (or **URL Configuration**)
2. Find **"Enable email confirmations"**
3. **Disable** it (uncheck)
4. Save changes

This allows all new signups to login immediately without email verification.

