# Complete Supabase Auth Settings Checklist

## ✅ All Required Settings for Email/Password Signup

### 1. MANAGE → Users
- **No action needed** - This is just for viewing/managing users
- ✅ Leave as is

### 2. MANAGE → OAuth Apps
- **No action needed** - Not required for email/password signup
- ✅ Leave as is (can be disabled)

### 3. NOTIFICATIONS → Email
- **Templates**: Leave as is (won't be used if email confirmation is OFF)
- **SMTP Settings**: 
  - ✅ Can use built-in service for development
  - ⚠️ Orange warning is fine - ignore for now

### 4. CONFIGURATION → Policies
- **No action needed** - Default policies work for signup
- ✅ Leave as is

### 5. CONFIGURATION → Sign In / Providers ⚠️ **IMPORTANT**
- **Email**: ✅ **Must be ENABLED** (green checkmark)
- **Phone**: ❌ Can be disabled (not needed)
- **Other providers** (Google, GitHub, etc.): ❌ Can be disabled (not needed)

### 6. CONFIGURATION → OAuth Server
- **No action needed** - Not required for email/password signup
- ✅ Can be disabled

### 7. CONFIGURATION → Sessions
- **No action needed** - Default settings work
- ✅ Leave as is

### 8. CONFIGURATION → Rate Limits
- **No action needed** - Default limits are fine for development
- ✅ Leave as is

### 9. CONFIGURATION → Multi-Factor
- **No action needed** - Not required for basic signup
- ✅ Can be disabled

### 10. CONFIGURATION → URL Configuration ⚠️ **CRITICAL**
- **Site URL**: 
  - ✅ Set to: `http://localhost:5184`
  - ⚠️ **Must match your app port exactly!**
- **Redirect URLs**: 
  - ✅ Add: `http://localhost:5184/**`
  - ✅ Add: `http://localhost:5184`
  - ⚠️ **Must include your app URL!**

### 11. CONFIGURATION → Attack Protection
- **No action needed** - Default settings work
- ✅ Leave as is

### 12. CONFIGURATION → Auth Hooks
- **No action needed** - Not required for basic signup
- ✅ Leave as is

### 13. CONFIGURATION → Audit Logs
- **No action needed** - Just for viewing logs
- ✅ Leave as is

### 14. CONFIGURATION → Advanced
- **No action needed** - Default settings work
- ✅ Leave as is

### 15. Authentication → Settings (or Policies) ⚠️ **CRITICAL**
Go to **Authentication → Settings** (or find "User Signups" section):

- **"Allow new users to sign up"**: ✅ **Must be ON** (green toggle)
- **"Confirm email"**: ✅ **Must be OFF** (gray toggle)
- **"Allow manual linking"**: ❌ Can be OFF (not needed)
- **"Allow anonymous sign-ins"**: ❌ Can be OFF (not needed)

## 📋 Quick Setup Checklist

### Critical Settings (Must Configure):

1. [ ] **Sign In / Providers**:
   - [ ] Email = **ENABLED** ✅

2. [ ] **URL Configuration**:
   - [ ] Site URL = `http://localhost:5184`
   - [ ] Redirect URLs includes `http://localhost:5184/**`
   - [ ] Click "Save changes"

3. [ ] **Settings (User Signups)**:
   - [ ] "Allow new users to sign up" = **ON** ✅
   - [ ] "Confirm email" = **OFF** ✅

### Optional Settings (Can Leave Default):

- [ ] OAuth Apps = Disabled (fine)
- [ ] OAuth Server = Disabled (fine)
- [ ] Multi-Factor = Disabled (fine)
- [ ] Other providers = Disabled (fine)
- [ ] Email templates = Default (fine)
- [ ] SMTP = Built-in (fine for dev)

## 🎯 Step-by-Step Setup

### Step 1: Enable Email Provider
1. Go to: **Authentication** → **Sign In / Providers**
2. Find **"Email"** in the list
3. Make sure it shows **"Enabled"** (green checkmark)
4. If disabled, click it and enable

### Step 2: Configure URL
1. Go to: **Authentication** → **URL Configuration**
2. **Site URL**: Enter `http://localhost:5184`
3. **Redirect URLs**: 
   - Click "Add URL"
   - Enter: `http://localhost:5184/**`
   - Click "Add URL" again
   - Enter: `http://localhost:5184`
4. Click **"Save changes"** button
5. Wait 30 seconds

### Step 3: Configure User Signups
1. Go to: **Authentication** → **Settings** (or look for "User Signups" section)
2. **"Allow new users to sign up"**: Toggle **ON** (should be green)
3. **"Confirm email"**: Toggle **OFF** (should be gray)
4. Click **"Save"** if there's a save button

## ✅ Verification

After setting everything:

1. **Email provider** = Enabled ✅
2. **Site URL** = `http://localhost:5184` ✅
3. **Redirect URLs** = Includes `http://localhost:5184/**` ✅
4. **Allow signups** = ON ✅
5. **Confirm email** = OFF ✅

## 🚀 Test

1. Go to: `http://localhost:5184/signup`
2. Enter: `test@example.com` / `test123`
3. Click "Create Account"
4. **Should work!** ✅

## Summary

**Only 3 sections need configuration:**
1. **Sign In / Providers** → Email = Enabled
2. **URL Configuration** → Site URL = `http://localhost:5184`
3. **Settings** → Allow signups = ON, Confirm email = OFF

Everything else can be left as default!

