# Deep Research Edge Function

This Edge Function handles the deep research phase using OpenAI's `o3-deep-research` model with web search capabilities.

## Setup

1. **Set the Secret**: Add your OpenAI API key as a Supabase secret named `deep-Research`
   - Go to Supabase Dashboard → Project Settings → Edge Functions → Secrets
   - Add secret: `deep-Research` with your OpenAI API key value

2. **Deploy the Function**: 
   - Via Dashboard: Copy the code from `index.ts` and `status.ts` to Supabase Dashboard
   - Via CLI: `supabase functions deploy deep-Research`

## Usage

### Start Deep Research

```bash
POST https://your-project.supabase.co/functions/v1/deep-Research
Content-Type: application/json
Authorization: Bearer YOUR_ANON_KEY

{
  "originalQuery": "Research the economic impact of semaglutide on global healthcare systems.",
  "clarifyingAnswers": "Focus on global market (US, EU, Asia), include 2019–2025 data, cover pharmaceutical revenue trends, and reference peer-reviewed sources.",
  "researchId": "optional-research-id"
}
```

**Response:**
```json
{
  "responseId": "resp_abc123...",
  "status": "started",
  "message": "Deep research started. Poll /deep-Research/status for completion."
}
```

### Check Status

```bash
GET https://your-project.supabase.co/functions/v1/deep-Research?responseId=resp_abc123...
Authorization: Bearer YOUR_ANON_KEY
```

**Response (Processing):**
```json
{
  "status": "processing",
  "message": "Research is still in progress..."
}
```

**Response (Completed):**
```json
{
  "status": "completed",
  "report": {
    "keyFindings": [
      {
        "text": "Finding text...",
        "citations": [1, 2]
      }
    ],
    "sources": [
      {
        "url": "https://example.com/source",
        "domain": "example.com",
        "date": "2024-01-15"
      }
    ]
  },
  "raw": "First 1000 chars of output..."
}
```

## Features

- Uses `o3-deep-research` model
- Web search enabled for live source retrieval
- Background processing (async)
- Structured output parsing (Key Findings, Sources)
- Citation extraction

## Notes

- The research runs in the background, so you need to poll the status endpoint
- Poll every 5-10 seconds until status is "completed" or "failed"
- Maximum research time is typically 10-15 minutes

