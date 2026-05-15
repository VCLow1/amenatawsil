#!/usr/bin/env node

/**
 * Script simple pour créer un Super Admin
 * Ce script génère les instructions et les données nécessaires
 * Usage: node create-admin-simple.js
 */

import readline from 'readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function main() {
  console.log('\n🔐 Création d\'un utilisateur Super Admin\n');
  console.log('='.repeat(70));
  
  const email = await question('\n📧 Email de l\'admin (défaut: admin@amenatawsil.com) : ') || 'admin@amenatawsil.com';
  const password = await question('🔑 Mot de passe (min. 6 caractères) : ');
  
  if (password.length < 6) {
    console.log('\n❌ Le mot de passe doit contenir au moins 6 caractères.');
    rl.close();
    process.exit(1);
  }
  
  const name = await question('👤 Nom complet (défaut: Administrateur) : ') || 'Administrateur';
  
  console.log('\n' + '='.repeat(70));
  console.log('\n📝 ÉTAPE 1 : Créer l\'utilisateur dans Firebase Authentication');
  console.log('='.repeat(70));
  console.log('\n1️⃣  Ouvrez ce lien dans votre navigateur :');
  console.log('    👉 https://console.firebase.google.com/project/gen-lang-client-0208289492/authentication/users');
  console.log('\n2️⃣  Cliquez sur le bouton "Add user" (en haut à droite)');
  console.log('\n3️⃣  Remplissez le formulaire :');
  console.log(`    📧 Email    : ${email}`);
  console.log(`    🔑 Password : ${password}`);
  console.log('\n4️⃣  Cliquez sur "Add user"');
  console.log('\n5️⃣  ⚠️  IMPORTANT : Copiez l\'UID de l\'utilisateur créé');
  console.log('    (C\'est une longue chaîne comme : abc123def456ghi789)');
  
  const uid = await question(XfkSB5NVBHWf09eqcSNNAKxuR533);
  
  if (!uid || uid.length < 10) {
    console.log('\n❌ UID invalide. Veuillez réessayer.');
    rl.close();
    process.exit(1);
  }
  
  console.log('\n' + '='.repeat(70));
  console.log('\n📝 ÉTAPE 2 : Créer le profil dans Firestore');
  console.log('='.repeat(70));
  console.log('\n1️⃣  Ouvrez ce lien dans votre navigateur :');
  console.log('    👉 https://console.firebase.google.com/project/gen-lang-client-0208289492/firestore/data');
  console.log('\n2️⃣  Si c\'est votre première fois :');
  console.log('    - Cliquez sur "Create database"');
  console.log('    - Choisissez "Start in production mode"');
  console.log('    - Sélectionnez une région (ex: europe-west1)');
  console.log('    - Cliquez sur "Enable"');
  console.log('\n3️⃣  Créer la collection "users" :');
  console.log('    - Cliquez sur "Start collection"');
  console.log('    - Collection ID : users');
  console.log('    - Cliquez sur "Next"');
  console.log('\n4️⃣  Ajouter le document admin :');
  console.log(`    - Document ID : ${uid}`);
  console.log('    - Ajoutez ces champs (cliquez sur "Add field" pour chaque) :');
  console.log('\n    ┌─────────────┬────────┬──────────────────────────┐');
  console.log('    │ Field       │ Type   │ Value                    │');
  console.log('    ├─────────────┼────────┼──────────────────────────┤');
  console.log(`    │ email       │ string │ ${email.padEnd(24)} │`);
  console.log(`    │ name        │ string │ ${name.padEnd(24)} │`);
  console.log('    │ role        │ string │ Super Admin              │');
  console.log('    │ status      │ string │ Active                   │');
  console.log(`    │ lastLogin   │ string │ ${new Date().toISOString().split('T')[0].padEnd(24)} │`);
  console.log('    └─────────────┴────────┴──────────────────────────┘');
  console.log('\n5️⃣  Cliquez sur "Save"');
  
  console.log('\n' + '='.repeat(70));
  console.log('\n🎉 ÉTAPE 3 : Se connecter');
  console.log('='.repeat(70));
  console.log('\n1️⃣  Allez sur : https://amenatawsil.com');
  console.log('\n2️⃣  Connectez-vous avec :');
  console.log(`    📧 Email    : ${email}`);
  console.log(`    🔑 Password : ${password}`);
  console.log('\n3️⃣  Vous êtes maintenant Super Admin ! 🎊');
  
  console.log('\n' + '='.repeat(70));
  console.log('\n📋 RÉSUMÉ DES INFORMATIONS');
  console.log('='.repeat(70));
  console.log(`\nUID      : ${uid}`);
  console.log(`Email    : ${email}`);
  console.log(`Nom      : ${name}`);
  console.log(`Rôle     : Super Admin`);
  console.log(`Status   : Active`);
  console.log(`Date     : ${new Date().toISOString().split('T')[0]}`);
  
  console.log('\n' + '='.repeat(70));
  console.log('\n💾 Ces informations ont été sauvegardées dans admin-credentials.txt');
  
  // Sauvegarder les informations
  const fs = await import('fs');
  const credentials = `
INFORMATIONS SUPER ADMIN
========================

Date de création : ${new Date().toISOString()}

IDENTIFIANTS DE CONNEXION
--------------------------
Email    : ${email}
Password : ${password}
URL      : https://amenatawsil.com

DONNÉES FIRESTORE
-----------------
Collection : users
Document ID : ${uid}

Champs :
{
  "email": "${email}",
  "name": "${name}",
  "role": "Super Admin",
  "status": "Active",
  "lastLogin": "${new Date().toISOString().split('T')[0]}"
}

⚠️  IMPORTANT : Gardez ce fichier en sécurité et ne le partagez pas !
`;
  
  fs.writeFileSync('admin-credentials.txt', credentials);
  console.log('\n✅ Fichier créé : admin-credentials.txt');
  console.log('\n' + '='.repeat(70) + '\n');
  
  rl.close();
}

main().catch(error => {
  console.error('❌ Erreur:', error.message);
  rl.close();
  process.exit(1);
});
