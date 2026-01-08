# Fix "Invalid email or password" (400 Error)

## The Problem

Getting `400 Bad Request` when trying to login means:
- ❌ User doesn't exist yet, OR
- ❌ Password is incorrect, OR  
- ❌ Email is not confirmed (if email confirmation is enabled)

## ✅ Solution: Create Account First

You need to **create an account** before you can login.

### Step 1: Go to Signup Page

1. Click **"Sign up"** link on the login page, OR
2. Go directly to: `http://localhost:5184/signup`

### Step 2: Create Account

1. Fill in the form:
   - **Email**: `test@example.com`
   - **Password**: `test123` (minimum 6 characters)
   - **Confirm Password**: `test123`
2. Click **"Create Account"**
3. Should see success message

### Step 3: Login

1. Go back to login page: `http://localhost:5184/login`
2. Enter the same credentials you just created:
   - **Email**: `test@example.com`
   - **Password**: `test123`
3. Click **"Sign In"**
4. Should redirect to `/dashboard` ✅

## Alternative: Create User via Supabase Dashboard

If signup page doesn't work:

1. **Go to Supabase Dashboard** → **Authentication** → **Users**
2. Click **"Add user"** or **"Create new user"**
3. Fill in:
   - **Email**: `test@example.com`
   - **Password**: `test123`
   - ✅ **Auto Confirm User**: Check this
   - ❌ **Send invitation email**: Uncheck
4. Click **"Create user"**
5. Now you can login with these credentials

## Common Issues

### "User not found"
- **Fix**: Create account first via signup or dashboard

### "Invalid password"
- **Fix**: Make sure password matches what you set
- **Fix**: Try resetting password in Supabase dashboard

### "Email not confirmed"
- **Fix**: Check "Auto Confirm User" when creating user
- **Fix**: Or disable email confirmation in Auth settings

## Quick Test

1. **Sign up**: Go to `/signup` → Create account
2. **Login**: Go to `/login` → Use same credentials
3. **Should work!** ✅

## Summary

**The 400 error means you need to create an account first!**

- ✅ Sign up at `/signup`
- ✅ Then login at `/login`
- ✅ Use the same email/password for both

