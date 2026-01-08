# How to Deploy Supabase Edge Functions

## 📋 Prerequisites

1. **Supabase CLI installed**
   - Check: `supabase --version`
   - If not installed, see installation steps below

2. **Logged into Supabase**
   - Run: `supabase login`

3. **Linked to your project**
   - Run: `supabase link --project-ref your-project-ref`

---

## 🚀 Quick Deployment

### Step 1: Install Supabase CLI (If Not Installed)

#### Windows (PowerShell)
```powershell
# Using Scoop (recommended)
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase

# Or using npm
npm install -g supabase
```

#### macOS
```bash
brew install supabase/tap/supabase
```

#### Linux
```bash
# Download binary
curl -fsSL https://github.com/supabase/cli/releases/latest/download/supabase_linux_amd64.tar.gz | tar -xz
sudo mv supabase /usr/local/bin/
```

### Step 2: Login to Supabase

```bash
supabase login
```

This will open your browser to authenticate. After login, you'll get an access token.

### Step 3: Link to Your Project

```bash
# Get your project reference from Supabase Dashboard
# Go to: Project Settings → General → Reference ID

supabase link --project-ref your-project-ref
```

**Where to find project-ref:**
1. Go to Supabase Dashboard
2. Select your project
3. Go to Settings → General
4. Copy the "Reference ID" (looks like: `abcdefghijklmnop`)

### Step 4: Deploy Edge Functions

#### Deploy build-research-graph
```bash
supabase functions deploy build-research-graph
```

#### Deploy get-research-graph
```bash
supabase functions deploy get-research-graph
```

#### Deploy Both at Once
```bash
supabase functions deploy build-research-graph get-research-graph
```

---

## 🔐 Setting Secrets (Environment Variables)

Edge functions need secrets for API keys and database connections.

### Required Secrets

```bash
# Gemini API Key (required)
supabase secrets set GEMINI_API_KEY="your-gemini-api-key"

# Neo4j (optional - only if using Neo4j)
supabase secrets set NEO4J_URI="neo4j+s://xxxxx.databases.neo4j.io"
supabase secrets set NEO4J_USER="neo4j"
supabase secrets set NEO4J_PASSWORD="your-neo4j-password"
```

### How to Set Secrets

1. **Get your Gemini API Key**
   - Go to: https://aistudio.google.com/app/apikey
   - Create or copy your API key

2. **Set the secret**
   ```bash
   supabase secrets set GEMINI_API_KEY="your-actual-key-here"
   ```

3. **Verify secrets are set**
   ```bash
   supabase secrets list
   ```

---

## 📝 Step-by-Step Deployment Guide

### Complete Deployment Process

```bash
# 1. Check Supabase CLI is installed
supabase --version

# 2. Login (if not already logged in)
supabase login

# 3. Link to your project
supabase link --project-ref YOUR_PROJECT_REF

# 4. Set required secrets
supabase secrets set GEMINI_API_KEY="your-gemini-key"

# 5. Deploy functions
supabase functions deploy build-research-graph
supabase functions deploy get-research-graph

# 6. Verify deployment
supabase functions list
```

---

## 🔍 Verify Deployment

### Check Functions Are Deployed

```bash
supabase functions list
```

You should see:
- `build-research-graph`
- `get-research-graph`

### Test Functions

#### Test build-research-graph
```bash
curl -X POST \
  'https://YOUR_PROJECT_REF.supabase.co/functions/v1/build-research-graph' \
  -H 'Authorization: Bearer YOUR_ANON_KEY' \
  -H 'Content-Type: application/json' \
  -d '{
    "report": {
      "topic": "Test topic",
      "executiveSummary": "Test summary"
    },
    "researchId": "test-id"
  }'
```

#### Test get-research-graph
```bash
curl -X POST \
  'https://YOUR_PROJECT_REF.supabase.co/functions/v1/get-research-graph' \
  -H 'Authorization: Bearer YOUR_ANON_KEY' \
  -H 'Content-Type: application/json' \
  -d '{
    "researchId": "test-id"
  }'
```

---

## 🐛 Troubleshooting

### Error: "command not found: supabase"

**Solution**: Install Supabase CLI (see Step 1 above)

### Error: "Not logged in"

**Solution**: 
```bash
supabase login
```

### Error: "Project not linked"

**Solution**:
```bash
supabase link --project-ref YOUR_PROJECT_REF
```

### Error: "Function not found"

**Solution**: 
- Make sure you're in the project root directory
- Check function exists: `ls supabase/functions/`
- Verify function name matches exactly

### Error: "Secret not found"

**Solution**:
```bash
# Set the secret
supabase secrets set GEMINI_API_KEY="your-key"

# Verify it's set
supabase secrets list
```

### Error: "Permission denied"

**Solution**:
- Make sure you're logged in: `supabase login`
- Verify you have access to the project
- Check project settings in Supabase Dashboard

### Deployment Takes Too Long

**Solution**:
- Check your internet connection
- Try deploying one function at a time
- Check Supabase status: https://status.supabase.com/

---

## 📋 Deployment Checklist

Before deploying:
- [ ] Supabase CLI installed
- [ ] Logged into Supabase
- [ ] Project linked
- [ ] Secrets set (GEMINI_API_KEY at minimum)
- [ ] Function files exist in `supabase/functions/`

After deploying:
- [ ] Functions appear in `supabase functions list`
- [ ] Functions accessible via API
- [ ] Test with curl or from frontend
- [ ] Check Supabase Dashboard → Edge Functions

---

## 🎯 Quick Reference

### Common Commands

```bash
# Login
supabase login

# Link project
supabase link --project-ref YOUR_REF

# Deploy function
supabase functions deploy FUNCTION_NAME

# List functions
supabase functions list

# Set secret
supabase secrets set KEY="value"

# List secrets
supabase secrets list

# View logs
supabase functions logs FUNCTION_NAME

# Delete function
supabase functions delete FUNCTION_NAME
```

### Function URLs

After deployment, functions are available at:
```
https://YOUR_PROJECT_REF.supabase.co/functions/v1/FUNCTION_NAME
```

---

## 🔄 Updating Functions

To update a deployed function:

```bash
# Make changes to function code
# Then redeploy
supabase functions deploy FUNCTION_NAME
```

The function will be updated immediately (no downtime).

---

## 📊 Monitor Functions

### View Logs

```bash
# View logs for a function
supabase functions logs build-research-graph

# Follow logs in real-time
supabase functions logs build-research-graph --follow
```

### In Supabase Dashboard

1. Go to: Supabase Dashboard → Edge Functions
2. Click on function name
3. View logs, metrics, and settings

---

## 🚨 Important Notes

1. **Secrets are encrypted** - They're stored securely and only accessible to edge functions
2. **Function names are case-sensitive** - Use exact names: `build-research-graph` not `Build-Research-Graph`
3. **Deployment is instant** - Functions update immediately after deployment
4. **Cold starts** - First request may be slower (function needs to start)
5. **Timeout** - Functions have a default timeout (check Supabase limits)

---

## ✅ Success Indicators

You'll know deployment succeeded when:

1. ✅ Command shows "Deployed successfully"
2. ✅ Function appears in `supabase functions list`
3. ✅ Function appears in Supabase Dashboard
4. ✅ Function responds to API calls
5. ✅ No errors in function logs

---

## 📞 Need Help?

- **Supabase Docs**: https://supabase.com/docs/guides/functions
- **Supabase CLI Docs**: https://supabase.com/docs/reference/cli
- **Community**: https://github.com/supabase/supabase/discussions

---

**Last Updated**: [Date]  
**Version**: 1.0

