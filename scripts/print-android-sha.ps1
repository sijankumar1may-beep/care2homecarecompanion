# Print SHA-1 / SHA-256 for Firebase Phone Auth (com.care2home.companion)
$keystore = Join-Path $PSScriptRoot "..\android\app\debug.keystore"
if (-not (Test-Path $keystore)) {
    $keystore = Join-Path $env:USERPROFILE ".android\debug.keystore"
}

Write-Host "Keystore: $keystore"
Write-Host ""
keytool -list -v -alias androiddebugkey -keystore $keystore -storepass android 2>$null | Select-String "SHA1:|SHA256:"
Write-Host ""
Write-Host "Add BOTH SHA-1 and SHA-256 to Firebase Console:"
Write-Host "  Project care2home-ff435 -> Project settings -> Your apps"
Write-Host "  -> Android app 'com.care2home.companion' -> Add fingerprint"
Write-Host "Then download google-services.json and replace the project copy."
Write-Host "Enable Play Integrity API in Google Cloud Console for this project."
