# Database Setup Script for Multi-Company Model
Write-Host "=========================================="
Write-Host "Firebase Database Setup for Multi-Company Model" -ForegroundColor Green
Write-Host "=========================================="
Write-Host ""

# Check for Node.js
try {
    $nodeVersion = node --version
    Write-Host "✓ Node.js detected: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "✗ Node.js is not installed. Please install Node.js and try again." -ForegroundColor Red
    exit 1
}

# Check for Firebase CLI
try {
    $firebaseVersion = firebase --version
    Write-Host "✓ Firebase CLI detected: $firebaseVersion" -ForegroundColor Green
} catch {
    Write-Host "! Firebase CLI not detected. Installing Firebase CLI globally..." -ForegroundColor Yellow
    npm install -g firebase-tools
}

# Install dependencies
Write-Host ""
Write-Host "Installing dependencies for database setup..." -ForegroundColor Cyan
npm install --prefix . firebase-admin --save

# Check for service account key
Write-Host ""
Write-Host "Checking for service account key..." -ForegroundColor Cyan
if (Test-Path -Path "service-account-key.json") {
    Write-Host "✓ Service account key found" -ForegroundColor Green
} else {
    Write-Host "! Service account key not found" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "To complete the setup, you need to get a service account key from Firebase." -ForegroundColor Yellow
    Write-Host "Please follow these steps:" -ForegroundColor Yellow
    Write-Host "1. Go to Firebase Console (https://console.firebase.google.com/)" -ForegroundColor White
    Write-Host "2. Select your project: gigfriendv2-3079b" -ForegroundColor White
    Write-Host "3. Click on Project Settings (gear icon)" -ForegroundColor White
    Write-Host "4. Go to Service accounts tab" -ForegroundColor White
    Write-Host "5. Click 'Generate new private key'" -ForegroundColor White
    Write-Host "6. Save the JSON file as 'service-account-key.json' in this directory" -ForegroundColor White
    Write-Host ""
    
    $confirmation = Read-Host "Have you downloaded and placed the service account key in this directory? (y/n)"
    if ($confirmation -ne "y") {
        Write-Host "Please complete this step before continuing. See GET-SERVICE-ACCOUNT.md for detailed instructions." -ForegroundColor Yellow
        exit 1
    }
}

# Run the initialization script
Write-Host ""
Write-Host "Running database initialization script..." -ForegroundColor Cyan
node firestore-init.js

Write-Host ""
Write-Host "Database setup process complete!" -ForegroundColor Green
Write-Host "Please check the console output above for any errors or warnings." -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Deploy your application to start using the multi-company model" -ForegroundColor White
Write-Host "2. When you sign up as the first user, update the company ownerId in Firestore" -ForegroundColor White
Write-Host "3. Review DATABASE-SETUP.md for more information about the database schema" -ForegroundColor White
Write-Host "" 