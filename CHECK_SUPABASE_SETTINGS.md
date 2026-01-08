# Check All Supabase Auth Settings

## The 500 Error Persists - Check These Settings

Even if "Confirm email" is OFF, check these additional settings:

### 1. Authentication → Settings

Go to **Authentication** → **Settings** and verify:

- ✅ **"Enable email signup"** - Should be ON
- ✅ **"Confirm email"** - Should be OFF (you already checked this)
- ✅ **"Secure email change"** - Can be ON or OFF (doesn't matter)
- ✅ **"Enable custom SMTP"** - Can be OFF (uses Supabase default)

### 2. Authentication → URL Configuration

Go to **Authentication** → **URL Configuration**:

- ✅ **"Site URL"** - Set to: `http://localhost:5184` (or your app URL)
- ✅ **"Redirect URLs"** - Add: `http://localhost:5184/**`

**This is important!** Missing Site URL can cause 500 errors.

### 3. Authentication → Emails

Go to **Authentication** → **Emails**:

- Check all email templates
- Make sure they're not trying to send emails if SMTP isn't configured
- You can disable email sending here if needed

### 4. Check Project Status

1. Go to **Settings** → **General**
2. Check for any warnings or errors
3. Verify project is not paused

### 5. Check Database Logs

1. Go to **Logs** → **Postgres Logs**
2. Look for errors around signup time
3. The exact error message will be there

## Quick Fix: Set Site URL

**Most likely issue**: Site URL is not set!

1. Go to **Authentication** → **URL Configuration**
2. Set **"Site URL"** to: `http://localhost:5184`
3. Add **"Redirect URLs"**: `http://localhost:5184/**`
4. Click **"Save"**
5. Try signup again

## Alternative: Use Management API

If signup still fails, create users via Management API (bypasses all these issues):

### Get Service Role Key
1. Go to **Settings** → **API**
2. Copy **`service_role`** key

### Create User Script

Save this as `create-user.js`:

```javascript
const SUPABASE_URL = 'https://vvrulvxeaejxhwnafwrq.supabase.co'
const SERVICE_ROLE_KEY = 'YOUR_SERVICE_ROLE_KEY' // Get from Settings → API

async function createUser(email, password) {
  const response = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
    method: 'POST',
    headers: {
      'apikey': SERVICE_ROLE_KEY,
      'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      email: email,
      password: password,
      email_confirm: true, // Auto-confirm, no email needed
      user_metadata: {}
    })
  })
  
  const data = await response.json()
  console.log('User created:', data)
  return data
}

// Usage
createUser('test@example.com', 'test123')
```

Run in Node.js or browser console.

## Most Common Fix

**90% of 500 errors are caused by:**
1. ❌ Site URL not set → **Fix**: Set it in URL Configuration
2. ❌ Email confirmation enabled → **Fix**: Disable it (you already did this)
3. ❌ Database connection issue → **Fix**: Check project status

**Try setting Site URL first** - that's the most common cause!

