#!/bin/bash

# Script automatique pour configurer les variables d'environnement sur Vercel
# Usage: bash setup-vercel.sh

echo "🚀 Configuration automatique de Vercel..."
echo ""

# Vérifier si Vercel CLI est installé
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI n'est pas installé"
    echo "📦 Installation de Vercel CLI..."
    npm install -g vercel
fi

echo "✅ Vercel CLI est installé"
echo ""

# Se connecter à Vercel
echo "🔐 Connexion à Vercel..."
vercel login

echo ""
echo "🔗 Liaison du projet..."
vercel link

echo ""
echo "📝 Ajout des variables d'environnement..."

# Ajouter chaque variable
echo "AIzaSyA9iQIr23KSYZgsTqymaHe0bXqFdZeId3Q" | vercel env add VITE_FIREBASE_API_KEY production
echo "gen-lang-client-0208289492.firebaseapp.com" | vercel env add VITE_FIREBASE_AUTH_DOMAIN production
echo "gen-lang-client-0208289492" | vercel env add VITE_FIREBASE_PROJECT_ID production
echo "gen-lang-client-0208289492.firebasestorage.app" | vercel env add VITE_FIREBASE_STORAGE_BUCKET production
echo "616128322905" | vercel env add VITE_FIREBASE_MESSAGING_SENDER_ID production
echo "1:616128322905:web:0c796ed0e1110a41bb8048" | vercel env add VITE_FIREBASE_APP_ID production
echo "(default)" | vercel env add VITE_FIREBASE_DATABASE_ID production

echo ""
echo "✅ Variables d'environnement configurées !"
echo ""
echo "🚀 Déploiement en production..."
vercel --prod

echo ""
echo "✅ TERMINÉ !"
echo ""
echo "🎉 Votre application est maintenant déployée !"
echo "🌐 Allez sur amenatawsil.com pour la voir"
echo ""
