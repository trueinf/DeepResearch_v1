# Fix Port Mismatch - Update Supabase to 5184

## ⚠️ Port Mismatch Detected!

- **Your app**: Running on port **5184** ✅
- **Supabase Site URL**: Set to port **5185** ❌

This mismatch causes 500 errors!

## ✅ Fix: Update Supabase to Port 5184

### Step-by-Step:

1. **Go to Supabase Dashboard**
   - URL: https://supabase.com/dashboard/project/vvrulvxeaejxhwnafwrq

2. **Navigate to URL Configuration**
   - Click **"Authentication"** in left sidebar
   - Click **"URL Configuration"** (below "Emails")

3. **Update Site URL**
   - Change from: `http://localhost:5185`
   - Change to: `http://localhost:5184`
   - Click **"Save changes"** button

4. **Update Redirect URLs**
   - Remove: `http://localhost:5185/**` (if exists)
   - Add: `http://localhost:5184/**`
   - Click **"Add URL"** if needed
   - Click **"Save changes"**

5. **Wait 30 seconds** for changes to propagate

6. **Test Signup**
   - Go to: `http://localhost:5184/signup`
   - Enter: `test@example.com` / `test123`
   - Click "Create Account"
   - **Should work now!** ✅

## Why This Matters

Supabase validates redirect URLs against the Site URL. If ports don't match:
- ❌ 500 errors
- ❌ "Database error saving new user"
- ❌ Signup fails

## Quick Checklist

- [ ] Site URL = `http://localhost:5184` (matches your app)
- [ ] Redirect URLs includes `http://localhost:5184/**`
- [ ] Clicked "Save changes"
- [ ] Waited 30 seconds
- [ ] Cleared browser cache (Ctrl+Shift+Delete)
- [ ] Tried signup again

After updating Supabase to port 5184, signup should work! 🎉

