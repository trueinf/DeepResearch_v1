# Neo4j AuraDB Quick Start

## 🚀 Setup in 3 Steps

### 1. Create Neo4j AuraDB Instance

1. Go to: https://aura.neo4j.io
2. Click "Create Free Instance"
3. Copy:
   - **Bolt URL** (e.g., `neo4j+s://xxxxx.databases.neo4j.io`)
   - **Username** (usually `neo4j`)
   - **Password** (save immediately!)

### 2. Set Secrets in Supabase

Go to: Supabase Dashboard → Edge Functions → Secrets

Add:
```
NEO4J_URI = neo4j+s://xxxxx.databases.neo4j.io
NEO4J_USER = neo4j
NEO4J_PASSWORD = [your-password]
```

### 3. Initialize Schema

Deploy and run the init function:

```bash
supabase functions deploy init-neo4j-schema
```

Then call it:
```bash
curl -X POST https://[project].supabase.co/functions/v1/init-neo4j-schema \
  -H "Authorization: Bearer [anon-key]"
```

## ✅ Done!

Your Neo4j database is now ready. Research graphs will automatically be saved when you build them.

## 📋 Schema Overview

**Nodes**: Concept, Person, Organization, Trend, Problem, Solution

**Relationships**: RELATES_TO, INFLUENCES, CAUSES, CONTRADICTS, SUPPORTS, PART_OF

See `NEO4J_SETUP_GUIDE.md` for detailed documentation.

