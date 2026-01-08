# Advanced Model Management Implementation Guide

## ✅ What's Been Implemented

### 1. Dynamic Model Loading from Supabase
- ✅ Created `model_configurations` table SQL script
- ✅ Created `useModels.js` hook to fetch models dynamically
- ✅ Updated `TopBar.jsx` to use dynamic models
- ✅ Updated `Home.jsx` to use dynamic models

### 2. Multi-Model Failover
- ✅ Enhanced `deep-Research-gemini` with Claude fallback
- ✅ Fallback chain: Gemini 3 Pro → Gemini 1.5 Pro → Claude Sonnet 4

### 3. Auto-Seeding Default Models
- ✅ SQL script seeds default models on table creation
- ✅ Models are automatically available after running SQL

### 4. Streaming Reasoning Tokens
- ✅ Created `stream-research` Edge Function
- ✅ Created `useResearchStream.js` hook
- ✅ Created `ReasoningPanel.jsx` component

## 📋 Setup Steps

### Step 1: Create Model Configurations Table

1. Go to Supabase Dashboard → SQL Editor
2. Run: `create_model_configurations_table.sql`
3. This creates the table and seeds default models

### Step 2: Deploy Edge Functions

Deploy these functions:
1. `deep-Research-gemini` (with failover logic)
2. `stream-research` (for streaming)

### Step 3: Update Frontend

The frontend code is already updated:
- `TopBar.jsx` - Uses dynamic models
- `Home.jsx` - Uses dynamic models
- `ReasoningPanel.jsx` - Ready to use

### Step 4: Add Reasoning Panel (Optional)

To show reasoning tokens, add to `ResearchProgress.jsx`:

```jsx
import { ReasoningPanel } from '../components/ReasoningPanel'

// In your component:
<ReasoningPanel 
  researchId={id} 
  prompt={researchPrompt} 
  model={researchModel} 
/>
```

## 🔄 How It Works

### Model Selection Flow:
1. User selects model from dropdown
2. Dropdown loads models from `model_configurations` table
3. If table doesn't exist, uses fallback models
4. Model ID is sent to Edge Function

### Failover Flow:
1. Try selected Gemini model
2. If 404 → Try Gemini 1.5 Pro
3. If still fails → Try Claude Sonnet 4
4. If all fail → Return error

### Streaming Flow:
1. Frontend calls `stream-research` function
2. Function streams tokens via SSE
3. `useResearchStream` hook receives tokens
4. `ReasoningPanel` displays tokens in real-time

## 🎯 Next Steps

1. **Run SQL script** to create `model_configurations` table
2. **Deploy updated functions** to Supabase
3. **Test model selection** - should see dynamic models
4. **Test failover** - should auto-fallback if model unavailable
5. **Add ReasoningPanel** to ResearchProgress page (optional)

## 📝 Model Configuration Format

Models are stored as:
```
Provider: Gemini Model: gemini-3.0-pro-preview
Provider: Claude Model: claude-sonnet-4-20250514
```

To add new models, insert into `model_configurations` table:
```sql
INSERT INTO model_configurations (document_content, is_active)
VALUES ('Provider: Gemini Model: gemini-2.0-pro', true);
```

