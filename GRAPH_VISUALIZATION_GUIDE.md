# Graph Visualization (Phase 4) - Implementation Guide

## ✅ What's Implemented

### Visual Map Component: `ResearchMap.jsx`

**Route**: `/map/:id`

A fully interactive graph visualization using **Reagraph (reaflow)** - the easiest React graph library.

## 📋 Features

### 1. Interactive Graph Visualization
- **Library**: Reagraph (reaflow) - React-native graph visualization
- **Layout**: Force-directed layout for natural node positioning
- **Rendering**: SVG-based, smooth animations

### 2. Zoom Controls
- ✅ Zoom In/Out buttons
- ✅ Mouse wheel zoom
- ✅ Zoom range: 0.5x to 2x
- ✅ Auto-fit on load

### 3. Node Interaction
- ✅ **Click node** → Shows details panel
- ✅ **Highlight connected nodes** automatically
- ✅ Node colors by type (Person, Organization, Concept, etc.)
- ✅ Node sizes based on centrality (importance)

### 4. Filter by Node Type
- ✅ Sidebar filter panel
- ✅ Filter by: Person, Organization, Concept, Trend, Problem, Solution
- ✅ Shows only nodes and edges of selected type
- ✅ "All Types" option to reset

### 5. Search Nodes
- ✅ Real-time search input
- ✅ Searches node labels, types, and descriptions
- ✅ Highlights matching nodes
- ✅ Clear search button

### 6. Additional Features
- ✅ **Cluster highlighting** - Click cluster to highlight related nodes
- ✅ **Most influential nodes** - Top 5 by centrality score
- ✅ **Export graph** - Download as JSON
- ✅ **Rebuild graph** - Regenerate from report
- ✅ **Statistics panel** - Nodes, relationships, clusters count

## 🚀 Usage

### Access the Graph Viewer

1. **From Report View**:
   - Go to any research report (`/report/:id`)
   - Click the **"View Intelligence Map"** button (purple gradient button)

2. **Direct Navigation**:
   - Navigate to `/map/:id` where `:id` is the research ID

### Using the Graph

1. **Zoom**:
   - Use zoom buttons (top right)
   - Or scroll with mouse wheel
   - Or pinch on touch devices

2. **Explore Nodes**:
   - Click any node to see details
   - Connected nodes are automatically highlighted
   - Node details appear in sidebar

3. **Filter**:
   - Use sidebar filter panel
   - Select a node type to filter
   - Click "All Types" to reset

4. **Search**:
   - Type in search box
   - Matching nodes are highlighted
   - Clear with X button

5. **Clusters**:
   - Click a cluster in sidebar
   - Related nodes are highlighted
   - Click again to deselect

## 🎨 Node Types & Colors

| Type | Color | Description |
|------|-------|-------------|
| Person | Blue (#4A90E2) | People mentioned |
| Organization | Green (#50C878) | Companies, institutions |
| Concept | Purple (#9B59B6) | Abstract concepts |
| Trend | Orange (#F39C12) | Trends, movements |
| Problem | Red (#E74C3C) | Issues, challenges |
| Solution | Green (#2ECC71) | Solutions, fixes |
| Technology | Red (#FF6B6B) | Technologies, tools |

## 🔗 Relationship Types & Colors

| Type | Color | Description |
|------|-------|-------------|
| INFLUENCES | Blue (#3498DB) | General influence |
| CAUSES | Red (#E74C3C) | Direct causation |
| SUPPORTS | Green (#2ECC71) | Agreement/support |
| CONTRADICTS | Orange (#E67E22) | Opposition |
| PART_OF | Purple (#9B59B6) | Containment/hierarchy |
| RELATES_TO | Gray (#7F8C8D) | General relation |

## 📊 Data Flow

```
Research Report
    ↓
build-research-graph (Edge Function)
    ↓
Neo4j Database
    ↓
get-research-graph (Edge Function)
    ↓
ResearchMap Component
    ↓
Reagraph Visualization
```

## 🛠️ Technical Details

### Component Structure

```jsx
<ResearchMap>
  ├── Header (title, zoom controls, export)
  ├── Stats Panel (nodes, relationships, clusters)
  ├── Graph Canvas (Reagraph)
  └── Sidebar
      ├── Search
      ├── Filters
      ├── Clusters
      ├── Node Details
      └── Most Influential
</ResearchMap>
```

### Data Format

**Nodes**:
```javascript
{
  id: "node-id",
  text: "Node Label",
  data: {
    type: "Concept",
    description: "...",
    confidence: 0.9
  },
  fill: "#9B59B6",
  width: 60,
  height: 60
}
```

**Edges**:
```javascript
{
  id: "edge-id",
  from: "source-id",
  to: "target-id",
  label: "INFLUENCES",
  stroke: "#3498DB",
  strokeWidth: 2
}
```

## ✅ Deliverables Checklist

- [x] Choose graph UI library (Reagraph/reaflow)
- [x] Basic React code with GraphCanvas
- [x] Zoom in/out functionality
- [x] Click node → show details
- [x] Highlight connected relations
- [x] Filter by node type
- [x] Search node functionality
- [x] Fully interactive research map screen
- [x] Nodes + edges appear visually
- [x] First "WOW feature" complete!

## 🎯 Next Steps

After Phase 4, you have:
- ✅ Visual graph viewer
- ✅ Interactive exploration
- ✅ User-friendly interface
- ✅ Complete GraphRAG foundation

You can now:
- Visualize any research as a knowledge graph
- Explore relationships interactively
- Filter and search nodes
- Export graphs for analysis

## 📚 Related Files

- `src/pages/ResearchMap.jsx` - Main visualization component
- `src/App.jsx` - Route configuration
- `src/pages/ReportView.jsx` - Entry point button
- `supabase/functions/build-research-graph/index.ts` - Graph builder
- `supabase/functions/get-research-graph/index.ts` - Graph fetcher (if exists)

## 🐛 Troubleshooting

### Graph Not Loading
- Check if `build-research-graph` function is deployed
- Verify Neo4j connection in Supabase secrets
- Check browser console for errors

### Nodes Not Appearing
- Ensure report has been processed
- Check if entities were extracted
- Verify graph was built successfully

### Performance Issues
- Large graphs (>100 nodes) may be slower
- Use filters to reduce visible nodes
- Consider pagination for very large graphs

