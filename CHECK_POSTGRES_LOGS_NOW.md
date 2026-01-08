# Check Postgres Logs - Get Exact Error

## 🔍 Critical: Get the Exact Error

Since Dashboard also failed, we need the **exact error** from Postgres logs.

## Step-by-Step:

### 1. Open Postgres Logs

1. **Go to**: Supabase Dashboard
2. **Click**: **"Logs"** in left sidebar
3. **Click**: **"Postgres Logs"** tab

### 2. Try Creating User

1. **Keep logs open** (in another tab or window)
2. **Go to**: Authentication → Users → Add user
3. **Try to create user**:
   - Email: `test@example.com`
   - Password: `test123`
   - Auto Confirm: Checked
4. **Click**: "Create user"

### 3. Check Logs Immediately

1. **Go back to Postgres Logs**
2. **Look for new ERROR messages** (red, appeared just now)
3. **Click on the error** to expand it
4. **Copy the FULL error message**

### 4. What to Look For

The error will look like:
```
ERROR: [exact error message here]
CONTEXT: [additional context]
```

Common patterns:
- `ERROR: permission denied` → Permission issue
- `ERROR: constraint violation` → Database constraint
- `ERROR: trigger error` → Trigger blocking
- `ERROR: quota exceeded` → Storage full
- `ERROR: relation does not exist` → Table missing

## Share the Error

Once you have the exact error, share it and we can fix it precisely!

The exact error message will tell us exactly what's blocking user creation.

