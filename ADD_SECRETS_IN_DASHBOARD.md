# How to Add Secrets in Supabase Dashboard

## 📍 Where to Add Secrets

### Step 1: Navigate to Edge Functions

**Option A: From Left Sidebar**
1. Click on **"Edge Functions"** icon in the left sidebar
2. Or go to: https://supabase.com/dashboard/project/vvrulvxeaejxhwnafwrq/functions

**Option B: From Settings**
1. Click **"Settings"** (gear icon) in left sidebar
2. Under **"CONFIGURATION"**, click **"Edge Functions"** (with external link icon)
3. This opens the Edge Functions page

### Step 2: Find Secrets Section

On the Edge Functions page, look for:
- **"Secrets"** tab or section
- **"Environment Variables"** section
- **"Manage secrets"** button
- Usually located at the top or in a sidebar

### Step 3: Add Secrets

Click **"Add secret"** or **"New secret"** and add:

#### Required Secret:
```
Name: GEMINI_API_KEY
Value: AIzaSyB_3UDdmrqfDh-SlsmLH_uOLbq7REWDP8g
```

#### Optional Secrets (if using Neo4j):
```
Name: NEO4J_URI
Value: neo4j+s://xxxxx.databases.neo4j.io

Name: NEO4J_USER
Value: neo4j

Name: NEO4J_PASSWORD
Value: your-neo4j-password
```

### Step 4: Save

Click **"Save"** or **"Add"** to save the secret.

---

## 🎯 Quick Navigation

**Direct Links:**

1. **Edge Functions Page**:
   https://supabase.com/dashboard/project/vvrulvxeaejxhwnafwrq/functions

2. **Settings → Edge Functions**:
   https://supabase.com/dashboard/project/vvrulvxeaejxhwnafwrq/settings/functions

---

## 📝 What Secrets to Add

### Required:
- ✅ `GEMINI_API_KEY` - Your Gemini API key (from Google AI Studio)

### Optional (for Neo4j):
- `NEO4J_URI` - Neo4j connection URI
- `NEO4J_USER` - Neo4j username
- `NEO4J_PASSWORD` - Neo4j password

---

## 🔍 If You Can't Find Secrets Section

1. **Check Edge Functions Page**:
   - Look for tabs: "Functions", "Secrets", "Logs"
   - Click on "Secrets" tab

2. **Check Project Settings**:
   - Settings → Edge Functions
   - Look for "Environment Variables" or "Secrets"

3. **Alternative**: Use Supabase CLI (after fixing .env file):
   ```powershell
   npx supabase@latest secrets set GEMINI_API_KEY="your-key"
   ```

---

## ✅ After Adding Secrets

1. Secrets are automatically available to all edge functions
2. No need to redeploy functions (they pick up secrets automatically)
3. You can verify by checking function logs

---

**Your Project**: VibeFlow (vvrulvxeaejxhwnafwrq)  
**Required Secret**: `GEMINI_API_KEY`

