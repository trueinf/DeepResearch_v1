# 📊 Visual Workflow Diagram

## 🎯 Complete Pipeline Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    USER JOURNEY                                 │
└─────────────────────────────────────────────────────────────────┘

┌──────────────┐
│  1. HOME     │
│  ──────────  │
│  • Enter topic                                                  │
│  • Upload files (optional)                                      │
│  • Select model                                                 │
│  • Click "Start Research"                                        │
└──────┬───────┘
       │
       │ createResearch()
       ▼
┌─────────────────────────────────────────────────────────────────┐
│  DATABASE: researches table                                     │
│  • id, topic, status: 'In Progress', model, documentContext     │
└──────┬──────────────────────────────────────────────────────────┘
       │
       │ Navigate to /progress/:id
       ▼
┌──────────────┐
│ 2. CLARIFY   │
│  ──────────  │
│  POST /functions/v1/clarify-Questions-gemini                    │
│  • Generate 5 adaptive questions                                 │
│  • User answers questions                                        │
│  • Store answers                                                 │
└──────┬───────┘
       │
       │ Start Research
       ▼
┌─────────────────────────────────────────────────────────────────┐
│  3. PROGRESS PAGE                                                │
│  ────────────────────────────────────────────────────────────  │
│  POST /functions/v1/deep-Research-gemini                        │
│                                                                  │
│  Processing Steps:                                               │
│  ├─ Step 1: Planning                                            │
│  │   └─ Analyze requirements                                    │
│  │                                                               │
│  ├─ Step 2: Web Search (optional)                               │
│  │   └─ SERP API → Get search results                          │
│  │                                                               │
│  ├─ Step 3: API Call                                             │
│  │   ├─ Build prompt (topic + answers + docs + search)          │
│  │   ├─ Call Gemini API (with retry logic)                      │
│  │   └─ Handle rate limits (5 retries, exponential backoff)    │
│  │                                                               │
│  ├─ Step 4: Parse Response                                       │
│  │   ├─ Extract Executive Summary                                │
│  │   ├─ Extract Key Findings                                    │
│  │   ├─ Extract Detailed Analysis                               │
│  │   ├─ Extract Insights                                        │
│  │   ├─ Extract Conclusion                                      │
│  │   └─ Extract Sources                                         │
│  │                                                               │
│  ├─ Step 5: Iterative Refinement (if depth = deep/expert)       │
│  │   ├─ Check for missing sections                              │
│  │   └─ Generate supplementary content                         │
│  │                                                               │
│  └─ Step 6: Save to Database                                     │
│      ├─ research_reports table                                  │
│      └─ Update status: 'Done'                                   │
└──────┬──────────────────────────────────────────────────────────┘
       │
       │ Navigate to /report/:id
       ▼
┌──────────────┐
│  4. REPORT   │
│  ──────────  │
│  • Display report sections                                       │
│  • Show sources                                                  │
│  • Action buttons:                                               │
│    ├─ Generate Universal Framework                               │
│    └─ Generate PPT                                               │
└──────┬───────┘
       │
       ├─────────────────┐
       │                 │
       ▼                 ▼
┌──────────────┐  ┌──────────────┐
│ 5A. FRAMEWORK│  │  5B. PPT      │
│  ──────────  │  │  ──────────  │
│  Check cache │  │  Check cache │
│  If cached:  │  │  If cached:  │
│  → Return    │  │  → Return    │
│  If not:     │  │  If not:     │
│  → Throttle  │  │  → Throttle  │
│  → API call  │  │  → API call  │
│  → Parse     │  │  → Parse     │
│  → Cache     │  │  → Cache     │
│  → Display   │  │  → Preview  │
│              │  │  → Download  │
└──────────────┘  └──────────────┘
```

---

## 🔄 Detailed Function Call Flow

### Research Generation Flow:

```
┌──────────────────────────────────────────────────────────────┐
│ 1. Frontend: Home.jsx                                        │
│    handleStartResearch()                                     │
│    ├─ Validate input                                         │
│    ├─ Process files → extractText()                          │
│    ├─ createResearch() → Supabase DB                         │
│    └─ Navigate to /progress/:id                              │
└──────────────┬───────────────────────────────────────────────┘
               │
               ▼
┌──────────────────────────────────────────────────────────────┐
│ 2. Frontend: ResearchProgress.jsx                            │
│    useEffect() → performResearch()                           │
│    ├─ Show clarifying questions (if needed)                  │
│    └─ Call deep-Research-gemini                              │
└──────────────┬───────────────────────────────────────────────┘
               │
               ▼
┌──────────────────────────────────────────────────────────────┐
│ 3. Backend: deep-Research-gemini/index.ts                    │
│    serve() handler                                           │
│    ├─ Parse request                                          │
│    ├─ Web search (optional)                                  │
│    ├─ Build prompt                                           │
│    ├─ Call Gemini API (with retries)                         │
│    ├─ Parse response → parseReport()                         │
│    ├─ Iterative refinement (if needed)                      │
│    └─ Return report                                          │
└──────────────┬───────────────────────────────────────────────┘
               │
               ▼
┌──────────────────────────────────────────────────────────────┐
│ 4. Frontend: ResearchProgress.jsx                            │
│    Receive response                                          │
│    ├─ setResearchReport() → Supabase DB                      │
│    ├─ updateResearchStatus(id, 'Done')                       │
│    └─ Navigate to /report/:id                                │
└──────────────┬───────────────────────────────────────────────┘
               │
               ▼
┌──────────────────────────────────────────────────────────────┐
│ 5. Frontend: ReportView.jsx                                  │
│    Load report from DB                                       │
│    Display sections                                          │
│    Optional: Generate Framework/PPT                          │
└──────────────────────────────────────────────────────────────┘
```

---

## 📡 API Request/Response Flow

### Request 1: Clarifying Questions
```
Client → POST /functions/v1/clarify-Questions-gemini
Body: {
  topic: "Research topic",
  documentContext: "File content...",
  model: "gemini-2.5-flash"
}

Function → Gemini API
Response: {
  questions: ["Q1", "Q2", "Q3", "Q4", "Q5"]
}

Client ← Response
```

### Request 2: Deep Research
```
Client → POST /functions/v1/deep-Research-gemini
Body: {
  originalQuery: "Topic",
  clarifyingAnswers: "Answers...",
  documentContext: "Files...",
  model: "gemini-2.5-flash",
  mode: "comprehensive"
}

Function → Web Search (SERP API)
Function → Gemini API (with retry logic)
Response: {
  status: "completed",
  report: { ... },
  model: "gemini-2.5-flash"
}

Client ← Response
Client → Save to DB (research_reports table)
```

### Request 3: Universal Framework
```
Client → POST /functions/v1/deep-Research-gemini
Body: {
  originalQuery: "Topic",
  mode: "universal",
  documentContext: "Report content..."
}

Function → Gemini API
Response: {
  report: {
    executiveSummary: "...",  // Sections 1-3
    keyFindings: [...],        // Section 4
    detailedAnalysis: "...",   // Sections 5-7, 9
    insights: "...",           // Section 8
    conclusion: "..."          // Section 10
  }
}

Client ← Response
Client → Cache in localStorage
Client → Display in accordion UI
```

### Request 4: PPT Generation
```
Client → POST /functions/v1/generate-ppt-agent
Body: {
  report: { ... },
  presentationStyle: "executive",
  slideCount: 10
}

Function → Gemini API
Response: {
  status: "success",
  slides: [
    { layout: "title", title: "...", ... },
    { layout: "title_and_bullets", ... },
    ...
  ]
}

Client ← Response
Client → Cache in localStorage
Client → Display in modal
Client → Generate PPTX file
```

---

## 🗄️ Database Schema Flow

### researches Table:
```sql
CREATE TABLE researches (
  id UUID PRIMARY KEY,
  topic TEXT,
  status TEXT,  -- 'Pending', 'In Progress', 'Done', 'Failed'
  model TEXT,
  options JSONB,  -- { depth, documentContext, clarifyingAnswers }
  created_at TIMESTAMP,
  updated_at TIMESTAMP
)
```

### research_reports Table:
```sql
CREATE TABLE research_reports (
  id UUID PRIMARY KEY,
  research_id UUID REFERENCES researches(id),
  report JSONB,  -- Full report object
  created_at TIMESTAMP,
  updated_at TIMESTAMP
)
```

### Data Flow:
```
1. createResearch() → INSERT into researches
2. Research processing → UPDATE researches.status
3. Report generated → INSERT/UPDATE research_reports
4. ReportView → SELECT from research_reports
```

---

## ⚡ Performance Optimizations Flow

### Caching Pipeline:
```
Request → Check localStorage
  ├─ Cache Hit → Return (0ms)
  └─ Cache Miss → API Call → Cache → Return
```

### Throttling Pipeline:
```
Request → Check last request time
  ├─ < 2s ago → Wait (2s - elapsed)
  └─ ≥ 2s ago → Proceed immediately
```

### Rate Limit Pipeline:
```
Request → Check rate limit status
  ├─ Under limit → Proceed
  └─ Over limit → Wait → Retry (up to 5 times)
```

---

## 🔄 State Synchronization

### Frontend ↔ Backend:
```
Frontend State          Backend State          Database
─────────────────       ──────────────       ──────────
research.status    ←→   Processing      ←→   researches.status
report data       ←→   Generated       ←→   research_reports.report
universalFramework ←→   Cached         ←→   localStorage
slides            ←→   Cached         ←→   localStorage
```

---

## 📊 Complete Data Transformation

```
User Input
    │
    ├─→ Text Cleaning
    │   └─→ cleanTextForDatabase()
    │
    ├─→ File Processing
    │   └─→ extractText() → documentContext
    │
    ├─→ Clarifying Questions
    │   └─→ Gemini API → 5 questions → Answers
    │
    └─→ Research Prompt
        ├─→ Original query
        ├─→ Clarifying answers
        ├─→ Document context
        ├─→ Search results
        └─→ Current date (dynamic)
            │
            ▼
        Gemini API
            │
            ▼
        Raw Response
            │
            ├─→ parseReport()
            │   ├─→ Executive Summary
            │   ├─→ Key Findings
            │   ├─→ Detailed Analysis
            │   ├─→ Insights
            │   ├─→ Conclusion
            │   └─→ Sources
            │
            └─→ Structured Report
                │
                ├─→ Save to DB
                ├─→ Display in UI
                ├─→ Generate Framework (optional)
                └─→ Generate PPT (optional)
```

---

## 🎯 Key Decision Points

### Model Selection:
```
User selects model
    │
    ├─→ gemini-2.5-flash (default, fast)
    ├─→ gemini-2.5-pro (better quality)
    └─→ claude-sonnet-4 (alternative)
```

### Fallback Chain:
```
Primary model fails
    │
    ├─→ Try gemini-2.5-flash
    ├─→ Try gemini-2.5-pro
    ├─→ Try gemini-pro-latest
    ├─→ Try gemini-flash-latest
    └─→ Try gemini-2.5-flash-lite
```

### Error Handling:
```
Error occurs
    │
    ├─→ Rate limit (429) → Retry with backoff
    ├─→ Model not found (404) → Try fallback
    ├─→ API error (500) → Show error message
    └─→ Timeout → Show timeout message
```

---

## 🔐 Security Flow

### Request Validation:
```
Incoming Request
    │
    ├─→ CORS check
    ├─→ Method validation (POST only)
    ├─→ Body parsing
    ├─→ Input sanitization
    └─→ API key validation
```

### Data Sanitization:
```
User Input
    │
    ├─→ cleanTextForDatabase()
    │   ├─→ Remove null chars
    │   ├─→ Remove invalid Unicode
    │   └─→ Limit length
    │
    └─→ Safe for storage
```

---

## 📈 Monitoring Points

### Performance Metrics:
```
1. Request latency
2. API call duration
3. Cache hit rate
4. Rate limit frequency
5. Error rate
6. Model usage distribution
```

### User Experience Metrics:
```
1. Time to first question
2. Research completion time
3. Framework generation time
4. PPT generation time
5. Error recovery time
```

---

## 🎨 UI State Transitions

```
Home Page
    │
    ├─→ [Start Research] → Clarifying Questions Modal
    │                          │
    │                          └─→ [Confirm] → Progress Page
    │
    └─→ [View Research] → Report Page
                            │
                            ├─→ [Generate Framework] → Framework Display
                            └─→ [Generate PPT] → PPT Modal → Download
```

---

This visual diagram shows the complete end-to-end flow of the DeepResearch AI system from user input to final output.

