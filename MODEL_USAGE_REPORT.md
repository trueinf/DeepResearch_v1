# Current Model Usage Report

## 📊 Summary

**Total Models Found:** 5 different Gemini models
**Functions Using Models:** 12+ edge functions
**Frontend Components:** 5+ components

## 🔍 Current Models Being Used

### 1. **gemini-3.0-pro-preview** (Frontend Default)
- **Used in:**
  - `src/App.jsx` - Default state
  - `src/pages/Home.jsx` - Default prop
  - `src/components/TopBar.jsx` - Only option shown
  - `src/pages/ReportView.jsx` - Fallback
  - `src/pages/ResearchProgress.jsx` - Fallback
- **Status:** ⚠️ May not be available in all regions

### 2. **gemini-1.5-pro** (Backend Default - Most Reliable)
- **Used in:**
  - `supabase/functions/deep-Research-gemini/index.ts` - Default (just updated)
  - Fallback in multiple functions
- **Status:** ✅ Fully functional, globally available

### 3. **gemini-1.5-flash** (Fast Alternative)
- **Used in:**
  - Fallback option in `deep-Research-gemini`
- **Status:** ✅ Fully functional, globally available

### 4. **gemini-2.0-flash-lite** (Legacy - Multiple Functions)
- **Used in:**
  - `supabase/functions/chat-Research/index.ts`
  - `supabase/functions/clarify-Questions-gemini/index.ts`
  - `supabase/functions/graph-entities/index.ts`
  - `supabase/functions/build-research-graph/index.ts`
  - `supabase/functions/extract-causal-relationships/index.ts`
  - `supabase/functions/extract-trend-signals/index.ts`
  - `supabase/functions/graph-relationships/index.ts`
- **Status:** ⚠️ May be deprecated or unavailable

### 5. **gemini-1.5-pro-latest** (Stream Research)
- **Used in:**
  - `supabase/functions/stream-research/index.ts`
- **Status:** ✅ Should work (same as 1.5-pro)

## 🎯 Recommendation: Standardize to ONE Model

**Recommended Model:** `gemini-1.5-pro`

**Why:**
- ✅ Most reliable and widely available
- ✅ Best quality for research tasks
- ✅ Works in all regions
- ✅ No special permissions needed
- ✅ Already set as backend default

## 📝 Files That Need Updates

### Frontend (5 files):
1. `src/App.jsx` - Change default from `gemini-3.0-pro-preview` to `gemini-1.5-pro`
2. `src/pages/Home.jsx` - Change default from `gemini-3.0-pro-preview` to `gemini-1.5-pro`
3. `src/components/TopBar.jsx` - Update model list to show `gemini-1.5-pro`
4. `src/pages/ReportView.jsx` - Change fallback to `gemini-1.5-pro`
5. `src/pages/ResearchProgress.jsx` - Change fallback to `gemini-1.5-pro`

### Backend (8+ files):
1. `supabase/functions/chat-Research/index.ts` - Change from `gemini-2.0-flash-lite`
2. `supabase/functions/clarify-Questions-gemini/index.ts` - Change from `gemini-2.0-flash-lite`
3. `supabase/functions/graph-entities/index.ts` - Change from `gemini-2.0-flash-lite`
4. `supabase/functions/build-research-graph/index.ts` - Change from `gemini-2.0-flash-lite`
5. `supabase/functions/extract-causal-relationships/index.ts` - Change from `gemini-2.0-flash-lite`
6. `supabase/functions/extract-trend-signals/index.ts` - Change from `gemini-2.0-flash-lite`
7. `supabase/functions/graph-relationships/index.ts` - Change from `gemini-2.0-flash-lite`
8. `supabase/functions/stream-research/index.ts` - Change from `gemini-1.5-pro-latest` to `gemini-1.5-pro`

## ✅ Benefits of Standardization

1. **Consistency** - Same model behavior across all features
2. **Reliability** - No more "model not found" errors
3. **Simplicity** - Easier to maintain and debug
4. **Cost Predictability** - Single pricing model
5. **Better Support** - Focus on one model's capabilities

