# AMENA TAWSIL

Plateforme de gestion logistique multi-agences avec Firebase, React et Gemini AI.

---

## Prérequis

- Node.js 18+
- Un compte Google (pour Firebase et Gemini)

---

## Installation

```bash
npm install
```

---

## Configuration Firebase (obligatoire)

### 1. Créer un projet Firebase

1. Aller sur [console.firebase.google.com](https://console.firebase.google.com)
2. Créer un nouveau projet
3. Dans **Authentication** → Activer la méthode **Email/Password**
4. Dans **Firestore Database** → Créer une base en mode **Production**
5. Dans **Paramètres du projet** → **Vos applications** → Ajouter une app Web → Copier les clés

### 2. Configurer les variables d'environnement

Copier `.env.example` en `.env.local` et remplir avec vos clés :

```bash
cp .env.example .env.local
```

```env
VITE_FIREBASE_API_KEY="..."
VITE_FIREBASE_AUTH_DOMAIN="..."
VITE_FIREBASE_PROJECT_ID="..."
VITE_FIREBASE_STORAGE_BUCKET="..."
VITE_FIREBASE_MESSAGING_SENDER_ID="..."
VITE_FIREBASE_APP_ID="..."
VITE_FIREBASE_DATABASE_ID="(default)"

VITE_GEMINI_API_KEY="..."   # https://aistudio.google.com/app/apikey
```

### 3. Déployer les règles Firestore

```bash
npm install -g firebase-tools
firebase login
firebase use --add   # sélectionner votre projet
firebase deploy --only firestore:rules
```

### 4. Peupler la base de données (seed)

```bash
npm run seed
```

Cela crée le compte admin par défaut :

| Rôle        | Email                  | Mot de passe      |
|-------------|------------------------|-------------------|
| Super Admin | admin@amenatawsil.com  | AmenaTawsil2024!  |

---

## Lancer l'application

```bash
npm run dev
```

---

## Rôles et accès

| Rôle              | Accès                                                      |
|-------------------|------------------------------------------------------------|
| Super Admin       | Vue globale, gestion agences, approbations comptes         |
| Agency Moderator  | Son agence uniquement, crée expéditeurs/livreurs, affecte colis |
| Shipper           | Crée et suit ses propres colis                             |
| Courier           | Voit ses colis assignés, met à jour les statuts            |

---

## Stack technique

- **Frontend** : React 18 + TypeScript + Vite + TailwindCSS
- **Backend** : Firebase (Auth + Firestore)
- **AI** : Google Gemini 2.0 Flash
- **Charts** : Recharts
- **PDF** : jsPDF
