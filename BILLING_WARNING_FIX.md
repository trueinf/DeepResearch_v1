# Fix "Missing Billing Information" Warning

## ⚠️ Important Notice

Your Supabase dashboard shows a **red banner**: "Missing Billing Information"

This warning can cause:
- **500 errors** on signup
- **Database write restrictions**
- **API rate limiting**

## Quick Fix

### Option 1: Add Billing Information (Recommended)

1. **Click the red banner** at the top of Supabase Dashboard
2. **Or go to**: Settings → Billing
3. **Add billing address:**
   - Enter your address
   - Add payment method (if required)
   - For business: Add tax ID
4. **Save**
5. **Wait 1-2 minutes** for changes to take effect
6. **Try signup again**

### Option 2: Check Project Plan

1. **Go to**: Settings → Billing
2. **Check your plan:**
   - Free tier should work for development
   - If on free tier, billing info might not be required
   - But the warning can still cause issues

### Option 3: Verify Project Status

1. **Go to**: Settings → General
2. **Check project status:**
   - Should show "Active"
   - Not "Paused" or "Restricted"
3. **If restricted**, add billing info to unlock

## Why This Matters

Even on free tier, Supabase may restrict certain operations if billing info is missing:
- User creation might fail
- Database writes might be limited
- API calls might be rate-limited

## Test After Adding Billing Info

1. **Wait 1-2 minutes** after adding billing info
2. **Go to**: `http://localhost:5184/signup`
3. **Try creating account**
4. **Should work now!** ✅

## If Still Fails

If signup still fails after adding billing info:

1. **Check Postgres Logs** for exact error
2. **Try creating user via Dashboard** (Authentication → Users → Add user)
3. **If Dashboard also fails**, contact Supabase Support

The billing warning is likely the root cause of your 500 errors!

