# Test Transaction Creation

Write-Host "Testing Transaction Creation with ML Prediction..." -ForegroundColor Cyan
Write-Host ""

# First, login to get token
Write-Host "Logging in..." -ForegroundColor Yellow
$loginBody = @{
    email = "testuser@example.com"  # Changed from admin
    password = "Test123!@#"          # Changed password
} | ConvertTo-Json

try {
    $loginResponse = Invoke-RestMethod -Uri "http://localhost:3001/api/auth/login" -Method POST -Body $loginBody -ContentType "application/json"
    $token = $loginResponse.token
    Write-Host "✅ Logged in as: $($loginResponse.user.email)" -ForegroundColor Green
    Write-Host ""
} catch {
    Write-Host "❌ Login failed: $_" -ForegroundColor Red
    exit
}

# Create a test transaction
Write-Host "Creating test transaction..." -ForegroundColor Yellow
$transactionBody = @{
    transaction_id = "txn_test_$(Get-Date -Format 'yyyyMMddHHmmss')"
    user_id = "user_12345"
    merchant_id = "merch_amazon_001"
    merchant_name = "Amazon"
    merchant_category = "retail"
    amount = 299.99
    currency = "USD"
    card_number_last4 = "4242"
    card_type = "credit"
    transaction_type = "purchase"
    ip_address = "192.168.1.100"
    device_id = "device_mobile_001"
    location_lat = 37.7749
    location_lng = -122.4194
    location_country = "USA"
    location_city = "San Francisco"
} | ConvertTo-Json

try {
    $headers = @{
        "Authorization" = "Bearer $token"
        "Content-Type" = "application/json"
    }
    
    Write-Host "Calling ML Service for prediction..." -ForegroundColor Gray
    $response = Invoke-RestMethod -Uri "http://localhost:3001/api/transactions" -Method POST -Headers $headers -Body $transactionBody
    
    Write-Host "✅ Transaction created successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Transaction Details:" -ForegroundColor Cyan
    Write-Host "  ID: $($response.transaction.id)" -ForegroundColor Gray
    Write-Host "  Transaction ID: $($response.transaction.transaction_id)" -ForegroundColor Gray
    Write-Host "  Amount: `$$($response.transaction.amount)" -ForegroundColor Gray
    Write-Host "  Merchant: $($response.transaction.merchant_name)" -ForegroundColor Gray
    Write-Host "  Status: $($response.transaction.status)" -ForegroundColor Gray
    Write-Host ""
    Write-Host "Fraud Prediction:" -ForegroundColor Cyan
    $pred = if ($response.fraud_prediction) { $response.fraud_prediction } else { $response.prediction }
    Write-Host "  Fraud Score: $([math]::Round($pred.fraud_score * 100, 2))%" -ForegroundColor Gray
    Write-Host "  Is Fraud: $($pred.is_fraud)" -ForegroundColor Gray
    Write-Host "  Confidence: $([math]::Round($pred.confidence * 100, 2))%" -ForegroundColor Gray
    Write-Host "  Model Version: $($pred.model_version)" -ForegroundColor Gray
    Write-Host "  Prediction Time: $([math]::Round($pred.prediction_time_ms, 2))ms" -ForegroundColor Gray
    
    if ($pred.is_fraud) {
        Write-Host ""
        Write-Host "  ⚠️  FRAUD DETECTED!" -ForegroundColor Red
        Write-Host "  Fraud Type: $($pred.fraud_type)" -ForegroundColor Red
        Write-Host ""
        Write-Host "Risk Factors:" -ForegroundColor Yellow
        foreach ($factor in $pred.risk_factors) {
            Write-Host "  - $($factor.name): $($factor.value) (contribution: $([math]::Round($factor.contribution * 100, 2))%)" -ForegroundColor Gray
        }
    } else {
        Write-Host ""
        Write-Host "  ✅ Transaction appears legitimate" -ForegroundColor Green
    }
    
    Write-Host ""
    Write-Host "✅ Test completed successfully!" -ForegroundColor Green
    
} catch {
    Write-Host "❌ Transaction creation failed!" -ForegroundColor Red
    Write-Host "Error: $_" -ForegroundColor Red
    
    # Check if ML service is running
    Write-Host ""
    Write-Host "Checking ML Service..." -ForegroundColor Yellow
    try {
        $mlHealth = Invoke-RestMethod -Uri "http://localhost:8000/health" -Method GET
        Write-Host "✅ ML Service is running" -ForegroundColor Green
    } catch {
        Write-Host "❌ ML Service not responding - Please start it:" -ForegroundColor Red
        Write-Host "  cd D:\pr2\backend\ml-service" -ForegroundColor Gray
        Write-Host "  python -m uvicorn app.main:app --reload --port 8000" -ForegroundColor Gray
    }
}