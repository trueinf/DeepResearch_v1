# Level-6 Google Slides Integration Guide

This guide explains how to integrate the Level-6 Google Slides renderer into your askDepth_gemini project **without disturbing the frontend**.

## 🎯 Overview

The integration adds a high-quality PPTX rendering system using Google Slides API while maintaining complete backward compatibility with your existing frontend.

## 📋 Architecture

```
Frontend (No Changes)
    ↓
POST /functions/v1/create-ppt-job (New Edge Function)
    ↓
Supabase slide_jobs table
    ↓
Level-6 Renderer Microservice (Webhook/Queue)
    ↓
Google Slides API → PPTX Export
    ↓
Supabase Storage → final_ppt_url
    ↓
Frontend polls slide_jobs (Existing Pattern)
```

## 🚀 Setup Steps

### Step 1: Database Migration

Run the migration to create the `slide_jobs` table:

```sql
-- Run: supabase/migrations/20250120000000_create_slide_jobs.sql
```

Or manually:

```sql
CREATE TABLE slide_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  research_id UUID REFERENCES research(id),
  ppt_plan JSONB NOT NULL,
  status TEXT DEFAULT 'pending',
  final_ppt_url TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Add storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('ppt-results', 'ppt-results', true)
ON CONFLICT (id) DO NOTHING;
```

### Step 2: Deploy Edge Function

Deploy the new `create-ppt-job` Edge Function:

```bash
supabase functions deploy create-ppt-job
```

Or via Supabase Dashboard:
1. Go to Edge Functions
2. Create new function: `create-ppt-job`
3. Copy code from `supabase/functions/create-ppt-job/index.ts`

### Step 3: Setup Google Service Account

1. **Create Service Account:**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create project or select existing
   - Enable APIs:
     - Google Slides API
     - Google Sheets API
     - Google Drive API

2. **Create Service Account:**
   - IAM & Admin → Service Accounts → Create
   - Download JSON key file

3. **Share Template:**
   - Create or select a Google Slides template
   - Share with service account email (found in JSON key)
   - Give "Editor" access

4. **Get Template ID:**
   - Open template in Google Slides
   - URL format: `https://docs.google.com/presentation/d/{TEMPLATE_ID}/edit`
   - Copy `TEMPLATE_ID`

### Step 4: Deploy Level-6 Renderer

#### Option A: Local Development

```bash
cd level6-renderer
cp .env.example .env
# Edit .env with your values
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 8080
```

#### Option B: Docker

```bash
cd level6-renderer
docker build -t level6-renderer .
docker run --env-file .env -p 8080:8080 level6-renderer
```

#### Option C: Google Cloud Run

```bash
cd level6-renderer
gcloud builds submit --tag gcr.io/PROJECT_ID/level6-renderer
gcloud run deploy level6-renderer \
  --image gcr.io/PROJECT_ID/level6-renderer \
  --platform managed \
  --region us-central1 \
  --set-env-vars SUPABASE_URL=...,SUPABASE_SERVICE_ROLE_KEY=...
```

### Step 5: Configure Webhook (Optional)

Set the webhook URL in your Edge Function environment:

```bash
supabase secrets set LEVEL6_RENDERER_WEBHOOK_URL=https://your-renderer-url/run-job
```

Or in Supabase Dashboard:
- Edge Functions → create-ppt-job → Settings → Secrets

## 🔄 Integration Flow

### 1. Frontend Calls Edge Function (No Changes Needed)

Your existing frontend can call:

```javascript
// In ReportView.jsx or similar
const response = await fetch(`${SUPABASE_URL}/functions/v1/create-ppt-job`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    research_id: researchId,
    slides: generatedSlides, // From generate-ppt-agent
    template: 'executive',
    presentation_style: 'executive'
  })
});

const { job_id } = await response.json();
```

### 2. Edge Function Creates Job

The Edge Function:
- Validates user authentication
- Converts slides/ppt_plan to standard format
- Inserts job into `slide_jobs` table
- Calls Level-6 renderer webhook (if configured)

### 3. Level-6 Renderer Processes Job

The microservice:
- Fetches job from Supabase
- Copies Google Slides template
- Replaces placeholders
- Inserts charts/images
- Exports PPTX
- Uploads to Supabase Storage
- Updates job status

### 4. Frontend Polls Status (Existing Pattern)

Your frontend already polls research status. Just poll `slide_jobs`:

```javascript
// Poll for job completion
const pollJobStatus = async (jobId) => {
  const { data } = await supabase
    .from('slide_jobs')
    .select('status, final_ppt_url')
    .eq('id', jobId)
    .single();
  
  if (data.status === 'done' && data.final_ppt_url) {
    // Show download button
    return data.final_ppt_url;
  } else if (data.status === 'failed') {
    // Show error
    return null;
  }
  
  // Continue polling
  setTimeout(() => pollJobStatus(jobId), 2000);
};
```

## 📝 Slide Plan Format

The `ppt_plan` JSON structure:

```json
{
  "slides": [
    {
      "layout": "title",
      "target_slide_index": 0,
      "placeholders": {
        "{{TITLE}}": "My Presentation",
        "{{SUBTITLE}}": "Generated Date"
      }
    },
    {
      "layout": "content",
      "target_slide_index": 1,
      "placeholders": {
        "{{TITLE}}": "Key Findings",
        "{{CONTENT}}": "Point 1\nPoint 2\nPoint 3"
      },
      "chart_spec": {
        "title": "Revenue Growth",
        "type": "LINE",
        "data": [
          ["Quarter", "Revenue"],
          ["Q1", 120],
          ["Q2", 150]
        ],
        "series": [{"col": 1, "name": "Revenue"}],
        "x_col": 0,
        "x": 1.0,
        "y": 2.5,
        "width": 8.0,
        "height": 3.5
      },
      "image": {
        "url": "https://example.com/image.jpg",
        "position": "right",
        "description": "Chart visualization"
      }
    }
  ]
}
```

## 🎨 Template Setup

Your Google Slides template should include placeholders:

- `{{TITLE}}` - Main title
- `{{SUBTITLE}}` - Subtitle
- `{{CONTENT}}` - Main content (bullets)
- `{{LEFT_CONTENT}}` - Left column content
- `{{RIGHT_CONTENT}}` - Right column content
- Custom placeholders as needed

## 🔧 Environment Variables

### Edge Function (`create-ppt-job`)

```env
SUPABASE_URL=your-supabase-url
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
LEVEL6_RENDERER_WEBHOOK_URL=https://your-renderer-url/run-job (optional)
```

### Level-6 Renderer

```env
SUPABASE_URL=your-supabase-url
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_PPT_BUCKET=ppt-results
GCP_SERVICE_ACCOUNT_JSON=/path/to/gcp_sa.json
DEFAULT_TEMPLATE_DRIVE_ID=your_template_id
LEVEL6_RENDERER_PORT=8080
```

## ✅ Testing

1. **Test Edge Function:**
```bash
curl -X POST https://your-project.supabase.co/functions/v1/create-ppt-job \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "research_id": "test-id",
    "slides": [{"layout": "title", "title": "Test"}]
  }'
```

2. **Test Renderer:**
```bash
curl -X POST http://localhost:8080/run-job \
  -H "Content-Type: application/json" \
  -d '{"job_id": "your-job-id"}'
```

3. **Check Job Status:**
```sql
SELECT * FROM slide_jobs WHERE id = 'your-job-id';
```

## 🐛 Troubleshooting

### Job Stuck in "pending"

- Check renderer webhook URL is correct
- Check renderer service is running
- Check service account permissions

### Template Not Found

- Verify template is shared with service account email
- Check `template_drive_id` is correct
- Verify service account has Drive API access

### Upload Failed

- Check Supabase Storage bucket exists
- Verify bucket is public or service role has access
- Check file size limits

### Chart Not Appearing

- Verify Sheets API is enabled
- Check chart_spec format is correct
- Verify data array structure

## 🔒 Security Notes

- Service account JSON should be kept secure
- Use environment variables, not hardcoded keys
- Service role key has full database access - keep it secret
- Enable RLS policies on `slide_jobs` table

## 📊 Monitoring

Monitor job status:

```sql
-- Jobs by status
SELECT status, COUNT(*) 
FROM slide_jobs 
GROUP BY status;

-- Recent jobs
SELECT id, status, created_at, updated_at 
FROM slide_jobs 
ORDER BY created_at DESC 
LIMIT 10;
```

## 🎉 Benefits

✅ **No Frontend Changes** - Existing code continues to work  
✅ **High Quality** - Google Slides native rendering  
✅ **Charts** - Native Google Sheets charts  
✅ **Scalable** - Separate microservice  
✅ **Flexible** - Template-based customization  
✅ **Reliable** - Retry logic and error handling  

## 📚 Next Steps

1. Deploy database migration
2. Deploy Edge Function
3. Setup Google Service Account
4. Deploy Level-6 Renderer
5. Test with sample job
6. Integrate into existing flow
7. Monitor and optimize

Your frontend will automatically work with the new system once jobs are created and polled correctly!

