# Create User Script - Management API

## ✅ Script Created!

I've created `create-user.js` - a Node.js script to create users directly via Supabase Management API.

## 🚀 Quick Start

### Option 1: Interactive Mode (Easiest)

1. **Get your Service Role Key**:
   - Go to Supabase Dashboard → Settings → API
   - Find **"service_role"** key (NOT anon key)
   - Click eye icon 👁️ to reveal it
   - Copy the full key

2. **Set environment variable**:
   ```powershell
   # Windows PowerShell
   $env:SUPABASE_SERVICE_ROLE_KEY="your_service_role_key_here"
   ```

   ```bash
   # Linux/Mac
   export SUPABASE_SERVICE_ROLE_KEY="your_service_role_key_here"
   ```

3. **Run the script**:
   ```bash
   npm run create-user
   ```

4. **Enter details when prompted**:
   - Email: `test@example.com`
   - Password: `test123`

5. **Done!** ✅ User created!

### Option 2: Command Line Arguments

```bash
# Set service role key
$env:SUPABASE_SERVICE_ROLE_KEY="your_key_here"

# Create user directly
node create-user.js test@example.com test123
```

### Option 3: Use .env File

1. **Create `.env` file** in project root:
   ```env
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
   ```

2. **Install dotenv** (if not already):
   ```bash
   npm install dotenv
   ```

3. **Update script** to load .env (or use existing .env loading)

4. **Run**:
   ```bash
   npm run create-user
   ```

## 📋 What the Script Does

1. ✅ Creates user via Supabase Admin API
2. ✅ Auto-confirms email (no verification needed)
3. ✅ Shows user details after creation
4. ✅ Provides login instructions
5. ✅ Handles errors gracefully

## 🔒 Security Note

⚠️ **Service Role Key is SECRET!**

- Never commit it to git
- Never share it publicly
- Only use in backend/server scripts
- This script is for development/testing only

## 📝 Example Usage

```bash
# Interactive mode
$env:SUPABASE_SERVICE_ROLE_KEY="eyJhbGc..."
npm run create-user

# Or with arguments
node create-user.js user@example.com password123
```

## ✅ Output Example

```
🚀 Supabase User Creation Script
================================

📝 Enter user details (or press Ctrl+C to cancel)

Email: test@example.com
Password (min 6 chars): test123

🔧 Creating Supabase admin client...
📧 Creating user: test@example.com
⏳ Please wait...

✅ User created successfully!

📋 User Details:
   Email: test@example.com
   ID: 12345678-1234-1234-1234-123456789012
   Email Confirmed: Yes
   Created At: 2025-01-27T12:00:00.000Z

🎉 You can now login at: http://localhost:5184/login
   Email: test@example.com
   Password: test123
```

## 🐛 Troubleshooting

### Error: "SUPABASE_SERVICE_ROLE_KEY not set"
- **Fix**: Set the environment variable (see Option 1 above)

### Error: "User already registered"
- **Fix**: Use a different email address

### Error: "Invalid API key"
- **Fix**: Make sure you're using `service_role` key (not `anon` key)

### Error: "Cannot find module '@supabase/supabase-js'"
- **Fix**: Run `npm install` first

## 🎯 Why This Works

- ✅ Bypasses all signup code issues
- ✅ Works regardless of Site URL configuration
- ✅ Works even with billing restrictions
- ✅ Direct database access via admin API
- ✅ Always succeeds (unless database is down)

## 📚 Next Steps

1. **Create test users** using this script
2. **Login** at `http://localhost:5184/login`
3. **Test your app** - everything should work!
4. **Fix Site URL** later for regular signup to work

This script gives you a reliable way to create users for testing! 🚀

