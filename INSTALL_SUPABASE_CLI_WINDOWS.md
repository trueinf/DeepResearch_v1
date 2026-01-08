# Install Supabase CLI on Windows

## Method 1: Direct Download (Easiest)

### Step 1: Download the Binary

1. Go to: https://github.com/supabase/cli/releases/latest
2. Download: `supabase_windows_amd64.zip` (or `supabase_windows_arm64.zip` for ARM)
3. Extract the ZIP file
4. You'll get a file named `supabase.exe`

### Step 2: Add to PATH

**Option A: Add to System PATH (Recommended)**

1. Copy `supabase.exe` to a permanent location:
   - Example: `C:\Program Files\Supabase\supabase.exe`
   - Or: `C:\Users\karth\bin\supabase.exe`

2. Add to PATH:
   - Press `Win + X` → System → Advanced system settings
   - Click "Environment Variables"
   - Under "System variables", find "Path" and click "Edit"
   - Click "New" and add the folder path (e.g., `C:\Program Files\Supabase`)
   - Click OK on all dialogs

3. **Restart PowerShell** (close and reopen)

**Option B: Use Current Directory (Quick Test)**

1. Copy `supabase.exe` to your project folder
2. Use it directly: `.\supabase.exe --version`

### Step 3: Verify Installation

Open a **new** PowerShell window and run:
```powershell
supabase --version
```

You should see the version number.

---

## Method 2: Using npx (Temporary - Not Recommended for Deployment)

You can use npx to run Supabase CLI without installing:

```powershell
npx supabase@latest functions deploy build-research-graph
npx supabase@latest functions deploy get-research-graph
```

**Note**: This downloads the CLI each time, so it's slower but works for one-time deployments.

---

## Method 3: Install Scoop First (Then Install Supabase)

### Install Scoop

Run in PowerShell (as Administrator):
```powershell
Set-ExecutionPolicy RemoteSigned -Scope CurrentUser
irm get.scoop.sh | iex
```

### Then Install Supabase

```powershell
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase
```

---

## Quick Setup (Recommended)

**Fastest way for now:**

1. **Download binary**: https://github.com/supabase/cli/releases/latest
   - Download: `supabase_windows_amd64.zip`
   - Extract to: `C:\Users\karth\bin\` (create folder if needed)

2. **Add to PATH**:
   ```powershell
   # Run in PowerShell (as Administrator)
   [Environment]::SetEnvironmentVariable("Path", $env:Path + ";C:\Users\karth\bin", "User")
   ```

3. **Restart PowerShell** and test:
   ```powershell
   supabase --version
   ```

---

## After Installation

Once installed, you can deploy functions:

```powershell
# 1. Login
supabase login

# 2. Link project
supabase link --project-ref YOUR_PROJECT_REF

# 3. Set secrets
supabase secrets set GEMINI_API_KEY="your-key"

# 4. Deploy
supabase functions deploy build-research-graph
supabase functions deploy get-research-graph
```

---

## Troubleshooting

### "supabase is not recognized"
- Make sure you restarted PowerShell after adding to PATH
- Check PATH includes the folder with supabase.exe
- Try using full path: `C:\Users\karth\bin\supabase.exe --version`

### Permission Errors
- Run PowerShell as Administrator
- Check folder permissions

### Still Not Working?
Use npx method for now:
```powershell
npx supabase@latest --version
npx supabase@latest login
npx supabase@latest functions deploy build-research-graph
```

