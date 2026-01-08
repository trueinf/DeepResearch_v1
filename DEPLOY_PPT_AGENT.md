# Deploy Premium PPT Generation Agent

## Quick Deployment Steps

### 1. Access Supabase Dashboard
1. Go to https://supabase.com/dashboard
2. Select your project
3. Navigate to **Edge Functions** in the left sidebar

### 2. Create/Deploy the Function
1. Click **"Create a new function"** or find **"generate-ppt-agent"** if it exists
2. Name it: `generate-ppt-agent`
3. Copy the entire contents of `supabase/functions/generate-ppt-agent/index.ts`
4. Paste into the Supabase code editor
5. Click **"Deploy"** or **"Save"**

### 3. Set Environment Variable
1. Go to **Project Settings** → **Edge Functions** → **Secrets**
2. Ensure `GEMINI_API_KEY` is set with your Google Gemini API key
3. If not set, click **"Add new secret"** and add:
   - Name: `GEMINI_API_KEY`
   - Value: Your Gemini API key

### 4. Verify Deployment
1. Check that the function shows **"Active"** or **"Deployed"** status
2. The function should be accessible at:
   ```
   https://[your-project-ref].supabase.co/functions/v1/generate-ppt-agent
   ```

### 5. Test
1. Go back to your app
2. Open any research report
3. Click **"Generate PPT"**
4. The premium agent should now generate high-quality slides

## What Makes This Agent Premium?

✅ **Industry Best Practices**: Follows Nancy Duarte and Garr Reynolds methodologies  
✅ **Storytelling Arc**: "What is → What could be → Call to action" structure  
✅ **Executive Quality**: C-suite ready, strategic insights, actionable recommendations  
✅ **Visual Intelligence**: Smart layout selection based on content type  
✅ **Content Optimization**: Action-oriented bullets, compelling titles, strategic speaker notes  
✅ **Design Excellence**: Premium color schemes, professional typography recommendations  

## Troubleshooting

**404 Error**: Function not deployed - follow steps above  
**401 Error**: GEMINI_API_KEY not set or invalid  
**500 Error**: Check Supabase function logs for details  

## Function Features

- Generates 10-12 premium slides automatically
- Supports multiple presentation styles (executive, technical, visual, academic)
- Creates compelling titles and action-oriented content
- Provides strategic speaker notes
- Recommends optimal layouts and visual elements
- Follows presentation design best practices

