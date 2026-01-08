# Research Intelligence Map - Setup Guide

## 🎯 What's Been Implemented

### ✅ New Features Added

1. **Graph Building Edge Function** (`build-research-graph`)
   - Extracts entities (People, Organizations, Technologies, Concepts, Events, Risks, Benefits)
   - Extracts relationships (INFLUENCES, CAUSES, ENABLES, CONTRADICTS, etc.)
   - Builds graph in Neo4j (optional)
   - Runs graph algorithms (community detection, centrality)

2. **Graph Retrieval Edge Function** (`get-research-graph`)
   - Fetches existing graph from Neo4j
   - Returns nodes and relationships for visualization

3. **ResearchMap Component** (`src/pages/ResearchMap.jsx`)
   - Interactive graph visualization using vis-network
   - Filter by entity type
   - Cluster highlighting
   - Node details panel
   - Centrality rankings
   - Zoom controls
   - Export functionality

4. **Integration**
   - Added route: `/map/:id`
   - Added "View Intelligence Map" button to ReportView
   - Integrated with existing research workflow

## 📋 Setup Instructions

### Step 1: Install Dependencies

Already done:
```bash
npm install vis-network --save
```

### Step 2: Deploy Edge Functions

Deploy the new Supabase Edge Functions:

```bash
# Deploy graph building function
supabase functions deploy build-research-graph

# Deploy graph retrieval function
supabase functions deploy get-research-graph
```

### Step 3: Set Up Neo4j (Optional but Recommended)

#### Option A: Neo4j AuraDB (Cloud - Recommended)

1. **Create Neo4j AuraDB Instance**
   - Go to: https://neo4j.com/cloud/aura/
   - Sign up for free tier (or paid)
   - Create a new database instance
   - Note your connection URI, username, and password

2. **Set Supabase Secrets**
   ```bash
   supabase secrets set NEO4J_URI="neo4j+s://xxxxx.databases.neo4j.io"
   supabase secrets set NEO4J_USER="neo4j"
   supabase secrets set NEO4J_PASSWORD="your-password"
   ```

#### Option B: Neo4j Desktop (Local Development)

1. **Install Neo4j Desktop**
   - Download from: https://neo4j.com/download/
   - Install and create a local database

2. **Update Connection String**
   - Use: `neo4j://localhost:7687` (or your local URI)
   - Set secrets accordingly

#### Option C: Skip Neo4j (Graph in Memory Only)

- The system will work without Neo4j
- Graphs will be built on-demand but not persisted
- Each request will rebuild the graph
- Good for testing, not for production

### Step 4: Configure Edge Function Secrets

Set all required secrets in Supabase:

```bash
# Already set (for Gemini)
supabase secrets set GEMINI_API_KEY="your-gemini-key"

# New (for Neo4j - optional)
supabase secrets set NEO4J_URI="your-neo4j-uri"
supabase secrets set NEO4J_USER="your-neo4j-user"
supabase secrets set NEO4J_PASSWORD="your-neo4j-password"
```

### Step 5: Test the Feature

1. **Start your dev server**
   ```bash
   npm run dev
   ```

2. **Create or view a research report**
   - Go to a completed research report
   - Click "View Intelligence Map" button

3. **Build the graph**
   - The system will automatically extract entities and relationships
   - Graph will be visualized in the interactive map

## 🎨 Features

### Graph Visualization
- **Interactive Network**: Zoom, pan, drag nodes
- **Color-Coded Nodes**: Different colors for entity types
- **Relationship Labels**: Shows relationship types on edges
- **Node Sizing**: Based on centrality scores
- **Cluster Highlighting**: Click clusters to highlight themes

### Filters
- Filter by entity type (Person, Organization, Technology, etc.)
- Show/hide specific relationship types
- Focus on specific clusters

### Analytics
- **Centrality Rankings**: Top 10 most influential nodes
- **Cluster Detection**: Automatically groups related concepts
- **Graph Stats**: Node count, relationship count, cluster count

### Export
- Export graph data as JSON
- Includes all nodes, relationships, clusters, and centrality scores

## 🔧 Configuration

### Entity Types Supported
- Person
- Organization
- Technology
- Concept
- Event
- Risk
- Benefit
- Product
- Location

### Relationship Types Supported
- INFLUENCES
- CAUSES
- ENABLES
- CONTRADICTS
- DEPENDS_ON
- SIMILAR_TO
- PART_OF
- USES
- REGULATES
- ACCELERATES
- REDUCES
- INCREASES
- RESISTS

## 🚀 Usage

### From Report View
1. Navigate to any completed research report
2. Click "View Intelligence Map" button
3. Graph will be built automatically (first time)
4. Explore the interactive visualization

### Direct URL
```
http://localhost:5184/map/:researchId
```

## 📊 Graph Algorithms

Currently implemented:
- **Community Detection**: Groups entities by type (simple clustering)
- **Degree Centrality**: Counts connections per node
- **Top Influencers**: Ranks nodes by connection count

Future enhancements (with Neo4j GDS):
- **PageRank**: Influence ranking
- **Betweenness Centrality**: Bridge nodes
- **Louvain Clustering**: Advanced community detection
- **Shortest Path**: Find connections between concepts
- **Time-series Analysis**: Evolution of concepts over time

## 🐛 Troubleshooting

### Graph Not Building
- Check Gemini API key is set
- Check Neo4j credentials (if using)
- Check browser console for errors
- Verify research report has content

### Neo4j Connection Failed
- Verify connection URI format
- Check username/password
- Ensure database is running
- Check firewall/network settings

### Visualization Not Showing
- Check vis-network is installed: `npm list vis-network`
- Check browser console for errors
- Verify graph data is returned from API

## 📝 Notes

- **First Build**: First graph build may take 30-60 seconds (entity + relationship extraction)
- **Caching**: Graphs are stored in Neo4j (if configured) for faster subsequent loads
- **Performance**: Large reports may generate many nodes/relationships - consider pagination
- **Cost**: Gemini API calls for extraction, Neo4j storage (if using cloud)

## 🎯 Next Steps

1. **Deploy Edge Functions** to Supabase
2. **Set up Neo4j** (optional but recommended)
3. **Test with a research report**
4. **Customize visualization** (colors, shapes, layouts)
5. **Add more algorithms** (PageRank, pathfinding, etc.)

---

**Status**: ✅ Core implementation complete  
**Ready for**: Testing and deployment  
**Requires**: Neo4j setup (optional) for persistence

