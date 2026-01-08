# ⚠️ CRITICAL: How to Deploy Functions Correctly

## ❌ Common Mistake

**DO NOT** copy from `.md` files (markdown documentation)
**DO** copy from `.ts` files (TypeScript code)

## ✅ Correct Way to Deploy

### Step 1: Open the TypeScript File

**For `build-research-graph`:**
- Open: `supabase/functions/build-research-graph/index.ts`
- This is a `.ts` file (TypeScript), NOT a `.md` file

**For `get-research-graph`:**
- Open: `supabase/functions/get-research-graph/index.ts`
- This is a `.ts` file (TypeScript), NOT a `.md` file

### Step 2: Copy ALL the Code

1. Open the `.ts` file in your code editor
2. Select ALL the code (Ctrl+A)
3. Copy it (Ctrl+C)

### Step 3: Deploy in Supabase Dashboard

1. Go to: https://supabase.com/dashboard
2. Select your project
3. Go to: **Edge Functions**
4. Click **"Create Function"** or edit existing
5. **Name**: `build-research-graph` (or `get-research-graph`)
6. **Paste the TypeScript code** into the code editor
7. Click **"Deploy"**

## 📁 File Locations

✅ **CORRECT FILES TO COPY:**
- `supabase/functions/build-research-graph/index.ts` ← Copy this
- `supabase/functions/get-research-graph/index.ts` ← Copy this

❌ **WRONG FILES (DO NOT COPY):**
- `DEPLOY_GRAPH_FUNCTIONS.md` ← This is documentation, NOT code
- `FIX_ALL_ISSUES_NOW.md` ← This is documentation, NOT code
- Any `.md` file ← These are guides, NOT code

## 🎯 Quick Checklist

- [ ] Open `.ts` file (TypeScript), NOT `.md` file (Markdown)
- [ ] Copy ALL code from the `.ts` file
- [ ] Paste into Supabase Dashboard Edge Function editor
- [ ] Click "Deploy"

## 💡 Visual Guide

**What the file should look like when you open it:**

```typescript
// @ts-ignore - Deno runtime types
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

// @ts-ignore - Deno runtime
const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY')
...
```

**NOT like this (this is markdown):**

```markdown
# Deploy Graph Functions - Fix 500 Errors
...
```

## ✅ After Deployment

Once you deploy the correct `.ts` files:
- ✅ No parsing errors
- ✅ Functions will work
- ✅ 500 errors will be resolved

