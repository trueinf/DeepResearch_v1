# Verify Chat-Research Function Integration

## ✅ Frontend Configuration Check

The frontend is correctly configured to call:
- **Function URL**: `${SUPABASE_URL}/functions/v1/chat-Research`
- **Method**: POST
- **Headers**: 
  - `Content-Type: application/json`
  - `Authorization: Bearer ${SUPABASE_ANON_KEY}`

## ✅ Request Body Structure

The frontend sends:
```json
{
  "question": "user's question",
  "report": {
    "topic": "research topic",
    "executiveSummary": "...",
    "detailedAnalysis": "...",
    "keyFindings": [...],
    "insights": "...",
    "conclusion": "...",
    "metadata": "..."
  }
}
```

## ✅ Edge Function Requirements

### 1. Function Name
- Must be exactly: `chat-Research` (case-sensitive)
- URL: `https://vvrulvxeaejxhwnafwrq.supabase.co/functions/v1/chat-Research`

### 2. Secret Configuration
- Secret name: `ANTHROPIC_API_KEY`
- Location: Supabase Dashboard → Settings → Functions → Secrets
- Value: Your Anthropic API key (sk-ant-...)

### 3. Function Code
- Should match: `supabase/functions/chat-Research/index.ts`
- Handles CORS properly
- Validates request body
- Calls Anthropic API with correct format

## 🔍 Testing Checklist

1. **Verify Function Exists**
   - Go to: https://supabase.com/dashboard/project/vvrulvxeaejxhwnafwrq/functions
   - Confirm `chat-Research` function is listed
   - Status should be "Active" or "Deployed"

2. **Verify Secret is Set**
   - Go to: https://supabase.com/dashboard/project/vvrulvxeaejxhwnafwrq/settings/functions
   - Click "Secrets" tab
   - Verify `ANTHROPIC_API_KEY` exists with correct value

3. **Test in Browser**
   - Open your app: http://localhost:5173
   - Complete a research report
   - Click "Ask Follow-up"
   - Ask a question like "What is Sachin's highest ODI score?"
   - Open browser console (F12) to see logs

4. **Check Console Logs**
   - Should see: `Sending chat request:` with request details
   - Should see: `Chat API response:` with the answer
   - If error: Check error details in console

5. **Check Supabase Logs**
   - Go to: https://supabase.com/dashboard/project/vvrulvxeaejxhwnafwrq/functions/chat-Research/logs
   - Look for any errors or warnings

## 🐛 Common Issues

### Issue: 401 Unauthorized
**Fix**: Verify `ANTHROPIC_API_KEY` secret is set correctly

### Issue: 404 Not Found
**Fix**: Verify function name is exactly `chat-Research` (case-sensitive)

### Issue: Empty Response
**Fix**: Check that the research report has content (not just topic)

### Issue: Generic Error Message
**Fix**: Check browser console for detailed error message

## ✅ Expected Behavior

1. User asks a question
2. Question appears in chat (right side, blue bubble)
3. Loading spinner shows on send button
4. Bot response appears (left side, gray bubble)
5. Response is based on the research report content
6. Messages are saved and persist on page reload

## 📝 Next Steps

If everything is configured correctly:
1. The chat should work immediately
2. Test with a completed research report
3. Ask specific questions about the report content
4. Verify answers are accurate and relevant

