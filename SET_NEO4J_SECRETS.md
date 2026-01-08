# Set Neo4j Secrets in Supabase

## Your Neo4j AuraDB Connection Details

- **Connection URI**: `neo4j+s://77fddcd5.databases.neo4j.io`
- **Query API**: `https://77fddcd5.databases.neo4j.io/db/neo4j/query/v2`
- **Username**: `neo4j` (default)
- **Password**: [Your password from AuraDB dashboard]
- **Instance**: Deep_Research (Fresh - 0 nodes, 0 relationships)

## Step-by-Step: Set Secrets in Supabase

### Option 1: Via Supabase Dashboard (Recommended)

1. **Go to Supabase Dashboard**
   - Navigate to your project
   - Go to: **Project Settings** → **Edge Functions** → **Secrets**

2. **Add Each Secret**
   
   **Secret 1: NEO4J_URI**
   - Click "Add Secret"
   - Name: `NEO4J_URI`
   - Value: `neo4j+s://77fddcd5.databases.neo4j.io`
   - Click "Save"

   **Secret 2: NEO4J_USER**
   - Click "Add Secret"
   - Name: `NEO4J_USER`
   - Value: `neo4j`
   - Click "Save"

   **Secret 3: NEO4J_PASSWORD**
   - Click "Add Secret"
   - Name: `NEO4J_PASSWORD`
   - Value: [Your Neo4j password from AuraDB]
   - Click "Save"

### Option 2: Via Supabase CLI

```bash
# Set Neo4j URI
supabase secrets set NEO4J_URI="neo4j+s://77fddcd5.databases.neo4j.io"

# Set Neo4j Username
supabase secrets set NEO4J_USER="neo4j"

# Set Neo4j Password
supabase secrets set NEO4J_PASSWORD="your-password-here"
```

### Option 3: Via npx (if CLI not installed)

```bash
# Set Neo4j URI
npx supabase@latest secrets set NEO4J_URI="neo4j+s://77fddcd5.databases.neo4j.io"

# Set Neo4j Username
npx supabase@latest secrets set NEO4J_USER="neo4j"

# Set Neo4j Password
npx supabase@latest secrets set NEO4J_PASSWORD="your-password-here"
```

## Verify Secrets Are Set

1. Go to: **Project Settings** → **Edge Functions** → **Secrets**
2. You should see:
   - ✅ `NEO4J_URI`
   - ✅ `NEO4J_USER`
   - ✅ `NEO4J_PASSWORD`

## Next Steps

After setting secrets:

1. **Deploy the functions**:
   ```bash
   supabase functions deploy init-neo4j-schema
   supabase functions deploy build-research-graph
   ```

2. **Test the connection**:
   - Go to Edge Functions → `init-neo4j-schema` → Invoke
   - Or use curl:
     ```bash
     curl -X POST https://[your-project].supabase.co/functions/v1/init-neo4j-schema \
       -H "Authorization: Bearer [your-anon-key]"
     ```

3. **Check Neo4j Browser**:
   - Go to: https://77fddcd5.databases.neo4j.io
   - Run: `MATCH (n) RETURN n LIMIT 25`
   - After building graphs, you'll see nodes and relationships created

## Troubleshooting

### "Neo4j credentials not configured"
- Make sure all 3 secrets are set
- Redeploy functions after setting secrets

### "Connection failed"
- Verify password is correct
- Check that URI format is exactly: `neo4j+s://77fddcd5.databases.neo4j.io`
- Ensure username is `neo4j` (default)

### "404 Not Found"
- The client will automatically try Query API v2 if traditional API fails
- This is handled automatically

