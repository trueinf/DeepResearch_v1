# How to Link Neo4j AuraDB to Supabase

## Step-by-Step Guide

### Step 1: Get Your Neo4j Credentials

From your Neo4j AuraDB dashboard, you have:
- **Connection URI**: `neo4j+s://77fddcd5.databases.neo4j.io`
- **Username**: `neo4j` (default)
- **Password**: [Copy from AuraDB dashboard - you saved it when creating the instance]

### Step 2: Set Secrets in Supabase Dashboard

1. **Go to Supabase Dashboard**
   - Visit: https://supabase.com/dashboard
   - Select your project

2. **Navigate to Edge Functions Secrets**
   - Click on **Project Settings** (gear icon in left sidebar)
   - Click on **Edge Functions** in the left menu
   - Click on **Secrets** tab

3. **Add Neo4j Secrets**

   **Secret 1: NEO4J_URI**
   - Click **"Add Secret"** button
   - **Name**: `NEO4J_URI`
   - **Value**: `neo4j+s://77fddcd5.databases.neo4j.io`
   - Click **"Save"**

   **Secret 2: NEO4J_USER**
   - Click **"Add Secret"** button
   - **Name**: `NEO4J_USER`
   - **Value**: `neo4j`
   - Click **"Save"**

   **Secret 3: NEO4J_PASSWORD**
   - Click **"Add Secret"** button
   - **Name**: `NEO4J_PASSWORD`
   - **Value**: [Paste your Neo4j password from AuraDB]
   - Click **"Save"**

### Step 3: Verify Secrets Are Set

You should now see 3 secrets in the list:
- ✅ `NEO4J_URI`
- ✅ `NEO4J_USER`
- ✅ `NEO4J_PASSWORD`

### Step 4: Deploy Edge Functions

#### Option A: Via Supabase Dashboard

1. **Go to Edge Functions**
   - Click **Edge Functions** in left sidebar
   - You should see your functions list

2. **Deploy init-neo4j-schema**
   - Find `init-neo4j-schema` function
   - Click on it
   - Click **"Deploy"** button
   - Wait for deployment to complete

3. **Deploy build-research-graph**
   - Find `build-research-graph` function
   - Click on it
   - Click **"Deploy"** button
   - Wait for deployment to complete

#### Option B: Via Supabase CLI

```bash
# Make sure you're in your project directory
cd "C:\Users\karth\Downloads\askDepth_gemini\askDepth_gemini"

# Deploy init-neo4j-schema function
supabase functions deploy init-neo4j-schema

# Deploy build-research-graph function
supabase functions deploy build-research-graph
```

### Step 5: Test the Connection

#### Option A: Via Supabase Dashboard

1. **Go to Edge Functions**
   - Click **Edge Functions** in left sidebar
   - Click on `init-neo4j-schema` function

2. **Invoke the Function**
   - Click **"Invoke"** button
   - Or click **"Test"** tab
   - Click **"Run"** button

3. **Check Response**
   - You should see: `{"success": true, "message": "Neo4j schema initialized successfully"}`
   - If you see errors, check the logs

#### Option B: Via cURL

```bash
# Replace [YOUR_PROJECT_REF] and [YOUR_ANON_KEY] with your actual values
curl -X POST https://[YOUR_PROJECT_REF].supabase.co/functions/v1/init-neo4j-schema \
  -H "Authorization: Bearer [YOUR_ANON_KEY]" \
  -H "Content-Type: application/json"
```

**To find your values:**
- **Project Ref**: Supabase Dashboard → Settings → General → Reference ID
- **Anon Key**: Supabase Dashboard → Settings → API → anon/public key

### Step 6: Verify in Neo4j Browser

1. **Open Neo4j Browser**
   - Go to: https://77fddcd5.databases.neo4j.io
   - Log in with your AuraDB credentials

2. **Run Test Query**
   ```cypher
   MATCH (n) RETURN count(n) as nodeCount
   ```
   - Should return `0` initially (fresh instance)

3. **Check Schema**
   ```cypher
   CALL db.constraints()
   ```
   - Should show constraints for Concept, Person, Organization, Trend, Problem, Solution

## ✅ Success Indicators

You'll know it's working when:

1. ✅ All 3 secrets are set in Supabase
2. ✅ Functions deploy without errors
3. ✅ `init-neo4j-schema` returns success message
4. ✅ Neo4j Browser shows constraints created
5. ✅ When you build a research graph, nodes appear in Neo4j

## 🔧 Troubleshooting

### "Neo4j credentials not configured"
- **Solution**: Make sure all 3 secrets are set in Supabase
- **Check**: Go to Project Settings → Edge Functions → Secrets

### "Connection failed" or "401 Unauthorized"
- **Solution**: Verify password is correct
- **Check**: Copy password directly from AuraDB dashboard

### "404 Not Found"
- **Solution**: The client will automatically try Query API v2
- **Note**: This is handled automatically, no action needed

### Function deployment fails
- **Solution**: Check function code is correct
- **Check**: View function logs in Supabase Dashboard

## 📋 Quick Checklist

- [ ] Neo4j AuraDB instance created (77fddcd5)
- [ ] Secrets set in Supabase (NEO4J_URI, NEO4J_USER, NEO4J_PASSWORD)
- [ ] Functions deployed (init-neo4j-schema, build-research-graph)
- [ ] Connection tested (init-neo4j-schema returns success)
- [ ] Schema verified in Neo4j Browser

## 🎉 You're Done!

Once all steps are complete, your Neo4j AuraDB is linked to Supabase. Research graphs will automatically be saved to Neo4j when you build them!

