# Setup Advanced Model Management Features

## ✅ Implementation Complete

All code has been created and updated. Here's what to do next:

## 📋 Step-by-Step Setup

### Step 1: Create Model Configurations Table

1. **Go to Supabase Dashboard** → SQL Editor
2. **Open**: `create_model_configurations_table.sql`
3. **Copy all SQL** and paste into SQL Editor
4. **Click "Run"**

This will:
- Create `model_configurations` table
- Seed 4 default models
- Set up RLS policies

### Step 2: Deploy Edge Functions

Deploy these 2 functions:

#### A. Update `deep-Research-gemini`
1. Go to: https://supabase.com/dashboard/project/vvrulvxeaejxhwnafwrq/functions/deep-Research-gemini
2. Copy code from: `supabase/functions/deep-Research-gemini/index.ts`
3. Paste and deploy

#### B. Deploy `stream-research` (NEW)
1. Go to: https://supabase.com/dashboard/project/vvrulvxeaejxhwnafwrq/functions
2. Click "Deploy a new function"
3. Name: `stream-research`
4. Copy code from: `supabase/functions/stream-research/index.ts`
5. Paste and deploy

### Step 3: Verify Frontend Updates

The frontend is already updated:
- ✅ `TopBar.jsx` - Uses dynamic models
- ✅ `Home.jsx` - Uses dynamic models
- ✅ `useModels.js` - Fetches from Supabase
- ✅ `ReasoningPanel.jsx` - Ready to use

### Step 4: Test

1. **Refresh your browser** (F5)
2. **Check model dropdown** - Should show models from Supabase
3. **Start a research** - Should use selected model
4. **If model fails** - Should auto-fallback to Claude

## 🎯 Features Now Available

### 1. Dynamic Model Loading
- Models loaded from Supabase `model_configurations` table
- Add new models by inserting into table
- Models grouped by provider (Gemini, Claude)

### 2. Multi-Model Failover
- **Primary**: Selected model (e.g., Gemini 3 Pro)
- **Fallback 1**: Gemini 1.5 Pro (if 3 Pro unavailable)
- **Fallback 2**: Claude Sonnet 4 (if all Gemini fail)
- **Automatic** - No user intervention needed

### 3. Streaming Reasoning (Optional)
- Call `stream-research` function for live tokens
- Use `ReasoningPanel` component to display
- Shows model "thinking" in real-time

## 🔧 Adding New Models

To add a new model, run this SQL:

```sql
INSERT INTO model_configurations (document_content, is_active)
VALUES ('Provider: Gemini Model: gemini-2.0-pro', true);
```

The model will appear in dropdowns automatically!

## 📝 Model Format

Models must follow this format:
```
Provider: [ProviderName] Model: [model-id]
```

Examples:
- `Provider: Gemini Model: gemini-3.0-pro-preview`
- `Provider: Claude Model: claude-sonnet-4-20250514`
- `Provider: OpenAI Model: gpt-4`

## ✅ Verification Checklist

- [ ] `model_configurations` table created
- [ ] Default models seeded
- [ ] `deep-Research-gemini` deployed with failover
- [ ] `stream-research` deployed (optional)
- [ ] Frontend shows dynamic models
- [ ] Failover works (test with unavailable model)

## 🚀 After Setup

Your application now has:
- ✅ Dynamic model management
- ✅ Automatic failover
- ✅ Easy model addition via database
- ✅ Streaming support (ready to use)

Everything is ready! Just run the SQL and deploy the functions.

