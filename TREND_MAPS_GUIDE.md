# Trend Maps (Phase 7) - Implementation Guide

## ✅ What's Implemented

### Expert-Level Trend Analysis System

**Edge Functions**:
1. `extract-trend-signals` - Extract timestamps and trend signals
2. `analyze-trends` - Graph analytics for trend detection

**Visualization**: Updated ResearchMap with trend color coding and Trend Radar

## 📋 Features

### 1. Trend Signal Extraction

**Endpoint**: `POST /functions/v1/extract-trend-signals`

Extracts:
- **Timestamps**: When trends were mentioned
- **Frequency**: How often topics appear
- **Trend States**: 
  - 🔥 **Rising**: Increasing mentions, growing interest
  - 📉 **Falling**: Decreasing mentions, declining interest
  - 🌱 **Emerging**: New topics, recent appearance
  - ➖ **Stable**: Consistent mentions, steady state

### 2. Trend Analysis

**Endpoint**: `POST /functions/v1/analyze-trends`

Analyzes:
- **Frequency Over Time**: Current vs previous frequency
- **Velocity**: Rate of change (%)
- **Trend State Detection**: Automatic classification
- **Future Prediction**: Predicts trend continuation

### 3. Visual Trend Mapping

**Color Coding**:
- 🔥 **Rising**: Red (#E74C3C)
- 📉 **Falling**: Blue (#3498DB)
- 🌱 **Emerging**: Green (#2ECC71)
- ➖ **Stable**: Gray (#95A5A6)

## 🚀 Usage

### Step 1: Extract Trend Signals

```javascript
const response = await fetch('/functions/v1/extract-trend-signals', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${anonKey}`,
  },
  body: JSON.stringify({
    text: researchContent,
    sources: [
      { url: '...', date: '2024-01-15', title: '...' },
      { url: '...', date: '2024-02-01', title: '...' }
    ],
    researchId: 'research-123',
    createNodes: true
  })
})

const { signals } = await response.json()
```

### Step 2: Analyze Trends

```javascript
const response = await fetch('/functions/v1/analyze-trends', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${anonKey}`,
  },
  body: JSON.stringify({
    researchId: 'research-123',
    timeWindow: 30 // Days to look back
  })
})

const { trends } = await response.json()
```

### Step 3: Visualize in Research Map

1. Open Research Map (`/map/:id`)
2. Click **"🔥 Trends ON"** button
3. Nodes are color-coded by trend state
4. View **Trend Radar** in sidebar

## 📊 Trend Detection Logic

### Rising Trends
- **Criteria**: Frequency increase > 20%
- **Velocity**: Positive velocity
- **Evidence**: "increasing", "growing", "rising", "surge", "boom"

### Falling Trends
- **Criteria**: Frequency decrease > 20%
- **Velocity**: Negative velocity
- **Evidence**: "decreasing", "declining", "falling", "drop", "decline"

### Emerging Trends
- **Criteria**: New topic (previous frequency = 0)
- **Velocity**: High positive (new appearance)
- **Evidence**: "new", "emerging", "recent", "latest", "novel"

### Stable Trends
- **Criteria**: Frequency change < 20%
- **Velocity**: Near zero
- **Evidence**: "stable", "consistent", "steady", "maintained"

## 🎨 Trend Radar Features

### Sidebar Panel
- **Top 10 Trends**: Most active trends
- **Trend Icons**: Visual indicators (🔥📉🌱➖)
- **Velocity Display**: Percentage change
- **Frequency Count**: Current mention count
- **Summary Stats**: Count by trend state

### Node Visualization
- **Color Override**: Trend colors override cluster colors when trend view is active
- **Trend Info**: Hover/click nodes to see trend details
- **Prediction**: Future trend state prediction

## 📈 Example Cypher Queries

### Get Frequency Over Time

```cypher
MATCH (t:Trend)
WHERE t.researchId = $researchId
RETURN t.name, t.frequencyOverTime
ORDER BY t.timestamp DESC
```

### Find Rising Trends

```cypher
MATCH (t:Trend)
WHERE t.researchId = $researchId 
  AND t.sentiment = 'rising'
RETURN t.name, t.frequency, t.velocity
ORDER BY t.frequency DESC
```

### Trend Prediction

```cypher
MATCH (t:Trend)
WHERE t.researchId = $researchId
  AND t.prediction = 'continue_rising'
RETURN t.name, t.currentFrequency, t.velocity
ORDER BY t.velocity DESC
```

## 🎯 Use Cases

### For Analysts
- **Trend Monitoring**: Track rising/falling topics
- **Early Detection**: Identify emerging trends
- **Market Analysis**: Understand market dynamics

### For Strategists
- **Future Planning**: Predict trend continuation
- **Risk Assessment**: Identify falling trends
- **Opportunity Mapping**: Find emerging opportunities

### For Researchers
- **Topic Evolution**: See how topics change over time
- **Citation Analysis**: Track mention frequency
- **Temporal Patterns**: Understand time-based patterns

## ✅ Deliverables Checklist

- [x] Extract timestamps & trend signals from articles
- [x] Use graph analytics to detect rising topics
- [x] Color nodes based on trend state (🔥📉🌱➖)
- [x] Cypher query: `MATCH (t:Trend) RETURN t.name, t.frequencyOverTime`
- [x] Trend Radar visualization
- [x] Future prediction map
- [x] Time-evolving research visualization

## 🔄 Complete Workflow

### 1. Research Generation
```javascript
// Generate research report
await fetch('/functions/v1/deep-Research-gemini', { ... })
```

### 2. Extract Entities
```javascript
// Extract entities
await fetch('/functions/v1/graph-entities', { ... })
```

### 3. Extract Relationships
```javascript
// Extract relationships
await fetch('/functions/v1/graph-relationships', { ... })
```

### 4. Extract Trend Signals
```javascript
// Extract trend signals
await fetch('/functions/v1/extract-trend-signals', {
  text: reportContent,
  sources: reportSources,
  researchId: id
})
```

### 5. Analyze Trends
```javascript
// Analyze trends
await fetch('/functions/v1/analyze-trends', {
  researchId: id,
  timeWindow: 30
})
```

### 6. Visualize
- Open Research Map
- Toggle Trend View
- Explore Trend Radar

## 📚 Data Model

### Trend Node
```cypher
(:Trend {
  id: String,
  name: String,
  timestamp: String,
  date: String,
  frequency: Integer,
  mentions: Integer,
  sentiment: String, // rising|falling|emerging|stable
  evidence: String,
  researchId: String
})
```

### Trend Relationship
```cypher
(:Node)-[:HAS_TREND]->(:Trend)
```

## 🎨 Visual Features

### Trend View Toggle
- **Button**: "🔥 Trends ON" / "📊 Trends OFF"
- **Effect**: Switches between cluster colors and trend colors
- **Location**: Top right, next to layout selector

### Trend Radar Panel
- **Location**: Sidebar, below Clusters
- **Content**: Top 10 trends with icons and stats
- **Summary**: Count by trend state

### Node Colors
- **Priority**: Selected > Trend > Cluster > Type
- **When Trend View ON**: Trend colors override cluster colors
- **When Trend View OFF**: Cluster colors used

## 🚀 Next Steps

After Phase 7, you have:
- ✅ Complete trend analysis system
- ✅ Time-evolving visualization
- ✅ Future prediction capabilities
- ✅ Expert-level research intelligence

You can now:
- Track trends over time
- Predict future states
- Visualize temporal patterns
- Support strategic decision-making

## 📚 Related Files

- `supabase/functions/extract-trend-signals/index.ts` - Signal extraction
- `supabase/functions/analyze-trends/index.ts` - Trend analysis
- `src/pages/ResearchMap.jsx` - Visualization component
- `TREND_MAPS_GUIDE.md` - This documentation

## 🐛 Troubleshooting

### No Trends Detected
- Check if trend signals were extracted
- Verify sources have dates
- Ensure text contains temporal indicators

### Trend Colors Not Showing
- Toggle "Trends ON" button
- Verify trends were analyzed
- Check node labels match trend topics

### Frequency Over Time Not Working
- Ensure multiple timestamps exist
- Check Neo4j query syntax
- Verify timeWindow parameter

