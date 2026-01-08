# Fix Port Mismatch Issue

## ⚠️ Problem Found!

Your app is running on **port 5185** but Supabase Site URL is set to **port 5184**.

This mismatch causes the 500 error!

## Solution: Update Supabase Site URL

### Option 1: Update Site URL to Match Current Port (5185)

1. **Go to**: Supabase Dashboard → Authentication → URL Configuration
2. **Change "Site URL"** from `http://localhost:5184` to:
   ```
   http://localhost:5185
   ```
3. **Update "Redirect URLs"**:
   - Remove: `http://localhost:5184/**`
   - Add: `http://localhost:5185/**`
4. **Click "Save changes"**
5. **Wait 30 seconds**
6. **Try signup again**

### Option 2: Force App to Use Port 5184

If you prefer to keep Supabase on 5184:

1. **Stop the dev server** (Ctrl+C in terminal)
2. **Kill any process on port 5184**:
   ```powershell
   Get-Process -Id (Get-NetTCPConnection -LocalPort 5184).OwningProcess | Stop-Process -Force
   ```
3. **Start server again**:
   ```bash
   npm run dev
   ```
4. **Should start on port 5184** now
5. **Try signup again**

## Why This Matters

Supabase validates redirect URLs against the Site URL. If they don't match:
- ❌ 500 errors
- ❌ "Database error saving new user"
- ❌ Signup fails

## Quick Fix (Recommended)

**Update Supabase Site URL to 5185** (Option 1) - This is faster!

1. Authentication → URL Configuration
2. Site URL: `http://localhost:5185`
3. Redirect URLs: `http://localhost:5185/**`
4. Save
5. Wait 30 seconds
6. Try signup → Should work! ✅

