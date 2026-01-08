# Storyboard → PPT Pipeline

## New Pipeline Flow

The PPT generation now uses storyboard data as the primary source, creating a more narrative-driven presentation.

### Flow:
```
Research Report → Storyboard Generation → PPT Generation
```

## How It Works

### Step 1: Generate Storyboard (Automatic)
When user clicks "Generate PPT":
1. System checks if storyboard already exists
2. If not, automatically generates storyboard first
3. Storyboard is stored for future use

### Step 2: Generate PPT from Storyboard
1. PPT agent receives storyboard data
2. Converts storyboard frames into slides
3. Maintains narrative flow from storyboard
4. Uses controlling insight as main theme

### Step 3: Fallback (If Storyboard Fails)
If storyboard generation fails:
- System falls back to using report data directly
- Original PPT generation method is used
- User experience is not interrupted

## What Changed

### PPT Agent Function (`generate-ppt-agent`)
- **NEW**: Accepts `storyboard` parameter (optional)
- **NEW**: Accepts `report` parameter (fallback)
- **NEW**: Prompt converts storyboard frames into slides
- **UPDATED**: Context building prioritizes storyboard data

### Frontend (`ReportView.jsx`)
- **NEW**: Automatically generates storyboard before PPT
- **NEW**: Passes storyboard data to PPT agent
- **NEW**: Falls back to report data if storyboard fails
- **UPDATED**: Cache keys include storyboard data

## Storyboard → Slide Conversion

The PPT agent converts:
- **Controlling Insight** → Main theme/title slide
- **Story Claims** → Slide section headers
- **Scene Groups** → Thematic slide groupings
- **Frames** → Individual slides or slide content
- **Visual Actions** → Slide visual descriptions
- **Emotional Beats** → Compelling slide titles
- **Logical Purposes** → Slide content structure

## Benefits

1. **Narrative Coherence**: Slides follow a clear story structure
2. **Better Flow**: Presentation tells a story, not just data
3. **Focused Message**: Controlling insight drives the entire deck
4. **Visual Consistency**: Frames guide visual elements

## Usage

### For Users:
1. Click "Generate PPT" button
2. System automatically generates storyboard first (if needed)
3. PPT is created from storyboard
4. Presentation follows narrative structure

### For Developers:
- Storyboard is optional - system falls back to report if needed
- Both `storyboard` and `report` parameters are supported
- Cache keys account for storyboard data

## Technical Details

### Request Format:
```typescript
{
  storyboard?: StoryboardData,  // Preferred
  report?: ReportData,          // Fallback
  presentationStyle?: string,
  slideCount?: number
}
```

### Response Format:
Same as before - slides array with standard structure

## Migration Notes

- Existing code that sends only `report` will continue to work
- New code should send `storyboard` for better results
- System automatically handles both cases
