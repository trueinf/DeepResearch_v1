# Set GEMINI_API_KEY Secret in Supabase

## Quick Fix for "GEMINI_API_KEY secret not configured" Error

### Step-by-Step Instructions:

1. **Open Supabase Dashboard**
   - Go to: https://supabase.com/dashboard
   - Sign in if needed

2. **Select Your Project**
   - Find and click on your project (ID: `vvrulvxeaejxhwnafwrq`)

3. **Navigate to Edge Functions Secrets**
   - Click **"Project Settings"** (gear icon) in the left sidebar
   - Click **"Edge Functions"** in the settings menu
   - Click **"Secrets"** tab

4. **Add the Secret**
   - Click **"Add new secret"** or **"New Secret"** button
   - **Name:** `GEMINI_API_KEY` (exact name, case-sensitive)
   - **Value:** Paste your Gemini 3.0 Pro Preview API key
   - Click **"Save"** or **"Add"**

5. **Verify**
   - You should see `GEMINI_API_KEY` in the secrets list
   - The value should be masked (showing only `••••••••`)

6. **Test**
   - Go back to your app: http://localhost:5184
   - Refresh the page
   - Try the clarify questions feature again
   - The error should be gone! ✅

## Alternative: Using Supabase CLI (if installed)

If you have Supabase CLI installed, you can set it via command line:

```bash
supabase secrets set GEMINI_API_KEY=your-api-key-here
```

## Where to Get Your Gemini API Key

1. Go to: https://aistudio.google.com/apikey
2. Sign in with your Google account
3. Click **"Create API Key"**
4. Copy the API key
5. Paste it in the Supabase secret value field

## Functions That Need This Secret

The following Edge Functions require `GEMINI_API_KEY`:
- ✅ `clarify-Questions-gemini`
- ✅ `deep-Research-gemini`
- ✅ `chat-Research`
- ✅ `generate-ppt-agent`

Once you set the secret, all these functions will work!

## Troubleshooting

**Still getting the error?**
- Make sure the secret name is exactly `GEMINI_API_KEY` (case-sensitive)
- Wait 10-30 seconds after saving (secrets take a moment to propagate)
- Refresh your browser and try again
- Check that your API key is valid and has access to Gemini 3.0 Pro Preview

**API Key Invalid?**
- Verify your API key at: https://aistudio.google.com/apikey
- Make sure you have access to Gemini 3.0 Pro Preview model
- Check your Google Cloud billing is set up correctly

