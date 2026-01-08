# 🗑️ How to Delete a Supabase Edge Function

## Method 1: Via Supabase Dashboard (Easiest)

### Step-by-Step:

1. **Go to Edge Functions Dashboard:**
   - Visit: https://supabase.com/dashboard/project/vvrulvxeaejxhwnafwrq/functions
   - Or navigate: Dashboard → Your Project → Edge Functions (left sidebar)

2. **Find the Function:**
   - Scroll through the list of functions
   - Find the function you want to delete (e.g., `clarify-Questions-gemini`)

3. **Delete the Function:**
   - Click on the function name to open it
   - Look for a **"Delete"** or **"Remove"** button (usually in the top right or in a menu)
   - Click the three dots (⋯) menu if you don't see a delete button
   - Confirm the deletion when prompted

4. **Alternative:**
   - Some dashboards have a trash/delete icon next to each function in the list
   - Click the delete icon and confirm

---

## Method 2: Via Supabase CLI

### Prerequisites:
- Supabase CLI installed
- Logged in and linked to your project

### Commands:

```bash
# Delete a specific function
supabase functions delete <function-name> --project-ref vvrulvxeaejxhwnafwrq

# Example: Delete clarify-Questions-gemini
supabase functions delete clarify-Questions-gemini --project-ref vvrulvxeaejxhwnafwrq
```

### If you need to login/link first:

```bash
# Login to Supabase
supabase login

# Link to your project (if not already linked)
supabase link --project-ref vvrulvxeaejxhwnafwrq

# Then delete the function
supabase functions delete <function-name> --project-ref vvrulvxeaejxhwnafwrq
```

---

## Method 3: Via Supabase API (Advanced)

If you have API access, you can delete functions programmatically:

```bash
# Get your access token from Supabase Dashboard → Settings → API
# Then use the Management API

curl -X DELETE \
  'https://api.supabase.com/v1/projects/vvrulvxeaejxhwnafwrq/functions/<function-name>' \
  -H 'Authorization: Bearer YOUR_ACCESS_TOKEN' \
  -H 'Content-Type: application/json'
```

---

## ⚠️ Important Notes:

1. **Deletion is Permanent:**
   - Once deleted, the function cannot be recovered
   - Make sure you have a backup of the code if you might need it later

2. **Check Dependencies:**
   - Make sure no other parts of your application are calling this function
   - Check your frontend code for references to the function

3. **Redeploy Instead of Delete:**
   - If you just want to update a function, you can **redeploy** it instead of deleting
   - This is safer and preserves the function history

---

## 🔄 Alternative: Redeploy (Recommended)

Instead of deleting, you can simply **update/redeploy** the function:

1. Go to the function in Dashboard
2. Click "Edit" or "Update"
3. Paste new code
4. Click "Deploy" or "Save"

This updates the function without deleting it.

---

## 📋 Quick Reference

**Project Reference ID:** `vvrulvxeaejxhwnafwrq`

**Dashboard URL:** 
https://supabase.com/dashboard/project/vvrulvxeaejxhwnafwrq/functions

**Common Functions:**
- `clarify-Questions-gemini`
- `deep-Research-gemini`
- `generate-ppt-agent`
- `chat-Research`

---

## ❓ Why Delete a Function?

Common reasons:
- Removing unused/old functions
- Cleaning up test functions
- Replacing with a new version
- Reducing clutter in the dashboard

**Note:** For updates, redeploying is usually better than deleting and recreating.

