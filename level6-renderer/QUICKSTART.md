# Quick Start Guide

## 1. Setup Google Service Account (5 minutes)

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create/select project
3. Enable APIs:
   - Google Slides API
   - Google Sheets API  
   - Google Drive API
4. Create Service Account:
   - IAM & Admin → Service Accounts → Create
   - Download JSON key → Save as `secrets/gcp_sa.json`
5. Create Google Slides template:
   - Create new presentation
   - Add placeholders: `{{TITLE}}`, `{{SUBTITLE}}`, `{{CONTENT}}`
   - Share with service account email (from JSON key)
   - Copy template ID from URL

## 2. Configure Environment (2 minutes)

```bash
cd level6-renderer
cp .env.example .env
```

Edit `.env`:
```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-key
SUPABASE_PPT_BUCKET=ppt-results
GCP_SERVICE_ACCOUNT_JSON=./secrets/gcp_sa.json
DEFAULT_TEMPLATE_DRIVE_ID=your_template_id
```

## 3. Run Locally (1 minute)

```bash
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 8080
```

Or with Docker:
```bash
docker-compose up
```

## 4. Test

```bash
# Health check
curl http://localhost:8080/health

# Process a job (after creating one via Edge Function)
curl -X POST http://localhost:8080/run-job \
  -H "Content-Type: application/json" \
  -d '{"job_id": "your-job-id"}'
```

## 5. Deploy

### Google Cloud Run:
```bash
gcloud builds submit --tag gcr.io/PROJECT_ID/level6-renderer
gcloud run deploy level6-renderer --image gcr.io/PROJECT_ID/level6-renderer
```

### Or use Docker Compose on your server

Done! 🎉

