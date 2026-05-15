#!/usr/bin/env node

/**
 * Script pour créer un utilisateur Super Admin
 * Usage: node create-admin.js
 */

const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function main() {
  console.log('\n🔐 Création d\'un utilisateur Super Admin\n');
  console.log('=' .repeat(60));
  
  const email = await question('\n📧 Email de l\'admin : ');
  const password = await question('🔑 Mot de passe (min. 6 caractères) : ');
  const name = await question('👤 Nom complet : ');
  
  console.log('\n' + '='.repeat(60));
  console.log('\n📝 Informations saisies :');
  console.log(`   Email    : ${email}`);
  console.log(`   Nom      : ${name}`);
  console.log(`   Rôle     : Super Admin`);
  
  const confirm = await question('\n✅ Confirmer la création ? (oui/non) : ');
  
  if (confirm.toLowerCase() !== 'oui' && confirm.toLowerCase() !== 'o') {
    console.log('\n❌ Création annulée.');
    rl.close();
    return;
  }
  
  console.log('\n🚀 Création de l\'utilisateur...\n');
  console.log('⚠️  IMPORTANT : Vous devez maintenant :');
  console.log('\n1️⃣  Aller sur Firebase Console :');
  console.log('    👉 https://console.firebase.google.com/project/gen-lang-client-0208289492/authentication/users');
  console.log('\n2️⃣  Cliquer sur "Add user"');
  console.log(`    📧 Email    : ${email}`);
  console.log(`    🔑 Password : ${password}`);
  console.log('\n3️⃣  Copier l\'UID de l\'utilisateur créé (ex: abc123def456)');
  console.log('\n4️⃣  Aller dans Firestore Database :');
  console.log('    👉 https://console.firebase.google.com/project/gen-lang-client-0208289492/firestore/data');
  console.log('\n5️⃣  Créer une collection "users"');
  console.log('\n6️⃣  Ajouter un document avec l\'UID comme ID');
  console.log('\n7️⃣  Ajouter ces champs :');
  console.log('    {');
  console.log(`      "email": "${email}",`);
  console.log(`      "name": "${name}",`);
  console.log('      "role": "Super Admin",');
  console.log('      "status": "Active",');
  console.log(`      "lastLogin": "${new Date().toISOString().split('T')[0]}"`);
  console.log('    }');
  console.log('\n✅ Ensuite vous pourrez vous connecter sur https://amenatawsil.com\n');
  
  rl.close();
}

main().catch(console.error);
