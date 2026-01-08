# 🔄 Complete Project Pipeline - askDepth_gemini

## 📋 Table of Contents
1. [High-Level Architecture](#high-level-architecture)
2. [Complete User Journey](#complete-user-journey)
3. [Detailed Component Flow](#detailed-component-flow)
4. [API & Function Pipeline](#api--function-pipeline)
5. [Data Flow Diagrams](#data-flow-diagrams)
6. [State Management](#state-management)
7. [Error Handling & Resilience](#error-handling--resilience)
8. [Performance Optimizations](#performance-optimizations)

---

## 🏗️ High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    FRONTEND (React/Vite)                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Home.jsx   │  │ ResearchProg │  │ ReportView  │      │
│  │              │  │    ress.jsx  │  │    .jsx     │      │
│  │ • Input      │  │ • Progress   │  │ • Display   │      │
│  │ • File Upload│  │ • Questions  │  │ • PPT Gen   │      │
│  │ • Model Sel  │  │ • Rate Limit │  │ • Customize │      │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘      │
│         │                 │                 │              │
│         └─────────────────┴─────────────────┘              │
│                           │                                  │
│                    HTTP Requests                            │
└───────────────────────────┼──────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│              SUPABASE EDGE FUNCTIONS (Deno)                 │
│  ┌────────────────────────────────────────────────────┐   │
│  │ 1. clarify-Questions-gemini                        │   │
│  │    → Generate 5 adaptive questions                 │   │
│  │                                                     │   │
│  │ 2. document-ingestion-agent                        │   │
│  │    → Extract structured content from files          │   │
│  │                                                     │   │
│  │ 3. deep-Research-gemini                            │   │
│  │    → Comprehensive research generation              │   │
│  │    → Universal Framework generation                │   │
│  │                                                     │   │
│  │ 4. generate-ppt-agent                              │   │
│  │    → Industry-standard PPT with images              │   │
│  │                                                     │   │
│  │ 5. stream-research                                 │   │
│  │    → Real-time streaming research                  │   │
│  │                                                     │   │
│  │ 6. chat-Research                                   │   │
│  │    → Follow-up chat functionality                  │   │
│  │                                                     │   │
│  │ 7. build-research-graph                            │   │
│  │    → Graph visualization                           │   │
│  └────────────────────────────────────────────────────┘   │
└───────────────────────────┬──────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    EXTERNAL APIs                            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Gemini API   │  │ Claude API   │  │ SERP API     │      │
│  │ (Google)     │  │ (Anthropic) │  │ (Search)     │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└───────────────────────────┬──────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│              SUPABASE DATABASE (PostgreSQL)                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  research    │  │ research_    │  │ token_usage  │      │
│  │   table      │  │  reports     │  │   table     │      │
│  │              │  │   table      │  │             │      │
│  │ • Status     │  │ • Full Report│  │ • Usage      │      │
│  │ • Metadata   │  │ • JSON Data  │  │ • Costs     │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
```

---

## 🚀 Complete User Journey

### Phase 1: Research Initiation & Setup

#### Step 1: User Input (`Home.jsx`)

**User Actions:**
```
1. Enters research topic in input field
2. (Optional) Uploads documents:
   - PDF files
   - Word documents (.docx)
   - Text files
   - Images (OCR support)
3. Selects AI model:
   - Default: gemini-2.5-flash
   - Options: gemini-2.5-pro, claude-3-5-sonnet, etc.
4. Clicks "Start Research" button
```

**Frontend Processing:**
```javascript
// src/pages/Home.jsx - handleStartResearch()

1. Validate Input:
   ├─ Check topic is not empty
   ├─ Sanitize input
   └─ Validate file types and sizes

2. Process Uploaded Files:
   ├─ Extract text from PDFs (pdf-parse)
   ├─ Extract text from Word (mammoth)
   ├─ Extract text from images (OCR - if implemented)
   └─ Combine into documentContext string

3. Document Ingestion (Optional):
   ├─ Call document-ingestion-agent
   ├─ Extract structured content:
   │   ├─ Summary
   │   ├─ Key Points
   │   ├─ Data Points
   │   ├─ Tables
   │   ├─ Insights
   │   ├─ Quotes
   │   ├─ Timeline
   │   └─ Metadata
   └─ Store in ingestedContent state

4. Create Research Record:
   ├─ Call createResearch() from ResearchContext
   ├─ Insert into Supabase 'research' table
   ├─ Get research ID
   └─ Navigate to /progress/:id
```

**Code Flow:**
```javascript
// src/pages/Home.jsx
const handleStartResearch = async () => {
  // 1. Validation
  if (!topic.trim()) return;
  
  // 2. File Processing
  let documentContext = '';
  let ingestedContent = null;
  
  if (uploadedFiles.length > 0) {
    // Extract text
    documentContext = await extractTextFromFiles(uploadedFiles);
    
    // Optional: Document Ingestion
    ingestedContent = await processFilesWithIngestion(uploadedFiles);
  }
  
  // 3. Create Research
  const research = await createResearch({
    topic,
    model: selectedModel,
    documentContext,
    ingestedContent
  });
  
  // 4. Navigate
  navigate(`/progress/${research.id}`);
};
```

---

#### Step 2: Clarifying Questions Generation

**Function:** `clarify-Questions-gemini`

**Request Flow:**
```
Frontend (ResearchProgress.jsx)
  ↓
POST /functions/v1/clarify-Questions-gemini
  ↓
Supabase Edge Function
  ↓
Gemini API (gemini-2.5-flash)
  ↓
Response: 5 Questions
```

**Function Processing:**
```typescript
// supabase/functions/clarify-Questions-gemini/index.ts

1. Receive Request:
   ├─ topic: string
   ├─ documentContext?: string
   ├─ ingestedContent?: object
   └─ model: string (default: gemini-2.5-flash)

2. Build Prompt:
   ├─ Include research topic
   ├─ Include document context (if available)
   ├─ Include ingested content insights (if available)
   └─ Request EXACTLY 5 adaptive questions

3. Call Gemini API:
   ├─ Model: gemini-2.5-flash (primary)
   ├─ Fallback: gemini-2.5-pro (if needed)
   ├─ Temperature: 0.7
   └─ Max tokens: 2000

4. Parse Response:
   ├─ Extract questions from JSON
   ├─ Fallback: Extract from markdown
   ├─ Fallback: Extract from numbered list
   └─ Fallback: Generate generic questions

5. Return:
   └─ { questions: string[] } (exactly 5)
```

**Frontend Display:**
```javascript
// src/pages/ResearchProgress.jsx

1. Show Modal:
   ├─ Display 5 questions
   ├─ Input fields for each answer
   └─ Submit button

2. Collect Answers:
   ├─ Store in clarifyingAnswers state
   └─ Validate all answered

3. Proceed to Research:
   └─ Call deep-Research-gemini with answers
```

---

### Phase 2: Deep Research Execution

#### Step 3: Research Processing (`ResearchProgress.jsx`)

**User Action:**
```
Answers clarifying questions → Clicks "Start Research"
```

**Research Flow:**
```
┌─────────────────────────────────────────────────────┐
│  deep-Research-gemini Function                      │
└─────────────────────────────────────────────────────┘
         │
         ├─ Step 3.1: Web Search (Optional)
         │   ├─ Check if web search enabled
         │   ├─ Call SERP API
         │   ├─ Get top 10 search results
         │   └─ Extract URLs and snippets
         │
         ├─ Step 3.2: Build Comprehensive Prompt
         │   ├─ Original research topic
         │   ├─ Clarifying answers (JSON)
         │   ├─ Document context (if uploaded)
         │   ├─ Ingested content insights:
         │   │   ├─ Summary
         │   │   ├─ Key Points
         │   │   ├─ Data Points
         │   │   ├─ Tables
         │   │   └─ Insights
         │   ├─ Search results (if available)
         │   ├─ Current date (dynamic: new Date())
         │   └─ Research depth (standard/deep/expert)
         │
         ├─ Step 3.3: API Call with Retry Logic
         │   ├─ Primary Model: gemini-2.5-flash
         │   ├─ Fallback Chain:
         │   │   ├─ gemini-2.5-pro
         │   │   ├─ gemini-pro-latest
         │   │   └─ gemini-1.5-pro
         │   ├─ Rate Limit Handling:
         │   │   ├─ Retry 1: Wait 60s
         │   │   ├─ Retry 2: Wait 120s
         │   │   ├─ Retry 3: Wait 180s
         │   │   ├─ Retry 4: Wait 240s
         │   │   └─ Retry 5: Wait 300s
         │   └─ Error Handling:
         │       ├─ Network errors → Retry
         │       ├─ API errors → Fallback model
         │       └─ Parse errors → Retry with different prompt
         │
         ├─ Step 3.4: Parse Response
         │   ├─ Extract Executive Summary
         │   ├─ Extract Key Findings (with citations)
         │   ├─ Extract Detailed Analysis
         │   ├─ Extract Insights
         │   ├─ Extract Conclusion
         │   ├─ Extract Sources (URLs, domains, dates)
         │   └─ Structure into report object
         │
         ├─ Step 3.5: Iterative Refinement (if depth = deep/expert)
         │   ├─ Check for missing sections
         │   ├─ Generate supplementary content
         │   ├─ Enhance report quality
         │   └─ Add more detailed analysis
         │
         └─ Step 3.6: Save to Database
             ├─ Insert into research_reports table
             ├─ Update research table (status = 'Done')
             └─ Return report object
```

**Rate Limit Handling:**
```javascript
// src/pages/ResearchProgress.jsx

If rate limit hit (429):
  ├─ Show countdown timer
  ├─ Display attempt number
  ├─ Show progress bar
  ├─ Exponential backoff:
  │   ├─ Attempt 1: 60s wait
  │   ├─ Attempt 2: 120s wait
  │   ├─ Attempt 3: 180s wait
  │   ├─ Attempt 4: 240s wait
  │   └─ Attempt 5: 300s wait
  └─ Smart delay: +30s if rate limit hit within last 2 minutes
```

**Progress Updates:**
```javascript
// Real-time status updates
const steps = [
  "Planning Research Approach",
  "Gathering Information from Sources",
  "Analyzing Data and Patterns",
  "Generating Insights and Conclusions",
  "Finalizing Report"
];

// Display:
// - Current step indicator
// - Progress percentage
// - Current message
// - Loading animations
```

---

### Phase 3: Report Display & Interaction

#### Step 4: Report View (`ReportView.jsx`)

**User Action:**
```
Research completes → Navigate to /report/:id
```

**Report Display Sections:**
```
1. Executive Summary
   └─ 2-3 paragraph overview of research

2. Key Findings
   └─ 4-5 bullet points with citations [1], [2], etc.

3. Detailed Analysis
   └─ Comprehensive analysis section

4. Insights
   └─ Strategic insights and implications

5. Conclusion
   └─ Summary and recommendations

6. Sources
   └─ List of URLs with:
       - Domain
       - Date accessed
       - Title (if available)

7. Universal Research Framework (Generated on demand)
   └─ 10 structured sections (see below)
```

**Report Structure:**
```typescript
interface Report {
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
  ingestedContent?: {
    summary: string
    keyPoints: string[]
    dataPoints: Array<{label: string, value: string}>
    tables: Array<{headers: string[], rows: string[][]}>
    insights: string[]
    quotes: Array<{text: string, author?: string}>
    timeline: Array<{date: string, event: string}>
    metadata: object
  }
}
```

---

### Phase 4: Universal Framework Generation

#### Step 5: Generate Universal Framework

**User Action:**
```
Clicks "Generate Universal Framework" button
```

**Processing Flow:**
```
1. Check Cache:
   ├─ Key: `universal_framework_{researchId}_{hash}`
   ├─ TTL: 1 hour
   └─ If cached → Return immediately (instant)

2. If Not Cached:
   ├─ Apply Throttling:
   │   └─ Wait 2s (proactive rate limit prevention)
   │
   ├─ Call deep-Research-gemini:
   │   ├─ Mode: 'universal'
   │   ├─ Input: Full report content
   │   ├─ Prompt: Generate 10 structured sections
   │   └─ Model: gemini-2.5-flash
   │
   ├─ Parse Response:
   │   └─ Extract 10 sections:
   │       ├─ 1. Research Question Precision
   │       ├─ 2. Context and Background
   │       ├─ 3. One-Sentence Answer
   │       ├─ 4. Key Insights
   │       ├─ 5. Stakeholders and Key Players
   │       ├─ 6. Evidence Summary
   │       ├─ 7. Confidence Level
   │       ├─ 8. Implications and Impact
   │       ├─ 9. Limitations
   │       └─ 10. Key Takeaways
   │
   ├─ Cache Result:
   │   └─ Store in localStorage with TTL
   │
   └─ Display:
       └─ Accordion UI with expandable sections
```

**Universal Framework Structure:**
```typescript
interface UniversalFramework {
  executiveSummary: string  // Contains sections 1-3 combined
  keyFindings: Array         // Section 4
  detailedAnalysis: string   // Contains sections 5, 6, 7, 9
  insights: string          // Section 8
  conclusion: string         // Section 10
}

// Parsed into 10 separate sections:
interface ParsedSections {
  section1: string  // Research Question Precision
  section2: string  // Context and Background
  section3: string  // One-Sentence Answer
  section4: Array   // Key Insights
  section5: string  // Stakeholders and Key Players
  section6: string  // Evidence Summary
  section7: string  // Confidence Level
  section8: string  // Implications and Impact
  section9: string  // Limitations
  section10: string // Key Takeaways
}
```

---

### Phase 5: PPT Generation & Customization

#### Step 6: Generate PowerPoint

**User Action:**
```
Clicks "Generate PPT" button
```

**Processing Flow:**
```
1. Check Cache:
   ├─ Key: `ppt_slides_{researchId}_{style}_{hash}`
   ├─ TTL: 1 hour
   └─ If cached → Return immediately

2. If Not Cached:
   ├─ Apply Throttling:
   │   └─ Wait 2s (proactive rate limit prevention)
   │
   ├─ Call generate-ppt-agent:
   │   ├─ Input:
   │   │   ├─ Full report content
   │   │   ├─ Ingested content (if available)
   │   │   ├─ Presentation style
   │   │   └─ Report topic
   │   │
   │   ├─ Build Prompt:
   │   │   ├─ Request 8-12 slides
   │   │   ├─ Include specific metrics and data points
   │   │   ├─ Industry-standard terminology
   │   │   ├─ Actionable recommendations
   │   │   ├─ Risk factors
   │   │   ├─ Competitive insights
   │   │   └─ Image suggestions (2-4 slides)
   │   │
   │   ├─ Call Gemini API:
   │   │   └─ Model: gemini-2.5-flash
   │   │
   │   └─ Parse Response:
   │       └─ Extract structured slide data
   │
   ├─ Cache Result:
   │   └─ Store in localStorage
   │
   └─ Display:
       └─ Modal with slide preview
```

**PPT Agent Processing:**
```typescript
// supabase/functions/generate-ppt-agent/index.ts

1. Receive Request:
   ├─ report: Report object
   ├─ ingestedContent?: object
   ├─ presentationStyle: string
   └─ topic: string

2. Build Comprehensive Prompt:
   ├─ Include report sections
   ├─ Include ingested content:
   │   ├─ Key points
   │   ├─ Data points
   │   ├─ Tables
   │   ├─ Insights
   │   └─ Timeline
   ├─ Request slide types:
   │   ├─ Title slide
   │   ├─ Executive Summary
   │   ├─ Methodology
   │   ├─ Key Findings (2-3 slides)
   │   ├─ Market/Industry Analysis
   │   ├─ Insights & Implications (1-2 slides)
   │   ├─ Recommendations
   │   └─ Conclusion
   ├─ Image requirements:
   │   ├─ Suggest 2-4 relevant images
   │   ├─ Use Unsplash or Pexels URLs
   │   ├─ Specify position (left/right/center)
   │   └─ Include descriptions
   └─ Industry standards:
       ├─ Specific metrics
       ├─ Quantitative data
       ├─ Actionable recommendations
       └─ Risk factors

3. Call Gemini API:
   └─ Parse JSON response

4. Return:
   └─ Array of slide objects with image data
```

**Slide Structure:**
```typescript
interface AgentSlide {
  layout: 'title' | 'title_and_bullets' | 'two_column' | 
          'timeline' | 'conclusion' | 'image_right_bullets' | 
          'image_left_bullets'
  title: string
  subtitle?: string
  bullets?: string[]
  left_bullets?: string[]
  right_bullets?: string[]
  icons?: string[]
  imageData?: {
    url: string
    position: 'left' | 'right' | 'center'
    description: string
  }
}
```

---

#### Step 7: PPT Customization & Download

**User Action:**
```
Clicks "Customize & Download" button
```

**Customization Features:**
```
1. Theme Presets:
   ├─ Professional
   ├─ Modern
   ├─ Creative
   ├─ Minimal
   ├─ Dark
   └─ Corporate

2. Color Customization:
   ├─ Primary Color (picker)
   ├─ Secondary Color (picker)
   ├─ Accent Color (picker)
   └─ Background Color (picker)

3. Font Settings:
   ├─ Title Font (dropdown)
   ├─ Body Font (dropdown)
   └─ Font Size (dropdown)

4. Layout Options:
   ├─ Slide Layout (dropdown)
   └─ Content Alignment (dropdown)

5. Background:
   ├─ Background Type (solid/gradient/image)
   └─ Gradient Direction (if gradient)

6. Styling:
   ├─ Bullet Style (dropdown)
   ├─ Border Style (dropdown)
   ├─ Border Width (slider)
   ├─ Shadow Effect (checkbox)
   ├─ Rounded Corners (checkbox)
   └─ Line Spacing (dropdown)

7. Header & Footer:
   ├─ Header Height (slider)
   ├─ Show Footer (checkbox)
   ├─ Footer Text (input)
   └─ Show Slide Numbers (checkbox)

8. Title Slide:
   └─ Title Slide Style (dropdown)

9. Icons:
   └─ Icon Style (dropdown)
```

**Live Preview:**
```
Side-by-side layout:
├─ Left Panel: Customization Settings
│   └─ All options with real-time updates
│
└─ Right Panel: Live Preview
    ├─ Shows actual content:
    │   ├─ Title slide with real topic
    │   ├─ Content slides with real data
    │   └─ Images (if available)
    ├─ Navigation:
    │   ├─ Previous/Next buttons
    │   └─ Slide counter (e.g., "Slide 2 of 5")
    └─ Updates in real-time as settings change
```

**Download Process:**
```javascript
// src/pages/ReportView.jsx - handleDownloadPPTX()

1. Create PPTXGenJS Presentation:
   ├─ Set theme colors
   ├─ Set fonts
   └─ Set master slide layout

2. Generate Title Slide:
   ├─ Apply title slide style
   ├─ Use custom colors
   ├─ Use custom fonts
   └─ Add header/footer if enabled

3. Generate Content Slides:
   ├─ For each slide in slides array:
   │   ├─ Apply layout (title_and_bullets, two_column, etc.)
   │   ├─ Add title with styling
   │   ├─ Add bullets with formatting
   │   ├─ Add images (if imageData exists):
   │   │   ├─ Load image from URL
   │   │   ├─ Size: contain (maintain aspect ratio)
   │   │   ├─ Position: left/right/center
   │   │   ├─ Apply rounded corners (if enabled)
   │   │   ├─ Apply shadow (if enabled)
   │   │   └─ Add border (if enabled)
   │   ├─ Adjust content area based on image position
   │   ├─ Apply custom colors
   │   ├─ Apply custom fonts
   │   ├─ Apply line spacing
   │   ├─ Apply content padding
   │   └─ Add header/footer
   │
   └─ Add slide numbers (if enabled)

4. Apply Global Settings:
   ├─ Background (solid/gradient/image)
   ├─ Border style (if enabled)
   └─ Shadow effects (if enabled)

5. Download:
   └─ Generate .pptx file and trigger download
```

**Image Handling:**
```javascript
// addImageToSlide() function

1. Determine Image Position:
   ├─ Left: Image on left, content on right
   ├─ Right: Image on right, content on left (default)
   └─ Center: Image centered, content above/below

2. Calculate Dimensions:
   ├─ Side images: 3.5" × 3.0"
   └─ Center images: 6.0" × 3.5"

3. Adjust Content Area:
   ├─ If image on side: Reduce content width to 5.5"
   └─ If image centered: Full width 8.2"

4. Apply Styling:
   ├─ Rounded corners (if pptSettings.roundedCorners)
   ├─ Shadow (if pptSettings.shadowEffect)
   ├─ Border (if pptSettings.borderStyle !== 'none')
   └─ Hyperlink to source URL

5. Add Caption (optional):
   └─ Description text below image
```

---

## 🔄 Data Flow Diagrams

### Complete Research Pipeline:

```
┌─────────────────────────────────────────────────────────────┐
│                    USER INPUT                               │
│  • Research Topic                                            │
│  • Uploaded Files (Optional)                                 │
│  • AI Model Selection                                        │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                  HOME.JSX                                    │
│  1. Validate Input                                           │
│  2. Extract Text from Files                                  │
│  3. (Optional) Document Ingestion                           │
│  4. Create Research Record                                   │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│            RESEARCHPROGRESS.JSX                             │
│  1. Generate Clarifying Questions                           │
│  2. Collect User Answers                                     │
│  3. Execute Deep Research                                    │
│  4. Handle Rate Limits                                       │
│  5. Show Progress                                            │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ├─► clarify-Questions-gemini
                     │   └─► Gemini API
                     │
                     └─► deep-Research-gemini
                         ├─► SERP API (optional)
                         └─► Gemini API
                             │
                             ▼
┌─────────────────────────────────────────────────────────────┐
│              SUPABASE DATABASE                              │
│  • research table (status updated)                          │
│  • research_reports table (full report)                     │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                 REPORTVIEW.JSX                              │
│  1. Display Report                                           │
│  2. Generate Universal Framework (optional)                  │
│  3. Generate PPT (optional)                                  │
│  4. Customize PPT (optional)                                 │
│  5. Download PPTX                                            │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ├─► deep-Research-gemini (mode: 'universal')
                     │   └─► Gemini API
                     │
                     └─► generate-ppt-agent
                         └─► Gemini API
                             │
                             ▼
                     ┌───────────────────────┐
                     │   PPTXGENJS           │
                     │   Generate .pptx      │
                     │   Download File       │
                     └───────────────────────┘
```

### Document Ingestion Flow:

```
┌─────────────────────────────────────────────────────────────┐
│              FILE UPLOAD (Home.jsx)                          │
│  • PDF, Word, Text, Images                                   │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│          TEXT EXTRACTION (Client-side)                      │
│  • pdf-parse (PDFs)                                          │
│  • mammoth (Word docs)                                       │
│  • FileReader (Text files)                                   │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│      DOCUMENT-INGESTION-AGENT (Optional)                    │
│  Input: Extracted text                                       │
│  └─► Gemini API                                             │
│      └─► Structured Content:                                 │
│          • Summary                                           │
│          • Key Points                                        │
│          • Data Points                                       │
│          • Tables                                            │
│          • Insights                                          │
│          • Quotes                                            │
│          • Timeline                                          │
│          • Metadata                                          │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│         STORED IN STATE (ingestedContent)                   │
│  • Passed to deep-Research-gemini                           │
│  • Passed to generate-ppt-agent                             │
│  • Enhances research quality                                 │
└─────────────────────────────────────────────────────────────┘
```

### Rate Limit & Caching Flow:

```
┌─────────────────────────────────────────────────────────────┐
│              API REQUEST INITIATED                           │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│         RATE LIMIT HANDLER (rateLimitHandler.js)            │
│  1. Check Cache:                                             │
│     ├─ Key: request-specific hash                           │
│     ├─ TTL: 1 hour                                           │
│     └─ If cached → Return immediately ✅                      │
└────────────────────┬────────────────────────────────────────┘
                     │
                     │ (Not cached)
                     ▼
┌─────────────────────────────────────────────────────────────┐
│         PROACTIVE THROTTLING                                 │
│  • Check last request time                                   │
│  • If < 2s since last request → Wait                         │
│  • Update last request time                                  │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│              API CALL                                        │
│  • Make request to external API                             │
│  • Track request timestamp                                   │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ├─► Success
                     │   ├─ Cache response
                     │   └─ Return data
                     │
                     └─► Rate Limit (429)
                         ├─ Exponential Backoff:
                         │   ├─ Retry 1: 60s
                         │   ├─ Retry 2: 120s
                         │   ├─ Retry 3: 180s
                         │   ├─ Retry 4: 240s
                         │   └─ Retry 5: 300s
                         ├─ Show countdown UI
                         └─ Retry after delay
```

---

## 🔧 API & Function Pipeline

### Function Call Sequence:

```
1. POST /functions/v1/clarify-Questions-gemini
   ├─ Input: { topic, documentContext?, ingestedContent?, model }
   ├─ Process:
   │   ├─ Build prompt with context
   │   ├─ Call Gemini API (gemini-2.5-flash)
   │   ├─ Parse response (JSON/markdown/numbered list)
   │   └─ Extract exactly 5 questions
   └─ Output: { questions: string[] }

2. POST /functions/v1/document-ingestion-agent (Optional)
   ├─ Input: { text: string }
   ├─ Process:
   │   ├─ Build extraction prompt
   │   ├─ Call Gemini API
   │   ├─ Parse structured JSON
   │   └─ Validate extracted data
   └─ Output: { summary, keyPoints, dataPoints, tables, ... }

3. POST /functions/v1/deep-Research-gemini
   ├─ Input: { 
   │     topic, 
   │     clarifyingAnswers, 
   │     documentContext?, 
   │     ingestedContent?,
   │     model,
   │     depth?,
   │     enableWebSearch?
   │   }
   ├─ Process:
   │   ├─ Web search (if enabled) → SERP API
   │   ├─ Build comprehensive prompt
   │   ├─ Call Gemini API (with retries & fallbacks)
   │   ├─ Parse response sections
   │   ├─ Extract sources
   │   ├─ Iterative refinement (if depth = deep/expert)
   │   └─ Save to database
   └─ Output: { report: Report object }

4. POST /functions/v1/deep-Research-gemini (mode: 'universal')
   ├─ Input: { report, mode: 'universal' }
   ├─ Process:
   │   ├─ Build universal framework prompt
   │   ├─ Call Gemini API
   │   └─ Parse 10 sections
   └─ Output: { universalFramework: object }

5. POST /functions/v1/generate-ppt-agent
   ├─ Input: { 
   │     report, 
   │     ingestedContent?,
   │     presentationStyle,
   │     topic
   │   }
   ├─ Process:
   │   ├─ Build industry-standard prompt
   │   ├─ Include ingested content insights
   │   ├─ Request 8-12 slides with images
   │   ├─ Call Gemini API
   │   └─ Parse slide structure
   └─ Output: { slides: AgentSlide[] }
```

---

## 📊 State Management

### Frontend State Flow:

```javascript
// Home.jsx
{
  topic: string
  uploadedFiles: File[]
  selectedModel: string (default: 'gemini-2.5-flash')
  documentContext: string
  ingestedContent: object | null
  isIngesting: boolean
}

// ResearchProgress.jsx
{
  research: object
  currentStep: number
  currentMessage: string
  clarifyingAnswers: string[]
  rateLimitCountdown: {
    seconds: number
    attempt: number
    isActive: boolean
  }
  report: object | null
}

// ReportView.jsx
{
  report: object
  universalFramework: object | null
  universalSections: ParsedSections | null
  slides: AgentSlide[]
  pptSettings: {
    theme: string
    primaryColor: string
    secondaryColor: string
    accentColor: string
    backgroundColor: string
    titleFont: string
    bodyFont: string
    fontSize: string
    layout: string
    backgroundType: string
    bulletStyle: string
    headerHeight: number
    textAlignment: string
    lineSpacing: string
    contentPadding: string
    borderStyle: string
    borderWidth: number
    shadowEffect: boolean
    roundedCorners: boolean
    showFooter: boolean
    footerText: string
    showSlideNumbers: boolean
    titleSlideStyle: string
    iconStyle: string
    gradientDirection: string
  }
  showPptModal: boolean
  showPptSettings: boolean
  previewSlideIndex: number
  previewImage: string | null
}
```

### Database State:

```sql
-- research table
CREATE TABLE research (
  id UUID PRIMARY KEY,
  topic TEXT NOT NULL,
  status TEXT CHECK (status IN ('Pending', 'In Progress', 'Done')),
  model TEXT,
  document_context TEXT,
  clarifying_answers JSONB,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);

-- research_reports table
CREATE TABLE research_reports (
  id UUID PRIMARY KEY,
  research_id UUID REFERENCES research(id),
  report JSONB NOT NULL,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

---

## 🛡️ Error Handling & Resilience

### Error Handling Strategy:

```
1. Input Validation:
   ├─ Topic: Non-empty, sanitized
   ├─ Files: Type and size validation
   └─ Model: Valid model name

2. Network Errors:
   ├─ Retry with exponential backoff
   ├─ Show user-friendly message
   └─ Log error details

3. API Errors:
   ├─ Rate Limits (429):
   │   ├─ Exponential backoff (60s-300s)
   │   ├─ Visual countdown
   │   └─ Automatic retry
   ├─ Model Errors (400/404):
   │   ├─ Fallback to alternative model
   │   └─ Retry with different prompt
   └─ Server Errors (500):
       ├─ Retry with backoff
       └─ Show error message

4. Parse Errors:
   ├─ Multiple parsing strategies
   ├─ Fallback to generic content
   └─ Log for debugging

5. Cache Errors:
   ├─ Graceful degradation
   ├─ Continue without cache
   └─ Log warning
```

### Rate Limit Handling:

```javascript
// Proactive Throttling
- Minimum 2s delay between requests
- Prevents hitting rate limits
- Smooth user experience

// Reactive Handling
- Exponential backoff: 60s, 120s, 180s, 240s, 300s
- Visual feedback: Countdown timer, progress bar
- Automatic retry: Up to 5 attempts
- Smart delay: +30s if rate limit hit within last 2 minutes

// Caching
- 1 hour TTL for responses
- localStorage-based
- Automatic cleanup of expired entries
```

---

## ⚡ Performance Optimizations

### 1. Caching Strategy:

```
✅ Response Caching:
   - localStorage-based
   - 1 hour TTL
   - Automatic cleanup

✅ Cache Keys:
   - Universal Framework: `universal_framework_{id}_{hash}`
   - PPT Slides: `ppt_slides_{id}_{style}_{hash}`

✅ Cache-First Strategy:
   - Check cache before API call
   - Return immediately if cached
   - Update cache after API call
```

### 2. Throttling:

```
✅ Proactive Throttling:
   - 2s minimum delay between requests
   - Prevents rate limits
   - Smooth user experience

✅ Request Tracking:
   - Track timestamps in localStorage
   - Calculate requests per minute
   - Prevent exceeding limits
```

### 3. Retry Logic:

```
✅ Exponential Backoff:
   - 60s, 120s, 180s, 240s, 300s
   - Up to 5 attempts
   - Automatic recovery

✅ Model Fallback:
   - gemini-2.5-flash → gemini-2.5-pro → gemini-pro-latest
   - Automatic switching
   - Seamless user experience
```

### 4. Code Splitting:

```
✅ Lazy Loading:
   - Route-based code splitting
   - Reduced initial bundle size
   - Faster page loads
```

---

## 📝 Summary

### Complete Pipeline:

```
User Input 
  → Validation 
  → File Processing 
  → Document Ingestion (Optional)
  → Clarifying Questions 
  → Research Execution 
  → Report Generation 
  → Storage 
  → Display 
  → Optional Enhancements (Framework/PPT)
  → Customization 
  → Download
```

### Key Components:

- **Frontend**: React, Vite, React Router, PPTXGenJS
- **Backend**: Supabase Edge Functions (Deno)
- **APIs**: Gemini, Claude, SERP
- **Database**: Supabase PostgreSQL
- **Storage**: localStorage (caching)
- **File Processing**: Client-side (pdf-parse, mammoth)

### Performance Features:

✅ Proactive throttling (2s delay)  
✅ Response caching (1 hour TTL)  
✅ Rate limit handling (exponential backoff)  
✅ Model fallback chain  
✅ Retry logic (5 attempts)  
✅ Progress tracking  
✅ Real-time updates  
✅ Live preview  

### Key Features:

✅ 5 Adaptive Clarifying Questions  
✅ Document Ingestion & Structured Extraction  
✅ Comprehensive Research Generation  
✅ Universal Research Framework (10 sections)  
✅ Industry-Standard PPT Generation  
✅ PPT Customization (20+ options)  
✅ Live Preview with Real Content  
✅ Image Integration with Proper Fitting  
✅ Rate Limit Management  
✅ Caching System  

This pipeline ensures reliable, fast, and user-friendly research generation with proper error handling and optimization at every step.

