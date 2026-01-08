# 📚 Level-6 Integration - Detailed Setup Guide

This guide provides step-by-step instructions for setting up the Level-6 Google Slides renderer integration.

---

## Step 1: Run Database Migration

### Option A: Via Supabase Dashboard (Recommended)

1. **Open Supabase Dashboard**
   - Go to [https://app.supabase.com](https://app.supabase.com)
   - Select your project

2. **Navigate to SQL Editor**
   - Click "SQL Editor" in the left sidebar
   - Click "New query"

3. **Copy Migration SQL**
   - Open `supabase/migrations/20250120000000_create_slide_jobs.sql`
   - Copy the entire contents

4. **Paste and Run**
   - Paste the SQL into the editor
   - Click "Run" or press `Ctrl+Enter` (Windows) / `Cmd+Enter` (Mac)

5. **Verify Success**
   - You should see "Success. No rows returned"
   - Check that the table was created:
     ```sql
     SELECT * FROM slide_jobs LIMIT 1;
     ```

### Option B: Via Supabase CLI

1. **Install Supabase CLI** (if not installed)
   ```bash
   # Windows (PowerShell)
   scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
   scoop install supabase
   
   # macOS
   brew install supabase/tap/supabase
   
   # Or via npm
   npm install -g supabase
   ```

2. **Login to Supabase**
   ```bash
   supabase login
   ```
   - This will open your browser for authentication

3. **Link Your Project**
   ```bash
   supabase link --project-ref your-project-ref
   ```
   - Find your project ref in Supabase Dashboard → Settings → General → Reference ID

4. **Run Migration**
   ```bash
   supabase db push
   ```
   - Or run specific migration:
   ```bash
   supabase migration up
   ```

### Option C: Manual SQL Execution

1. **Open SQL Editor in Supabase Dashboard**

2. **Run Each Section Separately:**

   **a) Create Table:**
   ```sql
   CREATE TABLE IF NOT EXISTS slide_jobs (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
     framework_id UUID REFERENCES research(id) ON DELETE SET NULL,
     research_id UUID REFERENCES research(id) ON DELETE SET NULL,
     ppt_plan JSONB NOT NULL,
     template TEXT DEFAULT 'default',
     template_drive_id TEXT,
     presentation_style TEXT DEFAULT 'executive' CHECK (presentation_style IN ('executive', 'technical', 'visual', 'academic')),
     status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'done', 'failed')),
     final_ppt_url TEXT,
     error_message TEXT,
     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
     updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
   );
   ```

   **b) Create Indexes:**
   ```sql
   CREATE INDEX IF NOT EXISTS idx_slide_jobs_user_id ON slide_jobs(user_id);
   CREATE INDEX IF NOT EXISTS idx_slide_jobs_status ON slide_jobs(status);
   CREATE INDEX IF NOT EXISTS idx_slide_jobs_research_id ON slide_jobs(research_id);
   ```

   **c) Enable RLS:**
   ```sql
   ALTER TABLE slide_jobs ENABLE ROW LEVEL SECURITY;
   ```

   **d) Create Policies:**
   ```sql
   CREATE POLICY "Users can view own slide jobs"
     ON slide_jobs FOR SELECT
     USING (auth.uid() = user_id);

   CREATE POLICY "Users can create own slide jobs"
     ON slide_jobs FOR INSERT
     WITH CHECK (auth.uid() = user_id);

   CREATE POLICY "Service role full access"
     ON slide_jobs FOR ALL
     USING (auth.jwt() ->> 'role' = 'service_role');
   ```

   **e) Create Trigger:**
   ```sql
   CREATE OR REPLACE FUNCTION update_slide_jobs_updated_at()
   RETURNS TRIGGER AS $$
   BEGIN
     NEW.updated_at = NOW();
     RETURN NEW;
   END;
   $$ LANGUAGE plpgsql;

   CREATE TRIGGER update_slide_jobs_updated_at
     BEFORE UPDATE ON slide_jobs
     FOR EACH ROW
     EXECUTE FUNCTION update_slide_jobs_updated_at();
   ```

   **f) Create Storage Bucket:**
   ```sql
   INSERT INTO storage.buckets (id, name, public)
   VALUES ('ppt-results', 'ppt-results', true)
   ON CONFLICT (id) DO NOTHING;
   ```

   **g) Storage Policies:**
   ```sql
   CREATE POLICY "Users can upload own PPTs"
     ON storage.objects FOR INSERT
     WITH CHECK (
       bucket_id = 'ppt-results' AND
       (storage.foldername(name))[1] = auth.uid()::text
     );

   CREATE POLICY "Public can view PPTs"
     ON storage.objects FOR SELECT
     USING (bucket_id = 'ppt-results');
   ```

### Verification

Run this query to verify everything is set up:
```sql
-- Check table exists
SELECT table_name 
FROM information_schema.tables 
WHERE table_name = 'slide_jobs';

-- Check bucket exists
SELECT * FROM storage.buckets WHERE id = 'ppt-results';

-- Check policies
SELECT * FROM pg_policies WHERE tablename = 'slide_jobs';
```

---

## Step 2: Deploy Edge Function

### Option A: Via Supabase Dashboard

1. **Open Supabase Dashboard**
   - Go to your project
   - Click "Edge Functions" in the left sidebar

2. **Create New Function**
   - Click "Create a new function"
   - Name: `create-ppt-job`
   - Click "Create function"

3. **Copy Function Code**
   - Open `supabase/functions/create-ppt-job/index.ts`
   - Copy the entire file contents
   - Paste into the function editor

4. **Set Environment Variables** (Optional)
   - Click "Settings" tab
   - Add secret:
     - Name: `LEVEL6_RENDERER_WEBHOOK_URL`
     - Value: `https://your-renderer-url/run-job` (set after Step 4)
   - Click "Save"

5. **Deploy**
   - Click "Deploy" button
   - Wait for deployment to complete

### Option B: Via Supabase CLI

1. **Install Supabase CLI** (if not already installed)
   ```bash
   # See Step 1, Option B for installation instructions
   ```

2. **Login and Link Project**
   ```bash
   supabase login
   supabase link --project-ref your-project-ref
   ```

3. **Deploy Function**
   ```bash
   supabase functions deploy create-ppt-job
   ```

4. **Set Secrets** (Optional)
   ```bash
   supabase secrets set LEVEL6_RENDERER_WEBHOOK_URL=https://your-renderer-url/run-job
   ```

### Option C: Manual Deployment via Dashboard

1. **Navigate to Edge Functions**
   - Supabase Dashboard → Edge Functions

2. **Create Function**
   - Click "New Function"
   - Function name: `create-ppt-job`
   - Click "Create"

3. **Edit Function Code**
   - Delete the default code
   - Copy from `supabase/functions/create-ppt-job/index.ts`
   - Paste into editor

4. **Verify Configuration**
   - Check that `verify_jwt = false` is in `supabase/config.toml`:
     ```toml
     [functions.create-ppt-job]
     verify_jwt = false
     ```

5. **Deploy**
   - Click "Deploy" button
   - Wait for "Deployed successfully" message

### Testing the Edge Function

1. **Get Your Access Token**
   - In your frontend, get the user's auth token
   - Or use Supabase Dashboard → Authentication → Users → Create test user

2. **Test via cURL**
   ```bash
   curl -X POST https://YOUR_PROJECT.supabase.co/functions/v1/create-ppt-job \
     -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{
       "research_id": "test-research-id",
       "slides": [
         {
           "layout": "title",
           "title": "Test Presentation",
           "subtitle": "Test Subtitle"
         }
       ],
       "template": "default"
     }'
   ```

3. **Expected Response**
   ```json
   {
     "job_id": "uuid-here",
     "status": "pending",
     "message": "Job created successfully. Poll slide_jobs table for status updates."
   }
   ```

4. **Verify in Database**
   ```sql
   SELECT * FROM slide_jobs ORDER BY created_at DESC LIMIT 1;
   ```

---

## Step 3: Setup Google Service Account

### Part A: Create Google Cloud Project

1. **Go to Google Cloud Console**
   - Visit [https://console.cloud.google.com](https://console.cloud.google.com)
   - Sign in with your Google account

2. **Create New Project** (or select existing)
   - Click project dropdown at top
   - Click "New Project"
   - Project name: `askdepth-slides-renderer` (or your choice)
   - Click "Create"
   - Wait for project creation (may take a few seconds)

3. **Select the Project**
   - Click project dropdown
   - Select your newly created project

### Part B: Enable Required APIs

1. **Enable Google Slides API**
   - Go to [API Library](https://console.cloud.google.com/apis/library)
   - Search for "Google Slides API"
   - Click on it
   - Click "Enable"

2. **Enable Google Sheets API**
   - Search for "Google Sheets API"
   - Click "Enable"

3. **Enable Google Drive API**
   - Search for "Google Drive API"
   - Click "Enable"

4. **Verify APIs Enabled**
   - Go to "APIs & Services" → "Enabled APIs"
   - You should see all three APIs listed

### Part C: Create Service Account

1. **Navigate to Service Accounts**
   - Go to "IAM & Admin" → "Service Accounts"
   - Or visit: [Service Accounts](https://console.cloud.google.com/iam-admin/serviceaccounts)

2. **Create Service Account**
   - Click "Create Service Account"
   - Service account name: `slides-renderer`
   - Service account ID: `slides-renderer` (auto-generated)
   - Description: `Service account for Level-6 PPT rendering`
   - Click "Create and Continue"

3. **Grant Roles** (Optional - not required for service account)
   - Skip this step (click "Continue")
   - Service accounts don't need IAM roles for API access

4. **Grant Access to Users** (Skip)
   - Click "Done"

### Part D: Create and Download JSON Key

1. **Find Your Service Account**
   - In Service Accounts list, find `slides-renderer`
   - Click on the email address

2. **Create Key**
   - Click "Keys" tab
   - Click "Add Key" → "Create new key"
   - Key type: **JSON**
   - Click "Create"

3. **Download JSON File**
   - File will automatically download
   - Save it securely (e.g., `gcp_service_account.json`)
   - **IMPORTANT:** Keep this file secure! It has full access to your Google account.

4. **Note the Service Account Email**
   - In the service account details, note the email address
   - Format: `slides-renderer@your-project-id.iam.gserviceaccount.com`
   - You'll need this to share the template

### Part E: Create Google Slides Template

1. **Create New Presentation**
   - Go to [Google Slides](https://slides.google.com)
   - Click "Blank" to create new presentation

2. **Design Your Template**
   - Add placeholders in text boxes:
     - `{{TITLE}}` - For main title
     - `{{SUBTITLE}}` - For subtitle
     - `{{CONTENT}}` - For main content
     - `{{LEFT_CONTENT}}` - For left column
     - `{{RIGHT_CONTENT}}` - For right column
     - Add any custom placeholders you need

3. **Example Template Structure:**
   ```
   Slide 1 (Title Slide):
   - Title: {{TITLE}}
   - Subtitle: {{SUBTITLE}}

   Slide 2 (Content Slide):
   - Title: {{TITLE}}
   - Bullets: {{CONTENT}}

   Slide 3 (Two Column):
   - Title: {{TITLE}}
   - Left: {{LEFT_CONTENT}}
   - Right: {{RIGHT_CONTENT}}
   ```

4. **Get Template ID**
   - Look at the URL: `https://docs.google.com/presentation/d/TEMPLATE_ID_HERE/edit`
   - Copy the `TEMPLATE_ID_HERE` part
   - Save this ID (you'll need it for `.env`)

5. **Share Template with Service Account**
   - Click "Share" button (top right)
   - In "Add people and groups", paste the service account email:
     - `slides-renderer@your-project-id.iam.gserviceaccount.com`
   - Permission: **Editor** (must be Editor, not Viewer)
   - Uncheck "Notify people" (optional)
   - Click "Share"

6. **Verify Sharing**
   - The service account should appear in the sharing list
   - Status should show "Editor"

### Part F: Store Credentials Securely

1. **For Local Development:**
   ```bash
   # Create secrets directory
   mkdir -p level6-renderer/secrets
   
   # Copy JSON key file
   cp /path/to/downloaded/gcp_service_account.json level6-renderer/secrets/gcp_sa.json
   
   # Set permissions (Linux/Mac)
   chmod 600 level6-renderer/secrets/gcp_sa.json
   ```

2. **For Docker:**
   - Mount the secrets directory:
     ```yaml
     volumes:
       - ./secrets:/secrets:ro
     ```

3. **For Cloud Run (Google Cloud):**
   - Upload as Secret Manager secret:
     ```bash
     gcloud secrets create gcp-service-account \
       --data-file=gcp_service_account.json
     ```
   - Or set as environment variable (base64 encoded):
     ```bash
     GCP_SERVICE_ACCOUNT_JSON_BASE64=$(base64 -i gcp_service_account.json)
     ```

4. **For Other Cloud Providers:**
   - Use their secret management service
   - Or set as environment variable (base64 encoded)

### Verification

Test that service account can access the template:

```python
# test_service_account.py
from google.oauth2 import service_account
from googleapiclient.discovery import build

SCOPES = ['https://www.googleapis.com/auth/drive.readonly']
SERVICE_ACCOUNT_FILE = 'secrets/gcp_sa.json'

creds = service_account.Credentials.from_service_account_file(
    SERVICE_ACCOUNT_FILE, scopes=SCOPES)
drive_service = build('drive', 'v3', credentials=creds)

# Try to access template
template_id = 'YOUR_TEMPLATE_ID'
file = drive_service.files().get(fileId=template_id).execute()
print(f"Success! Template: {file['name']}")
```

Run:
```bash
cd level6-renderer
python test_service_account.py
```

---

## Step 4: Deploy Level-6 Renderer

### Option A: Local Development (Docker Compose)

1. **Navigate to Renderer Directory**
   ```bash
   cd level6-renderer
   ```

2. **Create Environment File**
   ```bash
   cp env.example .env
   ```

3. **Edit `.env` File**
   ```env
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
   SUPABASE_PPT_BUCKET=ppt-results
   GCP_SERVICE_ACCOUNT_JSON=./secrets/gcp_sa.json
   DEFAULT_TEMPLATE_DRIVE_ID=your_template_id_here
   LEVEL6_RENDERER_PORT=8080
   ```

4. **Place Service Account JSON**
   ```bash
   mkdir -p secrets
   cp /path/to/gcp_service_account.json secrets/gcp_sa.json
   ```

5. **Start with Docker Compose**
   ```bash
   docker-compose up -d
   ```

6. **Check Logs**
   ```bash
   docker-compose logs -f
   ```

7. **Test Health Endpoint**
   ```bash
   curl http://localhost:8080/health
   ```
   Expected: `{"status":"ok","service":"level6-renderer"}`

### Option B: Local Development (Python)

1. **Navigate to Renderer Directory**
   ```bash
   cd level6-renderer
   ```

2. **Create Virtual Environment**
   ```bash
   python -m venv venv
   
   # Windows
   venv\Scripts\activate
   
   # Linux/Mac
   source venv/bin/activate
   ```

3. **Install Dependencies**
   ```bash
   pip install -r requirements.txt
   ```

4. **Create Environment File**
   ```bash
   cp env.example .env
   # Edit .env with your values
   ```

5. **Place Service Account JSON**
   ```bash
   mkdir -p secrets
   cp /path/to/gcp_service_account.json secrets/gcp_sa.json
   ```

6. **Run Server**
   ```bash
   uvicorn main:app --host 0.0.0.0 --port 8080 --reload
   ```

7. **Test**
   ```bash
   curl http://localhost:8080/health
   ```

### Option C: Google Cloud Run

1. **Install Google Cloud SDK**
   ```bash
   # Windows
   # Download from: https://cloud.google.com/sdk/docs/install
   
   # macOS
   brew install google-cloud-sdk
   
   # Linux
   # Follow: https://cloud.google.com/sdk/docs/install
   ```

2. **Authenticate**
   ```bash
   gcloud auth login
   gcloud config set project YOUR_PROJECT_ID
   ```

3. **Build Docker Image**
   ```bash
   cd level6-renderer
   gcloud builds submit --tag gcr.io/YOUR_PROJECT_ID/level6-renderer
   ```

4. **Deploy to Cloud Run**
   ```bash
   gcloud run deploy level6-renderer \
     --image gcr.io/YOUR_PROJECT_ID/level6-renderer \
     --platform managed \
     --region us-central1 \
     --allow-unauthenticated \
     --set-env-vars SUPABASE_URL=https://your-project.supabase.co \
     --set-env-vars SUPABASE_SERVICE_ROLE_KEY=your-key \
     --set-env-vars SUPABASE_PPT_BUCKET=ppt-results \
     --set-env-vars DEFAULT_TEMPLATE_DRIVE_ID=your-template-id \
     --set-env-vars LEVEL6_RENDERER_PORT=8080
   ```

5. **Set Service Account JSON Secret**
   ```bash
   # Create secret
   gcloud secrets create gcp-service-account-json \
     --data-file=secrets/gcp_sa.json
   
   # Update deployment to use secret
   gcloud run services update level6-renderer \
     --update-secrets GCP_SERVICE_ACCOUNT_JSON=gcp-service-account-json:latest
   ```

6. **Get Service URL**
   ```bash
   gcloud run services describe level6-renderer \
     --format 'value(status.url)'
   ```
   Save this URL for Step 5.

### Option D: Other Cloud Providers

#### AWS (ECS/Fargate)

1. **Build and Push to ECR**
   ```bash
   aws ecr create-repository --repository-name level6-renderer
   docker build -t level6-renderer .
   docker tag level6-renderer:latest YOUR_ACCOUNT.dkr.ecr.REGION.amazonaws.com/level6-renderer:latest
   aws ecr get-login-password | docker login --username AWS --password-stdin YOUR_ACCOUNT.dkr.ecr.REGION.amazonaws.com
   docker push YOUR_ACCOUNT.dkr.ecr.REGION.amazonaws.com/level6-renderer:latest
   ```

2. **Create Task Definition** (use AWS Console or CLI)
   - Set environment variables
   - Mount secrets from AWS Secrets Manager

3. **Deploy to ECS/Fargate**

#### Azure Container Instances

1. **Build and Push to ACR**
   ```bash
   az acr build --registry YOUR_REGISTRY --image level6-renderer:latest .
   ```

2. **Deploy**
   ```bash
   az container create \
     --resource-group YOUR_RESOURCE_GROUP \
     --name level6-renderer \
     --image YOUR_REGISTRY.azurecr.io/level6-renderer:latest \
     --environment-variables \
       SUPABASE_URL=... \
       SUPABASE_SERVICE_ROLE_KEY=... \
     --registry-login-server YOUR_REGISTRY.azurecr.io
   ```

#### DigitalOcean App Platform

1. **Connect GitHub Repository**
   - Push `level6-renderer` to GitHub
   - Connect in DigitalOcean dashboard

2. **Configure App**
   - Build command: `pip install -r requirements.txt`
   - Run command: `uvicorn main:app --host 0.0.0.0 --port 8080`
   - Set environment variables
   - Add secret for service account JSON

3. **Deploy**

### Verification

1. **Health Check**
   ```bash
   curl https://your-renderer-url/health
   ```
   Expected: `{"status":"ok","service":"level6-renderer"}`

2. **Test Job Processing** (after creating a job via Edge Function)
   ```bash
   curl -X POST https://your-renderer-url/run-job \
     -H "Content-Type: application/json" \
     -d '{"job_id": "your-job-id-from-step-2"}'
   ```

3. **Check Logs**
   - Local: `docker-compose logs -f` or terminal output
   - Cloud Run: `gcloud run services logs read level6-renderer`
   - Other: Use provider's logging dashboard

---

## Step 5: Configure Webhook URL (Optional)

### Why Configure Webhook?

Without webhook: Jobs are created but not automatically processed. You'd need to manually call the renderer or set up a polling mechanism.

With webhook: Jobs are automatically processed when created.

### Option A: Via Supabase Dashboard

1. **Open Edge Functions**
   - Supabase Dashboard → Edge Functions
   - Click on `create-ppt-job`

2. **Go to Settings**
   - Click "Settings" tab

3. **Add Secret**
   - Click "Add new secret"
   - Name: `LEVEL6_RENDERER_WEBHOOK_URL`
   - Value: `https://your-renderer-url/run-job`
     - Replace with your actual renderer URL from Step 4
   - Click "Save"

4. **Verify**
   - The secret should appear in the list
   - Edge Function will automatically use it

### Option B: Via Supabase CLI

1. **Set Secret**
   ```bash
   supabase secrets set LEVEL6_RENDERER_WEBHOOK_URL=https://your-renderer-url/run-job
   ```

2. **Verify**
   ```bash
   supabase secrets list
   ```

### Option C: Manual Configuration

1. **Get Your Renderer URL**
   - Local: `http://localhost:8080` (if using ngrok or similar)
   - Cloud Run: From Step 4, Option C
   - Other: Your deployed service URL

2. **Update Edge Function Code** (if not using secrets)
   - Open `supabase/functions/create-ppt-job/index.ts`
   - Find line with `LEVEL6_RENDERER_WEBHOOK_URL`
   - Replace with your URL:
     ```typescript
     const rendererWebhookUrl = 'https://your-renderer-url/run-job'
     ```
   - Redeploy function

### Testing Webhook

1. **Create a Test Job**
   ```bash
   curl -X POST https://YOUR_PROJECT.supabase.co/functions/v1/create-ppt-job \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{
       "research_id": "test-id",
       "slides": [{"layout": "title", "title": "Test"}]
     }'
   ```

2. **Check Renderer Logs**
   - You should see a request to `/run-job`
   - Job should start processing

3. **Check Job Status**
   ```sql
   SELECT id, status, created_at, updated_at 
   FROM slide_jobs 
   ORDER BY created_at DESC 
   LIMIT 1;
   ```

4. **Wait for Completion**
   - Status should change from `pending` → `processing` → `done`
   - `final_ppt_url` should be populated

### Alternative: Polling Mechanism (No Webhook)

If you don't want to use webhooks, you can set up a polling mechanism:

1. **Create a Scheduled Function**
   - Use Supabase Edge Functions with cron triggers
   - Or use external cron service (cron-job.org, etc.)

2. **Poll for Pending Jobs**
   ```typescript
   // poll-pending-jobs.ts
   const { data: jobs } = await supabase
     .from('slide_jobs')
     .select('id')
     .eq('status', 'pending')
     .limit(10);
   
   for (const job of jobs) {
     await fetch('https://your-renderer-url/run-job', {
       method: 'POST',
       body: JSON.stringify({ job_id: job.id })
     });
   }
   ```

3. **Schedule It**
   - Run every 1-5 minutes
   - Process pending jobs

---

## Complete Verification Checklist

After completing all steps, verify everything works:

### ✅ Database
- [ ] `slide_jobs` table exists
- [ ] `ppt-results` bucket exists
- [ ] RLS policies are active
- [ ] Can insert test row (as authenticated user)

### ✅ Edge Function
- [ ] Function `create-ppt-job` is deployed
- [ ] Can call function and get `job_id` back
- [ ] Job appears in `slide_jobs` table
- [ ] Webhook URL is configured (if using)

### ✅ Google Service Account
- [ ] Service account created
- [ ] JSON key downloaded
- [ ] APIs enabled (Slides, Sheets, Drive)
- [ ] Template created and shared with service account
- [ ] Template ID saved

### ✅ Level-6 Renderer
- [ ] Service is running
- [ ] Health endpoint returns `{"status":"ok"}`
- [ ] Can process a test job
- [ ] PPTX file is generated and uploaded
- [ ] `final_ppt_url` is populated in database

### ✅ End-to-End Test
1. [ ] Create job via Edge Function
2. [ ] Job appears in database with `status='pending'`
3. [ ] Renderer processes job (automatically or manually)
4. [ ] Job status changes to `done`
5. [ ] `final_ppt_url` contains valid URL
6. [ ] Can download PPTX file from URL
7. [ ] PPTX opens correctly and contains expected content

---

## Troubleshooting

### Database Issues

**Problem:** Migration fails
- **Solution:** Check SQL syntax, ensure you have proper permissions
- **Check:** Run migration in smaller chunks

**Problem:** RLS blocking access
- **Solution:** Verify policies are correct, check user authentication
- **Test:** Try querying as authenticated user

### Edge Function Issues

**Problem:** Function not found
- **Solution:** Ensure function is deployed, check function name spelling
- **Verify:** `supabase functions list`

**Problem:** Authentication error
- **Solution:** Check token is valid, ensure `verify_jwt = false` in config
- **Test:** Use service role key for testing

### Google Service Account Issues

**Problem:** "Permission denied" when accessing template
- **Solution:** Ensure template is shared with service account email (Editor access)
- **Verify:** Check sharing settings in Google Slides

**Problem:** APIs not enabled
- **Solution:** Enable Slides, Sheets, and Drive APIs in Google Cloud Console
- **Check:** APIs & Services → Enabled APIs

### Renderer Issues

**Problem:** Service won't start
- **Solution:** Check environment variables, verify service account JSON path
- **Debug:** Check logs for specific error messages

**Problem:** Job stuck in "processing"
- **Solution:** Check renderer logs, verify Google API credentials
- **Test:** Try processing job manually via `/run-job` endpoint

**Problem:** PPTX not uploading
- **Solution:** Check Supabase Storage bucket exists and is accessible
- **Verify:** Check storage policies, verify service role key has access

---

## Next Steps

Once everything is set up:

1. **Integrate into Frontend**
   - Update frontend to call `create-ppt-job` Edge Function
   - Add polling logic for job status
   - Show download button when `status='done'`

2. **Monitor Performance**
   - Set up logging/monitoring
   - Track job processing times
   - Monitor error rates

3. **Optimize**
   - Adjust template design
   - Fine-tune chart/image placement
   - Add more placeholder options

4. **Scale**
   - Consider queue system for high volume
   - Add multiple renderer instances
   - Implement caching for common templates

---

## Support

If you encounter issues:

1. Check logs (Edge Function, Renderer, Database)
2. Verify all environment variables are set correctly
3. Test each component individually
4. Review the troubleshooting section above
5. Check Supabase and Google Cloud documentation

For detailed API documentation, see `level6-renderer/README.md`.

