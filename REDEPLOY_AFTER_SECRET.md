# Redeploy Functions After Setting GEMINI_API_KEY

## ⚠️ Important: Functions Must Be Redeployed

After setting the `GEMINI_API_KEY` secret in Supabase, you **must redeploy** the Edge Functions for them to pick up the new secret.

## Quick Fix Steps

### Step 1: Verify Secret is Set
1. Go to Supabase Dashboard → Project Settings → Edge Functions → Secrets
2. Verify `GEMINI_API_KEY` exists and has a value
3. Make sure the name is exactly `GEMINI_API_KEY` (case-sensitive)

### Step 2: Redeploy the Functions

#### Option A: Via Supabase Dashboard (Recommended)

1. **Go to Edge Functions**
   - Navigate to: https://supabase.com/dashboard/project/vvrulvxeaejxhwnafwrq/functions
   - Or: Dashboard → Edge Functions (left sidebar)

2. **Redeploy Each Function:**
   
   **For `clarify-Questions-gemini`:**
   - Click on `clarify-Questions-gemini` function
   - Click **"Deploy"** or **"Redeploy"** button (top right)
   - Wait for deployment to complete (10-30 seconds)
   
   **For `deep-Research-gemini`:**
   - Click on `deep-Research-gemini` function
   - Click **"Deploy"** or **"Redeploy"** button
   - Wait for deployment
   
   **For `chat-Research`:**
   - Click on `chat-Research` function
   - Click **"Deploy"** or **"Redeploy"** button
   - Wait for deployment
   
   **For `generate-ppt-agent`:**
   - Click on `generate-ppt-agent` function
   - Click **"Deploy"** or **"Redeploy"** button
   - Wait for deployment

3. **Verify Deployment**
   - Each function should show **"Active"** or **"Deployed"** status
   - Check for any error messages

#### Option B: Via Supabase CLI (If Installed)

```bash
# Login first
npx supabase login

# Link project
npx supabase link --project-ref vvrulvxeaejxhwnafwrq

# Redeploy all functions
npx supabase functions deploy clarify-Questions-gemini
npx supabase functions deploy deep-Research-gemini
npx supabase functions deploy chat-Research
npx supabase functions deploy generate-ppt-agent
```

### Step 3: Wait for Propagation
- Wait 10-30 seconds after deployment
- Secrets and deployments take a moment to propagate

### Step 4: Test
1. Go back to your app: http://localhost:5184
2. **Hard refresh** the page (Ctrl+Shift+R or Cmd+Shift+R)
3. Try the clarify questions feature again
4. The error should be gone! ✅

## Why Redeployment is Needed

Edge Functions are deployed with a snapshot of the environment at deployment time. When you add a new secret:
- ✅ The secret is stored in Supabase
- ❌ But existing function deployments don't know about it yet
- ✅ Redeploying creates a new deployment with the updated environment

## Troubleshooting

**Still getting "GEMINI_API_KEY secret not configured"?**

1. **Double-check secret name:**
   - Must be exactly `GEMINI_API_KEY` (case-sensitive)
   - No spaces, no typos

2. **Verify secret has a value:**
   - In Supabase Dashboard → Secrets
   - Click on `GEMINI_API_KEY` to verify it has a value
   - Make sure it's not empty

3. **Check function deployment status:**
   - Go to Edge Functions
   - Make sure all functions show "Active" or "Deployed"
   - If any show "Error", click on it to see details

4. **Wait longer:**
   - Sometimes it takes 1-2 minutes for changes to fully propagate
   - Try again after waiting

5. **Check function logs:**
   - Go to Edge Functions → Select function → Logs tab
   - Look for any error messages
   - Check if the secret is being read correctly

6. **Verify API key is valid:**
   - Test your Gemini API key at: https://aistudio.google.com/apikey
   - Make sure it has access to Gemini 3.0 Pro Preview

## Functions That Need GEMINI_API_KEY

Make sure these functions are deployed and have access to the secret:
- ✅ `clarify-Questions-gemini` (most important for your current error)
- ✅ `deep-Research-gemini`
- ✅ `chat-Research`
- ✅ `generate-ppt-agent`

## Quick Test

After redeploying, test the function directly:

```bash
curl -X POST https://vvrulvxeaejxhwnafwrq.supabase.co/functions/v1/clarify-Questions-gemini \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"input": "test query"}'
```

If you get a response (not an error), the secret is working!

