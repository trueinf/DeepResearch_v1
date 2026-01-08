# 🔧 Fix All Issues - Step by Step Guide

## ❌ Current Issues

1. **Gemini API Error**: `models/gemini-1.5-pro-latest is not found`
2. **500 Errors**: `build-research-graph` and `get-research-graph` functions not deployed

## ✅ What I've Fixed

1. ✅ Changed model name from `gemini-1.5-pro-latest` to `gemini-1.5-pro`
2. ✅ Removed `_shared` imports from `build-research-graph`
3. ✅ Inlined all Neo4j client code

## 📋 What You Need to Do

### Step 1: Deploy Functions to Supabase

**Option A: Via Supabase Dashboard (Easiest)**

1. Go to: https://supabase.com/dashboard
2. Select your project
3. Go to: **Edge Functions**

4. **Deploy `build-research-graph`:**
   - Click "Create Function" or edit existing
   - Name: `build-research-graph`
   - Copy ALL code from: `supabase/functions/build-research-graph/index.ts`
   - Paste into the editor
   - Click **"Deploy"**

5. **Deploy `get-research-graph`:**
   - Click "Create Function" or edit existing
   - Name: `get-research-graph`
   - Copy ALL code from: `supabase/functions/get-research-graph/index.ts`
   - Paste into the editor
   - Click **"Deploy"**

**Option B: Via CLI**

```powershell
cd "C:\Users\karth\Downloads\askDepth_gemini\askDepth_gemini"

# Deploy build-research-graph
npx supabase@latest functions deploy build-research-graph

# Deploy get-research-graph
npx supabase@latest functions deploy get-research-graph
```

### Step 2: Set Required Secrets

Go to Supabase Dashboard → **Settings** → **Edge Functions** → **Secrets**

Set these secrets:

1. **GEMINI_API_KEY** (REQUIRED)
   - Your Gemini API key from Google AI Studio
   - Example: `AIzaSy...` (your actual key from https://aistudio.google.com/app/apikey)

2. **NEO4J_URI** (Optional - if using Neo4j)
   - Your Neo4j connection URI
   - Example: `neo4j+s://77fddcd5.databases.neo4j.io`

3. **NEO4J_USER** (Optional)
   - Neo4j username (usually `neo4j`)

4. **NEO4J_PASSWORD** (Optional)
   - Your Neo4j password

**Via CLI:**
```powershell
npx supabase@latest secrets set GEMINI_API_KEY="your-api-key-here"
npx supabase@latest secrets set NEO4J_URI="neo4j+s://77fddcd5.databases.neo4j.io"
npx supabase@latest secrets set NEO4J_USER="neo4j"
npx supabase@latest secrets set NEO4J_PASSWORD="your-password"
```

### Step 3: Verify Deployment

1. Go to Supabase Dashboard → **Edge Functions**
2. You should see:
   - ✅ `build-research-graph` (deployed)
   - ✅ `get-research-graph` (deployed)

### Step 4: Test in Browser

1. **Refresh your browser** (hard refresh: `Ctrl + Shift + R`)
2. Go to: `http://localhost:5184/map/[your-research-id]`
3. Click **"Build Intelligence Map"**
4. The 500 errors should be gone!

## 🎯 Quick Checklist

- [ ] Deploy `build-research-graph` function
- [ ] Deploy `get-research-graph` function
- [ ] Set `GEMINI_API_KEY` secret
- [ ] (Optional) Set Neo4j secrets if using Neo4j
- [ ] Refresh browser
- [ ] Test building graph

## ⚠️ Important Notes

1. **Model Name Fixed**: Changed from `gemini-1.5-pro-latest` to `gemini-1.5-pro`
2. **Functions Must Be Deployed**: The 500 errors will persist until functions are deployed
3. **API Key Required**: Without `GEMINI_API_KEY`, functions will fail
4. **Neo4j Optional**: Graph will work without Neo4j, but won't persist data

## 🐛 If Still Getting Errors

1. **Check Function Logs:**
   - Supabase Dashboard → Edge Functions → Select function → Logs
   - Look for error messages

2. **Verify API Key:**
   - Make sure `GEMINI_API_KEY` is set correctly
   - Test it at: https://aistudio.google.com/

3. **Check Browser Console:**
   - Press F12 → Console tab
   - Look for specific error messages

4. **Verify Deployment:**
   - Functions should show "Active" status in dashboard
   - Check that code was copied correctly

## ✅ After Fixing

Once deployed and secrets are set:
- ✅ No more 500 errors
- ✅ Graph building will work
- ✅ Trend extraction will work
- ✅ All features will be functional

