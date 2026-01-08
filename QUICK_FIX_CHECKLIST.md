# Quick Fix Checklist - 500 Error

## ⚠️ Still Getting 500 Error?

Run through this checklist:

### ✅ Checklist

- [ ] **Site URL is set** to `http://localhost:5184` (no trailing slash)
- [ ] **Clicked "Save changes"** after setting Site URL
- [ ] **Waited 30 seconds** after saving
- [ ] **Redirect URLs** includes `http://localhost:5184/**`
- [ ] **Billing info added** (clicked red banner, added address)
- [ ] **Waited 2 minutes** after adding billing info
- [ ] **"Allow new users to sign up"** = ON
- [ ] **"Confirm email"** = OFF
- [ ] **Cleared browser cache** (Ctrl+Shift+Delete)
- [ ] **Tried different email** (test2@example.com)
- [ ] **Checked Postgres Logs** for exact error

## Most Common Issues

### Issue 1: Site URL Not Actually Saved
**Fix**: Go to URL Configuration → Re-enter Site URL → Click "Save changes" → Wait 30 seconds

### Issue 2: Billing Warning Blocking
**Fix**: Click red banner → Add billing address → Save → Wait 2 minutes

### Issue 3: Browser Cache
**Fix**: Clear cache (Ctrl+Shift+Delete) → Hard reload (Ctrl+Shift+R)

### Issue 4: Email Already Exists
**Fix**: Try different email address

## Quick Test After Fixes

1. **Clear browser cache**
2. **Wait 2 minutes** (for Supabase changes to propagate)
3. **Go to**: `http://localhost:5184/signup`
4. **Enter**: `test3@example.com` / `test123`
5. **Click "Create Account"**

## If Still Fails

1. **Check Postgres Logs** (Logs → Postgres Logs)
2. **Copy exact error message**
3. **Try Dashboard** (Authentication → Users → Add user)
4. **If Dashboard also fails** → Contact Supabase Support

