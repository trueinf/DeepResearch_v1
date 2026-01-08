# How to Run the Project

## 🚀 Quick Start

### Step 1: Open Terminal
- **Windows**: PowerShell or Command Prompt
- **Mac/Linux**: Terminal

### Step 2: Navigate to Project Directory
```bash
cd C:\Users\karth\Downloads\askDepth_gemini\askDepth_gemini
```

### Step 3: Install Dependencies (First Time Only)
```bash
npm install
```

### Step 4: Start Development Server
```bash
npm run dev
```

### Step 5: Open in Browser
- The server will start on: **http://localhost:5184**
- Open this URL in your browser

---

## 📋 Complete Commands

### Windows PowerShell
```powershell
# Navigate to project
cd C:\Users\karth\Downloads\askDepth_gemini\askDepth_gemini

# Install dependencies (first time only)
npm install

# Start server
npm run dev
```

### Mac/Linux Terminal
```bash
# Navigate to project
cd ~/Downloads/askDepth_gemini/askDepth_gemini

# Install dependencies (first time only)
npm install

# Start server
npm run dev
```

---

## 🔧 Common Commands

### Start Development Server
```bash
npm run dev
```
- Runs on: `http://localhost:5184`
- Auto-reloads on file changes

### Build for Production
```bash
npm run build
```
- Creates optimized production build in `dist/` folder

### Preview Production Build
```bash
npm run preview
```
- Preview the production build locally

### Stop Server
- Press `Ctrl + C` in the terminal

---

## 🐛 Troubleshooting

### Port Already in Use
If you see "Port 5184 is already in use":

**Windows PowerShell:**
```powershell
# Kill process on port 5184
Get-NetTCPConnection -LocalPort 5184 -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess | ForEach-Object { Stop-Process -Id $_ -Force }

# Or kill all node processes
Get-Process -Name node -ErrorAction SilentlyContinue | Stop-Process -Force

# Then restart
npm run dev
```

**Mac/Linux:**
```bash
# Kill process on port 5184
lsof -ti:5184 | xargs kill -9

# Then restart
npm run dev
```

### Dependencies Not Installed
```bash
npm install
```

### Module Not Found Errors
```bash
# Delete node_modules and reinstall
rm -rf node_modules
npm install
```

**Windows:**
```powershell
Remove-Item -Recurse -Force node_modules
npm install
```

---

## ✅ Success Indicators

When the server starts successfully, you'll see:
```
  VITE v5.0.8  ready in XXX ms

  ➜  Local:   http://localhost:5184/
  ➜  Network: use --host to expose
  ➜  press h + enter to show help
```

---

## 📝 Quick Reference

| Command | Purpose |
|---------|---------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |
| `npm install` | Install dependencies |
| `Ctrl + C` | Stop server |

---

## 🎯 Typical Workflow

1. **Open terminal**
2. **Navigate to project**: `cd path/to/askDepth_gemini`
3. **Start server**: `npm run dev`
4. **Open browser**: `http://localhost:5184`
5. **Make changes** (auto-reloads)
6. **Stop server**: `Ctrl + C`

---

**Project runs on**: `http://localhost:5184`  
**Port is fixed**: Cannot be changed (configured in `vite.config.js`)

