# Quick Check: Is Site URL Set?

## Fast Way to Check

1. **Open Supabase Dashboard**
2. **Go to**: Authentication → URL Configuration
3. **Look at "Site URL" field**
   - **Empty?** → That's the problem! Set it to `http://localhost:5184`
   - **Has value?** → Check if it matches your app URL

## What Should It Be?

For local development:
- **Site URL**: `http://localhost:5184`
- **Redirect URLs**: 
  - `http://localhost:5184/**`
  - `http://localhost:5184`

For production:
- **Site URL**: `https://yourdomain.com`
- **Redirect URLs**: 
  - `https://yourdomain.com/**`
  - `https://yourdomain.com`

## Why This Matters

Even with email confirmation OFF, Supabase needs Site URL to:
- Validate redirect URLs
- Set up proper CORS
- Configure auth callbacks
- Save user data correctly

**Missing Site URL = 500 error**, even if database is healthy!

## Quick Fix

1. **Authentication** → **URL Configuration**
2. **Set Site URL**: `http://localhost:5184`
3. **Add Redirect URL**: `http://localhost:5184/**`
4. **Save**
5. **Wait 10 seconds**
6. **Try signup** → Should work! ✅

