# Storyboard Generation Feature

## Overview

The Storyboard feature converts deep research results into a clear, persuasive narrative storyboard that communicates one undeniable insight. Unlike traditional reports that summarize data, storyboards argue a point through visual narrative.

## How It Works

The storyboard generation follows a **7-step process**:

### Step 1: Identify the Controlling Insight
- Reviews all research findings
- Identifies the single most important thing the research makes undeniable
- Expressed in ONE clear sentence (no numbers or metrics)

### Step 2: Group Findings into 3-4 Insight Buckets
- Clusters research findings into meaningful groups
- Each group supports the controlling insight
- Represents distinct ideas (no overlap)
- Focuses on what the research reveals, not where it came from

### Step 3: Convert Each Insight into a Story Claim
- Translates insight buckets into narrative language
- Expresses a point of view
- Something the storyboard will prove visually

### Step 4: Choose a Story Spine
Three narrative structures available:
- **Problem → Insight → Resolution**
- **Before → During → After**
- **Question → Discovery → Answer**

### Step 5: Build Scene Groups
For each story claim, creates scene groups:
- **Context** – establish the normal situation
- **Tension** – reveal the problem or risk
- **Intervention** – introduce the insight or change
- **Proof** – show validation or evidence
- **Outcome** – show the result or impact

### Step 6: Design Individual Storyboard Frames
Each frame includes:
- **One idea** only
- **One visual action**
- **One emotional beat**
- **One logical purpose**
- **Supporting evidence** (expandable)

### Step 7: Handle Remaining Research
- Unused findings stored as supporting evidence
- Available through expandable elements
- Attached to relevant frames

## Files Created

### 1. Edge Function: `7-generate-storyboard.ts`
**Location:** Root directory (to be deployed to Supabase)

**Purpose:** Converts research reports into storyboard structure using Gemini AI

**Input:**
```typescript
{
  report: {
    topic: string
    executiveSummary?: string
    detailedAnalysis?: string
    keyFindings?: Array<{text: string, citations: number[]}>
    insights?: string
    conclusion?: string
    sources?: Array<{url: string, domain: string, date: string}>
  },
  storySpine?: 'problem-insight-resolution' | 'before-during-after' | 'question-discovery-answer',
  audience?: string
}
```

**Output:**
```typescript
{
  status: 'success',
  storyboard: {
    controllingInsight: string
    storySpine: string
    insightBuckets: Array<{
      id: string
      name: string
      description: string
      findings: string[]
    }>
    storyClaims: Array<{
      id: string
      claim: string
      insightBucketId: string
      narrativeLanguage: string
    }>
    sceneGroups: Array<{
      id: string
      storyClaimId: string
      type: 'context' | 'tension' | 'intervention' | 'proof' | 'outcome'
      description: string
      situation: string
    }>
    frames: Array<{
      id: string
      sceneGroupId: string
      frameNumber: number
      idea: string
      visualAction: string
      emotionalBeat: string
      logicalPurpose: string
      supportingEvidence?: string[]
    }>
    remainingResearch: {
      unusedFindings: string[]
      supportingEvidence: Array<{
        frameId: string
        evidence: string
        source?: string
      }>
    }
  }
}
```

### 2. React Component: `src/components/StoryboardView.jsx`

**Purpose:** Displays the generated storyboard in an interactive, expandable interface

**Features:**
- Hierarchical display: Buckets → Claims → Scenes → Frames
- Expandable/collapsible sections
- Frame detail modal
- Supporting evidence tooltips
- Color-coded scene types
- Story spine indicator

### 3. Integration: `src/pages/ReportView.jsx`

**Changes:**
- Added storyboard state management
- Added "Generate Storyboard" button (purple gradient, next to PPT button)
- Added `handleGenerateStoryboard()` function
- Integrated StoryboardView component
- Added error handling and display

## Deployment Instructions

### Step 1: Deploy Edge Function to Supabase

1. **Copy the function code:**
   - Open `7-generate-storyboard.ts`
   - Copy all contents

2. **Create function in Supabase:**
   - Go to Supabase Dashboard → Edge Functions
   - Click "Create a new function"
   - Name: `generate-storyboard`
   - Paste the code
   - Deploy

3. **Set environment variable:**
   - Go to Edge Functions → Secrets
   - Ensure `GEMINI_API_KEY` is set (required)

### Step 2: Verify Frontend Integration

The frontend is already integrated. Just ensure:
- `StoryboardView.jsx` is in `src/components/`
- `ReportView.jsx` imports and uses the component
- No build errors

### Step 3: Test

1. Generate a research report
2. Go to Report View
3. Click "Generate Storyboard" button
4. Wait for generation (30-60 seconds)
5. View the interactive storyboard

## Usage

### From Report View:

1. **Click "Generate Storyboard"** button (purple, with film icon)
2. **Wait for generation** (shows loading spinner)
3. **View storyboard** in modal overlay
4. **Explore:**
   - Click insight buckets to expand
   - Click story claims to see scenes
   - Click scenes to see frames
   - Click frames to see details
   - Click "Evidence" to see supporting research

### Story Spine Options:

Currently defaults to `problem-insight-resolution`. To change:
- Modify `storySpine` state in `ReportView.jsx`
- Or add UI selector for user choice

## UI Features

### Color Coding:
- **Context** (blue) - Normal situation
- **Tension** (red) - Problem or risk
- **Intervention** (yellow) - Insight or change
- **Proof** (green) - Validation or evidence
- **Outcome** (purple) - Result or impact

### Interactive Elements:
- Expandable accordions for each level
- Frame detail modal with full information
- Evidence tooltips
- Visual action, emotional beat, and logical purpose indicators

## Technical Details

### API Endpoint:
```
POST /functions/v1/generate-storyboard
```

### Authentication:
- Uses Supabase anon key
- No user authentication required (uses public endpoint)

### Model:
- Uses Gemini 1.5 Pro (`gemini-1.5-pro-latest`)
- Temperature: 0.7 (balanced creativity/consistency)
- Max tokens: 8192
- Response format: JSON

### Error Handling:
- Network errors: Shows user-friendly message
- API errors: Shows specific error with deployment instructions
- Parse errors: Logs to console, shows generic error

## Future Enhancements

Potential improvements:
1. **Story spine selector** - Let users choose narrative structure
2. **Audience selector** - Customize for different audiences
3. **Export options** - Export storyboard as PDF, images, or video script
4. **Frame visualization** - Generate actual visual mockups
5. **Collaboration** - Share and comment on storyboards
6. **Templates** - Pre-built storyboard templates for common use cases

## Troubleshooting

### "Storyboard function not deployed"
- Deploy the function in Supabase Dashboard
- Ensure function name is exactly `generate-storyboard`

### "GEMINI_API_KEY not configured"
- Add API key in Supabase Dashboard → Edge Functions → Secrets
- Key name must be exactly `GEMINI_API_KEY`

### Storyboard is empty or incomplete
- Check Gemini API quota/limits
- Verify research report has sufficient content
- Try with a different research report

### Frames don't make sense
- The AI may need more context
- Try regenerating with a different story spine
- Ensure research report is comprehensive

## Related Features

- **PPT Generation** - Similar AI-powered conversion, but for presentations
- **Research Reports** - Source data for storyboards
- **Graph Visualization** - Alternative way to visualize research relationships
