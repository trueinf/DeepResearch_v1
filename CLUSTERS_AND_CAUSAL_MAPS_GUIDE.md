# Clusters + Causal Maps (Phase 5 & 6) - Implementation Guide

## ✅ Phase 5: Clusters + Community Detection

### What's Implemented

**Edge Function**: `detect-communities`
- **Endpoint**: `POST /functions/v1/detect-communities`
- Uses Neo4j GDS algorithms (Louvain/Label Propagation) for community detection
- Automatically groups nodes into intelligent clusters
- Generates theme names based on node types

### Features

1. **Community Detection**
   - Uses Neo4j Graph Data Science (GDS) algorithms
   - Falls back to type-based clustering if GDS unavailable
   - Groups related nodes together

2. **Cluster Themes**
   - **Tech Cluster**: Technology-focused nodes
   - **Risk Cluster**: Problem/Risk nodes
   - **Market Cluster**: Trend/Market nodes
   - **Stakeholder Cluster**: Person/Organization nodes
   - **Concept Cluster**: Abstract concepts
   - **Solution Cluster**: Solution nodes

3. **Color Coding**
   - **Cluster 1**: Purple (#9B59B6)
   - **Cluster 2**: Green (#2ECC71)
   - **Cluster 3**: Yellow (#F2C94C)
   - **Cluster 4**: Blue (#3498DB)
   - **Cluster 5**: Red (#E74C3C)
   - **Cluster 6**: Orange (#F39C12)
   - **Cluster 7**: Teal (#1ABC9C)
   - **Cluster 8**: Dark Orange (#E67E22)

### Usage

```javascript
// Detect communities
const response = await fetch('/functions/v1/detect-communities', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${anonKey}`,
  },
  body: JSON.stringify({
    researchId: 'research-123',
    minCommunitySize: 2 // Minimum nodes per cluster
  })
})

const { clusters } = await response.json()
// Returns: [{ id, theme, nodes, color, size }]
```

### Response Format

```json
{
  "success": true,
  "clusters": [
    {
      "id": "cluster-0",
      "theme": "Tech Cluster",
      "nodes": ["node1", "node2", "node3"],
      "color": "#9B59B6",
      "size": 3
    }
  ],
  "stats": {
    "totalClusters": 5,
    "totalNodes": 25,
    "averageClusterSize": 5
  }
}
```

## ✅ Phase 6: Causal Maps

### What's Implemented

**Edge Function**: `extract-causal-relationships`
- **Endpoint**: `POST /functions/v1/extract-causal-relationships`
- Enhanced LLM extraction focused on causal relationships
- Creates CAUSES edges in Neo4j
- Supports causal flow visualization

### Features

1. **Causal Relationship Extraction**
   - **causes**: A directly causes B
   - **leads_to**: A leads to B, A results in B
   - **triggers**: A triggers B, A initiates B

2. **Pattern Recognition**
   - "A causes B"
   - "A leads to B"
   - "A results in B"
   - "A triggers B"
   - "A brings about B"
   - "A gives rise to B"
   - "A creates B"
   - "A produces B"
   - "Due to A, B happens"
   - "Because of A, B occurs"

3. **Neo4j Integration**
   - Creates `CAUSES` relationship edges
   - Stores evidence and confidence
   - Links to researchId

4. **Visualization**
   - **Causal Flow Layout**: Left-to-right (LR) layout
   - **CAUSES edges**: Highlighted in red (#E74C3C)
   - **View Mode Toggle**: Switch between Force and Causal layouts

### Usage

```javascript
// Extract causal relationships
const response = await fetch('/functions/v1/extract-causal-relationships', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${anonKey}`,
  },
  body: JSON.stringify({
    text: researchContent,
    entities: extractedEntities, // Optional
    researchId: 'research-123',
    createEdges: true
  })
})

const { relationships } = await response.json()
```

### Response Format

```json
{
  "success": true,
  "relationships": [
    {
      "from": "Battery Cost Reduction",
      "to": "EV Price Decrease",
      "type": "causes",
      "description": "Battery cost reduction directly causes EV price decrease",
      "confidence": 0.95,
      "evidence": "As battery costs decrease, EV prices follow suit"
    }
  ],
  "stats": {
    "total": 10,
    "byType": {
      "causes": 5,
      "leads_to": 3,
      "triggers": 2
    },
    "neo4j": {
      "created": 10,
      "errors": 0
    }
  }
}
```

## 🎨 Visual Features

### Cluster Visualization

1. **Color-Coded Nodes**
   - Nodes inherit their cluster color
   - Visual grouping in the graph
   - Easy identification of related concepts

2. **Cluster Sidebar**
   - List of all detected clusters
   - Color indicators
   - Node count per cluster
   - Click to highlight cluster

3. **Cluster Highlighting**
   - Click cluster to highlight all nodes
   - Visual feedback for relationships
   - Easy exploration of themes

### Causal Flow Visualization

1. **Left-to-Right Layout**
   - Causal chains flow left → right
   - Clear cause → effect direction
   - Perfect for strategy presentations

2. **CAUSES Edge Styling**
   - Red color (#E74C3C) for emphasis
   - Thicker lines for important chains
   - Clear directional arrows

3. **View Mode Toggle**
   - **Force Layout**: Natural, organic positioning
   - **Causal Flow**: Left-to-right causal chains
   - Switch between modes instantly

## 📊 Complete Workflow

### Step 1: Build Graph
```javascript
// Build research graph
await fetch('/functions/v1/build-research-graph', {
  method: 'POST',
  body: JSON.stringify({ report, researchId })
})
```

### Step 2: Detect Clusters
```javascript
// Detect communities
const { clusters } = await fetch('/functions/v1/detect-communities', {
  method: 'POST',
  body: JSON.stringify({ researchId })
}).then(r => r.json())
```

### Step 3: Extract Causal Relationships
```javascript
// Extract causal chains
const { relationships } = await fetch('/functions/v1/extract-causal-relationships', {
  method: 'POST',
  body: JSON.stringify({ text, researchId, createEdges: true })
}).then(r => r.json())
```

### Step 4: Visualize
- Open Research Map (`/map/:id`)
- View clusters with color coding
- Switch to Causal Flow layout
- Explore cause → effect chains

## 🎯 Use Cases

### For Consultants
- **Causal Maps**: Show cause → effect chains to clients
- **Cluster Analysis**: Identify key themes and risks
- **Strategy Planning**: Visualize impact chains

### For Analysts
- **Root Cause Analysis**: Trace problems to causes
- **Impact Assessment**: See downstream effects
- **Trend Analysis**: Group related concepts

### For Strategy Teams
- **Decision Support**: Visualize decision impacts
- **Risk Assessment**: Identify risk clusters
- **Opportunity Mapping**: Find solution clusters

## ✅ Deliverables Checklist

### Phase 5
- [x] Neo4j GDS community detection
- [x] Cluster theme generation
- [x] Color-coded clusters
- [x] Cluster visualization in UI
- [x] Intelligent grouping of insights
- [x] First version of "Research Intelligence Map"

### Phase 6
- [x] Enhanced LLM extraction for causal relationships
- [x] Extract: causes, leads_to, triggers
- [x] Push CAUSES edges to Neo4j
- [x] Render causal flow (left → right layout)
- [x] Causal map for every research topic
- [x] Perfect for consulting, analysts, strategy teams

## 🚀 Next Steps

After Phase 5 & 6, you have:
- ✅ Intelligent cluster detection
- ✅ Color-coded theme visualization
- ✅ Causal relationship extraction
- ✅ Causal flow visualization
- ✅ Complete Research Intelligence Map

You can now:
- Group insights intelligently
- Visualize cause → effect chains
- Present to clients and stakeholders
- Support strategic decision-making

## 📚 Related Files

- `supabase/functions/detect-communities/index.ts` - Community detection
- `supabase/functions/extract-causal-relationships/index.ts` - Causal extraction
- `src/pages/ResearchMap.jsx` - Visualization component
- `supabase/functions/build-research-graph/index.ts` - Graph builder

## 🐛 Troubleshooting

### Clusters Not Detected
- Check if GDS is available in Neo4j
- Verify minimum cluster size setting
- Ensure graph has relationships

### Causal Relationships Not Extracted
- Check LLM prompt quality
- Verify text contains causal language
- Review confidence scores

### Layout Not Working
- Check if Reagraph supports dagre layout
- Verify CAUSES edges exist
- Try switching view modes

