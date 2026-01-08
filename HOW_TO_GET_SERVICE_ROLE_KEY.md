# How to Get Your Service Role Key

## Step-by-Step Instructions

### 1. Go to Supabase Dashboard
- Navigate to: https://supabase.com/dashboard
- Select your project

### 2. Open Settings
- Click **"Settings"** in the left sidebar (gear icon at bottom)
- Click **"API"** in the settings menu

### 3. Find Service Role Key
- Scroll down to find **"Project API keys"** section
- You'll see two keys:
  - **`anon` `public`** - This is the public key (NOT what you need)
  - **`service_role` `secret`** - This is what you need! ✅

### 4. Reveal the Key
- The `service_role` key is hidden by default
- Click the **eye icon** 👁️ next to it to reveal
- You may need to enter your password to confirm

### 5. Copy the Key
- Click the **copy icon** 📋 next to the revealed key
- The key is very long (200+ characters)
- It looks like: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ2cnVsdnhlYWVqeGh3bmFmd3JxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTY5...`

### 6. Important Notes
- ✅ **Use `service_role` key** (NOT `anon` key)
- ✅ **Copy the entire key** (it's very long)
- ✅ **No spaces** - make sure you copied it completely
- ⚠️ **Keep it secret** - never share or commit to git
- ⚠️ **This key has full admin access** - use carefully

## Common Mistakes

❌ **Wrong**: Using `anon` key (public key)
✅ **Correct**: Using `service_role` key (secret key)

❌ **Wrong**: Copying only part of the key
✅ **Correct**: Copying the entire key (200+ characters)

❌ **Wrong**: Adding spaces or line breaks
✅ **Correct**: Single continuous string

## Verify Your Key

Your Service Role Key should:
- Start with `eyJ` (base64 encoded JWT)
- Be 200+ characters long
- Be a single continuous string (no spaces)
- Be from the `service_role` row (not `anon`)

## Still Getting 401 Error?

1. **Double-check**: Are you using `service_role` (not `anon`)?
2. **Verify length**: Is the key 200+ characters?
3. **Check for spaces**: Did you accidentally add spaces?
4. **Reveal again**: Click the eye icon to make sure you copied the full key
5. **Try copying again**: Sometimes copy/paste can miss characters

## Security Warning

⚠️ **The Service Role Key has full admin access to your Supabase project!**

- Never commit it to git
- Never share it publicly
- Only use it for admin operations
- Consider using it only in backend/server code (not frontend)

For the workaround page, it's okay to use it temporarily, but ideally you'd create users via a backend API endpoint instead.

