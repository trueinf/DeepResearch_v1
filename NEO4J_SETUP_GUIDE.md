# Neo4j AuraDB Setup Guide

## ✅ Phase 1: Create Neo4j AuraDB Free Instance

### Step 1: Create Free Tier Database

1. **Go to Neo4j Aura**
   - Visit: https://aura.neo4j.io
   - Sign up or log in with your account

2. **Create New Instance**
   - Click "Create Free Instance" or "New Instance"
   - Choose "Free Tier" (no credit card required)
   - Select a region close to you
   - Click "Create Instance"

3. **Wait for Instance Creation**
   - This takes 2-3 minutes
   - You'll see a progress indicator

4. **Copy Connection Details**
   Once created, you'll see:
   - **Bolt URL**: `neo4j+s://xxxxx.databases.neo4j.io`
   - **Username**: Usually `neo4j`
   - **Password**: Auto-generated (copy immediately!)

   ⚠️ **IMPORTANT**: Save the password - you won't see it again!

### Step 2: Set Up Backend Connection

#### For Supabase Edge Functions (Deno Runtime)

The connection is already set up using the HTTP API. You just need to configure the secrets.

#### Set Secrets in Supabase

1. **Go to Supabase Dashboard**
   - Navigate to: Project Settings → Edge Functions → Secrets

2. **Add Neo4j Secrets**
   ```
   Name: NEO4J_URI
   Value: neo4j+s://xxxxx.databases.neo4j.io
   
   Name: NEO4J_USER
   Value: neo4j
   
   Name: NEO4J_PASSWORD
   Value: [your-password-from-aura]
   ```

3. **Or use CLI**:
   ```bash
   supabase secrets set NEO4J_URI="neo4j+s://xxxxx.databases.neo4j.io"
   supabase secrets set NEO4J_USER="neo4j"
   supabase secrets set NEO4J_PASSWORD="your-password"
   ```

### Step 3: Initialize Database Schema

#### Option A: Use the Edge Function (Recommended)

1. **Deploy the init function** (if not already deployed):
   ```bash
   supabase functions deploy init-neo4j-schema
   ```

2. **Call the function**:
   ```bash
   curl -X POST https://[your-project].supabase.co/functions/v1/init-neo4j-schema \
     -H "Authorization: Bearer [your-anon-key]"
   ```

   Or use the Supabase Dashboard:
   - Go to Edge Functions → `init-neo4j-schema` → Invoke

#### Option B: Manual Schema Creation

Connect to Neo4j Browser (https://[your-instance].databases.neo4j.io) and run:

```cypher
// Create constraints for unique IDs
CREATE CONSTRAINT concept_id IF NOT EXISTS
FOR (n:Concept) REQUIRE n.id IS UNIQUE;

CREATE CONSTRAINT person_id IF NOT EXISTS
FOR (n:Person) REQUIRE n.id IS UNIQUE;

CREATE CONSTRAINT organization_id IF NOT EXISTS
FOR (n:Organization) REQUIRE n.id IS UNIQUE;

CREATE CONSTRAINT trend_id IF NOT EXISTS
FOR (n:Trend) REQUIRE n.id IS UNIQUE;

CREATE CONSTRAINT problem_id IF NOT EXISTS
FOR (n:Problem) REQUIRE n.id IS UNIQUE;

CREATE CONSTRAINT solution_id IF NOT EXISTS
FOR (n:Solution) REQUIRE n.id IS UNIQUE;

// Create index for researchId
CREATE INDEX researchId_index IF NOT EXISTS
FOR (n) ON (n.researchId);
```

## 📋 Database Schema

### Node Types

1. **Concept** - Abstract concepts, ideas, theories, technologies
2. **Person** - Individual people mentioned
3. **Organization** - Companies, institutions, agencies
4. **Trend** - Trends, events, movements
5. **Problem** - Problems, risks, threats, concerns
6. **Solution** - Solutions, benefits, opportunities

### Relationship Types

1. **RELATES_TO** - General relationship between entities
2. **INFLUENCES** - A influences B
3. **CAUSES** - A causes B
4. **CONTRADICTS** - A contradicts B
5. **SUPPORTS** - A supports B
6. **PART_OF** - A is part of B

### Node Properties

- `id` (unique) - Unique identifier: `{researchId}_{entityId}`
- `researchId` - Links to research report
- `label` - Display name
- `description` - Brief description
- `confidence` - Confidence score (0-1)
- `citations` - Array of citation numbers
- `originalType` - Original entity type before mapping
- `createdAt` - Creation timestamp
- `updatedAt` - Last update timestamp

### Relationship Properties

- `confidence` - Confidence score (0-1)
- `evidence` - Evidence text
- `strength` - Relationship strength (0-1)
- `citations` - Array of citation numbers
- `originalType` - Original relationship type before mapping
- `createdAt` - Creation timestamp
- `updatedAt` - Last update timestamp

## ✅ Verification

### Test Connection

1. **Deploy build-research-graph function**:
   ```bash
   supabase functions deploy build-research-graph
   ```

2. **Create a research report** in your app

3. **Check Neo4j Browser**:
   - Go to: https://[your-instance].databases.neo4j.io
   - Run query:
     ```cypher
     MATCH (n) RETURN n LIMIT 25
     ```
   - You should see nodes created!

### Check Schema

```cypher
// Count nodes by type
MATCH (n) 
RETURN labels(n)[0] as type, count(n) as count 
ORDER BY count DESC;

// Count relationships by type
MATCH ()-[r]->() 
RETURN type(r) as relType, count(r) as count 
ORDER BY count DESC;
```

## 🔧 Troubleshooting

### Connection Failed

- **Check URI format**: Should be `neo4j+s://...` for AuraDB
- **Verify credentials**: Username is usually `neo4j`
- **Check network**: Ensure Supabase can reach Neo4j (should work by default)

### Schema Errors

- **Constraints already exist**: This is OK, the function handles it
- **Index creation fails**: Usually safe to ignore if already exists

### No Nodes Created

- **Check function logs**: Supabase Dashboard → Edge Functions → Logs
- **Verify secrets are set**: Project Settings → Edge Functions → Secrets
- **Test connection**: Use `init-neo4j-schema` function first

## 📚 Next Steps

After setup:

1. ✅ Neo4j database connected
2. ✅ Backend connection working
3. ✅ Schema created

You can now:
- Build research graphs automatically
- Query relationships between concepts
- Visualize knowledge networks
- Run graph algorithms (with Neo4j GDS plugin)

## 🔗 Resources

- [Neo4j Aura Documentation](https://neo4j.com/docs/aura/)
- [Cypher Query Language](https://neo4j.com/docs/cypher-manual/)
- [Neo4j HTTP API](https://neo4j.com/docs/http-api/)

