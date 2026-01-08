# Deploy Edge Functions to Supabase
# This script helps deploy the updated functions

Write-Host "=== Deploy Edge Functions ===" -ForegroundColor Cyan
Write-Host ""

# Check if Supabase CLI is available
$supabaseVersion = npx supabase --version 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "Error: Supabase CLI not found" -ForegroundColor Red
    Write-Host "Please install: npm install -g supabase" -ForegroundColor Yellow
    exit 1
}

Write-Host "Supabase CLI version: $supabaseVersion" -ForegroundColor Green
Write-Host ""

# Functions to deploy
$functions = @(
    "deep-Research-gemini",
    "chat-Research",
    "generate-ppt-agent"
)

Write-Host "IMPORTANT: Deploy via Dashboard instead:" -ForegroundColor Yellow
Write-Host "1. Go to: https://supabase.com/dashboard/project/vvrulvxeaejxhwnafwrq/functions" -ForegroundColor Cyan
Write-Host "2. For each function, click 'Deploy' or 'Redeploy':" -ForegroundColor Cyan
foreach ($func in $functions) {
    Write-Host "   - $func" -ForegroundColor Green
}
Write-Host ""
Write-Host "OR use manual upload:" -ForegroundColor Yellow
Write-Host "1. Open each function in Dashboard" -ForegroundColor Cyan
Write-Host "2. Copy code from: supabase/functions/$func/index.ts" -ForegroundColor Cyan
Write-Host "3. Paste and deploy" -ForegroundColor Cyan

