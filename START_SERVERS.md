# How to Start the Application

## You need to run TWO servers:

### 1. Frontend Server (React/Vite)
**Location:** Parent folder (`C:\Users\Deepika\New folder\AskDepth`)
```bash
npm run dev
```
This starts the frontend on `http://localhost:5173`

### 2. Backend Server (Express)
**Location:** Server folder (`C:\Users\Deepika\New folder\AskDepth\server`)
```bash
cd server
npm run dev
```
This starts the backend API on `http://localhost:3001`

## Quick Start Commands

Open two terminal windows:

**Terminal 1 - Frontend:**
```bash
cd "C:\Users\Deepika\New folder\AskDepth"
npm run dev
```

**Terminal 2 - Backend:**
```bash
cd "C:\Users\Deepika\New folder\AskDepth\server"
npm run dev
```

## Port Information

- **Frontend:** Port 5173 (Vite default)
- **Backend:** Port 3001 (configurable in `server/.env`)

## If Port 3001 is Already in Use

If you get "port already in use" error:

**Windows:**
```bash
# Find what's using the port
netstat -ano | findstr ":3001"

# Kill the process (replace PID with the number from above)
taskkill /F /PID <PID>
```

Or simply restart your computer.

## Verify Servers are Running

- Frontend: Open `http://localhost:5173` in browser
- Backend: Should see "Server running on http://localhost:3001" in terminal

