# How to Deploy Edge Functions

## ⚠️ Important: Where to Run Commands

### ✅ Run in Terminal/PowerShell (Correct)
- Open PowerShell, Command Prompt, or Terminal
- Navigate to your project directory
- Run Supabase CLI commands

### ❌ NOT in Neo4j Browser (Wrong)
- Neo4j Browser is for Cypher queries only
- Commands like `supabase functions deploy` won't work there

## Deploy graph-entities Function

### Step 1: Open Terminal

**Windows:**
- Press `Win + X` → Select "Windows PowerShell" or "Terminal"
- Or search for "PowerShell" in Start menu

**Mac/Linux:**
- Open Terminal app

### Step 2: Navigate to Project Directory

```bash
cd "C:\Users\karth\Downloads\askDepth_gemini\askDepth_gemini"
```

### Step 3: Deploy the Function

```bash
supabase functions deploy graph-entities
```

### Step 4: Verify Deployment

You should see:
```
Deploying function graph-entities...
Function graph-entities deployed successfully
```

## Alternative: Deploy via Supabase Dashboard

If CLI doesn't work:

1. **Go to Supabase Dashboard**
   - Visit: https://supabase.com/dashboard
   - Select your project

2. **Go to Edge Functions**
   - Click "Edge Functions" in left sidebar
   - Find `graph-entities` function

3. **Deploy**
   - Click on the function
   - Click "Deploy" button
   - Or edit the code and save (auto-deploys)

## Deploy All Functions

To deploy all functions at once:

```bash
supabase functions deploy
```

Or deploy individually:

```bash
supabase functions deploy graph-entities
supabase functions deploy init-neo4j-schema
supabase functions deploy build-research-graph
```

## Troubleshooting

### "supabase: command not found"
- Install Supabase CLI: `npm install -g supabase`
- Or use npx: `npx supabase functions deploy graph-entities`

### "Not logged in"
- Login: `supabase login`
- Or link project: `supabase link --project-ref [your-project-ref]`

### "Function not found"
- Make sure you're in the project root directory
- Check that `supabase/functions/graph-entities/index.ts` exists

## Quick Reference

| Command | Description |
|---------|-------------|
| `supabase functions deploy graph-entities` | Deploy entity extraction function |
| `supabase functions list` | List all functions |
| `supabase functions serve` | Test functions locally |
| `supabase login` | Login to Supabase |
| `supabase link` | Link to your project |

