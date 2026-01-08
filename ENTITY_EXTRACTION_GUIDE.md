# Entity Extraction (Phase 2) - Implementation Guide

## ✅ What's Implemented

### Edge Function: `graph-entities`

**Endpoint**: `POST /functions/v1/graph-entities`

Extracts entities from research content and creates nodes in Neo4j.

## 📋 Features

### 1. Entity Extraction
- Uses Gemini 1.5 Pro to extract entities
- Extracts 6 entity types:
  - **Concept**: Abstract concepts, ideas, theories, technologies, products, locations
  - **Person**: Individual people mentioned
  - **Organization**: Companies, institutions, agencies
  - **Trend**: Trends, movements, patterns
  - **Problem**: Problems, risks, threats, concerns
  - **Solution**: Solutions, benefits, opportunities

### 2. Neo4j Node Creation
- Automatically creates nodes in Neo4j
- Maps entity types to schema node types
- Sets properties: name, description, confidence, citations
- Links to researchId if provided

### 3. Response Format
Returns extracted entities with statistics and grouped by type.

## 🚀 Usage

### Request Format

```json
{
  "text": "Your research content here...",
  "researchId": "optional-research-id",
  "createNodes": true
}
```

### Response Format

```json
{
  "success": true,
  "entities": [
    {
      "type": "Concept",
      "name": "Battery Cost",
      "description": "The cost of battery technology",
      "confidence": 0.9,
      "citations": []
    },
    {
      "type": "Person",
      "name": "Elon Musk",
      "description": "CEO of Tesla",
      "confidence": 0.95,
      "citations": []
    }
  ],
  "stats": {
    "total": 2,
    "byType": {
      "Concept": 1,
      "Person": 1
    },
    "neo4j": {
      "created": 2,
      "errors": 0
    }
  },
  "entitiesByType": {
    "Concept": [...],
    "Person": [...]
  }
}
```

## 📝 Example Usage

### Via cURL

```bash
curl -X POST https://[your-project].supabase.co/functions/v1/graph-entities \
  -H "Authorization: Bearer [your-anon-key]" \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Tesla is leading the electric vehicle revolution. Elon Musk, the CEO, has invested heavily in battery technology. The main challenge is reducing battery costs while increasing range.",
    "researchId": "research-123",
    "createNodes": true
  }'
```

### Via JavaScript/Fetch

```javascript
const response = await fetch(
  'https://[your-project].supabase.co/functions/v1/graph-entities',
  {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${anonKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      text: researchContent,
      researchId: 'research-123',
      createNodes: true
    })
  }
)

const data = await response.json()
console.log('Extracted entities:', data.entities)
console.log('Created in Neo4j:', data.stats.neo4j.created)
```

## 🔧 Configuration

### Required Secrets

- `GEMINI_API_KEY` - For entity extraction
- `NEO4J_URI` - Neo4j connection (optional, if createNodes is true)
- `NEO4J_USER` - Neo4j username (optional)
- `NEO4J_PASSWORD` - Neo4j password (optional)

### Deploy Function

```bash
supabase functions deploy graph-entities
```

## 📊 Entity Type Mapping

Extracted entities are mapped to Neo4j node types:

| Extracted Type | Neo4j Node Type |
|---------------|-----------------|
| Concept | Concept |
| Person | Person |
| Organization | Organization |
| Trend | Trend |
| Problem | Problem |
| Solution | Solution |

## ✅ Deliverables Checklist

- [x] LLM prompt for entity extraction
- [x] Extract entities (Concepts, Topics, People, Organizations, Technologies, Problems, Trends)
- [x] Return as JSON array
- [x] Push nodes to Neo4j
- [x] Create backend route: POST /graph/entities
- [x] Can create nodes for a research topic
- [x] Neo4j displays the nodes

## 🧪 Testing

### Test Entity Extraction

1. **Deploy the function**:
   ```bash
   supabase functions deploy graph-entities
   ```

2. **Test with sample text**:
   ```bash
   curl -X POST https://[project].supabase.co/functions/v1/graph-entities \
     -H "Authorization: Bearer [anon-key]" \
     -H "Content-Type: application/json" \
     -d '{"text": "AI is transforming healthcare. Dr. Smith at MIT is developing new diagnostic tools."}'
   ```

3. **Check Neo4j Browser**:
   - Go to: https://77fddcd5.databases.neo4j.io
   - Run: `MATCH (n) RETURN n LIMIT 25`
   - You should see the extracted entities as nodes!

## 🎯 Next Steps

After Phase 2, you can:
- Extract entities from any research content
- Store them in Neo4j
- View nodes in Neo4j Browser
- Use nodes for relationship extraction (Phase 3)

## 📚 Related Files

- `supabase/functions/graph-entities/index.ts` - Main implementation
- `supabase/functions/_shared/neo4j.ts` - Neo4j client utility
- `supabase/functions/build-research-graph/index.ts` - Full graph building (includes entity extraction)

