# Fix "Database error creating new user"

## Common Causes & Solutions

### Solution 1: Check Supabase Project Status

1. **Verify Project is Active**
   - Go to Supabase Dashboard
   - Check if project shows any warnings or errors
   - Ensure project is not paused or suspended

2. **Check Database Status**
   - Go to **Settings** → **Database**
   - Verify database is running
   - Check for any connection issues

### Solution 2: Use Supabase Auth API Directly

Instead of using the Dashboard, create users via the Auth API:

#### Option A: Use Supabase Management API

1. **Get your Service Role Key**
   - Go to **Settings** → **API**
   - Copy the **`service_role`** key (NOT the anon key - this is secret!)

2. **Create User via API** (using curl or Postman)

```bash
curl -X POST 'https://YOUR_PROJECT_REF.supabase.co/auth/v1/admin/users' \
  -H "apikey: YOUR_SERVICE_ROLE_KEY" \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "test123456",
    "email_confirm": true,
    "user_metadata": {}
  }'
```

Replace:
- `YOUR_PROJECT_REF` with your Supabase project reference
- `YOUR_SERVICE_ROLE_KEY` with your service role key

#### Option B: Create User via Your App (Signup Page)

Create a signup page in your app:

```javascript
// In your signup component
const { signUp } = useAuth()

const handleSignup = async (email, password) => {
  const { data, error } = await signUp(email, password)
  if (error) {
    console.error('Signup error:', error)
  } else {
    console.log('User created:', data)
  }
}
```

### Solution 3: Check Auth Configuration

1. **Go to Authentication → Settings**
   - Verify **"Enable email signup"** is enabled
   - Check **"Enable email confirmations"** setting
   - Verify **"Site URL"** is set correctly

2. **Check URL Configuration**
   - Go to **Authentication → URL Configuration**
   - Verify **"Site URL"** matches your app URL
   - Check **"Redirect URLs"** includes your app domain

### Solution 4: Check Database Permissions

Run this SQL in Supabase SQL Editor to verify auth schema:

```sql
-- Check if auth schema exists and is accessible
SELECT schema_name 
FROM information_schema.schemata 
WHERE schema_name = 'auth';

-- Check auth.users table exists
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'auth' AND table_name = 'users';
```

If these queries return no results, there's an issue with your Supabase setup.

### Solution 5: Try Alternative Method - SQL Direct Insert

⚠️ **Warning**: Only use this if other methods fail. This bypasses Supabase Auth security.

```sql
-- Generate password hash first
-- You'll need to use a password hashing function
-- This is complex and not recommended

-- Better: Use the Management API or signup flow instead
```

### Solution 6: Contact Supabase Support

If none of the above work:
1. Check Supabase Status: https://status.supabase.com
2. Check your project's logs: **Logs** → **Postgres Logs**
3. Contact Supabase Support with:
   - Your project reference
   - Error message
   - Steps to reproduce

## Recommended: Create Signup Page

The best solution is to create a signup page in your app that uses Supabase Auth API:

### Quick Signup Page Implementation

1. **Create Signup Component**

```javascript
// src/pages/Signup.jsx
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Signup() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const { signUp } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    
    const { data, error: signupError } = await signUp(email, password)
    
    if (signupError) {
      setError(signupError.message)
    } else {
      // Success - redirect to login or dashboard
      navigate('/login')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          required
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          required
        />
        {error && <p className="text-red-600">{error}</p>}
        <button type="submit">Sign Up</button>
      </form>
    </div>
  )
}
```

2. **Add Route to App.jsx**

```javascript
<Route path="/signup" element={<Signup />} />
```

3. **Test Signup**
   - Go to `/signup`
   - Enter email and password
   - Submit form
   - User will be created via Supabase Auth API

## Quick Test: Check Auth is Working

Run this in your browser console (on your app):

```javascript
import { supabase } from './lib/supabase'

// Test signup
supabase.auth.signUp({
  email: 'test@example.com',
  password: 'test123456'
}).then(({ data, error }) => {
  console.log('Signup result:', { data, error })
})
```

If this works, the issue is with the Dashboard UI, not your setup.

## Most Likely Fix

The error is often caused by:
1. **Email confirmation enabled** - Try disabling it temporarily
2. **Site URL not configured** - Set it in Authentication → URL Configuration
3. **Project database issues** - Check project status

**Quick Fix**: Try creating user via API (Solution 2) or signup page (Solution 6).

