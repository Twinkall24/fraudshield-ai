# Test API Endpoints

Write-Host "Testing API Gateway Endpoints..." -ForegroundColor Cyan
Write-Host ""

# Test 1: Health Check
Write-Host "Test 1: Health Check" -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "http://localhost:3001/api/health" -Method GET
    Write-Host "✅ Health check passed" -ForegroundColor Green
    Write-Host "Response: $($response | ConvertTo-Json)" -ForegroundColor Gray
} catch {
    Write-Host "❌ Health check failed: $_" -ForegroundColor Red
}
Write-Host ""

# Test 2: Register User
Write-Host "Test 2: Register New User" -ForegroundColor Yellow
$registerBody = @{
    email = "testuser@example.com"
    password = "Test123!@#"
    role = "analyst"
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "http://localhost:3001/api/auth/register" -Method POST -Body $registerBody -ContentType "application/json"
    Write-Host "✅ User registered successfully" -ForegroundColor Green
    Write-Host "User ID: $($response.user.id)" -ForegroundColor Gray
    Write-Host "Email: $($response.user.email)" -ForegroundColor Gray
    $global:token = $response.token
    Write-Host "Token saved for next requests" -ForegroundColor Gray
} catch {
    Write-Host "⚠️  Registration failed (user might already exist): $_" -ForegroundColor Yellow
}
Write-Host ""

# Test 3: Login
Write-Host "Test 3: Login" -ForegroundColor Yellow
$loginBody = @{
    email = "testuser@example.com"
    password = "Test123!@#"
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "http://localhost:3001/api/auth/login" -Method POST -Body $loginBody -ContentType "application/json"
    Write-Host "✅ Login successful" -ForegroundColor Green
    Write-Host "User: $($response.user.email) ($($response.user.role))" -ForegroundColor Gray
    $global:token = $response.token
    Write-Host "Token: $($global:token.Substring(0, 20))..." -ForegroundColor Gray
} catch {
    Write-Host "❌ Login failed: $_" -ForegroundColor Red
}
Write-Host ""

# Test 4: Get Current User (Protected Route)
Write-Host "Test 4: Get Current User (Protected)" -ForegroundColor Yellow
try {
    $headers = @{
        "Authorization" = "Bearer $global:token"
    }
    $response = Invoke-RestMethod -Uri "http://localhost:3001/api/auth/me" -Method GET -Headers $headers
    Write-Host "✅ Protected route accessed successfully" -ForegroundColor Green
    Write-Host "Current User: $($response.user.email)" -ForegroundColor Gray
} catch {
    Write-Host "❌ Protected route failed: $_" -ForegroundColor Red
}
Write-Host ""

# Test 5: Get Transaction Stats
Write-Host "Test 5: Get Transaction Stats" -ForegroundColor Yellow
try {
    $headers = @{
        "Authorization" = "Bearer $global:token"
    }
    $response = Invoke-RestMethod -Uri "http://localhost:3001/api/transactions/stats" -Method GET -Headers $headers
    Write-Host "✅ Stats retrieved successfully" -ForegroundColor Green
    Write-Host "Total Transactions: $($response.total_transactions)" -ForegroundColor Gray
    Write-Host "Fraud Count: $($response.fraud_count)" -ForegroundColor Gray
    Write-Host "Fraud Rate: $($response.fraud_rate)%" -ForegroundColor Gray
} catch {
    Write-Host "❌ Stats retrieval failed: $_" -ForegroundColor Red
}
Write-Host ""

Write-Host "✅ API Testing Complete!" -ForegroundColor Green