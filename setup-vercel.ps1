# Script PowerShell pour configurer Vercel automatiquement
# Usage: .\setup-vercel.ps1

Write-Host "🚀 Configuration automatique de Vercel..." -ForegroundColor Cyan
Write-Host ""

# Vérifier si Vercel CLI est installé
$vercelInstalled = Get-Command vercel -ErrorAction SilentlyContinue
if (-not $vercelInstalled) {
    Write-Host "❌ Vercel CLI n'est pas installé" -ForegroundColor Red
    Write-Host "📦 Installation de Vercel CLI..." -ForegroundColor Yellow
    npm install -g vercel
}

Write-Host "✅ Vercel CLI est installé" -ForegroundColor Green
Write-Host ""

# Se connecter à Vercel
Write-Host "🔐 Connexion à Vercel..." -ForegroundColor Cyan
vercel login

Write-Host ""
Write-Host "🔗 Liaison du projet..." -ForegroundColor Cyan
vercel link

Write-Host ""
Write-Host "📝 Ajout des variables d'environnement..." -ForegroundColor Cyan

# Fonction pour ajouter une variable
function Add-VercelEnv {
    param($Name, $Value)
    Write-Host "  Ajout de $Name..." -ForegroundColor Gray
    echo $Value | vercel env add $Name production
}

# Ajouter toutes les variables
Add-VercelEnv "VITE_FIREBASE_API_KEY" "AIzaSyA9iQIr23KSYZgsTqymaHe0bXqFdZeId3Q"
Add-VercelEnv "VITE_FIREBASE_AUTH_DOMAIN" "gen-lang-client-0208289492.firebaseapp.com"
Add-VercelEnv "VITE_FIREBASE_PROJECT_ID" "gen-lang-client-0208289492"
Add-VercelEnv "VITE_FIREBASE_STORAGE_BUCKET" "gen-lang-client-0208289492.firebasestorage.app"
Add-VercelEnv "VITE_FIREBASE_MESSAGING_SENDER_ID" "616128322905"
Add-VercelEnv "VITE_FIREBASE_APP_ID" "1:616128322905:web:0c796ed0e1110a41bb8048"
Add-VercelEnv "VITE_FIREBASE_DATABASE_ID" "(default)"

Write-Host ""
Write-Host "✅ Variables d'environnement configurées !" -ForegroundColor Green
Write-Host ""
Write-Host "🚀 Déploiement en production..." -ForegroundColor Cyan
vercel --prod

Write-Host ""
Write-Host "✅ TERMINÉ !" -ForegroundColor Green
Write-Host ""
Write-Host "🎉 Votre application est maintenant déployée !" -ForegroundColor Cyan
Write-Host "🌐 Allez sur amenatawsil.com pour la voir" -ForegroundColor Yellow
Write-Host ""
