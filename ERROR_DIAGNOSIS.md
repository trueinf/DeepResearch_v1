# Error Diagnosis & Fixes

## Issues Identified:

### 1. HTTP 500 from Edge Function
The `clarify-Questions` function is returning 500 error. Possible causes:
- Invalid model name (`gpt-4.1` - might not be a valid OpenAI model)
- API response format different than expected
- Missing or invalid API key

### 2. Backend Server Not Running
The research endpoint (`/api/research`) requires the Express backend server at `localhost:3001` which isn't running.

## Solutions:

### Fix 1: Check Edge Function Logs
1. Go to: https://supabase.com/dashboard/project/vvrulvxeaejxhwnafwrq/functions/clarify-Questions/logs
2. Check the error logs to see what's causing the 500 error
3. Look for OpenAI API errors or parsing errors

### Fix 2: Start Backend Server
```bash
cd server
npm install  # if not already done
npm run dev
```

### Fix 3: Verify Model Name
The model `gpt-4.1` might not be valid. Check OpenAI docs or try:
- `gpt-4o`
- `gpt-4o-mini`
- `gpt-4-turbo`

