# Fixed Port Setup - Port 5184

## ✅ Fixed Port Configuration

I've updated `vite.config.js` to **always use port 5184**.

### Changes Made:
- Set `strictPort: true` - Forces port 5184, won't use different port
- If port 5184 is busy, server will fail to start (instead of using random port)

## Update Supabase Site URL

Now that port is fixed to 5184:

1. **Go to**: Supabase Dashboard → Authentication → URL Configuration
2. **Set Site URL** to: `http://localhost:5184`
3. **Set Redirect URLs** to: `http://localhost:5184/**`
4. **Click "Save changes"**
5. **Done!** Port will always be 5184 now

## If Port 5184 is Busy

If you get an error that port 5184 is already in use:

1. **Find what's using the port**:
   ```powershell
   Get-NetTCPConnection -LocalPort 5184 | Select-Object OwningProcess
   Get-Process -Id <PID> | Select-Object ProcessName
   ```

2. **Kill the process**:
   ```powershell
   Stop-Process -Id <PID> -Force
   ```

3. **Or change to different port** (if needed):
   - Edit `vite.config.js`
   - Change `port: 5184` to `port: 3000` (or any other port)
   - Update Supabase Site URL to match

## Test

1. **Start server**: `npm run dev`
2. **Should always use port 5184** now
3. **Go to**: `http://localhost:5184/signup`
4. **Should work!** ✅

Port is now fixed to 5184!

