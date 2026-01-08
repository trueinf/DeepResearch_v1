# What Changes to Expect - Level-6 Integration

This guide explains what you'll see at each stage of the Level-6 integration.

---

## 🎯 Overview

The Level-6 integration adds **Google Slides quality PPTX rendering** to your project. Here's what changes at each stage:

---

## Stage 1: After Database Migration ✅

### What You'll See:

**In Supabase Dashboard:**
- ✅ New table: `slide_jobs` in Table Editor
- ✅ New storage bucket: `ppt-results` in Storage
- ✅ New RLS policies visible in Authentication → Policies

**In Database:**
- Table structure with columns:
  - `id`, `user_id`, `research_id`, `ppt_plan`, `status`, `final_ppt_url`, etc.
- Indexes for fast queries
- Auto-update trigger for `updated_at`

**What You Can Do:**
- Query the `slide_jobs` table
- See job statuses (pending, processing, done, failed)
- Store PPT generation jobs

**What You CAN'T Do Yet:**
- ❌ Create jobs (no Edge Function yet)
- ❌ Process jobs (no renderer yet)
- ❌ See any UI changes (frontend not integrated)

---

## Stage 2: After Deploying Edge Function ✅

### What You'll See:

**In Supabase Dashboard:**
- ✅ New Edge Function: `create-ppt-job` in Edge Functions list
- ✅ Function logs available

**What You Can Do:**
- ✅ Call the Edge Function via API
- ✅ Create jobs in `slide_jobs` table
- ✅ Jobs will have `status = 'pending'`

**Test It:**
```bash
curl -X POST https://YOUR_PROJECT.supabase.co/functions/v1/create-ppt-job \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "research_id": "test-id",
    "slides": [{"layout": "title", "title": "Test"}]
  }'
```

**What You'll See:**
- Job created in `slide_jobs` table
- `status = 'pending'`
- `final_ppt_url = null` (not processed yet)

**What You CAN'T Do Yet:**
- ❌ Process jobs automatically (no renderer)
- ❌ See UI changes (frontend not integrated)

---

## Stage 3: After Deploying Level-6 Renderer ✅

### What You'll See:

**In Your Renderer Service:**
- ✅ API endpoint: `http://your-renderer-url/health`
- ✅ Logs showing job processing

**What You Can Do:**
- ✅ Process jobs manually via API
- ✅ Jobs will change: `pending` → `processing` → `done`
- ✅ PPTX files uploaded to Supabase Storage
- ✅ `final_ppt_url` populated with download link

**Test It:**
```bash
# After creating a job via Edge Function
curl -X POST http://your-renderer-url/run-job \
  -H "Content-Type: application/json" \
  -d '{"job_id": "job-id-from-step-2"}'
```

**What You'll See:**
- Job status updates in database
- PPTX file in `ppt-results` storage bucket
- Public URL in `final_ppt_url` column

**What You CAN'T Do Yet:**
- ❌ See UI changes (frontend not integrated)
- ❌ Automatic processing (unless webhook configured)

---

## Stage 4: After Frontend Integration 🎨

### What You'll See in Your App:

**New UI Elements (if integrated):**

1. **Option to Use Level-6 Rendering:**
   - Toggle or button: "Use Google Slides Quality" or "Level-6 Render"
   - May appear in PPT customization modal

2. **Job Status Indicators:**
   - "Generating PPT..." with progress
   - "Processing..." status
   - "Ready for Download" when done

3. **Download Button:**
   - Appears when `status = 'done'`
   - Downloads from `final_ppt_url`

4. **Error Handling:**
   - Shows error if `status = 'failed'`
   - Displays `error_message` from database

**What You Can Do:**
- ✅ Generate PPTs with Google Slides quality
- ✅ See real-time job status
- ✅ Download high-quality PPTX files
- ✅ Automatic processing (if webhook configured)

---

## 🔄 Current State vs. Future State

### Current System (What You Have Now):
```
Frontend → generate-ppt-agent → pptxgenjs → Download PPTX
```
- ✅ Works immediately
- ✅ Client-side generation
- ✅ Good quality
- ✅ No external dependencies

### Level-6 System (After Full Integration):
```
Frontend → create-ppt-job → slide_jobs → Level-6 Renderer → Google Slides API → PPTX → Supabase Storage → Download
```
- ✅ Google Slides native quality
- ✅ Professional templates
- ✅ Native charts from Google Sheets
- ✅ Better image handling
- ✅ Scalable (separate service)
- ⏳ Requires setup

---

## 📊 Comparison Table

| Feature | Current System | Level-6 System |
|---------|---------------|----------------|
| **Quality** | Good (pptxgenjs) | Excellent (Google Slides) |
| **Templates** | Code-based | Google Slides templates |
| **Charts** | Basic | Native Google Sheets charts |
| **Images** | Basic | Advanced positioning |
| **Setup Time** | ✅ Ready now | ⏳ ~30 minutes setup |
| **Dependencies** | None | Google Cloud account |
| **Cost** | Free | Free (within limits) |
| **Speed** | Instant | ~10-30 seconds per job |
| **Scalability** | Client-side | Server-side |

---

## 🎯 What Changes You'll Actually See

### Immediate (After Migration):
- ✅ Database table exists
- ✅ Can query `slide_jobs` table
- ❌ No UI changes yet

### After Edge Function:
- ✅ Can create jobs via API
- ✅ Jobs appear in database
- ❌ No UI changes yet

### After Renderer:
- ✅ Jobs can be processed
- ✅ PPTX files generated
- ❌ No UI changes yet

### After Frontend Integration:
- ✅ New UI elements
- ✅ Job status indicators
- ✅ Download buttons
- ✅ Error messages
- ✅ Progress indicators

---

## 🚀 Recommended Approach

### Option 1: Keep Current System (Recommended for Now)
- ✅ Works immediately
- ✅ No setup required
- ✅ Good quality
- Use Level-6 later when needed

### Option 2: Full Level-6 Integration
- ⏳ Requires 30-60 minutes setup
- ✅ Best quality output
- ✅ Professional templates
- ✅ Better for production

### Option 3: Hybrid Approach
- ✅ Keep current system as default
- ✅ Add "Use Level-6 Quality" option
- ✅ Let users choose

---

## 📝 Summary

**Right Now (After Migration Only):**
- ✅ Database structure ready
- ❌ No visible UI changes
- ❌ No functional changes yet

**After Full Setup:**
- ✅ High-quality PPTX generation
- ✅ Professional Google Slides output
- ✅ Better charts and images
- ✅ Scalable architecture

**The key point:** The migration only sets up the database. You won't see UI or functional changes until you:
1. Deploy the Edge Function
2. Deploy the Level-6 Renderer
3. Integrate the frontend

Would you like me to help you integrate the frontend so you can see the UI changes, or keep the current system for now?

