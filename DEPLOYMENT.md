# Guide de Déploiement - AMENA TAWSIL

## 🚀 Déploiement sur différentes plateformes

### Variables d'environnement requises

Avant de déployer, assurez-vous de configurer ces variables d'environnement :

```env
VITE_FIREBASE_API_KEY=votre_api_key
VITE_FIREBASE_AUTH_DOMAIN=votre_projet.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=votre_projet_id
VITE_FIREBASE_STORAGE_BUCKET=votre_projet.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=votre_sender_id
VITE_FIREBASE_APP_ID=votre_app_id
VITE_FIREBASE_DATABASE_ID=(default)
VITE_GEMINI_API_KEY=votre_gemini_api_key
```

---

## 📦 Vercel

### Déploiement via CLI

1. Installez Vercel CLI :
```bash
npm install -g vercel
```

2. Déployez :
```bash
cd logitrack-tunisia
vercel
```

3. Configurez les variables d'environnement dans le dashboard Vercel

### Déploiement via GitHub

1. Connectez votre repo GitHub à Vercel
2. Configurez les variables d'environnement dans Settings > Environment Variables
3. Le déploiement se fera automatiquement à chaque push

---

## 🌐 Netlify

### Déploiement via CLI

1. Installez Netlify CLI :
```bash
npm install -g netlify-cli
```

2. Déployez :
```bash
cd logitrack-tunisia
netlify deploy --prod
```

### Déploiement via GitHub

1. Connectez votre repo GitHub à Netlify
2. Build command: `npm run build`
3. Publish directory: `dist`
4. Configurez les variables d'environnement dans Site settings > Environment variables

---

## 🔥 Firebase Hosting

1. Installez Firebase CLI :
```bash
npm install -g firebase-tools
```

2. Connectez-vous :
```bash
firebase login
```

3. Initialisez Firebase Hosting :
```bash
cd logitrack-tunisia
firebase init hosting
```

Sélectionnez :
- Public directory: `dist`
- Configure as single-page app: `Yes`
- Set up automatic builds: `No`

4. Buildez et déployez :
```bash
npm run build
firebase deploy --only hosting
```

---

## 🐳 Docker

1. Créez un fichier `Dockerfile` :
```dockerfile
FROM node:18-alpine as build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

2. Créez `nginx.conf` :
```nginx
server {
    listen 80;
    server_name _;
    root /usr/share/nginx/html;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

3. Buildez et lancez :
```bash
docker build -t logitrack-tunisia .
docker run -p 80:80 logitrack-tunisia
```

---

## ⚠️ Résolution des problèmes

### Écran blanc après déploiement

1. **Vérifiez les variables d'environnement** : Toutes les variables VITE_* doivent être configurées
2. **Vérifiez la console du navigateur** : Ouvrez les DevTools (F12) pour voir les erreurs
3. **Vérifiez les chemins** : Le `base: './'` dans vite.config.ts doit être correct
4. **Vérifiez Firebase** : Assurez-vous que Firebase est correctement configuré

### Erreurs 404 sur les routes

- Assurez-vous que le fichier `_redirects` (Netlify) ou `vercel.json` (Vercel) est présent
- Pour Firebase Hosting, vérifiez que `rewrites` est configuré dans `firebase.json`

### Build échoue

1. Vérifiez que toutes les dépendances sont installées :
```bash
npm ci
```

2. Testez le build localement :
```bash
npm run build
npm run preview
```

---

## 📝 Checklist avant déploiement

- [ ] Toutes les variables d'environnement sont configurées
- [ ] Le build local fonctionne (`npm run build`)
- [ ] Les fichiers de configuration de déploiement sont présents
- [ ] Firebase est correctement configuré
- [ ] Le fichier `.gitignore` exclut `.env.local` et `dist/`
- [ ] Les règles Firestore sont déployées
- [ ] Les tests passent (si applicable)

---

## 🔒 Sécurité

⚠️ **Important** : Ne commitez JAMAIS vos fichiers `.env.local` ou vos clés API dans Git !

Utilisez toujours les systèmes de variables d'environnement de votre plateforme de déploiement.
