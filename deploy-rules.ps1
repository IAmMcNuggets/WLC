# PowerShell script to deploy Firestore rules

Write-Host "Deploying Firestore rules..." -ForegroundColor Cyan
firebase deploy --only firestore:rules

Write-Host "Rules deployment complete!" -ForegroundColor Green 