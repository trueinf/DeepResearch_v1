# ⚠️ CRITICAL: How to Deploy Edge Functions Correctly

## ❌ COMMON MISTAKE

**DO NOT paste TypeScript code into the SQL Editor!**

If you see this error:
```
ERROR: 42601: syntax error at or near "//"
LINE 1: // @ts-ignore - Deno runtime types
```

**This means you tried to run TypeScript code as SQL!**

---

## ✅ CORRECT WAY: Deploy Edge Functions

### Method 1: Via Supabase Dashboard (Recommended)

1. **Go to Edge Functions Dashboard:**
   ```
   https://supabase.com/dashboard/project/vvrulvxeaejxhwnafwrq/functions
   ```

2. **For each function:**
   - Click on the function name (e.g., `clarify-Questions-gemini`)
   - Click **"Edit"** or **"Update"**
   - Copy ALL code from: `supabase/functions/[function-name]/index.ts`
   - Paste into the code editor
   - Click **"Deploy"** or **"Save"**

3. **Functions to deploy:**
   - `clarify-Questions-gemini`
   - `deep-Research-gemini`
   - `stream-research`
   - `chat-Research`
   - `generate-ppt-agent`

---

### Method 2: Via CLI (If configured)

```bash
# Deploy a single function
npx supabase@latest functions deploy clarify-Questions-gemini --project-ref vvrulvxeaejxhwnafwrq

# Deploy multiple functions
npx supabase@latest functions deploy clarify-Questions-gemini deep-Research-gemini stream-research
```

---

## 📋 What Goes Where?

### SQL Editor (for `.sql` files only):
- ✅ `create_model_configurations_table.sql`
- ✅ `create_profiles_table.sql`
- ✅ `database/schema.sql`
- ✅ Any file ending in `.sql`

### Edge Functions Dashboard (for `.ts` files):
- ✅ `supabase/functions/clarify-Questions-gemini/index.ts`
- ✅ `supabase/functions/deep-Research-gemini/index.ts`
- ✅ `supabase/functions/stream-research/index.ts`
- ✅ Any file in `supabase/functions/*/index.ts`

---

## 🔍 How to Tell the Difference

### SQL Files:
- End with `.sql`
- Contain SQL syntax: `CREATE TABLE`, `INSERT INTO`, `SELECT`, etc.
- No TypeScript/JavaScript code
- Run in **SQL Editor**

### Edge Functions:
- End with `.ts` (TypeScript)
- Contain TypeScript code: `import`, `const`, `function`, etc.
- Have `// @ts-ignore` comments
- Deploy via **Edge Functions Dashboard**

---

## ✅ Quick Checklist

- [ ] I understand SQL files go in SQL Editor
- [ ] I understand TypeScript files go in Edge Functions Dashboard
- [ ] I will NOT paste TypeScript code into SQL Editor
- [ ] I will deploy functions via Dashboard, not SQL Editor

---

## 🆘 If You Already Made This Mistake

1. **Don't worry** - just close the SQL Editor tab
2. **Go to Edge Functions Dashboard** instead
3. **Deploy the function correctly** using Method 1 above
4. **The error will go away** once you deploy correctly

