# AskDepth Gemini - Complete Workflow & Pipeline Documentation

## 📋 Table of Contents
1. [Project Architecture](#project-architecture)
2. [Technology Stack](#technology-stack)
3. [Authentication Flow](#authentication-flow)
4. [Research Workflow Pipeline](#research-workflow-pipeline)
5. [PPT Generation Pipeline](#ppt-generation-pipeline)
6. [Database Schema](#database-schema)
7. [Edge Functions](#edge-functions)
8. [Frontend Components](#frontend-components)
9. [Data Flow Diagrams](#data-flow-diagrams)
10. [API Endpoints](#api-endpoints)

---

## 🏗️ Project Architecture

### High-Level Architecture
```
┌─────────────────────────────────────────────────────────────┐
│                      Frontend (React)                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Home.jsx   │  │  Login.jsx   │  │ ReportView   │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │AuthContext   │  │ResearchContext│  │ProtectedRoute│      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ HTTPS/REST API
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                  Supabase Backend Services                   │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              Supabase Edge Functions                  │  │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────┐  │  │
│  │  │deep-Research │  │clarify-Quest │  │generate- │  │  │
│  │  │  -gemini     │  │  -gemini     │  │ppt-agent  │  │  │
│  │  └──────────────┘  └──────────────┘  └──────────┘  │  │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────┐  │  │
│  │  │chat-Research │  │extract-file- │  │create-   │  │  │
│  │  │              │  │  text        │  │user      │  │  │
│  │  └──────────────┘  └──────────────┘  └──────────┘  │  │
│  └──────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              Supabase Database (PostgreSQL)            │  │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐            │  │
│  │  │researches│  │research_ │  │profiles  │            │  │
│  │  │          │  │reports   │  │          │            │  │
│  │  └──────────┘  └──────────┘  └──────────┘            │  │
│  │  ┌──────────┐  ┌──────────┐                          │  │
│  │  │chat_     │  │auth.users│                          │  │
│  │  │messages  │  │          │                          │  │
│  │  └──────────┘  └──────────┘                          │  │
│  └──────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              Supabase Auth Service                      │  │
│  │  - JWT Token Management                                 │  │
│  │  - Session Management                                   │  │
│  │  - User Authentication                                  │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ API Calls
                            ▼
┌─────────────────────────────────────────────────────────────┐
│              External Services                               │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              Google Gemini API                         │  │
│  │  - gemini-3.0-pro-preview                               │  │
│  │  - gemini-2.5-pro                                       │  │
│  │  - gemini-2.5-flash                                     │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

---

## 🛠️ Technology Stack

### Frontend
- **Framework**: React 18.2.0
- **Routing**: React Router DOM 6.20.0
- **Styling**: Tailwind CSS 3.3.6
- **Icons**: Lucide React 0.294.0
- **Build Tool**: Vite 5.0.8
- **PPT Generation**: PPTXGenJS 4.0.1

### Backend
- **Platform**: Supabase
- **Database**: PostgreSQL (via Supabase)
- **Authentication**: Supabase Auth
- **Edge Functions**: Deno Runtime
- **API**: RESTful APIs

### External Services
- **AI Models**: Google Gemini API
  - Primary: `gemini-3.0-pro-preview`
  - Fallback: `gemini-2.5-pro`, `gemini-2.5-flash`, etc.

---

## 🔐 Authentication Flow

### User Registration Flow
```
1. User visits /signup
   ↓
2. Fills email + password + confirm password
   ↓
3. Frontend validates (email format, password length ≥ 6)
   ↓
4. AuthContext.signUp() called
   ↓
5. Supabase Auth API: auth.signUp()
   ↓
6. Supabase creates user in auth.users
   ↓
7. Trigger: auto-creates profile in public.profiles
   ↓
8. Response: User created (email confirmation optional)
   ↓
9. Redirect to /login or /dashboard
```

### User Login Flow
```
1. User visits /login
   ↓
2. Enters email + password
   ↓
3. Frontend validates input
   ↓
4. AuthContext.signIn() called
   ↓
5. Supabase Auth API: auth.signInWithPassword()
   ↓
6. Supabase validates credentials
   ↓
7. If valid:
   - Creates JWT access token
   - Creates refresh token
   - Stores session in localStorage
   ↓
8. AuthContext updates user state
   ↓
9. ProtectedRoute checks authentication
   ↓
10. Redirect to /dashboard or / (Home)
```

### Session Management
- **Session Storage**: localStorage (via Supabase client)
- **Auto-refresh**: Every 60 minutes
- **Failed Attempts**: Tracked in localStorage (resets after 15 min)
- **CAPTCHA**: Triggered after 3 failed login attempts

### Protected Routes
- All routes except `/login`, `/signup`, `/create-user` are protected
- `ProtectedRoute` component checks authentication
- Redirects to `/login` if not authenticated

---

## 🔬 Research Workflow Pipeline

### Complete Research Flow
```
┌─────────────────────────────────────────────────────────────┐
│ STEP 1: User Input (Home.jsx)                               │
│  - User enters research topic                                │
│  - Optional: Upload documents (PDF, DOCX, TXT, MD)          │
│  - Select depth: Light / Standard / Deep                      │
│  - Select AI model: Gemini 3 Pro / Claude Sonnet 4           │
│  - Click "Initialize Research Agent"                          │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│ STEP 2: Clarifying Questions (Optional)                      │
│  Edge Function: clarify-Questions-gemini                     │
│  - Analyzes user query                                        │
│  - Generates clarifying questions (if needed)                │
│  - User answers questions or skips                            │
│  - Refined brief created with answers                         │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│ STEP 3: Document Processing (If files uploaded)             │
│  Edge Function: extract-file-text                            │
│  - Extracts text from PDF/DOCX files                         │
│  - Cleans text (removes null chars, invalid Unicode)         │
│  - Limits to 50KB per file, 100KB total                      │
│  - Combines with research query                               │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│ STEP 4: Create Research Record                               │
│  ResearchContext.createResearch()                             │
│  - Inserts into researches table                             │
│  - Status: "In Progress"                                      │
│  - Stores: topic, model, depth, documentContext              │
│  - Returns research_id                                        │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│ STEP 5: Navigate to Progress Page                            │
│  Route: /progress/:id                                         │
│  - Shows real-time progress                                   │
│  - Displays current step and message                          │
│  - Auto-starts research on mount                              │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│ STEP 6: Deep Research Execution                              │
│  Edge Function: deep-Research-gemini                          │
│  Input:                                                       │
│    - originalQuery: Research topic                            │
│    - clarifyingAnswers: User's answers                        │
│    - researchId: Database ID                                  │
│    - model: AI model name                                     │
│    - documentContext: Extracted file text                   │
│                                                               │
│  Process:                                                     │
│    1. Build comprehensive research prompt                      │
│    2. Call Gemini API with research instructions             │
│    3. Parse structured JSON response                         │
│    4. Extract:                                                │
│       - Executive Summary                                     │
│       - Key Findings (with citations)                         │
│       - Detailed Analysis                                     │
│       - Insights                                              │
│       - Conclusion                                            │
│       - Sources                                               │
│    5. Save to research_reports table                          │
│    6. Update research status to "Done"                       │
│                                                               │
│  Output:                                                     │
│    - Complete research report (JSON)                          │
│    - Status: "Done"                                           │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│ STEP 7: Display Report                                       │
│  Route: /report/:id                                           │
│  - Fetches report from database                               │
│  - Displays formatted report                                  │
│  - Shows key findings, analysis, insights                     │
│  - Option to generate PPT                                      │
│  - Option to chat with report                                 │
└─────────────────────────────────────────────────────────────┘
```

### Research States
- **"In Progress"**: Research is running
- **"Done"**: Research completed successfully
- **"Failed"**: Research encountered an error

### Progress Tracking
- **Steps**: 0-12 (configurable)
- **Current Step**: Updated in real-time
- **Progress Percentage**: Calculated from steps/total
- **Status Messages**: Displayed during execution

---

## 📊 PPT Generation Pipeline

### PPT Generation Flow
```
┌─────────────────────────────────────────────────────────────┐
│ STEP 1: User Clicks "Generate PPT"                           │
│  Location: ReportView.jsx                                    │
│  - User is on /report/:id                                     │
│  - Clicks "Generate Presentation" button                      │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│ STEP 2: Call PPT Agent                                       │
│  Edge Function: generate-ppt-agent                             │
│  Input:                                                       │
│    - report: Complete research report object                  │
│      • topic                                                  │
│      • executiveSummary                                       │
│      • keyFindings                                            │
│      • detailedAnalysis                                       │
│      • insights                                               │
│      • conclusion                                             │
│                                                               │
│  Process:                                                     │
│    1. Build expert-level prompt for PPT generation            │
│    2. Include design principles:                             │
│       - Storytelling arc                                      │
│       - Slide economy (1 idea per slide)                      │
│       - Visual hierarchy                                      │
│       - Content quality standards                             │
│    3. Request structured JSON output:                        │
│       {                                                      │
│         "slides": [                                          │
│           {                                                  │
│             "title": "Slide title",                          │
│             "bullets": ["point 1", "point 2"],               │
│             "speakerNotes": "Optional notes",                 │
│             "layout": "Title + Content"                       │
│           }                                                  │
│         ],                                                    │
│         "designRecommendations": {...}                        │
│       }                                                      │
│    4. Call Gemini API (with model fallback)                   │
│    5. Parse JSON response                                     │
│    6. Validate slide structure                               │
│                                                               │
│  Output:                                                     │
│    - Structured slide data (JSON)                            │
│    - Design recommendations                                   │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│ STEP 3: Generate PPT File                                     │
│  Location: ReportView.jsx                                    │
│  Library: PPTXGenJS                                           │
│                                                               │
│  Process:                                                     │
│    1. Create new PPTX presentation                            │
│    2. Set slide size: 16:9 widescreen                        │
│    3. Define color palette:                                   │
│       - Primary: #1F4E79 (Deep Blue)                         │
│       - Secondary: #D9E2EF (Light Gray-Blue)                │
│       - Accent: #F2C94C (Warm Yellow)                        │
│       - Background: #FFFFFF (White)                          │
│    4. Set fonts: Calibri (Title & Body)                      │
│    5. For each slide:                                        │
│       a. Create new slide                                    │
│       b. Add title (styled with primary color)               │
│       c. Add bullet points (styled)                          │
│       d. Add shapes/backgrounds (if needed)                  │
│       e. Add speaker notes (if provided)                    │
│    6. Apply consistent styling across slides                  │
│    7. Generate PPTX file                                     │
│    8. Trigger download                                       │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│ STEP 4: Download PPT                                          │
│  - File name: "Research_Report_[topic]_[timestamp].pptx"    │
│  - User downloads file                                        │
│  - PPT ready for presentation                                 │
└─────────────────────────────────────────────────────────────┘
```

### PPT Design Specifications
- **Aspect Ratio**: 16:9 widescreen
- **Color Scheme**: Deep Blue (#1F4E79), Light Gray-Blue (#D9E2EF), Warm Yellow (#F2C94C)
- **Fonts**: Calibri (Bold for titles, Regular for body)
- **Style**: Minimalist & modern
- **Slide Structure**: Title + Content layout
- **Visuals**: Simple icons/diagrams only

---

## 🗄️ Database Schema

### Tables

#### 1. `auth.users` (Supabase Auth)
- Managed by Supabase Auth
- Fields: `id`, `email`, `created_at`, etc.

#### 2. `public.profiles`
```sql
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  email TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```
- **RLS Policies**: Users can view/update own profile
- **Trigger**: Auto-creates profile on user signup

#### 3. `public.researches`
```sql
CREATE TABLE public.researches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  topic TEXT NOT NULL,
  status TEXT DEFAULT 'In Progress',
  model TEXT DEFAULT 'gemini-3.0-pro-preview',
  options JSONB,
  current_step INTEGER DEFAULT 0,
  total_steps INTEGER DEFAULT 12,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```
- **Fields**:
  - `topic`: Research topic/question
  - `status`: "In Progress", "Done", "Failed"
  - `model`: AI model used
  - `options`: JSONB with depth, documentContext, clarifyingAnswers
  - `current_step`: Progress tracking
  - `total_steps`: Total steps for progress calculation

#### 4. `public.research_reports`
```sql
CREATE TABLE public.research_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  research_id UUID REFERENCES researches(id),
  executive_summary TEXT,
  key_findings JSONB,
  sources JSONB,
  detailed_analysis TEXT,
  insights TEXT,
  conclusion TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```
- **Fields**:
  - `research_id`: Foreign key to researches
  - `executive_summary`: High-level summary
  - `key_findings`: Array of findings with citations
  - `sources`: Array of source URLs/names
  - `detailed_analysis`: Full analysis text
  - `insights`: Key insights
  - `conclusion`: Final conclusions
  - `metadata`: Additional metadata

#### 5. `public.chat_messages`
```sql
CREATE TABLE public.chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  research_id UUID REFERENCES researches(id),
  role TEXT NOT NULL, -- 'user' or 'assistant'
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```
- **Fields**:
  - `research_id`: Foreign key to researches
  - `role`: "user" or "assistant"
  - `content`: Message content

### Row Level Security (RLS)
- **researches**: Authenticated users can insert/read/update/delete own researches
- **research_reports**: Authenticated users can insert/read/update/delete own reports
- **profiles**: Users can view/update own profile
- **chat_messages**: Authenticated users can insert/read own messages

---

## ⚡ Edge Functions

### 1. `deep-Research-gemini`
**Purpose**: Conduct comprehensive research using Gemini AI

**Endpoint**: `POST /functions/v1/deep-Research-gemini`

**Input**:
```json
{
  "originalQuery": "Research topic",
  "clarifyingAnswers": "User's clarifying answers",
  "researchId": "uuid",
  "model": "gemini-3.0-pro-preview",
  "documentContext": "Extracted file text"
}
```

**Process**:
1. Build research prompt with context
2. Call Gemini API
3. Parse structured JSON response
4. Save to `research_reports` table
5. Update research status

**Output**:
```json
{
  "success": true,
  "report": {
    "executiveSummary": "...",
    "keyFindings": [...],
    "sources": [...],
    "detailedAnalysis": "...",
    "insights": "...",
    "conclusion": "..."
  }
}
```

### 2. `clarify-Questions-gemini`
**Purpose**: Generate clarifying questions for research topic

**Endpoint**: `POST /functions/v1/clarify-Questions-gemini`

**Input**:
```json
{
  "input": "Research topic"
}
```

**Output**:
```json
{
  "questions": ["Question 1", "Question 2"],
  "summary": "Refined research objective"
}
```

### 3. `generate-ppt-agent`
**Purpose**: Generate high-quality PPT structure using AI agent

**Endpoint**: `POST /functions/v1/generate-ppt-agent`

**Input**:
```json
{
  "report": {
    "topic": "...",
    "executiveSummary": "...",
    "keyFindings": [...],
    "detailedAnalysis": "...",
    "insights": "...",
    "conclusion": "..."
  }
}
```

**Process**:
1. Build expert-level PPT prompt
2. Call Gemini API (with model fallback)
3. Parse structured slide data
4. Return slide structure

**Output**:
```json
{
  "slides": [
    {
      "title": "Slide title",
      "bullets": ["point 1", "point 2"],
      "speakerNotes": "Optional notes",
      "layout": "Title + Content"
    }
  ],
  "designRecommendations": {...}
}
```

### 4. `chat-Research`
**Purpose**: Chat with research report using AI

**Endpoint**: `POST /functions/v1/chat-Research`

**Input**:
```json
{
  "question": "User question",
  "report": {...},
  "clarifyingAnswers": "..."
}
```

**Output**:
```json
{
  "answer": "AI response"
}
```

### 5. `extract-file-text`
**Purpose**: Extract text from uploaded files

**Endpoint**: `POST /functions/v1/extract-file-text`

**Input**: FormData with file

**Output**:
```json
{
  "text": "Extracted text content"
}
```

### 6. `create-user`
**Purpose**: Create user via Management API (workaround)

**Endpoint**: `POST /functions/v1/create-user`

**Input**:
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Output**:
```json
{
  "success": true,
  "user": {
    "id": "uuid",
    "email": "user@example.com"
  }
}
```

---

## 🎨 Frontend Components

### Core Components

#### 1. `App.jsx`
- Main application component
- Sets up routing
- Wraps app with AuthProvider and ResearchProvider

#### 2. `AuthContext.jsx`
- Manages authentication state
- Functions: `signIn`, `signOut`, `signUp`
- Tracks failed login attempts
- Auto-refreshes session

#### 3. `ResearchContext.jsx`
- Manages research data
- Functions: `createResearch`, `updateResearchStatus`, `setResearchReport`, `getResearchReport`
- Loads researches and reports from database

#### 4. `ProtectedRoute.jsx`
- Route guard component
- Checks authentication
- Redirects to login if not authenticated

### Pages

#### 1. `Home.jsx`
- Research Hub
- Create new research
- View ongoing/completed researches
- File upload
- Clarifying questions flow

#### 2. `Login.jsx`
- User login form
- Email/password validation
- CAPTCHA after 3 failed attempts
- Error handling

#### 3. `Signup.jsx`
- User registration form
- Email/password/confirm password
- Validation and error handling

#### 4. `ResearchProgress.jsx`
- Real-time research progress
- Shows current step and message
- Auto-starts research on mount
- Updates progress in real-time

#### 5. `ReportView.jsx`
- Displays completed research report
- Shows executive summary, findings, analysis
- Generate PPT button
- Chat with report button

#### 6. `FollowUpChat.jsx`
- Chat interface for research report
- Sends questions to `chat-Research` function
- Displays conversation history

#### 7. `Dashboard.jsx`
- User dashboard
- Shows user info
- Logout button

### UI Components

#### 1. `Sidebar.jsx`
- Navigation sidebar
- Workspace, Analytics, Collaboration sections
- Settings link

#### 2. `TopBar.jsx`
- Top navigation bar
- Search bar
- Model selector
- User profile dropdown (with logout)

#### 3. `ClarifyQuestions.jsx`
- Clarifying questions interface
- User answers questions
- Skip option

---

## 🔄 Data Flow Diagrams

### Research Creation Flow
```
User Input (Home.jsx)
    │
    ├─→ Clarifying Questions (clarify-Questions-gemini)
    │       │
    │       └─→ Gemini API
    │               │
    │               └─→ Questions + Summary
    │
    ├─→ File Upload (extract-file-text)
    │       │
    │       └─→ Extract Text
    │               │
    │               └─→ Document Context
    │
    └─→ Create Research (ResearchContext)
            │
            └─→ Supabase Database (researches table)
                    │
                    └─→ Navigate to /progress/:id
                            │
                            └─→ Start Research (deep-Research-gemini)
                                    │
                                    ├─→ Gemini API
                                    │       │
                                    │       └─→ Research Report
                                    │
                                    └─→ Save to Database (research_reports)
                                            │
                                            └─→ Update Status to "Done"
                                                    │
                                                    └─→ Navigate to /report/:id
```

### PPT Generation Flow
```
User Clicks "Generate PPT" (ReportView.jsx)
    │
    └─→ Call generate-ppt-agent
            │
            ├─→ Build Expert Prompt
            │       │
            │       └─→ Include Design Principles
            │
            ├─→ Call Gemini API (with fallback)
            │       │
            │       └─→ Structured Slide Data (JSON)
            │
            └─→ Generate PPT (PPTXGenJS)
                    │
                    ├─→ Create Presentation
                    │       │
                    │       ├─→ Set Colors (#1F4E79, #D9E2EF, #F2C94C)
                    │       ├─→ Set Fonts (Calibri)
                    │       └─→ Set Layout (16:9)
                    │
                    ├─→ For Each Slide:
                    │       │
                    │       ├─→ Add Title
                    │       ├─→ Add Bullets
                    │       ├─→ Add Shapes/Backgrounds
                    │       └─→ Add Speaker Notes
                    │
                    └─→ Download PPTX File
```

### Authentication Flow
```
User Login (Login.jsx)
    │
    └─→ AuthContext.signIn()
            │
            └─→ Supabase Auth API
                    │
                    ├─→ Validate Credentials
                    │       │
                    │       ├─→ Success: Create Session
                    │       │       │
                    │       │       ├─→ JWT Token
                    │       │       ├─→ Refresh Token
                    │       │       └─→ Store in localStorage
                    │       │
                    │       └─→ Failure: Increment Failed Attempts
                    │               │
                    │               └─→ Show CAPTCHA (if ≥ 3 attempts)
                    │
                    └─→ Update AuthContext State
                            │
                            └─→ ProtectedRoute Check
                                    │
                                    └─→ Redirect to /dashboard or /
```

---

## 🌐 API Endpoints

### Supabase Edge Functions

| Endpoint | Method | Purpose | Auth Required |
|----------|--------|---------|---------------|
| `/functions/v1/deep-Research-gemini` | POST | Conduct research | Yes (Bearer token) |
| `/functions/v1/clarify-Questions-gemini` | POST | Generate clarifying questions | Yes |
| `/functions/v1/generate-ppt-agent` | POST | Generate PPT structure | Yes |
| `/functions/v1/chat-Research` | POST | Chat with report | Yes |
| `/functions/v1/extract-file-text` | POST | Extract text from files | Yes |
| `/functions/v1/create-user` | POST | Create user (workaround) | No |

### Supabase Database Tables

| Table | Operations | RLS |
|-------|-----------|-----|
| `researches` | INSERT, SELECT, UPDATE, DELETE | Yes (own records) |
| `research_reports` | INSERT, SELECT, UPDATE, DELETE | Yes (own records) |
| `profiles` | SELECT, UPDATE, INSERT | Yes (own profile) |
| `chat_messages` | INSERT, SELECT | Yes (own messages) |
| `auth.users` | Managed by Supabase Auth | Yes |

---

## 📝 Key Features

### 1. Authentication
- ✅ Email/password authentication
- ✅ JWT token management
- ✅ Session persistence
- ✅ Auto-refresh tokens
- ✅ Failed attempt tracking
- ✅ CAPTCHA after 3 failures
- ✅ Protected routes

### 2. Research
- ✅ AI-powered research generation
- ✅ Clarifying questions
- ✅ Document upload and processing
- ✅ Real-time progress tracking
- ✅ Multiple AI model support
- ✅ Structured report output

### 3. PPT Generation
- ✅ AI agent for high-quality PPTs
- ✅ Custom styling (colors, fonts)
- ✅ Structured slide generation
- ✅ Speaker notes support
- ✅ Professional design

### 4. Chat
- ✅ Chat with research reports
- ✅ Context-aware responses
- ✅ Conversation history

### 5. File Processing
- ✅ PDF, DOCX, TXT, MD support
- ✅ Text extraction
- ✅ File size limits (50MB)
- ✅ Text cleaning for database

---

## 🔧 Environment Variables

### Frontend (.env)
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### Supabase Edge Functions (Secrets)
```
GEMINI_API_KEY=your-gemini-api-key
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

---

## 🚀 Deployment

### Frontend
- Build: `npm run build`
- Deploy: Vercel, Netlify, or any static host

### Supabase Edge Functions
- Deploy: `supabase functions deploy <function-name>`
- Set secrets: `supabase secrets set <key>=<value>`

### Database
- Run SQL migrations in Supabase SQL Editor
- Enable RLS policies
- Set up triggers

---

## 📊 Performance Considerations

1. **File Upload**: Limited to 50MB per file, 100KB total text
2. **Text Cleaning**: Removes null chars and invalid Unicode
3. **Progress Tracking**: Real-time updates via database
4. **Session Refresh**: Every 60 minutes
5. **Model Fallback**: Multiple Gemini models for reliability
6. **Error Handling**: Comprehensive error messages

---

## 🔒 Security

1. **Authentication**: JWT tokens, secure session storage
2. **RLS**: Row-level security on all tables
3. **CORS**: Configured in Edge Functions
4. **Input Validation**: Client and server-side
5. **CAPTCHA**: After multiple failed attempts
6. **API Keys**: Stored as Supabase secrets

---

## 📈 Future Enhancements

1. **Real-time Collaboration**: Multiple users on same research
2. **Export Options**: PDF, Word, Markdown
3. **Advanced Analytics**: Research insights dashboard
4. **Template Library**: Pre-built research templates
5. **API Integration**: Connect external data sources
6. **Custom Models**: User-defined AI models
7. **Version Control**: Research report versions
8. **Sharing**: Share reports with team members

---

**Document Version**: 1.0  
**Last Updated**: 2025-01-27  
**Maintained By**: AskDepth Development Team

