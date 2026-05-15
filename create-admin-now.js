#!/usr/bin/env node

/**
 * Script pour créer le Super Admin automatiquement
 * Ce script crée l'utilisateur ET le profil Firestore
 */

import https from 'https';

const FIREBASE_API_KEY = "AIzaSyA9iQIr23KSYZgsTqymaHe0bXqFdZeId3Q";
const PROJECT_ID = "gen-lang-client-0208289492";

// Générer un email unique avec timestamp pour éviter les conflits
const timestamp = Date.now();
const ADMIN_EMAIL = "admin@amenatawsil.com";
const ADMIN_PASSWORD = "Amena2026!";
const ADMIN_NAME = "Administrateur";

console.log('\n🔐 Création automatique du Super Admin\n');
console.log('='.repeat(70));

function createUser() {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
      returnSecureToken: true
    });

    const options = {
      hostname: 'identitytoolkit.googleapis.com',
      path: `/v1/accounts:signUp?key=${FIREBASE_API_KEY}`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
      }
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        const response = JSON.parse(body);
        if (response.error) {
          reject(response.error);
        } else {
          resolve(response);
        }
      });
    });

    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

function createFirestoreDoc(uid, idToken) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({
      fields: {
        email: { stringValue: ADMIN_EMAIL },
        name: { stringValue: ADMIN_NAME },
        role: { stringValue: "Super Admin" },
        status: { stringValue: "Active" },
        lastLogin: { stringValue: new Date().toISOString().split('T')[0] },
        createdAt: { timestampValue: new Date().toISOString() }
      }
    });

    const options = {
      hostname: 'firestore.googleapis.com',
      path: `/v1/projects/${PROJECT_ID}/databases/(default)/documents/users?documentId=${uid}`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${idToken}`,
        'Content-Length': data.length
      }
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        const response = JSON.parse(body);
        if (response.error) {
          reject(response.error);
        } else {
          resolve(response);
        }
      });
    });

    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

async function main() {
  try {
    console.log('\n📝 Création de l\'utilisateur...');
    const authResponse = await createUser();
    console.log(`✅ Utilisateur créé ! UID: ${authResponse.localId}`);
    
    console.log('\n📝 Création du profil Firestore...');
    await createFirestoreDoc(authResponse.localId, authResponse.idToken);
    console.log('✅ Profil créé dans Firestore !');
    
    console.log('\n' + '='.repeat(70));
    console.log('\n🎉 SUPER ADMIN CRÉÉ AVEC SUCCÈS !');
    console.log('\n' + '='.repeat(70));
    console.log('\n📋 VOS IDENTIFIANTS :');
    console.log('\n   🌐 URL      : https://amenatawsil.com');
    console.log(`   📧 Email    : ${ADMIN_EMAIL}`);
    console.log(`   🔑 Password : ${ADMIN_PASSWORD}`);
    console.log(`   👤 Nom      : ${ADMIN_NAME}`);
    console.log(`   🎯 Rôle     : Super Admin`);
    console.log(`   🆔 UID      : ${authResponse.localId}`);
    console.log('\n' + '='.repeat(70));
    console.log('\n✅ Connectez-vous maintenant sur https://amenatawsil.com\n');
    
  } catch (error) {
    if (error.message === 'EMAIL_EXISTS') {
      console.log('\n⚠️  L\'email existe déjà. Tentative de connexion...\n');
      
      // Essayer de se connecter avec le mot de passe
      try {
        const signInData = JSON.stringify({
          email: ADMIN_EMAIL,
          password: ADMIN_PASSWORD,
          returnSecureToken: true
        });

        const signInOptions = {
          hostname: 'identitytoolkit.googleapis.com',
          path: `/v1/accounts:signInWithPassword?key=${FIREBASE_API_KEY}`,
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Content-Length': signInData.length
          }
        };

        const signInReq = https.request(signInOptions, (res) => {
          let body = '';
          res.on('data', (chunk) => body += chunk);
          res.on('end', async () => {
            const response = JSON.parse(body);
            if (response.error) {
              console.log('❌ Le mot de passe ne correspond pas.');
              console.log('\n📋 L\'utilisateur existe avec un autre mot de passe.');
              console.log('\nVeuillez utiliser la console Firebase pour réinitialiser le mot de passe :');
              console.log('👉 https://console.firebase.google.com/project/gen-lang-client-0208289492/authentication/users');
            } else {
              console.log('✅ Connexion réussie !');
              console.log('\n📝 Mise à jour du profil Firestore...');
              try {
                await createFirestoreDoc(response.localId, response.idToken);
                console.log('✅ Profil mis à jour !');
              } catch (e) {
                console.log('⚠️  Le profil existe déjà.');
              }
              
              console.log('\n' + '='.repeat(70));
              console.log('\n🎉 SUPER ADMIN PRÊT !');
              console.log('\n' + '='.repeat(70));
              console.log('\n📋 VOS IDENTIFIANTS :');
              console.log('\n   🌐 URL      : https://amenatawsil.com');
              console.log(`   📧 Email    : ${ADMIN_EMAIL}`);
              console.log(`   🔑 Password : ${ADMIN_PASSWORD}`);
              console.log(`   👤 Nom      : ${ADMIN_NAME}`);
              console.log(`   🎯 Rôle     : Super Admin`);
              console.log(`   🆔 UID      : ${response.localId}`);
              console.log('\n' + '='.repeat(70));
              console.log('\n✅ Connectez-vous maintenant sur https://amenatawsil.com\n');
            }
          });
        });

        signInReq.on('error', (e) => console.error('Erreur:', e));
        signInReq.write(signInData);
        signInReq.end();
        
      } catch (signInError) {
        console.error('Erreur lors de la connexion:', signInError);
      }
    } else {
      console.error('\n❌ Erreur:', error.message || error);
      console.log('\nVeuillez créer l\'utilisateur manuellement via la console Firebase.');
    }
  }
}

main();
