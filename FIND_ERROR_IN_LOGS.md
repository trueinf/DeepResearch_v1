# How to Find the Error in Postgres Logs

## ✅ You're in the Right Place!

You're viewing Postgres logs, but the entries shown are just **connection logs** (normal operations).

## 🔍 Step 1: Filter for Errors

### In the Logs Page:

1. **Look for "Severity" filter** (top right, near "Last hour" button)
2. **Click "Severity" dropdown**
3. **Select "ERROR"** (or "Error")
4. **This will show only error logs**

### Or Search for Errors:

1. **In the "Search events" bar** (top of logs)
2. **Type**: `ERROR` or `error`
3. **Press Enter**
4. **This will filter to show only errors**

## 🔍 Step 2: Try Creating User While Logs Are Open

### Real-Time Error Capture:

1. **Keep Postgres Logs open** (in one tab/window)
2. **Open another tab**: Go to Authentication → Users → Add user
3. **Try to create user**:
   - Email: `test@example.com`
   - Password: `test123`
   - Auto Confirm: Checked
4. **Immediately go back to logs tab**
5. **Look for NEW error** that just appeared (should be at top)
6. **Click on the error** to expand and see full details

## 🔍 Step 3: Check Different Time Ranges

1. **Click "Last hour" dropdown** (top right)
2. **Try different ranges**:
   - "Last 15 minutes"
   - "Last hour"
   - "Last 24 hours"
3. **Look for ERROR entries** (red color)

## 🔍 Step 4: Check Other Log Collections

Since you're in "Logs & Analytics", also check:

1. **Click "Auth" in left sidebar** (under COLLECTIONS)
2. **Look for errors** related to user creation
3. **Auth logs might show different errors** than Postgres logs

## 📋 What Error Logs Look Like

Error logs will have:
- **Red color** or **ERROR** label
- **Different icon** (usually exclamation mark or X)
- **Error message** starting with "ERROR:"

Example:
```
ERROR: new row violates check constraint "users_email_check"
ERROR: permission denied for table auth.users
ERROR: trigger function returned error
```

## 🎯 Quick Action

1. **Click "Severity" filter** → Select "ERROR"
2. **Or search for**: `ERROR` in search bar
3. **Try creating user** while logs are open
4. **Check for new error** that appears

The error will tell us exactly what's blocking user creation!

