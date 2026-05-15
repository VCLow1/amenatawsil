# 🔐 IDENTIFIANTS SUPER ADMIN

## ⚠️ IMPORTANT - LISEZ CECI

L'utilisateur `admin@amenatawsil.com` existe déjà dans Firebase Authentication, mais nous ne connaissons pas le mot de passe actuel.

## 🎯 SOLUTION RAPIDE (2 minutes)

### Option 1 : Réinitialiser le mot de passe (RECOMMANDÉ)

1. **Allez sur Firebase Console** :
   👉 https://console.firebase.google.com/project/gen-lang-client-0208289492/authentication/users

2. **Trouvez l'utilisateur** `admin@amenatawsil.com` dans la liste

3. **Cliquez sur les 3 points** (⋮) à droite de l'utilisateur

4. **Sélectionnez "Reset password"** (Réinitialiser le mot de passe)

5. **Choisissez un nouveau mot de passe** :
   - Exemple : `SuperAdmin2026!`
   - Minimum 6 caractères

6. **Copiez l'UID** de l'utilisateur (vous en aurez besoin)

---

### Option 2 : Créer un nouvel admin avec un email différent

1. **Allez sur Firebase Console** :
   👉 https://console.firebase.google.com/project/gen-lang-client-0208289492/authentication/users

2. **Cliquez sur "Add user"**

3. **Utilisez ces identifiants** :
   ```
   📧 Email    : superadmin@amenatawsil.com
   🔑 Password : SuperAdmin2026!
   ```

4. **Copiez l'UID** de l'utilisateur créé

---

## 📝 CRÉER LE PROFIL FIRESTORE

Après avoir réinitialisé le mot de passe OU créé un nouvel utilisateur :

1. **Allez dans Firestore** :
   👉 https://console.firebase.google.com/project/gen-lang-client-0208289492/firestore/data

2. **Si la base n'existe pas** :
   - Cliquez sur "Create database"
   - Choisissez "Start in production mode"
   - Région : europe-west1
   - Cliquez sur "Enable"

3. **Créer la collection "users"** :
   - Cliquez sur "Start collection"
   - Collection ID : `users`
   - Cliquez sur "Next"

4. **Ajouter le document** :
   - **Document ID** : [Collez l'UID copié]
   - Ajoutez ces champs :

   | Field      | Type   | Value                    |
   |------------|--------|--------------------------|
   | email      | string | admin@amenatawsil.com    |
   | name       | string | Administrateur           |
   | role       | string | Super Admin              |
   | status     | string | Active                   |
   | lastLogin  | string | 2026-05-15               |

5. **Cliquez sur "Save"**

---

## ✅ SE CONNECTER

1. Allez sur : **https://amenatawsil.com**

2. Utilisez vos identifiants :
   - **Email** : `admin@amenatawsil.com` (ou `superadmin@amenatawsil.com`)
   - **Password** : Le mot de passe que vous avez défini

3. **Vous êtes connecté en tant que Super Admin !** 🎉

---

## 🎯 IDENTIFIANTS SUGGÉRÉS

### Option A (Réinitialiser l'existant)
```
🌐 URL      : https://amenatawsil.com
📧 Email    : admin@amenatawsil.com
🔑 Password : SuperAdmin2026!
👤 Nom      : Administrateur
🎯 Rôle     : Super Admin
```

### Option B (Créer un nouveau)
```
🌐 URL      : https://amenatawsil.com
📧 Email    : superadmin@amenatawsil.com
🔑 Password : SuperAdmin2026!
👤 Nom      : Super Administrateur
🎯 Rôle     : Super Admin
```

---

## 📋 CHECKLIST

- [ ] Utilisateur créé/réinitialisé dans Firebase Authentication
- [ ] UID copié
- [ ] Collection "users" créée dans Firestore
- [ ] Document créé avec l'UID comme ID
- [ ] Tous les champs ajoutés (email, name, role, status, lastLogin)
- [ ] Connexion testée sur https://amenatawsil.com
- [ ] Accès au dashboard Super Admin confirmé

---

## 🆘 BESOIN D'AIDE ?

Si vous avez des difficultés, voici les liens directs :

- **Authentication** : https://console.firebase.google.com/project/gen-lang-client-0208289492/authentication/users
- **Firestore** : https://console.firebase.google.com/project/gen-lang-client-0208289492/firestore/data
- **Application** : https://amenatawsil.com

---

## 🎊 FÉLICITATIONS !

Une fois connecté, vous pourrez :
- ✅ Gérer toutes les agences
- ✅ Gérer tous les expéditeurs
- ✅ Gérer tous les livreurs
- ✅ Voir tous les colis
- ✅ Générer des rapports
- ✅ Accéder à tous les paramètres

**Profitez de votre application LogiTrack Tunisia !** 🚀
