# 🔄 Complete Project Pipeline & Workflow

## 📊 High-Level Architecture

```
┌─────────────────┐
│   Frontend      │
│  (React/Vite)   │
└────────┬────────┘
         │
         │ HTTP Requests
         │
┌────────▼─────────────────────────────────────┐
│         Supabase Edge Functions               │
│  ┌────────────────────────────────────────┐  │
│  │ 1. clarify-Questions-gemini            │  │
│  │ 2. deep-Research-gemini                 │  │
│  │ 3. generate-ppt-agent                   │  │
│  │ 4. document-ingestion-agent (NEW)       │  │
│  └────────────────────────────────────────┘  │
└────────┬─────────────────────────────────────┘
         │
         │ API Calls
         │
┌────────▼─────────────────────────────────────┐
│      External APIs                           │
│  • Gemini API (Google)                       │
│  • Claude API (Anthropic)                    │
│  • SERP API (Search Results)                 │
└──────────────────────────────────────────────┘
         │
         │ Data Storage
         │
┌────────▼─────────────────────────────────────┐
│      Supabase Database                       │
│  • research table                            │
│  • research_reports table                    │
│  • token_usage table                         │
└──────────────────────────────────────────────┘
```

---

## 🚀 Complete User Journey

### Phase 1: Research Initiation

#### Step 1: User Input (`Home.jsx`)
```
User Action:
  ├─ Enters research topic
  ├─ (Optional) Uploads documents (PDF, Word, etc.)
  ├─ Selects AI model (gemini-2.5-flash default)
  └─ Clicks "Start Research"

Frontend Processing:
  ├─ Validates input
  ├─ Processes uploaded files (extract text)
  ├─ Stores files in state
  └─ Prepares request payload
```

**Code Flow:**
```javascript
// src/pages/Home.jsx
handleStartResearch() {
  1. Validate topic
  2. Process uploaded files → extractText()
  3. Combine documentContext
  4. Create research record → createResearch()
  5. Navigate to /progress/:id
}
```

#### Step 2: Clarifying Questions (`clarify-Questions-gemini`)

```
Request Flow:
  Frontend → Supabase Function → Gemini API → Response

Function: clarify-Questions-gemini
  ├─ Receives: research topic, uploaded files context
  ├─ Generates: 5 adaptive clarifying questions
  ├─ Uses: gemini-2.5-flash (with fallback)
  └─ Returns: Array of 5 questions

Frontend Display:
  ├─ Shows modal with questions
  ├─ User answers each question
  └─ Stores answers for research
```

**API Call:**
```javascript
POST /functions/v1/clarify-Questions-gemini
Body: {
  topic: "Research topic",
  documentContext: "Uploaded files text",
  model: "gemini-2.5-flash"
}
Response: {
  questions: ["Q1", "Q2", "Q3", "Q4", "Q5"]
}
```

---

### Phase 2: Deep Research Execution

#### Step 3: Research Processing (`ResearchProgress.jsx`)

```
User Action:
  └─ Answers clarifying questions → Starts research

Research Flow:
  1. Frontend calls deep-Research-gemini
  2. Function processes request
  3. Real-time progress updates
  4. Report generation
  5. Storage in database
```

**Detailed Processing Steps:**

```
┌─────────────────────────────────────────────────┐
│  deep-Research-gemini Function                  │
└─────────────────────────────────────────────────┘
         │
         ├─ Step 3.1: Web Search (if enabled)
         │   └─ SERP API → Get search results
         │
         ├─ Step 3.2: Build Research Prompt
         │   ├─ Original query
         │   ├─ Clarifying answers
         │   ├─ Document context (if uploaded)
         │   ├─ Search results
         │   └─ Current date (dynamic)
         │
         ├─ Step 3.3: API Call with Retry Logic
         │   ├─ Primary: gemini-2.5-flash
         │   ├─ Fallback: gemini-2.5-pro, gemini-pro-latest, etc.
         │   ├─ Rate limit handling (5 retries, exponential backoff)
         │   └─ Error handling
         │
         ├─ Step 3.4: Parse Response
         │   ├─ Extract sections (Executive Summary, Key Findings, etc.)
         │   ├─ Extract sources
         │   ├─ Extract insights and conclusion
         │   └─ Structure data
         │
         ├─ Step 3.5: Iterative Refinement (if depth = deep/expert)
         │   ├─ Check for missing sections
         │   ├─ Generate supplementary content
         │   └─ Enhance report
         │
         └─ Step 3.6: Save to Database
             ├─ research table (status = 'Done')
             └─ research_reports table (full report)
```

**Rate Limit Handling:**
```
If rate limit hit (429):
  ├─ Retry 1: Wait 60s
  ├─ Retry 2: Wait 120s
  ├─ Retry 3: Wait 180s
  ├─ Retry 4: Wait 240s
  └─ Retry 5: Wait 300s
  
  Frontend shows:
    ├─ Countdown timer
    ├─ Attempt number
    └─ Progress bar
```

**Progress Updates:**
```javascript
// Real-time status updates
Steps: [
  "Planning",
  "Gathering Information", 
  "Analyzing Data",
  "Generating Insights",
  "Finalizing Report"
]
```

---

### Phase 3: Report Display

#### Step 4: Report View (`ReportView.jsx`)

```
User Action:
  └─ Clicks on completed research → Views report

Report Display:
  ├─ Executive Summary
  ├─ Key Findings
  ├─ Detailed Analysis
  ├─ Insights
  ├─ Conclusion
  ├─ Sources
  └─ Universal Research Framework (optional)
```

**Report Sections:**
```
1. Executive Summary
   └─ 2-3 paragraph overview

2. Key Findings
   └─ 4-5 bullet points with citations

3. Detailed Analysis
   └─ Comprehensive analysis section

4. Insights
   └─ Strategic insights and implications

5. Conclusion
   └─ Summary and recommendations

6. Sources
   └─ List of URLs and references

7. Universal Research Framework (Generated on demand)
   └─ 10 structured sections
```

---

### Phase 4: Universal Framework Generation

#### Step 5: Generate Universal Framework

```
User Action:
  └─ Clicks "Generate Universal Framework"

Processing:
  1. Check cache (1 hour TTL)
  2. If cached → Return immediately
  3. If not cached:
     ├─ Throttle (2s delay)
     ├─ Call deep-Research-gemini (mode: 'universal')
     ├─ Parse 10 sections
     ├─ Cache result
     └─ Display in accordion UI

Sections Generated:
  1. Research Question Precision
  2. Context and Background
  3. One-Sentence Answer
  4. Key Insights
  5. Stakeholders and Key Players
  6. Evidence Summary
  7. Confidence Level
  8. Implications and Impact
  9. Limitations
  10. Key Takeaways
```

**Caching Flow:**
```
Request → Check localStorage cache
  ├─ Cache Hit → Return cached data (instant)
  └─ Cache Miss → API call → Cache result → Return
```

---

### Phase 5: PPT Generation

#### Step 6: Generate PowerPoint

```
User Action:
  └─ Clicks "Generate PPT"

Processing Flow:
  1. Check cache (based on report + style)
  2. If cached → Return slides immediately
  3. If not cached:
     ├─ Throttle (2s delay)
     ├─ Call generate-ppt-agent
     ├─ Process structured slide data
     ├─ Cache result
     └─ Display in modal

Slide Generation:
  ├─ Title slide
  ├─ Content slides (3-6)
  ├─ Conclusion slide
  └─ Structured layouts:
      • title_and_bullets
      • two_column
      • timeline
      • conclusion
```

**PPT Agent Processing:**
```
generate-ppt-agent Function:
  ├─ Receives: Report data, presentation style
  ├─ Builds: Comprehensive prompt
  ├─ Calls: Gemini API
  ├─ Parses: JSON slide structure
  └─ Returns: Array of slide objects
```

**Slide Structure:**
```json
{
  "slides": [
    {
      "layout": "title",
      "title": "Main Title",
      "subtitle": "Subtitle"
    },
    {
      "layout": "title_and_bullets",
      "title": "Slide Title",
      "bullets": ["Point 1", "Point 2"],
      "icons": ["trend-up", "globe"]
    },
    {
      "layout": "two_column",
      "title": "Comparison",
      "left_bullets": ["Left 1", "Left 2"],
      "right_bullets": ["Right 1", "Right 2"]
    }
  ]
}
```

---

## 🔄 Data Flow Diagram

```
┌──────────────┐
│   User       │
└──────┬───────┘
       │
       │ 1. Enter Topic + Upload Files
       ▼
┌─────────────────────────────────────┐
│         Home.jsx                    │
│  • File processing                  │
│  • Input validation                 │
│  • createResearch()                 │
└──────┬──────────────────────────────┘
       │
       │ 2. Navigate to Progress
       ▼
┌─────────────────────────────────────┐
│    ResearchProgress.jsx              │
│  • Show clarifying questions        │
│  • Call deep-Research-gemini        │
│  • Real-time progress updates       │
│  • Handle rate limits               │
└──────┬──────────────────────────────┘
       │
       │ 3. Research Complete
       ▼
┌─────────────────────────────────────┐
│      Supabase Database              │
│  • research table                   │
│  • research_reports table           │
└──────┬──────────────────────────────┘
       │
       │ 4. Navigate to Report
       ▼
┌─────────────────────────────────────┐
│        ReportView.jsx                │
│  • Display report                   │
│  • Generate Universal Framework     │
│  • Generate PPT                     │
│  • Export/Download                  │
└─────────────────────────────────────┘
```

---

## 🔧 Function Call Sequence

### Complete Research Flow:

```
1. POST /functions/v1/clarify-Questions-gemini
   ├─ Input: topic, documentContext
   ├─ Process: Generate 5 questions
   └─ Output: questions array

2. POST /functions/v1/deep-Research-gemini
   ├─ Input: topic, clarifyingAnswers, documentContext, model
   ├─ Process:
   │   ├─ Web search (optional)
   │   ├─ Build prompt
   │   ├─ Call Gemini API (with retries)
   │   ├─ Parse response
   │   └─ Save to database
   └─ Output: report object

3. GET /rest/v1/research_reports?research_id=eq.{id}
   └─ Fetch stored report

4. POST /functions/v1/deep-Research-gemini (mode: 'universal')
   ├─ Input: report content, mode: 'universal'
   ├─ Process: Generate universal framework
   └─ Output: structured framework

5. POST /functions/v1/generate-ppt-agent
   ├─ Input: report, presentationStyle
   ├─ Process: Generate slide structure
   └─ Output: slides array
```

---

## 📦 Data Structures

### Research Object:
```typescript
{
  id: string
  topic: string
  status: 'Pending' | 'In Progress' | 'Done'
  model: string
  created_at: timestamp
  updated_at: timestamp
  documentContext?: string
  clarifyingAnswers?: string
}
```

### Report Object:
```typescript
{
  research_id: string
  executiveSummary: string
  keyFindings: Array<{
    text: string
    citations: number[]
  }>
  detailedAnalysis: string
  insights: string
  conclusion: string
  sources: Array<{
    url: string
    domain: string
    date: string
    title?: string
  }>
}
```

### Universal Framework:
```typescript
{
  executiveSummary: string  // Contains sections 1-3
  keyFindings: Array        // Section 4
  detailedAnalysis: string  // Contains sections 5, 6, 7, 9
  insights: string         // Section 8
  conclusion: string        // Section 10
}
```

---

## 🛡️ Error Handling & Resilience

### Rate Limit Handling:
```
1. Proactive Throttling
   └─ 2s delay between requests

2. Exponential Backoff
   └─ 60s, 120s, 180s, 240s, 300s

3. Visual Feedback
   └─ Countdown timer, progress bar

4. Model Fallback
   └─ gemini-2.5-flash → gemini-2.5-pro → gemini-pro-latest
```

### Caching Strategy:
```
1. Response Caching
   └─ localStorage, 1 hour TTL

2. Cache Keys:
   ├─ Universal Framework: `universal_framework_{id}_{hash}`
   └─ PPT Slides: `ppt_slides_{id}_{style}_{hash}`

3. Cache Invalidation:
   └─ Automatic after TTL expires
```

---

## 🔄 State Management

### Frontend State Flow:

```
Home.jsx:
  ├─ uploadedFiles: File[]
  ├─ selectedModel: string
  ├─ clarifyingAnswers: string[]
  └─ researchId: string

ResearchProgress.jsx:
  ├─ currentStep: number
  ├─ currentMessage: string
  ├─ rateLimitCountdown: object
  └─ report: object

ReportView.jsx:
  ├─ report: object
  ├─ universalFramework: object
  ├─ slides: array
  └─ expandedSections: object
```

### Database State:

```
research table:
  ├─ Tracks research status
  ├─ Stores metadata
  └─ Links to reports

research_reports table:
  ├─ Stores full report JSON
  ├─ Versioned by research_id
  └─ Updated on completion
```

---

## 🎯 Key Workflows

### Workflow 1: Standard Research (No Files)
```
1. User enters topic
2. Clarifying questions generated
3. User answers questions
4. Research executed
5. Report generated
6. User views report
```

### Workflow 2: Research with Files
```
1. User enters topic
2. User uploads files
3. Files processed (text extraction)
4. Clarifying questions generated (with file context)
5. User answers questions
6. Research executed (with document context)
7. Report generated (document-focused)
8. User views report
```

### Workflow 3: Research with Universal Framework
```
1-6. Same as Workflow 1 or 2
7. User clicks "Generate Universal Framework"
8. Framework generated (cached)
9. User views 10 structured sections
```

### Workflow 4: Research with PPT Generation
```
1-6. Same as Workflow 1 or 2
7. User clicks "Generate PPT"
8. Slides generated (cached)
9. User previews slides
10. User downloads PPTX file
```

---

## 🔌 API Integration Points

### Gemini API:
```
Endpoint: https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent
Method: POST
Headers:
  - Content-Type: application/json
Body:
  - contents: [{ parts: [{ text: prompt }] }]
  - generationConfig: { temperature, maxOutputTokens, ... }
Response:
  - candidates[0].content.parts[0].text
```

### Supabase Functions:
```
Base URL: {SUPABASE_URL}/functions/v1
Functions:
  - /clarify-Questions-gemini
  - /deep-Research-gemini
  - /generate-ppt-agent
  - /document-ingestion-agent
```

---

## 📊 Performance Optimizations

### 1. Caching:
- ✅ Response caching (1 hour TTL)
- ✅ Cache-first strategy
- ✅ Automatic cleanup

### 2. Throttling:
- ✅ 2s minimum delay between requests
- ✅ Prevents rate limits
- ✅ Smooth user experience

### 3. Retry Logic:
- ✅ Exponential backoff
- ✅ Visual feedback
- ✅ Automatic recovery

### 4. Model Selection:
- ✅ Fast model (gemini-2.5-flash) as default
- ✅ Fallback chain for reliability
- ✅ Model availability checking

---

## 🔐 Security & Validation

### Input Validation:
```
1. Topic validation (non-empty, sanitized)
2. File type validation
3. File size limits
4. API key validation
5. Request rate limiting
```

### Error Handling:
```
1. Network errors → Retry with backoff
2. API errors → Proper HTTP status codes
3. Validation errors → User-friendly messages
4. Timeout errors → Clear timeout messages
```

---

## 📈 Monitoring & Logging

### Frontend Logging:
```javascript
console.log('Research started')
console.log('Rate limit hit, retrying...')
console.log('Cache hit for: ...')
```

### Backend Logging:
```typescript
console.log('Using Gemini model: ...')
console.log('Rate limit: Throttling request')
console.log('Research completed')
```

### Error Tracking:
```
- API errors logged with details
- Rate limit events tracked
- Cache hits/misses logged
- Performance metrics tracked
```

---

## 🎨 UI/UX Flow

### Visual States:

```
1. Home Page
   ├─ Input form
   ├─ File upload area
   └─ Model selector

2. Clarifying Questions Modal
   ├─ 5 questions displayed
   ├─ Input fields
   └─ Submit button

3. Progress Page
   ├─ Step indicators
   ├─ Current message
   ├─ Rate limit countdown (if applicable)
   └─ Loading animations

4. Report View
   ├─ Report sections (expandable)
   ├─ Universal Framework (accordion)
   ├─ Sources list
   └─ Action buttons (PPT, Export)
```

---

## 🔄 Complete Request Lifecycle

```
┌─────────────────────────────────────────────────┐
│ 1. User Input                                  │
│    Topic + Files + Model Selection             │
└──────────────┬────────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────────┐
│ 2. Clarifying Questions                        │
│    Generate → Display → Collect Answers        │
└──────────────┬────────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────────┐
│ 3. Research Execution                           │
│    Web Search → API Call → Parse → Store       │
└──────────────┬────────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────────┐
│ 4. Report Display                              │
│    Load from DB → Render Sections              │
└──────────────┬────────────────────────────────┘
               │
               ├─► 5. Universal Framework (Optional)
               │    Generate → Cache → Display
               │
               └─► 6. PPT Generation (Optional)
                   Generate → Cache → Preview → Download
```

---

## 🎯 Key Features Pipeline

### Feature: Document Ingestion (NEW)
```
Flow:
  1. User uploads files
  2. Files processed → Text extracted
  3. (Optional) Call document-ingestion-agent
  4. Structured content extracted:
     - Key points
     - Data points
     - Tables
     - Insights
  5. Enhanced research with document data
  6. Richer PPT generation
```

### Feature: Rate Limit Management
```
Flow:
  1. Request made
  2. Check rate limit status
  3. If limit reached:
     - Show countdown
     - Wait with exponential backoff
     - Retry automatically
  4. Track usage
  5. Cache responses
```

### Feature: Caching System
```
Flow:
  1. Request initiated
  2. Check cache (localStorage)
  3. If cached:
     - Return immediately (instant)
  4. If not cached:
     - Make API call
     - Cache result
     - Return data
```

---

## 📝 Summary

### Complete Pipeline:
```
User Input → Validation → Clarifying Questions → 
Research Execution → Report Generation → 
Storage → Display → Optional Enhancements (Framework/PPT)
```

### Key Components:
- **Frontend**: React, Vite, React Router
- **Backend**: Supabase Edge Functions (Deno)
- **APIs**: Gemini, Claude, SERP
- **Database**: Supabase PostgreSQL
- **Storage**: localStorage (caching)
- **File Processing**: Client-side text extraction

### Performance Features:
- ✅ Proactive throttling
- ✅ Response caching
- ✅ Rate limit handling
- ✅ Model fallback
- ✅ Retry logic
- ✅ Progress tracking

This pipeline ensures reliable, fast, and user-friendly research generation with proper error handling and optimization at every step.

