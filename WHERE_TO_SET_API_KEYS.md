# Where to Set API Keys

## 🎯 Location: Supabase Dashboard → Edge Functions → Secrets

### Step-by-Step Instructions:

1. **Go to Supabase Dashboard:**
   - Open: https://supabase.com/dashboard/project/vvrulvxeaejxhwnafwrq/functions

2. **Click on "Secrets" tab:**
   - Look for tabs at the top: "Functions", "Secrets", "Logs"
   - Click on **"Secrets"**

3. **Add Required Secrets:**

   Click **"Add secret"** or **"New secret"** button and add:

   #### For Gemini (Required):
   ```
   Name: GEMINI_API_KEY
   Value: [Your Gemini API key from Google AI Studio]
   ```

   #### For Claude (Optional - if using Claude):
   ```
   Name: ANTHROPIC_API_KEY
   Value: [Your Anthropic API key]
   ```

4. **Save:**
   - Click **"Save"** or **"Add"**

---

## 🔑 How to Get API Keys:

### Gemini API Key:
1. Go to: https://aistudio.google.com/
2. Sign in with your Google account
3. Click "Get API Key" or go to API Keys section
4. Create a new API key or copy existing one
5. Paste it as `GEMINI_API_KEY` in Supabase secrets

### Anthropic API Key (if using Claude):
1. Go to: https://console.anthropic.com/
2. Sign in
3. Navigate to API Keys
4. Create or copy your API key
5. Paste it as `ANTHROPIC_API_KEY` in Supabase secrets

---

## 📍 Direct Links:

- **Edge Functions Secrets**: 
  https://supabase.com/dashboard/project/vvrulvxeaejxhwnafwrq/functions

- **Alternative Path**: 
  Settings → Edge Functions → Secrets tab

---

## ✅ After Setting Secrets:

1. **No need to redeploy** - Edge Functions automatically pick up secrets
2. **Test your function** - It should now have access to the API keys
3. **Check logs** - If there are errors, check Edge Function logs

---

## 🔍 Verify Secrets Are Set:

1. Go to Edge Functions → Secrets tab
2. You should see:
   - ✅ `GEMINI_API_KEY` (required)
   - ✅ `ANTHROPIC_API_KEY` (optional, if using Claude)

---

## ⚠️ Important Notes:

- **Never commit API keys** to Git
- **Secrets are encrypted** in Supabase
- **Each Edge Function** can access all secrets
- **Secrets are project-wide** (shared by all functions)

