#!/usr/bin/env node

/**
 * Script de vérification des variables d'environnement
 * Exécutez: node check-env.js
 */

const requiredEnvVars = [
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN',
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_STORAGE_BUCKET',
  'VITE_FIREBASE_MESSAGING_SENDER_ID',
  'VITE_FIREBASE_APP_ID',
];

console.log('\n🔍 Vérification des variables d\'environnement Firebase...\n');

let allPresent = true;
let hasValues = true;

requiredEnvVars.forEach(varName => {
  const value = process.env[varName];
  const isPresent = value !== undefined;
  const hasValue = value && value.length > 0 && !value.includes('your_') && !value.includes('votre');
  
  const status = !isPresent ? '❌ MANQUANTE' : !hasValue ? '⚠️  VIDE/EXEMPLE' : '✅ OK';
  
  console.log(`${status} ${varName}`);
  
  if (!isPresent) allPresent = false;
  if (!hasValue) hasValues = false;
});

console.log('\n' + '='.repeat(60) + '\n');

if (!allPresent) {
  console.log('❌ ERREUR: Certaines variables d\'environnement sont manquantes!\n');
  console.log('📝 Actions à faire:\n');
  console.log('1. Créez un fichier .env.local à la racine du projet');
  console.log('2. Copiez le contenu de .env.example');
  console.log('3. Remplacez les valeurs par vos vraies clés Firebase\n');
  console.log('Pour obtenir vos clés Firebase:');
  console.log('👉 https://console.firebase.google.com');
  console.log('   > Sélectionnez votre projet');
  console.log('   > Paramètres du projet (⚙️)');
  console.log('   > Vos applications > Config\n');
  process.exit(1);
}

if (!hasValues) {
  console.log('⚠️  ATTENTION: Certaines variables contiennent des valeurs d\'exemple!\n');
  console.log('Remplacez-les par vos vraies clés Firebase avant de déployer.\n');
  process.exit(1);
}

console.log('✅ Toutes les variables d\'environnement sont configurées!\n');
console.log('Vous pouvez maintenant:');
console.log('  • Lancer le serveur de dev: npm run dev');
console.log('  • Builder pour la production: npm run build');
console.log('  • Déployer sur votre plateforme\n');
