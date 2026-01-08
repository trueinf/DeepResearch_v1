# Clarify Questions Edge Function

This Supabase Edge Function calls OpenAI's Responses API to generate clarifying questions for research topics.

## Setup

1. Set your OpenAI API key in Supabase:

```bash
supabase secrets set clarify-Questions=sk-your-api-key-here
```

Or in Supabase Dashboard:
- Go to Project Settings → Edge Functions → Secrets
- Add `clarify-Questions` with your OpenAI API key

## Deployment

Deploy the function:

```bash
supabase functions deploy clarify-Questions
```

## Usage

**Endpoint:** `https://[your-project-ref].supabase.co/functions/v1/clarify-Questions`

**Method:** POST

**Headers:**
```
Authorization: Bearer [your-anon-key]
Content-Type: application/json
```

**Request Body:**
```json
{
  "input": "Research surfboards for me. I'm interested in..."
}
```

**Response:**
```json
{
  "summary": "Research objective summary",
  "questions": ["Question 1", "Question 2", "Question 3"],
  "raw": "Full response text"
}
```

