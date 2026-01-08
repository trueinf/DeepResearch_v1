# Research Intelligence Map - Implementation Plan

## ✅ What Already Exists

### Current Features
- ✅ Research generation (`deep-Research-gemini`)
- ✅ Report storage (`research_reports` table)
- ✅ Report viewing (`ReportView.jsx`)
- ✅ PPT generation (`generate-ppt-agent`)
- ✅ Chat with reports (`chat-Research`)
- ✅ File upload and processing
- ✅ Authentication and user management

### Current Data Structure
- Research reports contain:
  - `executiveSummary`
  - `keyFindings` (array with citations)
  - `detailedAnalysis`
  - `insights`
  - `conclusion`
  - `sources`

## 🆕 What Needs to Be Implemented

### 1. Neo4j Integration
- [ ] Neo4j AuraDB connection
- [ ] Graph database setup
- [ ] Node and relationship schemas

### 2. Entity Extraction
- [ ] Edge function: `extract-entities-gemini`
- [ ] Extract: People, Organizations, Technologies, Concepts, Events, Risks, Benefits

### 3. Relationship Extraction
- [ ] Edge function: `extract-relationships-gemini`
- [ ] Extract: influences, causes, enables, contradicts, depends_on, similar_to

### 4. Graph Building
- [ ] Edge function: `build-research-graph`
- [ ] Create nodes in Neo4j
- [ ] Create relationships in Neo4j
- [ ] Store properties (confidence, citations, timestamps)

### 5. Graph Algorithms
- [ ] Community detection (themes/clusters)
- [ ] Centrality analysis (most important nodes)
- [ ] PageRank (influence ranking)
- [ ] Clustering (topic groups)
- [ ] Pathfinding (causal chains)

### 6. Visualization
- [ ] React component: `ResearchMap.jsx`
- [ ] Graph library: vis.js or cytoscape.js
- [ ] Interactive features: zoom, hover, filter, highlight
- [ ] Timeline view
- [ ] Export functionality

### 7. Integration
- [ ] Add "View Intelligence Map" button to ReportView
- [ ] New route: `/map/:id`
- [ ] Loading states
- [ ] Error handling

## 📋 Implementation Steps

1. **Setup Neo4j** (External service - Neo4j AuraDB)
2. **Create Edge Functions** (Supabase)
3. **Build Graph Visualization** (React)
4. **Integrate with ReportView**
5. **Add Graph Algorithms**
6. **Polish UI/UX**

