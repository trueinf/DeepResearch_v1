# Neo4j AuraDB Connection Information

## Current Instance

**Instance Name**: Deep_Research  
**Instance ID**: 77fddcd5  
**Status**: Running ✅

### Connection Details

- **Connection URI**: `neo4j+s://77fddcd5.databases.neo4j.io`
- **Query API URL**: `https://77fddcd5.databases.neo4j.io/db/neo4j/query/v2`
- **Version**: 2025.10
- **Type**: AuraDB Free
- **Current Stats**: 0 nodes, 0 relationships (Fresh instance)

### Credentials

- **Username**: `neo4j` (default)
- **Password**: [Set in Supabase Secrets]

## Supabase Secrets Configuration

Set these in Supabase Dashboard → Edge Functions → Secrets:

```
NEO4J_URI = neo4j+s://77fddcd5.databases.neo4j.io
NEO4J_USER = neo4j
NEO4J_PASSWORD = [your-password]
```

## Access Neo4j Browser

- **URL**: https://77fddcd5.databases.neo4j.io
- **Login**: Use your AuraDB credentials

## Quick Test Query

After connecting, test with:

```cypher
MATCH (n) RETURN count(n) as nodeCount
```

Should return `0` initially (fresh instance).

## Notes

- ✅ This is a fresh instance - perfect for starting clean
- ✅ Old instance (af049011) has been replaced
- ✅ All new research graphs will be stored here
- ✅ Schema will be initialized on first run

