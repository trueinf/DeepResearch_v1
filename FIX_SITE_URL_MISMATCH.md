# Fix Site URL Mismatch - Step by Step

## ⚠️ Issue: Site URL Mismatch

Your app is running on `http://localhost:5184` but Supabase Site URL might not match.

## ✅ Quick Fix: Update Supabase Site URL

### Step 1: Go to URL Configuration

1. **Open Supabase Dashboard**
   - URL: https://supabase.com/dashboard/project/vvrulvxeaejxhwnafwrq

2. **Navigate to URL Configuration**
   - Click **"Authentication"** in left sidebar
   - Click **"URL Configuration"** (below "Emails" section)

### Step 2: Update Site URL

1. **Find "Site URL" field**
2. **Change it to exactly**:
   ```
   http://localhost:5184
   ```
   - ⚠️ **No trailing slash** (not `http://localhost:5184/`)
   - ⚠️ **Must be exactly** `http://localhost:5184`
   - ⚠️ **Port must match** your app port (5184)

3. **Click "Save changes"** button (green button below the field)

### Step 3: Update Redirect URLs

1. **Find "Redirect URLs" section**
2. **Check if it includes**:
   - `http://localhost:5184/**`
   - `http://localhost:5184`

3. **If missing, add them**:
   - Click **"Add URL"** button
   - Enter: `http://localhost:5184/**`
   - Click **"Add URL"** again
   - Enter: `http://localhost:5184`

4. **Click "Save changes"** if there's a save button

### Step 4: Wait and Test

1. **Wait 30 seconds** for changes to propagate
2. **Clear browser cache** (Ctrl+Shift+Delete)
3. **Go to**: `http://localhost:5184/signup`
4. **Try signup** - Should work now! ✅

## Verification Checklist

After updating, verify:

- [ ] **Site URL** = `http://localhost:5184` (exact match, no trailing slash)
- [ ] **Redirect URLs** includes `http://localhost:5184/**`
- [ ] **Redirect URLs** includes `http://localhost:5184`
- [ ] **Clicked "Save changes"** button
- [ ] **Waited 30 seconds** after saving
- [ ] **Cleared browser cache**

## Common Mistakes

❌ **Wrong**: `http://localhost:5184/` (trailing slash)
✅ **Correct**: `http://localhost:5184` (no trailing slash)

❌ **Wrong**: `http://localhost:5185` (wrong port)
✅ **Correct**: `http://localhost:5184` (matches your app)

❌ **Wrong**: `https://localhost:5184` (https instead of http)
✅ **Correct**: `http://localhost:5184` (http for localhost)

## Visual Guide

```
Supabase Dashboard
└── Authentication (left sidebar)
    └── URL Configuration ← Click here
        ├── Site URL: http://localhost:5184 ← Set this
        └── Redirect URLs:
            ├── http://localhost:5184/** ← Add this
            └── http://localhost:5184 ← Add this
```

## After Fixing

1. **Site URL matches your app** ✅
2. **Redirect URLs configured** ✅
3. **Try signup** → Should work! ✅

The mismatch is the most common cause of 500 errors. Once fixed, signup should work!

