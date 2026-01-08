# 🚀 Running the Project Locally

## Quick Start (Recommended)

### Method 1: Vite Dev Server (Fastest)

```bash
npm run dev
```

- **URL:** http://localhost:5173 (or check terminal output)
- **Features:** Fast hot reload, instant updates
- **Best for:** Development and testing

---

## Method 2: Vercel Dev (Production-like)

### Step 1: Login to Vercel

```bash
vercel login
```

This will open your browser to authenticate.

### Step 2: Link to Your Project

```bash
vercel link
```

When prompted:
- **Set up and develop?** → Yes
- **Which scope?** → Select your team/account
- **Link to existing project?** → Yes
- **What's the name of your existing project?** → `askdepth_gemini`
- **In which directory is your code located?** → `./`

Or manually link:
```bash
vercel link --project askdepth_gemini --scope trueinfs-projects
```

### Step 3: Run Dev Server

```bash
vercel dev
```

- **URL:** http://localhost:3000
- **Features:** Simulates Vercel production environment
- **Best for:** Testing production builds locally

---

## Method 3: Build and Preview

```bash
# Build the project
npm run build

# Preview the production build
npm run preview
```

- **URL:** http://localhost:4173 (or check terminal output)
- **Features:** Preview production build locally
- **Best for:** Testing production build before deployment

---

## Environment Variables

Make sure you have a `.env` file with:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

---

## Troubleshooting

### Port Already in Use

If port 5173 is taken, Vite will automatically use the next available port (5174, 5175, etc.)

### Vercel Dev Issues

If `vercel dev` fails:
1. Make sure you're logged in: `vercel login`
2. Make sure project is linked: `vercel link`
3. Check `.vercel` folder exists (created after linking)

### Build Errors

If you get build errors:
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

---

## Quick Commands Reference

```bash
# Development (Vite)
npm run dev

# Vercel Dev (Production-like)
vercel dev

# Build
npm run build

# Preview build
npm run preview

# Vercel Login
vercel login

# Link Project
vercel link
```

---

## Default URLs

- **Vite Dev:** http://localhost:5173
- **Vercel Dev:** http://localhost:3000
- **Vite Preview:** http://localhost:4173

Check your terminal output for the actual URL if different.
