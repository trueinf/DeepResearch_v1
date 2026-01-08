# API Key Configuration Guide

## Two Different Places for API Keys:

### 1. Edge Function (Supabase)
- **Location**: Supabase Dashboard → Settings → Edge Functions → Secrets
- **Secret Name**: `clarify-Questions`
- **Purpose**: Used by the `clarify-Questions` Edge Function
- **Status**: ✅ Already configured

### 2. Backend Server (Express)
- **Location**: `server/.env` file
- **Variable Name**: `ANTHROPIC_API_KEY`
- **Purpose**: Used by the Express backend for research streaming
- **Status**: ✅ Now configured

## Both Use the Same Key Value

Even though they have different names and locations, both should contain the **same Anthropic API key value**:
- Supabase secret `clarify-Questions` = `sk-ant-...`
- Backend `.env` `ANTHROPIC_API_KEY` = `sk-ant-...` (same key)

## Summary:

✅ **Edge Function**: Uses Supabase secret `clarify-Questions`
✅ **Backend Server**: Uses `ANTHROPIC_API_KEY` from `server/.env`

Both are now configured with your Anthropic API key!

