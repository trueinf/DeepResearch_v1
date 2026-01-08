# Relationship Extraction (Phase 3) - Implementation Guide

## ✅ What's Implemented

### Edge Function: `graph-relationships`

**Endpoint**: `POST /functions/v1/graph-relationships`

Extracts relationships between entities and creates edges in Neo4j.

## 📋 Features

### 1. Relationship Extraction
- Uses Gemini 1.5 Pro to extract relationships
- Extracts 6 relationship types:
  - **causes**: A causes B (direct causation)
  - **influences**: A influences B (general influence)
  - **depends_on**: A depends on B (dependency)
  - **contradicts**: A contradicts B (opposition)
  - **supports**: A supports B (agreement/support)
  - **part_of**: A is part of B (containment/hierarchy)

### 2. Neo4j Edge Creation
- Automatically creates relationships in Neo4j
- Maps relationship types to schema: CAUSES, INFLUENCES, PART_OF, CONTRADICTS, SUPPORTS, RELATES_TO
- Sets properties: description, confidence, evidence
- Links to researchId if provided

### 3. Response Format
Returns extracted relationships with statistics and grouped by type.

## 🚀 Usage

### Request Format

```json
{
  "text": "Your research content here...",
  "entities": [
    { "name": "Battery Prices", "type": "Concept" },
    { "name": "EV Adoption", "type": "Trend" }
  ],
  "researchId": "optional-research-id",
  "createEdges": true
}
```

**Note**: `entities` is optional. If provided, the LLM will use exact entity names from the list.

### Response Format

```json
{
  "success": true,
  "relationships": [
    {
      "from": "Battery Prices",
      "to": "EV Adoption",
      "type": "influences",
      "description": "Lower battery prices influence EV adoption rates",
      "confidence": 0.9,
      "evidence": "As battery costs decrease, more consumers adopt electric vehicles"
    }
  ],
  "stats": {
    "total": 1,
    "byType": {
      "influences": 1
    },
    "neo4j": {
      "created": 1,
      "errors": 0
    }
  },
  "relationshipsByType": {
    "influences": [...]
  }
}
```

## 📝 Example Usage

### Via cURL

```bash
curl -X POST https://[your-project].supabase.co/functions/v1/graph-relationships \
  -H "Authorization: Bearer [your-anon-key]" \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Tesla is leading the electric vehicle revolution. Lower battery costs are influencing EV adoption rates. However, range anxiety contradicts widespread adoption. Charging infrastructure is crucial - EV adoption depends on it.",
    "entities": [
      { "name": "Tesla", "type": "Organization" },
      { "name": "Battery Costs", "type": "Concept" },
      { "name": "EV Adoption", "type": "Trend" },
      { "name": "Range Anxiety", "type": "Problem" },
      { "name": "Charging Infrastructure", "type": "Concept" }
    ],
    "researchId": "research-123",
    "createEdges": true
  }'
```

### Via JavaScript/Fetch

```javascript
const response = await fetch(
  'https://[your-project].supabase.co/functions/v1/graph-relationships',
  {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${anonKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      text: researchContent,
      entities: extractedEntities, // From graph-entities endpoint
      researchId: 'research-123',
      createEdges: true
    })
  }
)

const data = await response.json()
console.log('Extracted relationships:', data.relationships)
console.log('Created in Neo4j:', data.stats.neo4j.created)
```

## 🔧 Configuration

### Required Secrets

- `GEMINI_API_KEY` - For relationship extraction
- `NEO4J_URI` - Neo4j connection (optional, if createEdges is true)
- `NEO4J_USER` - Neo4j username (optional)
- `NEO4J_PASSWORD` - Neo4j password (optional)

### Deploy Function

```bash
npx supabase@latest functions deploy graph-relationships
```

Or via Dashboard:
1. Go to Supabase Dashboard → Edge Functions
2. Create new function: `graph-relationships`
3. Copy code from `supabase/functions/graph-relationships/index.ts`
4. Deploy

## 📊 Relationship Type Mapping

Extracted relationships are mapped to Neo4j relationship types:

| Extracted Type | Neo4j Relationship Type |
|---------------|------------------------|
| causes | CAUSES |
| influences | INFLUENCES |
| depends_on | PART_OF |
| contradicts | CONTRADICTS |
| supports | SUPPORTS |
| part_of | PART_OF |
| relates_to | RELATES_TO |
| enables | RELATES_TO |
| uses | RELATES_TO |

## 🔗 Complete Workflow

### Step 1: Extract Entities
```javascript
// Extract entities first
const entitiesResponse = await fetch('/functions/v1/graph-entities', {
  method: 'POST',
  body: JSON.stringify({ text: researchContent, createNodes: true })
})
const { entities } = await entitiesResponse.json()
```

### Step 2: Extract Relationships
```javascript
// Then extract relationships using the entities
const relationshipsResponse = await fetch('/functions/v1/graph-relationships', {
  method: 'POST',
  body: JSON.stringify({ 
    text: researchContent,
    entities: entities, // Use extracted entities
    createEdges: true 
  })
})
const { relationships } = await relationshipsResponse.json()
```

### Step 3: View Graph in Neo4j
- Go to: https://77fddcd5.databases.neo4j.io
- Run: `MATCH (a)-[r]->(b) RETURN a, r, b LIMIT 50`
- You should see connected nodes with relationships!

## ✅ Deliverables Checklist

- [x] LLM prompt for relationship extraction
- [x] Extract relationships (causes, influences, depends_on, contradicts, supports, part_of)
- [x] Return as JSON array
- [x] Push edges to Neo4j
- [x] Create backend route: POST /graph/relationships
- [x] Graph is now connected
- [x] Users can see a basic research map
- [x] GraphRAG foundation established

## 🧪 Testing

### Test Relationship Extraction

1. **Deploy the function**:
   ```bash
   npx supabase@latest functions deploy graph-relationships
   ```

2. **Test with sample text**:
   ```bash
   curl -X POST https://[project].supabase.co/functions/v1/graph-relationships \
     -H "Authorization: Bearer [anon-key]" \
     -H "Content-Type: application/json" \
     -d '{"text": "AI is transforming healthcare. Machine learning enables better diagnostics. However, data privacy concerns contradict rapid adoption."}'
   ```

3. **Check Neo4j Browser**:
   - Go to: https://77fddcd5.databases.neo4j.io
   - Run: `MATCH (a)-[r]->(b) RETURN a, r, b LIMIT 25`
   - You should see connected nodes with relationship edges!

## 🎯 Next Steps

After Phase 3, you have:
- ✅ Nodes (entities) in Neo4j
- ✅ Edges (relationships) in Neo4j
- ✅ Connected knowledge graph
- ✅ Foundation for GraphRAG

You can now:
- Visualize the graph
- Query relationships
- Build research maps
- Implement graph algorithms

## 📚 Related Files

- `supabase/functions/graph-relationships/index.ts` - Main implementation
- `supabase/functions/graph-entities/index.ts` - Entity extraction (Phase 2)
- `supabase/functions/build-research-graph/index.ts` - Full graph building

