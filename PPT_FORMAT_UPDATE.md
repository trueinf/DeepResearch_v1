# PPT Format & Styling Update

## ✅ Changes Implemented

### 1. **New Color Palette (Minimalist & Modern)**
- **Primary**: `#1F4E79` (Deep Blue) - Headers, titles, accents
- **Secondary**: `#D9E2EF` (Light Gray-Blue) - Backgrounds, subtle elements
- **Accent**: `#F2C94C` (Warm Yellow) - Highlights, callouts
- **Background**: `#FFFFFF` (White) - Clean white background

### 2. **Font Style**
- **Title Font**: Bold, Sans-serif (Calibri / Segoe UI)
- **Body Font**: Regular, Sans-serif (Calibri / Segoe UI)

### 3. **Slide Structure**
- Numbered slides (Slide 1, Slide 2, etc.)
- Short titles (3-6 words)
- Concise bullets (8-12 words each)
- Maximum 6 bullets per slide
- Speaker notes (1-3 sentences, optional)

### 4. **Design Principles**
- Minimalist & modern
- One idea per slide
- Clean icons/simple illustrations only
- Consistent spacing and alignment
- 16:9 widescreen format

## 📁 Files Updated

### 1. `supabase/functions/generate-ppt-agent/index.ts`
- Updated agent prompt to follow new format
- Added structural rules for numbered slides
- Updated color scheme recommendations
- Updated font style recommendations

### 2. `src/pages/ReportView.jsx`
- Updated color palette (lines 527-535)
- Changed fonts to Calibri (Segoe UI / Calibri)
- Updated header bar to deep blue
- Updated accent colors to warm yellow
- Changed title slide to white background with blue text
- Updated icon shapes to minimalist circles

## 🎨 Visual Changes

### Title Slide
- **Before**: Navy blue background with white text
- **After**: White background with deep blue text, accent bars (blue top, yellow bottom)

### Content Slides
- **Before**: Navy blue header, blue accents
- **After**: Deep blue header (#1F4E79), warm yellow accents (#F2C94C)

### Icons
- **Before**: Triangle shapes
- **After**: Simple circles in warm yellow

## 🔄 Style Adaptation by Presentation Type

The agent adapts content based on `presentationStyle`:

### Executive
- Business-focused, strategic
- Actionable recommendations
- Minimal text, maximum impact

### Technical
- Data-driven, detailed
- Comprehensive analysis
- Evidence-based

### Visual
- Design-forward
- Minimal text
- High visual impact

### Academic
- Research-focused
- Citations included
- Scholarly approach

## 📝 Output Format

Each slide follows this structure:
```json
{
  "title": "Short compelling title (3-6 words)",
  "bullets": ["Point 1 (8-12 words)", "Point 2 (8-12 words)"],
  "design": {
    "layout": "content",
    "visualType": "none",
    "colorScheme": "minimalist"
  },
  "speakerNotes": "1-3 sentences of talking points",
  "priority": "high"
}
```

## 🚀 Next Steps

1. **Redeploy the Agent Function**:
   - Go to Supabase Dashboard → Edge Functions
   - Update `generate-ppt-agent` with new code
   - Deploy

2. **Test the New Format**:
   - Generate a PPT from any research report
   - Verify colors match new palette
   - Check fonts are Calibri/Segoe UI
   - Confirm slide numbering

3. **Customize Further** (if needed):
   - Edit colors in `src/pages/ReportView.jsx` (lines 527-535)
   - Change fonts throughout the file
   - Adjust layout dimensions

## 📋 Quality Checklist

- ✅ Slides are numbered
- ✅ Titles are 3-6 words
- ✅ Bullets are 8-12 words each
- ✅ Maximum 6 bullets per slide
- ✅ One idea per slide
- ✅ Clean, minimalist design
- ✅ Consistent formatting
- ✅ Speaker notes included

## 🎯 Result

Your PPTs now follow a **minimalist, modern design** with:
- Clean white backgrounds
- Deep blue primary color
- Warm yellow accents
- Professional sans-serif fonts
- Numbered, structured slides
- Concise, impactful content

