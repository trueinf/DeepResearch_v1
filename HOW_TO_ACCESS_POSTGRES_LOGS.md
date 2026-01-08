# How to Access Postgres Logs in Supabase

## 📍 Step-by-Step Guide

### Step 1: Go to Supabase Dashboard

1. **Open your browser**
2. **Go to**: https://supabase.com/dashboard
3. **Select your project**: `vvrulvxeaejxhwnafwrq`

### Step 2: Navigate to Logs

1. **Look at the left sidebar**
2. **Find "Logs"** (usually has a document/list icon)
3. **Click on "Logs"**

### Step 3: Select Postgres Logs

1. **You'll see tabs** at the top:
   - **API Logs**
   - **Auth Logs**
   - **Postgres Logs** ← **Click this one!**
   - **Realtime Logs**
   - **Storage Logs**

2. **Click "Postgres Logs"** tab

### Step 4: View Logs

1. **You'll see a list of log entries**
2. **Look for entries with**:
   - **Red color** = Errors
   - **Yellow color** = Warnings
   - **Gray/White** = Info

3. **To see more details**: Click on any log entry to expand it

## 🔍 How to Get the Error

### Method 1: Real-time Monitoring

1. **Open Postgres Logs** (Steps 1-3 above)
2. **Keep the logs page open**
3. **In another tab/window**: Try creating a user via Dashboard
4. **Go back to logs** - new error should appear at the top
5. **Click on the error** to see full details
6. **Copy the error message**

### Method 2: Filter by Time

1. **Open Postgres Logs**
2. **Use the time filter** (usually at top right)
3. **Select "Last 5 minutes"** or "Last hour"
4. **Look for ERROR entries** (red)
5. **Click to expand** and see full error

### Method 3: Search for Errors

1. **Open Postgres Logs**
2. **Use search/filter** (if available)
3. **Search for**: "ERROR" or "error creating"
4. **Find the relevant error**
5. **Copy the full message**

## 📋 What the Error Will Look Like

The error will typically show:

```
ERROR: [exact error message]
CONTEXT: [additional context]
STATEMENT: [SQL statement that failed]
```

Example:
```
ERROR: new row violates check constraint "users_email_check"
CONTEXT: SQL statement "INSERT INTO auth.users..."
```

## 🎯 Visual Guide

```
Supabase Dashboard
├── Left Sidebar
│   ├── Home
│   ├── Database
│   ├── Authentication
│   ├── Storage
│   ├── Edge Functions
│   ├── Realtime
│   └── Logs ← CLICK HERE
│       └── Tabs at top:
│           ├── API Logs
│           ├── Auth Logs
│           ├── Postgres Logs ← CLICK THIS TAB
│           ├── Realtime Logs
│           └── Storage Logs
```

## 💡 Tips

- **Refresh logs** if you don't see new entries
- **Look for red entries** - those are errors
- **Click to expand** - full error details are in expanded view
- **Copy the full error** - including CONTEXT and STATEMENT parts

## 🚀 Quick Access URL

Direct link to Postgres Logs:
```
https://supabase.com/dashboard/project/vvrulvxeaejxhwnafwrq/logs/postgres
```

## 📝 What to Do After Getting Error

1. **Copy the full error message**
2. **Share it** - I can help interpret and fix it
3. **Or check** `CRITICAL_DATABASE_ERROR_FIX.md` for common fixes

The exact error message will tell us exactly what's blocking user creation!

