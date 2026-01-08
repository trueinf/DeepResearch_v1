# 🚀 Ingestion Agent Quick Start

## ✅ What's Been Created

1. **Document Ingestion Agent** (`supabase/functions/document-ingestion-agent/index.ts`)
   - Processes uploaded documents
   - Extracts structured content (key points, data, tables, insights)
   - Optimizes content for PPT generation

2. **Integration Guide** (`INGESTION_AGENT_INTEGRATION.md`)
   - Complete architecture overview
   - Implementation details
   - API documentation

## 🔧 Integration Steps

### Step 1: Deploy Ingestion Agent

```bash
# Deploy to Supabase
supabase functions deploy document-ingestion-agent
```

Or via Supabase Dashboard:
1. Go to Edge Functions
2. Create new function: `document-ingestion-agent`
3. Copy code from `supabase/functions/document-ingestion-agent/index.ts`
4. Deploy

### Step 2: Update Supabase Config

Add to `supabase/config.toml`:

```toml
[functions.document-ingestion-agent]
verify_jwt = false
```

### Step 3: Integrate with File Upload (Optional)

**File:** `src/pages/Home.jsx`

Add ingestion processing after file upload:

```javascript
// After files are processed
if (uploadedFiles.length > 0) {
  // Call ingestion agent
  const ingestionResponse = await fetch(
    `${SUPABASE_URL}/functions/v1/document-ingestion-agent`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({
        files: uploadedFiles.map(file => ({
          name: file.name,
          content: file.extractedText || '',
          type: file.type || 'text/plain'
        })),
        researchTopic: refinedBrief,
        presentationStyle: 'executive'
      })
    }
  )
  
  const ingestionData = await ingestionResponse.json()
  // Store ingestedContent for later use
  // You can store it in state or pass to research
}
```

### Step 4: Enhance PPT Generation

**File:** `src/pages/ReportView.jsx`

Modify `handleGenerateSlides` to use ingested content:

```javascript
const handleGenerateSlides = async () => {
  // ... existing code ...
  
  // If you have ingested content stored, include it
  const requestBody = {
    report: {
      topic: research?.topic || report.topic,
      // ... existing report data
    },
    presentationStyle: presentationStyle,
    slideCount: 10,
    ingestedContent: storedIngestedContent // Add this if available
  }
  
  // ... rest of code ...
}
```

### Step 5: Update PPT Agent (Optional Enhancement)

**File:** `supabase/functions/generate-ppt-agent/index.ts`

Add support for ingested content:

```typescript
interface PPTAgentRequest {
  report: { ... }
  presentationStyle?: string
  slideCount?: number
  ingestedContent?: StructuredContent // Add this
}

// In the prompt building:
const agentPrompt = `
${request.ingestedContent ? `
ENHANCED CONTENT FROM DOCUMENTS:

KEY POINTS:
${request.ingestedContent.keyPoints.join('\n')}

DATA POINTS:
${request.ingestedContent.dataPoints.map(d => 
  `${d.label}: ${d.value}${d.context ? ` (${d.context})` : ''}`
).join('\n')}

TABLES:
${request.ingestedContent.tables.map(t => 
  `${t.title || 'Table'}: ${t.description || ''}\n` +
  `Headers: ${t.headers.join(', ')}\n` +
  `Rows: ${t.rows.length} rows`
).join('\n\n')}

INSIGHTS:
${request.ingestedContent.insights.join('\n')}
` : ''}

RESEARCH REPORT:
${reportContext}
`
```

## 📊 How It Works

### Current Flow:
```
Upload Files → Extract Text → Research → PPT
```

### With Ingestion Agent:
```
Upload Files → Ingestion Agent → Structured Content
                                    ↓
                              Research → Enhanced PPT
```

### Benefits:
- **Better Data Extraction**: Tables, metrics, key points
- **Richer Slides**: Actual data from documents
- **Faster Processing**: Pre-structured content
- **Better Accuracy**: Intelligent extraction

## 🧪 Testing

1. **Test Ingestion Agent:**
```bash
curl -X POST https://your-project.supabase.co/functions/v1/document-ingestion-agent \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "files": [{
      "name": "test.pdf",
      "content": "Your document text here...",
      "type": "application/pdf"
    }],
    "researchTopic": "Test Topic"
  }'
```

2. **Test with PPT Generation:**
   - Upload a document
   - Generate research
   - Generate PPT
   - Verify slides contain document data

## 📝 Example Response

```json
{
  "status": "success",
  "content": {
    "summary": "Document discusses market trends...",
    "keyPoints": [
      "Market grew 15% YoY",
      "Key players: Company A, B, C",
      "Technology adoption accelerating"
    ],
    "dataPoints": [
      {"label": "Revenue", "value": "$2.5B", "context": "2024"},
      {"label": "Growth", "value": "15%", "context": "Year-over-year"}
    ],
    "tables": [
      {
        "title": "Q1-Q4 Performance",
        "headers": ["Quarter", "Revenue", "Growth"],
        "rows": [
          ["Q1", "$500M", "10%"],
          ["Q2", "$600M", "12%"]
        ],
        "description": "Quarterly performance metrics"
      }
    ],
    "insights": [
      "Market is consolidating around top 3 players",
      "Technology adoption is the key differentiator"
    ],
    "metadata": {
      "documentType": "application/pdf",
      "wordCount": 5000,
      "keyTopics": ["Market Analysis", "Technology", "Growth"]
    }
  }
}
```

## 🎯 Next Steps

1. ✅ Deploy ingestion agent
2. ✅ Test with sample documents
3. ✅ Integrate with file upload (optional)
4. ✅ Enhance PPT agent to use ingested content
5. ✅ Test end-to-end workflow

## 💡 Tips

- **Cache ingested content** to avoid reprocessing
- **Store in database** for reuse across sessions
- **Combine with research** for richer context
- **Use for multiple purposes** (not just PPT)

## 🔗 Related Files

- `INGESTION_AGENT_INTEGRATION.md` - Full integration guide
- `supabase/functions/document-ingestion-agent/index.ts` - Agent code
- `supabase/functions/generate-ppt-agent/index.ts` - PPT agent (to enhance)

