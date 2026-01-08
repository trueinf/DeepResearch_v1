# PPT Generation Agent

An intelligent AI agent that generates professional PowerPoint presentations from research reports.

## Features

- **Intelligent Slide Structure**: Analyzes research content and determines optimal slide organization
- **Design Recommendations**: Suggests layouts, color schemes, and visual elements
- **Multiple Presentation Styles**: Supports executive, technical, visual, and academic styles
- **Smart Content Prioritization**: Automatically prioritizes high-impact content
- **Speaker Notes**: Generates helpful notes for presenters
- **Layout Intelligence**: Chooses appropriate layouts (content, two-column, comparison, timeline, visual)

## Usage

### Request Format

```json
{
  "report": {
    "topic": "Research Topic",
    "executiveSummary": "Summary text...",
    "detailedAnalysis": "Analysis text...",
    "keyFindings": [
      { "text": "Finding 1", "citations": [1] }
    ],
    "insights": "Insights text...",
    "conclusion": "Conclusion text...",
    "sources": [...]
  },
  "presentationStyle": "executive",
  "slideCount": 10
}
```

### Response Format

```json
{
  "status": "success",
  "slides": [
    {
      "title": "Slide Title",
      "bullets": ["Point 1", "Point 2"],
      "design": {
        "layout": "content",
        "visualType": "none",
        "colorScheme": "professional"
      },
      "speakerNotes": "Notes for presenter",
      "priority": "high"
    }
  ],
  "presentationStructure": {
    "totalSlides": 10,
    "estimatedDuration": 15,
    "recommendedStyle": "executive"
  },
  "designRecommendations": {
    "colorScheme": "Navy blue and white",
    "fontStyle": "Sans-serif, modern",
    "visualElements": ["Bar charts", "Timelines"]
  }
}
```

## Presentation Styles

- **executive**: Business-focused, concise, high-level insights
- **technical**: Detailed, data-driven, comprehensive analysis
- **visual**: Image-heavy, minimal text, design-focused
- **academic**: Research-oriented, citations, detailed analysis

## Layout Types

- **content**: Standard bullet-point layout
- **two-column**: Split content across two columns
- **comparison**: Side-by-side comparison format
- **timeline**: Chronological information display
- **visual**: Data-heavy with charts/diagrams

## Environment Variables

- `GEMINI_API_KEY`: Required. Your Google Gemini API key

## Endpoint

`POST /functions/v1/generate-ppt-agent`

## CORS

Configured to allow requests from any origin. Adjust `corsHeaders` in the function for production.

