# 🔑 How to Set API Keys in Supabase

## ❌ Current Error:
```
API key error. Please check your Gemini or Claude API key configuration in Supabase.
```

**This means the API keys are NOT set in Supabase Secrets!**

---

## ✅ Solution: Set API Keys in Supabase Secrets

### Step 1: Go to Supabase Dashboard

1. Open: https://supabase.com/dashboard/project/vvrulvxeaejxhwnafwrq
2. Click **"Edge Functions"** in the left sidebar
3. Click **"Secrets"** tab (at the top)

**OR**

Go directly to:
```
https://supabase.com/dashboard/project/vvrulvxeaejxhwnafwrq/functions
```
Then click the **"Secrets"** tab.

---

### Step 2: Add Required Secrets

Click **"Add secret"** or **"New secret"** button and add:

#### 1. Gemini API Key (REQUIRED):
```
Name: GEMINI_API_KEY
Value: [Your Gemini API key]
```

**How to get Gemini API key:**
1. Go to: https://aistudio.google.com/app/apikey
2. Sign in with your Google account
3. Click "Create API Key" or copy existing key
4. Paste it as the value for `GEMINI_API_KEY`

#### 2. Claude API Key (OPTIONAL - only if using Claude):
```
Name: ANTHROPIC_API_KEY
Value: [Your Claude API key]
```

**How to get Claude API key:**
1. Go to: https://console.anthropic.com/
2. Sign in
3. Navigate to API Keys
4. Create or copy your API key
5. Paste it as the value for `ANTHROPIC_API_KEY`

---

### Step 3: Save

1. Click **"Save"** or **"Add"** for each secret
2. Wait a few seconds for secrets to be saved
3. Verify both secrets appear in the list

---

### Step 4: Verify Secrets Are Set

In the Secrets tab, you should see:
- ✅ `GEMINI_API_KEY` (required)
- ✅ `ANTHROPIC_API_KEY` (optional, if using Claude)

---

## 🔍 Troubleshooting

### If you don't see "Secrets" tab:
1. Make sure you're in the **Edge Functions** section
2. Look for tabs: "Functions", "Secrets", "Logs"
3. Click on "Secrets" tab

### If secrets don't work after setting:
1. **Wait 10-30 seconds** - Secrets take a moment to propagate
2. **Redeploy the function** - Functions need to be redeployed to pick up new secrets
3. **Check function logs** - Look for errors about missing API keys

### If you get "API key not configured" error:
1. Verify the secret name is **exactly**: `GEMINI_API_KEY` (case-sensitive)
2. Verify the secret value is correct (no extra spaces)
3. Redeploy the function after setting secrets

---

## ✅ After Setting Secrets

1. **Redeploy your functions:**
   - `deep-Research-gemini`
   - `stream-research`
   - `clarify-Questions-gemini`

2. **Refresh your browser**

3. **Test the research flow again**

The API key error should be resolved!

---

## 📋 Quick Checklist

- [ ] Opened Supabase Dashboard → Edge Functions → Secrets
- [ ] Added `GEMINI_API_KEY` secret with your Gemini API key
- [ ] Added `ANTHROPIC_API_KEY` secret (if using Claude)
- [ ] Saved both secrets
- [ ] Redeployed functions
- [ ] Refreshed browser
- [ ] Tested research flow

---

## 🎯 Direct Links

- **Edge Functions Secrets**: 
  https://supabase.com/dashboard/project/vvrulvxeaejxhwnafwrq/functions → Secrets tab

- **Get Gemini API Key**: 
  https://aistudio.google.com/app/apikey

- **Get Claude API Key**: 
  https://console.anthropic.com/

