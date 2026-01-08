# Deploy Graph Functions - Fix 500 Errors

## ❌ Current Issue

The `build-research-graph` and `get-research-graph` functions are returning **500 errors** because they are **not deployed** to Supabase.

## ✅ Solution: Deploy the Functions

### Option 1: Deploy via Supabase Dashboard (Easiest)

1. **Go to Supabase Dashboard**
   - Navigate to: https://supabase.com/dashboard
   - Select your project

2. **Deploy `build-research-graph` function:**
   - Go to: Edge Functions → Create Function
   - Name: `build-research-graph`
   - Copy code from: `supabase/functions/build-research-graph/index.ts`
   - Paste and click "Deploy"

3. **Deploy `get-research-graph` function:**
   - Go to: Edge Functions → Create Function
   - Name: `get-research-graph`
   - Copy code from: `supabase/functions/get-research-graph/index.ts`
   - Paste and click "Deploy"

### Option 2: Deploy via CLI

```powershell
# Make sure you're in the project directory
cd "C:\Users\karth\Downloads\askDepth_gemini\askDepth_gemini"

# Deploy build-research-graph
npx supabase@latest functions deploy build-research-graph

# Deploy get-research-graph
npx supabase@latest functions deploy get-research-graph
```

### Option 3: Deploy All Graph Functions

```powershell
# Deploy all graph-related functions
npx supabase@latest functions deploy build-research-graph
npx supabase@latest functions deploy get-research-graph
npx supabase@latest functions deploy graph-entities
npx supabase@latest functions deploy graph-relationships
npx supabase@latest functions deploy detect-communities
npx supabase@latest functions deploy extract-causal-relationships
npx supabase@latest functions deploy extract-trend-signals
npx supabase@latest functions deploy analyze-trends
```

## 🔧 Required Secrets

Make sure these secrets are set in Supabase:

```powershell
# Set Neo4j secrets (if using Neo4j)
npx supabase@latest secrets set NEO4J_URI="neo4j+s://77fddcd5.databases.neo4j.io"
npx supabase@latest secrets set NEO4J_USER="neo4j"
npx supabase@latest secrets set NEO4J_PASSWORD="your-password"

# Set Gemini API key (required)
npx supabase@latest secrets set GEMINI_API_KEY="your-gemini-api-key"
```

## 📋 Quick Fix Steps

1. **Deploy the functions** (use Option 1 - Dashboard is easiest)
2. **Set required secrets** (GEMINI_API_KEY is mandatory)
3. **Refresh your browser** and try building the graph again

## ✅ After Deployment

Once deployed, the functions will be available at:
- `https://[your-project].supabase.co/functions/v1/build-research-graph`
- `https://[your-project].supabase.co/functions/v1/get-research-graph`

The 500 errors should be resolved!

