# 🚀 Guide Rapide de Déploiement

## ⚠️ Problème d'écran blanc ? Suivez ces étapes !

### 1️⃣ Vérifiez vos variables d'environnement

Sur votre plateforme de déploiement (Vercel, Netlify, Firebase, etc.), configurez ces variables :

```
VITE_FIREBASE_API_KEY=votre_clé
VITE_FIREBASE_AUTH_DOMAIN=votre_domaine.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=votre_projet_id
VITE_FIREBASE_STORAGE_BUCKET=votre_bucket.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=votre_sender_id
VITE_FIREBASE_APP_ID=votre_app_id
VITE_FIREBASE_DATABASE_ID=(default)
VITE_GEMINI_API_KEY=votre_gemini_key (optionnel)
```

### 2️⃣ Build local pour tester

```bash
cd logitrack-tunisia
npm install
npm run build
npm run preview
```

Si ça fonctionne localement, le problème vient des variables d'environnement sur votre plateforme.

### 3️⃣ Déploiement selon votre plateforme

#### 🔷 Vercel (Recommandé)

1. Allez sur [vercel.com](https://vercel.com)
2. Importez votre repo GitHub
3. Ajoutez les variables d'environnement dans Settings > Environment Variables
4. Déployez !

#### 🟢 Netlify

1. Allez sur [netlify.com](https://netlify.com)
2. Importez votre repo GitHub
3. Build command: `npm run build`
4. Publish directory: `dist`
5. Ajoutez les variables d'environnement dans Site settings > Environment variables

#### 🔥 Firebase Hosting

```bash
npm install -g firebase-tools
firebase login
firebase init hosting
# Sélectionnez: dist comme public directory, Yes pour SPA
npm run build
firebase deploy --only hosting
```

### 4️⃣ Vérification après déploiement

1. Ouvrez la console du navigateur (F12)
2. Vérifiez s'il y a des erreurs
3. Les erreurs communes :
   - ❌ "Firebase: Error (auth/invalid-api-key)" → Vérifiez VITE_FIREBASE_API_KEY
   - ❌ "Failed to load module" → Vérifiez que le build s'est bien terminé
   - ❌ 404 sur les routes → Vérifiez que les redirections sont configurées

### 5️⃣ Checklist de dépannage

- [ ] Toutes les variables VITE_* sont configurées sur la plateforme
- [ ] Le build local fonctionne (`npm run build && npm run preview`)
- [ ] Les fichiers de configuration sont présents (vercel.json, netlify.toml, etc.)
- [ ] Firebase est correctement configuré dans la console Firebase
- [ ] Les règles Firestore sont déployées
- [ ] Le cache du navigateur est vidé (Ctrl+Shift+R)

### 📞 Besoin d'aide ?

Consultez le fichier [DEPLOYMENT.md](./DEPLOYMENT.md) pour un guide complet.

---

## 🎯 Configuration Firebase rapide

1. Créez un projet sur [Firebase Console](https://console.firebase.google.com)
2. Activez **Authentication** > Email/Password
3. Créez une base **Firestore Database**
4. Copiez les clés de configuration dans vos variables d'environnement
5. Déployez les règles Firestore :
   ```bash
   firebase deploy --only firestore:rules
   ```

---

## ✅ Test de production

Après déploiement, testez ces fonctionnalités :

- [ ] Connexion avec email/password
- [ ] Création d'un colis
- [ ] Navigation entre les pages
- [ ] Affichage du dashboard
- [ ] Responsive mobile

Si tout fonctionne, félicitations ! 🎉
