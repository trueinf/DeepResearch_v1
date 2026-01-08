# Trend Implementation Guide - Where and How to Use

## 📍 Implementation Locations

### ✅ Already Implemented (Automatic)

The trend extraction and analysis are **already integrated** into `ResearchMap.jsx`:

1. **Automatic Trend Extraction**: When graph is built, trends are automatically extracted
2. **Automatic Trend Analysis**: Trends are analyzed after extraction
3. **UI Integration**: Trend view toggle and Trend Radar are already in the UI

### 🔧 Where It's Called

#### 1. In `src/pages/ResearchMap.jsx`

**Location**: `buildGraph()` function (line ~93-145)

```javascript
const buildGraph = async () => {
  // ... build graph ...
  
  // After graph is built:
  await extractTrendSignals()  // ✅ Extracts trends
  await loadTrends()            // ✅ Analyzes trends
}
```

**When it runs**:
- Automatically when you click "Build Intelligence Map"
- Automatically when graph is rebuilt
- After graph data is loaded

#### 2. In `loadGraph()` function (line ~50-91)

**Location**: When loading existing graph

```javascript
const loadGraph = async () => {
  // ... load existing graph ...
  
  if (getData.graph && getData.graph.nodes.length > 0) {
    // ... set graph data ...
    await loadTrends()  // ✅ Loads existing trends
  }
}
```

## 🚀 Manual Implementation (If Needed)

If you want to call these functions manually from other components:

### Option 1: From ResearchMap Component

Already done! Just use the UI:
1. Open Research Map (`/map/:id`)
2. Click "Rebuild Graph" if needed
3. Trends are automatically extracted and analyzed
4. Click "🔥 Trends ON" to view

### Option 2: From ReportView Component

Add to `src/pages/ReportView.jsx`:

```javascript
// After report is generated
const extractTrendsForReport = async (reportId, reportData) => {
  const researchContent = [
    reportData.executiveSummary,
    reportData.detailedAnalysis,
    reportData.insights,
    reportData.conclusion
  ].filter(Boolean).join('\n\n')

  // Extract trend signals
  await fetch(`${SUPABASE_URL}/functions/v1/extract-trend-signals`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
    },
    body: JSON.stringify({
      text: researchContent,
      sources: reportData.sources || [],
      researchId: reportId,
      createNodes: true
    })
  })

  // Analyze trends
  await fetch(`${SUPABASE_URL}/functions/v1/analyze-trends`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
    },
    body: JSON.stringify({
      researchId: reportId,
      timeWindow: 30
    })
  })
}
```

### Option 3: From build-research-graph Function

Add to `supabase/functions/build-research-graph/index.ts`:

```typescript
// After building Neo4j graph (line ~445)
if (researchId) {
  console.log('Building Neo4j graph...')
  await buildNeo4jGraph(researchId, entities, relationships)
  
  // Extract trend signals
  console.log('Extracting trend signals...')
  const trendResponse = await fetch(`${SUPABASE_URL}/functions/v1/extract-trend-signals`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}`,
    },
    body: JSON.stringify({
      text: [
        report.executiveSummary,
        report.detailedAnalysis,
        report.insights,
        report.conclusion
      ].filter(Boolean).join('\n\n'),
      sources: report.sources || [],
      researchId: researchId,
      createNodes: true
    })
  })
}
```

## 📋 Complete Workflow

### Current Automatic Flow

```
1. User opens Research Map (/map/:id)
   ↓
2. loadGraph() is called
   ↓
3. If graph exists:
   - Load graph data
   - loadTrends() ← Analyzes existing trends
   ↓
4. If graph doesn't exist:
   - buildGraph() is called
   - extractTrendSignals() ← Extracts trends
   - loadTrends() ← Analyzes trends
   ↓
5. User clicks "🔥 Trends ON"
   - Nodes colored by trend state
   - Trend Radar shows in sidebar
```

### Manual Trigger Flow

If you want to trigger manually:

```javascript
// 1. Extract trend signals
const extractResponse = await fetch('/functions/v1/extract-trend-signals', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
  },
  body: JSON.stringify({
    text: researchContent,      // Combined report text
    sources: reportSources,     // Array of {url, date, title}
    researchId: researchId,     // Research ID
    createNodes: true           // Store in Neo4j
  })
})

// 2. Analyze trends
const analyzeResponse = await fetch('/functions/v1/analyze-trends', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
  },
  body: JSON.stringify({
    researchId: researchId,    // Research ID
    timeWindow: 30              // Days to look back
  })
})

// 3. Visualize (already in ResearchMap)
// - Open /map/:id
// - Click "🔥 Trends ON"
```

## 🎯 Use Cases & Implementation

### Use Case 1: Automatic (Recommended)

**Where**: Already implemented in `ResearchMap.jsx`

**How**: 
- Just open Research Map
- Trends are automatically extracted and analyzed
- Click "🔥 Trends ON" to view

**No code changes needed!**

### Use Case 2: After Report Generation

**Where**: `src/pages/ReportView.jsx` or `src/pages/ResearchProgress.jsx`

**When**: After research report is completed

**How**:
```javascript
// In ReportView.jsx, after report loads
useEffect(() => {
  if (report && report.status === 'Done') {
    extractTrendsForReport(id, report)
  }
}, [report, id])
```

### Use Case 3: Scheduled Updates

**Where**: Create a new Edge Function or cron job

**When**: Daily/weekly to update trends

**How**:
```typescript
// supabase/functions/update-trends/index.ts
serve(async (req) => {
  // Get all research IDs
  const researches = await getResearches()
  
  for (const research of researches) {
    // Extract new trend signals
    await extractTrendSignals(research.id, research.report)
    
    // Analyze trends
    await analyzeTrends(research.id)
  }
})
```

### Use Case 4: Real-time Updates

**Where**: When new sources are added

**How**:
```javascript
// When user adds new sources
const addSourcesAndUpdateTrends = async (researchId, newSources) => {
  // Add sources to report
  await updateReportSources(researchId, newSources)
  
  // Re-extract trends with new sources
  await fetch('/functions/v1/extract-trend-signals', {
    method: 'POST',
    body: JSON.stringify({
      text: updatedReportContent,
      sources: [...existingSources, ...newSources],
      researchId: researchId,
      createNodes: true
    })
  })
  
  // Re-analyze trends
  await fetch('/functions/v1/analyze-trends', {
    method: 'POST',
    body: JSON.stringify({ researchId: researchId })
  })
}
```

## 🔍 Where to Find the Code

### Frontend (React)

1. **Trend Extraction Call**: `src/pages/ResearchMap.jsx` line ~180-210
   - Function: `extractTrendSignals()`

2. **Trend Analysis Call**: `src/pages/ResearchMap.jsx` line ~212-250
   - Function: `loadTrends()`

3. **Trend Visualization**: `src/pages/ResearchMap.jsx` line ~532-542
   - Button: "🔥 Trends ON/OFF"
   - Trend Radar: line ~650-700

### Backend (Edge Functions)

1. **Extract Trend Signals**: `supabase/functions/extract-trend-signals/index.ts`
   - Endpoint: `POST /functions/v1/extract-trend-signals`

2. **Analyze Trends**: `supabase/functions/analyze-trends/index.ts`
   - Endpoint: `POST /functions/v1/analyze-trends`

## ✅ Quick Start Checklist

- [x] Edge Functions deployed (`extract-trend-signals`, `analyze-trends`)
- [x] ResearchMap component updated with trend extraction
- [x] Trend view toggle button added
- [x] Trend Radar sidebar panel added
- [x] Trend color coding implemented

## 🎨 Visual Features (Already Implemented)

1. **Trend View Toggle**: Top right button "🔥 Trends ON/OFF"
2. **Trend Radar**: Sidebar panel showing top 10 trends
3. **Color Coding**: Nodes colored by trend state
4. **Icons**: 🔥 Rising, 📉 Falling, 🌱 Emerging, ➖ Stable

## 🚀 Testing

### Test Trend Extraction

1. Open Research Map for any research
2. Click "Rebuild Graph" if needed
3. Check browser console for "Trend signals extracted"
4. Click "🔥 Trends ON"
5. Verify nodes are colored by trend state
6. Check Trend Radar in sidebar

### Test Trend Analysis

1. After trends are extracted
2. Check browser console for trend analysis results
3. Verify Trend Radar shows trends with icons
4. Check trend statistics (rising/falling/emerging/stable counts)

## 📝 Summary

**Current Status**: ✅ **Fully Implemented and Automatic**

- Trends are automatically extracted when graph is built
- Trends are automatically analyzed after extraction
- UI is ready with Trend View toggle and Trend Radar
- No additional code needed for basic usage

**To Use**:
1. Open Research Map (`/map/:id`)
2. Build graph if needed
3. Click "🔥 Trends ON"
4. View Trend Radar in sidebar

**To Customize**:
- Modify `extractTrendSignals()` in ResearchMap.jsx
- Modify `loadTrends()` in ResearchMap.jsx
- Add manual triggers in other components as shown above

