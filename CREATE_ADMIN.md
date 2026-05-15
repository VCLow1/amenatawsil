# 🔐 Créer un utilisateur Super Admin

## 🎯 Méthode Simple (5 minutes)

### Étape 1 : Créer l'utilisateur dans Firebase Authentication

1. **Ouvrez Firebase Console** :
   👉 https://console.firebase.google.com/project/gen-lang-client-0208289492/authentication/users

2. **Cliquez sur "Add user"** (bouton bleu en haut)

3. **Remplissez le formulaire** :
   - **Email** : `admin@amenatawsil.com` (ou votre email)
   - **Password** : Choisissez un mot de passe fort (min. 6 caractères)

4. **Cliquez sur "Add user"**

5. **IMPORTANT** : Copiez l'**UID** de l'utilisateur créé
   - C'est une longue chaîne comme : `abc123def456ghi789`
   - Vous en aurez besoin pour l'étape suivante

---

### Étape 2 : Créer le profil dans Firestore

1. **Ouvrez Firestore Database** :
   👉 https://console.firebase.google.com/project/gen-lang-client-0208289492/firestore/data

2. **Si c'est votre première fois** :
   - Cliquez sur "Create database"
   - Choisissez "Start in production mode"
   - Sélectionnez une région (ex: europe-west1)
   - Cliquez sur "Enable"

3. **Créer la collection "users"** :
   - Cliquez sur "Start collection"
   - Collection ID : `users`
   - Cliquez sur "Next"

4. **Ajouter le document admin** :
   - **Document ID** : Collez l'UID copié à l'étape 1
   - Ajoutez ces champs (cliquez sur "Add field" pour chaque) :

   | Field | Type | Value |
   |-------|------|-------|
   | `email` | string | `admin@amenatawsil.com` |
   | `name` | string | `Administrateur` |
   | `role` | string | `Super Admin` |
   | `status` | string | `Active` |
   | `lastLogin` | string | `2026-01-19` |

5. **Cliquez sur "Save"**

---

### Étape 3 : Se connecter

1. Allez sur : **https://amenatawsil.com**
2. Utilisez vos identifiants :
   - Email : `admin@amenatawsil.com`
   - Mot de passe : celui que vous avez choisi
3. **Vous êtes connecté en tant que Super Admin !** 🎉

---

## 🎬 Méthode Alternative : Script Automatique

Si vous préférez utiliser un script :

```bash
node create-admin.js
```

Suivez les instructions à l'écran.

---

## 📋 Exemple de document Firestore

Voici à quoi doit ressembler votre document dans Firestore :

```json
{
  "email": "admin@amenatawsil.com",
  "name": "Administrateur",
  "role": "Super Admin",
  "status": "Active",
  "lastLogin": "2026-01-19"
}
```

**IMPORTANT** : L'ID du document DOIT être le même que l'UID de l'utilisateur dans Authentication !

---

## 🔒 Sécurité

### Règles Firestore à déployer

Après avoir créé votre admin, déployez les règles de sécurité :

```bash
# Installer Firebase CLI
npm install -g firebase-tools

# Se connecter
firebase login

# Déployer les règles
firebase deploy --only firestore:rules
```

---

## ❓ Problèmes courants

### "Email already in use"
- Cet email existe déjà dans Authentication
- Utilisez un autre email ou supprimez l'utilisateur existant

### "Permission denied"
- Les règles Firestore bloquent l'accès
- Déployez les règles avec `firebase deploy --only firestore:rules`

### "User not found" lors de la connexion
- Vérifiez que l'UID du document Firestore correspond à l'UID dans Authentication
- Vérifiez que le champ `role` est bien "Super Admin" (avec majuscules)

### L'utilisateur se connecte mais n'a pas accès
- Vérifiez que `status` est "Active"
- Vérifiez que `role` est exactement "Super Admin"

---

## 🎯 Checklist

- [ ] Utilisateur créé dans Firebase Authentication
- [ ] UID copié
- [ ] Collection "users" créée dans Firestore
- [ ] Document créé avec l'UID comme ID
- [ ] Tous les champs ajoutés (email, name, role, status, lastLogin)
- [ ] Règles Firestore déployées
- [ ] Connexion réussie sur amenatawsil.com
- [ ] Accès au dashboard Super Admin

---

## 🎊 Félicitations !

Vous avez maintenant un compte Super Admin et pouvez :
- ✅ Gérer les agences
- ✅ Gérer les expéditeurs
- ✅ Gérer les livreurs
- ✅ Voir tous les colis
- ✅ Générer des rapports
- ✅ Configurer les paramètres

**Profitez de votre application LogiTrack Tunisia !** 🚀
