# 📥 Ingestion Agent Integration for PPT Generation

## Overview

An **Ingestion Agent** can significantly enhance PPT generation by:
- **Intelligently processing** uploaded documents
- **Extracting structured data** (tables, charts, key points)
- **Preparing content** optimized for slide generation
- **Handling multiple formats** (PDF, Word, Excel, images)
- **Enriching context** with metadata and insights

---

## Current Architecture

### Existing Flow:
```
User Uploads Files → Home.jsx processes → documentContext → Research → Report → PPT Generation
```

### With Ingestion Agent:
```
User Uploads Files → Ingestion Agent → Structured Content → Enhanced Report → Optimized PPT
```

---

## Integration Architecture

### Option 1: Pre-Processing Agent (Recommended)
**Process documents BEFORE research/PPT generation**

```
1. User uploads files
2. Ingestion Agent processes files
3. Extracts structured data
4. Stores in database/cache
5. PPT Agent uses enriched data
```

**Benefits:**
- ✅ One-time processing
- ✅ Reusable structured data
- ✅ Faster PPT generation
- ✅ Better content extraction

### Option 2: On-Demand Processing
**Process documents during PPT generation**

```
1. User generates PPT
2. PPT Agent calls Ingestion Agent
3. Ingestion Agent processes files
4. Returns structured content
5. PPT Agent generates slides
```

**Benefits:**
- ✅ Always fresh data
- ✅ No storage needed
- ✅ Simpler architecture

---

## Implementation Plan

### Step 1: Create Ingestion Agent Function

**File:** `supabase/functions/document-ingestion-agent/index.ts`

```typescript
// Document Ingestion Agent
// Processes uploaded documents and extracts structured content

interface IngestionRequest {
  files: Array<{
    name: string
    content: string // Base64 or text content
    type: string // MIME type
  }>
  researchTopic?: string
  presentationStyle?: string
}

interface StructuredContent {
  summary: string
  keyPoints: string[]
  dataPoints: Array<{ label: string; value: string }>
  tables: Array<{ headers: string[]; rows: string[][] }>
  insights: string[]
  metadata: {
    documentType: string
    pageCount?: number
    wordCount: number
    extractedAt: string
  }
}

serve(async (req) => {
  // Process documents using Gemini
  // Extract structured content
  // Return optimized data for PPT generation
})
```

### Step 2: Enhanced PPT Agent Integration

**Modify:** `supabase/functions/generate-ppt-agent/index.ts`

```typescript
interface PPTAgentRequest {
  report: {
    topic: string
    // ... existing fields
  }
  presentationStyle?: string
  slideCount?: number
  ingestedContent?: StructuredContent // NEW: Add ingested content
  documentContext?: string // Keep for backward compatibility
}
```

### Step 3: Frontend Integration

**Modify:** `src/pages/ReportView.jsx`

```javascript
const handleGenerateSlides = async () => {
  // 1. Check if files were uploaded
  // 2. If yes, call ingestion agent first
  // 3. Then call PPT agent with ingested content
}
```

---

## Ingestion Agent Features

### 1. **Document Processing**
- Extract text from PDFs, Word docs, Excel
- OCR for images
- Parse tables and charts
- Extract metadata

### 2. **Content Structuring**
- Identify key sections
- Extract bullet points
- Find data points and metrics
- Identify quotes and citations

### 3. **PPT-Optimized Extraction**
- Slide-ready content chunks
- Visual data (charts, graphs)
- Key statistics
- Timeline information

### 4. **Intelligence**
- Content summarization
- Key insight extraction
- Relevance scoring
- Duplicate detection

---

## Implementation Code

### Complete Ingestion Agent

See `supabase/functions/document-ingestion-agent/index.ts` for full implementation.

### Key Functions:

1. **`processDocument(file)`** - Main processing function
2. **`extractStructuredContent(text)`** - Extract structured data
3. **`optimizeForSlides(content)`** - Prepare for PPT generation
4. **`extractKeyMetrics(text)`** - Find important numbers/stats
5. **`identifyVisualData(text)`** - Find chart/table opportunities

---

## Integration Points

### 1. **Home.jsx** - File Upload
```javascript
// After file upload, call ingestion agent
const processFilesWithIngestion = async (files) => {
  const ingestionResult = await fetch('/functions/v1/document-ingestion-agent', {
    method: 'POST',
    body: JSON.stringify({ files })
  })
  return await ingestionResult.json()
}
```

### 2. **ReportView.jsx** - PPT Generation
```javascript
// Use ingested content in PPT generation
const handleGenerateSlides = async () => {
  const response = await fetch('/functions/v1/generate-ppt-agent', {
    body: JSON.stringify({
      report: reportData,
      ingestedContent: ingestedContent, // Add this
      presentationStyle: presentationStyle
    })
  })
}
```

### 3. **generate-ppt-agent** - Enhanced Prompt
```typescript
// Use ingested content to enhance prompt
const agentPrompt = `
${ingestedContent ? `
INGESTED DOCUMENT CONTENT:
${ingestedContent.summary}

KEY POINTS FROM DOCUMENTS:
${ingestedContent.keyPoints.join('\n')}

DATA POINTS:
${ingestedContent.dataPoints.map(d => `${d.label}: ${d.value}`).join('\n')}

TABLES:
${ingestedContent.tables.map(t => JSON.stringify(t)).join('\n\n')}
` : ''}

RESEARCH REPORT:
${reportContext}
`
```

---

## Benefits

### For Users:
- ✅ **Better PPTs** - More accurate content from documents
- ✅ **Faster generation** - Pre-processed content
- ✅ **Richer slides** - Data points, tables, metrics
- ✅ **Multi-format support** - PDF, Word, Excel, images

### For System:
- ✅ **Reusable data** - Process once, use multiple times
- ✅ **Better accuracy** - Structured extraction
- ✅ **Scalability** - Can cache processed content
- ✅ **Flexibility** - Works with or without documents

---

## Example Workflow

### Without Ingestion Agent:
```
Upload PDF → Extract text → Research → Generate PPT
Result: Generic slides from text
```

### With Ingestion Agent:
```
Upload PDF → Ingestion Agent extracts:
  - Key metrics: $2.5B revenue, 15% growth
  - Tables: Q1-Q4 performance data
  - Insights: Market leader in segment
  - Visual data: Chart opportunities
  
→ Enhanced Research → Generate PPT
Result: Rich slides with actual data, tables, metrics
```

---

## Next Steps

1. **Create ingestion agent function**
2. **Integrate with file upload**
3. **Enhance PPT agent to use ingested content**
4. **Add caching for processed documents**
5. **Test with various document types**

---

## File Structure

```
supabase/functions/
  ├── document-ingestion-agent/
  │   ├── index.ts          # Main ingestion logic
  │   └── README.md         # Documentation
  ├── generate-ppt-agent/
  │   ├── index.ts          # Enhanced with ingestion support
  │   └── README.md
```

---

## API Endpoints

### POST `/functions/v1/document-ingestion-agent`
**Request:**
```json
{
  "files": [
    {
      "name": "report.pdf",
      "content": "base64...",
      "type": "application/pdf"
    }
  ],
  "researchTopic": "Market Analysis",
  "presentationStyle": "executive"
}
```

**Response:**
```json
{
  "status": "success",
  "content": {
    "summary": "Document summary...",
    "keyPoints": ["Point 1", "Point 2"],
    "dataPoints": [
      {"label": "Revenue", "value": "$2.5B"},
      {"label": "Growth", "value": "15%"}
    ],
    "tables": [...],
    "insights": [...],
    "metadata": {...}
  }
}
```

---

## Testing

1. Upload a PDF document
2. Verify ingestion agent processes it
3. Check structured content extraction
4. Generate PPT with ingested content
5. Verify slides contain document data

---

## Future Enhancements

- **Multi-language support**
- **Image extraction and processing**
- **Chart/graph detection**
- **Citation extraction**
- **Document comparison**
- **Version tracking**

