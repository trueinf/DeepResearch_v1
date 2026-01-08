# Capture Error in Real-Time

## 🎯 Best Method: Real-Time Capture

### Step 1: Prepare

1. **Open Postgres Logs** (keep this tab open)
2. **Clear the search/filter** (if any)
3. **Set time to "Last 15 minutes"** or "Last hour"

### Step 2: Try Creating User

1. **Open new tab**: Authentication → Users → Add user
2. **Fill form**:
   - Email: `test@example.com`
   - Password: `test123`
   - Auto Confirm: Checked
3. **Click "Create user"**

### Step 3: Immediately Check Logs

1. **Go back to Postgres Logs tab**
2. **Look at the TOP** of the log list
3. **New error should appear** (if it failed)
4. **Click on the error** to expand
5. **Copy the full error message**

## 🔍 Alternative: Filter for Errors

1. **In Postgres Logs page**
2. **Click "Severity" dropdown** (top right)
3. **Select "ERROR"**
4. **This shows only errors**
5. **Try creating user** and check for new error

## 📋 What You're Looking For

The error will look like:
```
ERROR: [specific error message]
CONTEXT: [additional details]
STATEMENT: INSERT INTO auth.users...
```

Common errors:
- `ERROR: permission denied`
- `ERROR: constraint violation`
- `ERROR: quota exceeded`
- `ERROR: trigger error`

## 💡 Tip

If you don't see errors in Postgres logs, also check:
- **Auth logs** (click "Auth" in left sidebar)
- **API logs** (might show different error)

The exact error message will tell us what's wrong!

