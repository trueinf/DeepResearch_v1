# Deploy Edge Functions Using npx (No Installation Required)

Since Supabase CLI isn't installed globally, you can use `npx` to deploy functions without installing.

---

## Quick Deployment Commands

### Step 1: Login to Supabase
```powershell
npx supabase@latest login
```

### Step 2: Link Your Project
```powershell
# Get your project reference from Supabase Dashboard
# Settings → General → Reference ID

npx supabase@latest link --project-ref YOUR_PROJECT_REF
```

### Step 3: Set Secrets
```powershell
# Set Gemini API Key (required)
npx supabase@latest secrets set GEMINI_API_KEY="your-gemini-api-key"

# Optional: Neo4j (only if using Neo4j)
npx supabase@latest secrets set NEO4J_URI="neo4j+s://xxxxx.databases.neo4j.io"
npx supabase@latest secrets set NEO4J_USER="neo4j"
npx supabase@latest secrets set NEO4J_PASSWORD="your-password"
```

### Step 4: Deploy Functions
```powershell
# Deploy build-research-graph
npx supabase@latest functions deploy build-research-graph

# Deploy get-research-graph
npx supabase@latest functions deploy get-research-graph
```

### Step 5: Verify
```powershell
npx supabase@latest functions list
```

---

## Complete Example

```powershell
# 1. Login (opens browser)
npx supabase@latest login

# 2. Link project (replace YOUR_PROJECT_REF)
npx supabase@latest link --project-ref YOUR_PROJECT_REF

# 3. Set Gemini API key (replace with your actual key)
npx supabase@latest secrets set GEMINI_API_KEY="your-actual-key-here"

# 4. Deploy functions
npx supabase@latest functions deploy build-research-graph
npx supabase@latest functions deploy get-research-graph

# 5. Check they're deployed
npx supabase@latest functions list
```

---

## Notes

- **npx downloads CLI each time** - First run is slower, but it works
- **No installation needed** - Perfect for one-time deployments
- **Same commands** - Just prefix with `npx supabase@latest`

---

## Alternative: Install CLI Properly

If you'll deploy frequently, install the CLI properly:
- See `INSTALL_SUPABASE_CLI_WINDOWS.md` for installation instructions
- Then you can use `supabase` directly without `npx`

