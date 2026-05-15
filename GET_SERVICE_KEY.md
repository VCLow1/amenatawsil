# 🔑 Obtenir la clé de service Firebase Admin

Pour utiliser le script automatique `create-admin.js`, vous avez besoin d'une clé de service Firebase Admin.

## 📥 Télécharger la clé de service

### Étape 1 : Accéder aux paramètres du projet

1. Allez sur Firebase Console :
   👉 https://console.firebase.google.com/project/gen-lang-client-0208289492/settings/serviceaccounts/adminsdk

2. Vous devriez voir la page "Service accounts"

### Étape 2 : Générer une nouvelle clé privée

1. Cliquez sur le bouton **"Generate new private key"** (Générer une nouvelle clé privée)

2. Une fenêtre de confirmation apparaît :
   - ⚠️ **ATTENTION** : Cette clé donne un accès complet à votre projet Firebase
   - Gardez-la en sécurité et ne la partagez jamais publiquement

3. Cliquez sur **"Generate key"**

4. Un fichier JSON sera téléchargé automatiquement

### Étape 3 : Placer la clé dans le projet

1. Renommez le fichier téléchargé en : **`serviceAccountKey.json`**

2. Placez-le dans le dossier `logitrack-tunisia/` (à côté de `create-admin.js`)

3. **IMPORTANT** : Vérifiez que ce fichier est dans `.gitignore` pour ne pas le pousser sur GitHub !

### Étape 4 : Exécuter le script

```bash
cd logitrack-tunisia
node create-admin.js
```

Le script va :
- ✅ Détecter automatiquement la clé de service
- ✅ Créer l'utilisateur dans Firebase Authentication
- ✅ Créer le profil dans Firestore
- ✅ Vous donner les identifiants pour vous connecter

---

## 🔒 Sécurité

### ⚠️ NE JAMAIS :
- ❌ Pousser la clé de service sur GitHub
- ❌ Partager la clé publiquement
- ❌ L'inclure dans votre code source
- ❌ L'envoyer par email non chiffré

### ✅ TOUJOURS :
- ✅ Garder la clé en local uniquement
- ✅ Vérifier qu'elle est dans `.gitignore`
- ✅ La stocker dans un endroit sécurisé
- ✅ Révoquer les clés non utilisées

---

## 🎯 Vérification du .gitignore

Assurez-vous que votre `.gitignore` contient :

```
# Firebase Service Account Keys
serviceAccountKey.json
firebase-admin-key.json
service-account.json
*-firebase-adminsdk-*.json
```

---

## 🆘 Problèmes courants

### "Permission denied"
- Vous n'avez pas les droits d'administration sur le projet Firebase
- Demandez à un propriétaire du projet de vous donner les droits

### "File not found"
- Vérifiez que le fichier est bien nommé `serviceAccountKey.json`
- Vérifiez qu'il est dans le bon dossier (`logitrack-tunisia/`)

### "Invalid service account"
- Le fichier JSON est corrompu
- Téléchargez une nouvelle clé

---

## 🎊 Prêt !

Une fois la clé en place, exécutez :

```bash
node create-admin.js
```

Et suivez les instructions à l'écran ! 🚀
