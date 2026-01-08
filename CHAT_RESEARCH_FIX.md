# Chat-Research Function Fix

## Changes Made

1. **Enhanced Error Handling**: Added detailed error messages and logging
2. **Better Request Validation**: Validates report structure and content
3. **Improved Error Messages**: More specific error messages for different failure scenarios
4. **Console Logging**: Added logging to help debug issues

## Deployment Checklist

### 1. Verify Function Name
- Function name must be exactly: `chat-Research` (case-sensitive)
- URL pattern: `${SUPABASE_URL}/functions/v1/chat-Research`

### 2. Set the Secret
Go to: https://supabase.com/dashboard/project/vvrulvxeaejxhwnafwrq/settings/functions

**Secrets Tab:**
- Name: `ANTHROPIC_API_KEY` (exact name, case-sensitive)
- Value: Your Anthropic API key (sk-ant-...)
- Click "Save"

**Important**: The secret name must be `ANTHROPIC_API_KEY` (not `chat-Research`)

### 3. Deploy the Updated Function
1. Go to: https://supabase.com/dashboard/project/vvrulvxeaejxhwnafwrq/functions
2. Find `chat-Research` function
3. Click "Edit"
4. Copy the entire code from `supabase/functions/chat-Research/index.ts`
5. Paste and click "Deploy"

### 4. Test the Function
After deployment, check the browser console when testing the chat. You should see:
- `Chat request received:` - Shows what data was received
- `Chat API response:` - Shows the response from Anthropic
- Any error messages will be more detailed

## Common Issues

### Issue 1: 401 Unauthorized
**Cause**: Secret not set or wrong name
**Fix**: 
- Verify secret name is exactly `ANTHROPIC_API_KEY`
- Verify the API key value is correct
- Redeploy the function after setting the secret

### Issue 2: Function Not Found (404)
**Cause**: Function name mismatch
**Fix**: 
- Verify function name is exactly `chat-Research` (capital R)
- Check the URL in the frontend matches

### Issue 3: Empty Report Error
**Cause**: Report data is missing or incomplete
**Fix**: 
- Ensure the research report is fully completed
- Check that report has at least `topic` and some content

### Issue 4: Generic Error Message
**Cause**: Error details not being shown
**Fix**: 
- Check browser console for detailed error messages
- The error message in chat now includes the actual error

## Testing

1. Complete a research report
2. Click "Ask Follow-up"
3. Ask a question like "What is Sachin's highest ODI score?"
4. Check browser console (F12) for logs
5. The chat should now show specific error messages if something fails

## Next Steps

If errors persist:
1. Check Supabase function logs: https://supabase.com/dashboard/project/vvrulvxeaejxhwnafwrq/functions/chat-Research/logs
2. Check browser console for detailed error messages
3. Verify the secret is set correctly
4. Verify the function is deployed with the latest code

