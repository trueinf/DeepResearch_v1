# Deploy Storyboard Generation Function

## Quick Deployment Steps

### Option 1: Via Supabase Dashboard (Recommended)

1. **Go to Supabase Dashboard**
   - Navigate to your project
   - Go to **Edge Functions** in the sidebar

2. **Create New Function**
   - Click **"Create a new function"**
   - Function name: `generate-storyboard`
   - Click **"Create function"**

3. **Copy Function Code**
   - Open `supabase/functions/generate-storyboard/index.ts`
   - Copy ALL contents
   - Paste into the Supabase function editor

4. **Deploy**
   - Click **"Deploy"** button
   - Wait for deployment to complete (30-60 seconds)

5. **Verify API Key**
   - Go to **Edge Functions → Secrets**
   - Ensure `GEMINI_API_KEY` is set
   - If not, add it:
     - Name: `GEMINI_API_KEY`
     - Value: Your Gemini API key from [Google AI Studio](https://aistudio.google.com/app/apikey)

### Option 2: Via Supabase CLI

```bash
# Install Supabase CLI (if not installed)
npm install -g supabase

# Login to Supabase
supabase login

# Link your project
supabase link --project-ref <your-project-ref>

# Deploy the function
supabase functions deploy generate-storyboard
```

## Verify Deployment

1. **Test the function:**
   - Go to Edge Functions → `generate-storyboard`
   - Click **"Invoke"** tab
   - Use this test payload:
   ```json
   {
     "report": {
       "topic": "Test Research",
       "executiveSummary": "This is a test summary",
       "keyFindings": [
         {"text": "Finding 1", "citations": [1]},
         {"text": "Finding 2", "citations": [2]}
       ]
     },
     "storySpine": "problem-insight-resolution"
   }
   ```
   - Click **"Invoke"**
   - Should return a storyboard structure

2. **Test from Frontend:**
   - Generate a research report
   - Go to Report View
   - Click **"Generate Storyboard"** button
   - Should generate and display storyboard

## Troubleshooting

### Function Not Found (404)
- Check function name is exactly `generate-storyboard`
- Ensure function is deployed (not just saved)
- Check you're in the correct Supabase project

### GEMINI_API_KEY Error
- Go to Edge Functions → Secrets
- Add/verify `GEMINI_API_KEY` secret
- Redeploy function after adding secret

### Timeout Errors
- Storyboard generation can take 30-60 seconds
- Check Supabase function timeout settings
- Consider increasing timeout if needed

### Invalid Response
- Check Gemini API quota/limits
- Verify research report has sufficient content
- Check function logs in Supabase Dashboard

## Function Endpoint

After deployment, the function will be available at:
```
https://<your-project>.supabase.co/functions/v1/generate-storyboard
```

The frontend automatically uses this endpoint when you click "Generate Storyboard".
