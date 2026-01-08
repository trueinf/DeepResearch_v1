# 🚀 Final Deployment Steps - Fix All Errors

## ✅ What I Just Fixed

1. ✅ Changed model from `gemini-1.5-pro` to `gemini-2.0-flash-lite` (working model)
2. ✅ Fixed all graph functions to use the correct model
3. ✅ Removed `_shared` imports

## 📋 Deploy These Functions (IN THIS ORDER)

### Step 1: Deploy `build-research-graph`

1. **Open the file:**
   - `supabase/functions/build-research-graph/index.ts`
   - This is a `.ts` file (TypeScript code)

2. **Copy ALL code:**
   - Press `Ctrl + A` (select all)
   - Press `Ctrl + C` (copy)

3. **Deploy in Supabase:**
   - Go to: https://supabase.com/dashboard
   - Select your project
   - Go to: **Edge Functions**
   - Click **"Create Function"** or edit existing
   - **Name**: `build-research-graph`
   - **Paste the code** (should start with `// @ts-ignore`)
   - Click **"Deploy"**

### Step 2: Deploy `get-research-graph`

1. **Open the file:**
   - `supabase/functions/get-research-graph/index.ts`

2. **Copy ALL code:**
   - Press `Ctrl + A` (select all)
   - Press `Ctrl + C` (copy)

3. **Deploy in Supabase:**
   - Same process as above
   - **Name**: `get-research-graph`
   - Paste and deploy

### Step 3: Verify Secrets

Go to: **Settings** → **Edge Functions** → **Secrets**

Make sure these are set:
- ✅ `GEMINI_API_KEY` (REQUIRED)
- ✅ `NEO4J_URI` (optional)
- ✅ `NEO4J_USER` (optional)
- ✅ `NEO4J_PASSWORD` (optional)

## ✅ After Deployment

1. **Refresh browser** (Ctrl + Shift + R)
2. **Try building graph again**
3. **Errors should be resolved!**

## 🎯 Quick Checklist

- [ ] Deploy `build-research-graph` (copy from `.ts` file)
- [ ] Deploy `get-research-graph` (copy from `.ts` file)
- [ ] Verify `GEMINI_API_KEY` secret is set
- [ ] Refresh browser
- [ ] Test building graph

## ⚠️ Important Reminders

1. **Copy from `.ts` files**, NOT `.md` files
2. **Model is now**: `gemini-2.0-flash-lite` (working model)
3. **Functions must be deployed** to fix 500 errors

