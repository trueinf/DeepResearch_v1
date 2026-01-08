# Check Network Response for More Error Details

## Get More Details from Failed Request

The console shows "Database error saving new user" but the Network tab might have more details.

## Steps:

1. **Open DevTools** → **Network tab**
2. **Find the failed `signup` request** (red, status 500)
3. **Click on it**
4. **Go to "Response" tab** (or "Preview" tab)
5. **Look for JSON response** - it should show:
   ```json
   {
     "error": "Database error saving new user",
     "error_description": "...",
     "hint": "...",
     "message": "..."
   }
   ```
6. **Copy the full response** - especially `error_description` and `hint` fields
7. **These will tell you the exact database constraint/trigger/restriction causing the issue**

## What to Look For:

- `error_description`: More specific error message
- `hint`: Suggestions on how to fix
- `message`: Additional context
- `code`: Error code (if present)

## Share the Response:

Once you have the Network response, share it and we can fix the exact issue!

