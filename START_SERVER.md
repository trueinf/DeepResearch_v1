# How to Start the Development Server

## Quick Start

1. **Open terminal** in project directory:
   ```bash
   cd c:\Users\karth\Downloads\askDepth_gemini\askDepth_gemini
   ```

2. **Start the server**:
   ```bash
   npm run dev
   ```

3. **Wait for output** - You should see:
   ```
   VITE v5.x.x  ready in xxx ms

   ➜  Local:   http://localhost:5184/
   ➜  Network: use --host to expose
   ```

4. **Open browser** to: `http://localhost:5184`

## If Server Won't Start

### Check 1: Dependencies Installed
```bash
npm install
```

### Check 2: Port Already in Use
If port 5184 is already in use:
- Close other applications using port 5184
- Or change port in `vite.config.js`:
  ```js
  export default {
    server: {
      port: 5185  // Change to different port
    }
  }
  ```

### Check 3: Environment Variables
Make sure `.env` file exists with:
```env
VITE_SUPABASE_URL=https://vvrulvxeaejxhwnafwrq.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
```

### Check 4: Check for Errors
Look at terminal output for error messages:
- Missing dependencies → Run `npm install`
- Port conflict → Change port or close other app
- Syntax errors → Fix code errors

## Manual Start (If Background Doesn't Work)

1. **Open PowerShell** or Command Prompt
2. **Navigate to project**:
   ```bash
   cd c:\Users\karth\Downloads\askDepth_gemini\askDepth_gemini
   ```
3. **Run**:
   ```bash
   npm run dev
   ```
4. **Keep terminal open** - Don't close it!
5. **Open browser** to the URL shown in terminal

## Troubleshooting

- **"Cannot find module"** → Run `npm install`
- **"Port already in use"** → Change port or kill process using port
- **"EADDRINUSE"** → Port 5184 is busy, use different port
- **Blank page** → Check browser console for errors
- **"Failed to fetch"** → Check Supabase URL in `.env`

## Expected Output

When server starts successfully, you should see:
```
  VITE v5.0.8  ready in 500 ms

  ➜  Local:   http://localhost:5184/
  ➜  press h to show help
```

Then open `http://localhost:5184` in your browser!

