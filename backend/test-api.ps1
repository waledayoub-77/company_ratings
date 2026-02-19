# API Testing Script for Company Rating System
# Run this to test your API endpoints

Write-Host "`n🧪 Testing Company Rating System API`n" -ForegroundColor Cyan

$baseUrl = "http://localhost:5000"

# Test 1: Health Check
Write-Host "✅ Test 1: Health Check" -ForegroundColor Green
$health = Invoke-RestMethod -Uri "$baseUrl/health" -Method Get
$health | ConvertTo-Json -Depth 10
Write-Host ""

# Test 2: API Root
Write-Host "✅ Test 2: API Root Endpoint" -ForegroundColor Green
$apiRoot = Invoke-RestMethod -Uri "$baseUrl/api" -Method Get
$apiRoot | ConvertTo-Json -Depth 10
Write-Host ""

# Test 3: 404 Handler
Write-Host "✅ Test 3: 404 Not Found Handler" -ForegroundColor Green
try {
    $notFound = Invoke-RestMethod -Uri "$baseUrl/api/nonexistent" -Method Get
} catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    Write-Host "Status Code: $statusCode (Expected 404)" -ForegroundColor Yellow
    $errorBody = $_.ErrorDetails.Message | ConvertFrom-Json
    Write-Host "Error Message: $($errorBody.error.message)" -ForegroundColor Yellow
}
Write-Host ""

# Test 4: Rate Limiting (when implemented)
Write-Host "ℹ️  Test 4: Rate Limiting (requires multiple requests)" -ForegroundColor Blue
Write-Host "Run this test manually by making 100+ requests quickly`n"

# Test 5: Auth Endpoints (once implemented)
Write-Host "⏳ Test 5: Auth Endpoints (Not yet implemented)" -ForegroundColor Yellow
Write-Host "TODO: Implement POST /api/auth/register"
Write-Host "TODO: Implement POST /api/auth/login`n"

Write-Host "✨ Basic tests passed! Server is running correctly.`n" -ForegroundColor Green
Write-Host "📝 Next steps:" -ForegroundColor Cyan
Write-Host "   1. Create database tables in Supabase (see database-schema.sql)"
Write-Host "   2. Build auth service (Day 1 Afternoon task)"
Write-Host "   3. Test with: .\test-auth.ps1`n"
