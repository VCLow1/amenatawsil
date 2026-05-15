# 🔥 Configuration des Variables d'Environnement

## ⚠️ IMPORTANT : Configurez ces variables sur votre plateforme de déploiement

Copiez-collez ces variables **EXACTEMENT** comme indiqué ci-dessous :

```env
VITE_FIREBASE_API_KEY=AIzaSyA9iQIr23KSYZgsTqymaHe0bXqFdZeId3Q
VITE_FIREBASE_AUTH_DOMAIN=gen-lang-client-0208289492.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=gen-lang-client-0208289492
VITE_FIREBASE_STORAGE_BUCKET=gen-lang-client-0208289492.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=616128322905
VITE_FIREBASE_APP_ID=1:616128322905:web:0c796ed0e1110a41bb8048
VITE_FIREBASE_DATABASE_ID=(default)
```

---

## 📍 Où configurer selon votre plateforme :

### 🔷 Vercel
1. Allez sur [vercel.com](https://vercel.com/dashboard)
2. Sélectionnez votre projet **amenatawsil**
3. Allez dans **Settings** → **Environment Variables**
4. Ajoutez chaque variable une par une :
   - Name: `VITE_FIREBASE_API_KEY`
   - Value: `AIzaSyA9iQIr23KSYZgsTqymaHe0bXqFdZeId3Q`
   - Environment: **Production, Preview, Development** (cochez les 3)
5. Cliquez sur **Save**
6. Répétez pour toutes les variables
7. Allez dans **Deployments** → Cliquez sur les 3 points → **Redeploy**

### 🟢 Netlify
1. Allez sur [app.netlify.com](https://app.netlify.com)
2. Sélectionnez votre site **amenatawsil**
3. Allez dans **Site settings** → **Environment variables**
4. Cliquez sur **Add a variable**
5. Ajoutez chaque variable :
   - Key: `VITE_FIREBASE_API_KEY`
   - Value: `AIzaSyA9iQIr23KSYZgsTqymaHe0bXqFdZeId3Q`
6. Cliquez sur **Save**
7. Répétez pour toutes les variables
8. Allez dans **Deploys** → **Trigger deploy** → **Deploy site**

### 🔥 Firebase Hosting
1. Les variables sont déjà dans le fichier `.env.local`
2. Buildez et déployez :
```bash
npm run build
firebase deploy --only hosting
```

### 🐳 Autre plateforme (Render, Railway, etc.)
Cherchez dans les paramètres de votre projet :
- "Environment Variables"
- "Config Vars"
- "Secrets"

Ajoutez les 7 variables listées ci-dessus.

---

## ✅ Vérification

Après avoir configuré les variables :

1. **Redéployez** votre application
2. Attendez que le déploiement soit terminé (1-2 minutes)
3. Ouvrez votre site : **amenatawsil.com**
4. Appuyez sur **F12** pour ouvrir la console
5. Vérifiez qu'il n'y a pas d'erreurs rouges

### Si vous voyez encore un écran blanc :
- Videz le cache : **Ctrl + Shift + R** (Windows) ou **Cmd + Shift + R** (Mac)
- Vérifiez que TOUTES les variables sont bien configurées
- Vérifiez qu'il n'y a pas de fautes de frappe dans les noms des variables

### Si vous voyez un message d'erreur Firebase :
- Vérifiez que les valeurs des variables sont exactement celles ci-dessus
- Pas d'espaces avant ou après les valeurs
- Pas de guillemets autour des valeurs (sauf si votre plateforme le demande)

---

## 🎯 Checklist finale

- [ ] Les 7 variables sont configurées sur la plateforme
- [ ] Le site a été redéployé
- [ ] Le cache du navigateur a été vidé
- [ ] La console ne montre pas d'erreurs Firebase
- [ ] La page de connexion s'affiche

---

## 📞 Besoin d'aide ?

Si le problème persiste après avoir suivi ces étapes :
1. Vérifiez la console du navigateur (F12)
2. Copiez le message d'erreur exact
3. Vérifiez que Firebase Authentication et Firestore sont activés dans la console Firebase

---

## 🔒 Sécurité

⚠️ **Ces clés sont publiques** (côté client) mais protégées par les règles Firebase.

Assurez-vous que :
- Les règles Firestore sont déployées : `firebase deploy --only firestore:rules`
- Firebase Authentication est activé avec Email/Password
- Les domaines autorisés incluent votre domaine de production
