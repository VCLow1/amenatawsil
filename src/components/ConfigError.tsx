import React from 'react';
import { AlertTriangle, ExternalLink } from 'lucide-react';

export const ConfigError: React.FC = () => {
  const missingVars = [
    'VITE_FIREBASE_API_KEY',
    'VITE_FIREBASE_AUTH_DOMAIN',
    'VITE_FIREBASE_PROJECT_ID',
    'VITE_FIREBASE_STORAGE_BUCKET',
    'VITE_FIREBASE_MESSAGING_SENDER_ID',
    'VITE_FIREBASE_APP_ID',
  ].filter(varName => !import.meta.env[varName]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-white rounded-3xl shadow-2xl p-8">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center">
            <AlertTriangle size={32} className="text-red-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Configuration Firebase manquante</h1>
            <p className="text-slate-500">L'application ne peut pas démarrer</p>
          </div>
        </div>

        <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-6 mb-6">
          <h2 className="font-bold text-red-900 mb-3">❌ Variables d'environnement manquantes :</h2>
          <ul className="space-y-2">
            {missingVars.map(varName => (
              <li key={varName} className="text-sm font-mono text-red-700 flex items-center gap-2">
                <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                {varName}
              </li>
            ))}
          </ul>
        </div>

        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6">
            <h3 className="font-bold text-blue-900 mb-3">🔧 Comment corriger :</h3>
            <ol className="space-y-3 text-sm text-blue-800">
              <li className="flex gap-3">
                <span className="font-bold">1.</span>
                <div>
                  <p className="font-medium">Allez sur Firebase Console</p>
                  <a 
                    href="https://console.firebase.google.com" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline flex items-center gap-1 mt-1"
                  >
                    console.firebase.google.com
                    <ExternalLink size={12} />
                  </a>
                </div>
              </li>
              <li className="flex gap-3">
                <span className="font-bold">2.</span>
                <p>Sélectionnez votre projet (ou créez-en un nouveau)</p>
              </li>
              <li className="flex gap-3">
                <span className="font-bold">3.</span>
                <p>Allez dans <strong>Paramètres du projet ⚙️</strong> → <strong>Vos applications</strong></p>
              </li>
              <li className="flex gap-3">
                <span className="font-bold">4.</span>
                <p>Copiez les valeurs de configuration</p>
              </li>
              <li className="flex gap-3">
                <span className="font-bold">5.</span>
                <div>
                  <p className="font-medium mb-2">Configurez-les sur votre plateforme :</p>
                  <div className="space-y-1 pl-4">
                    <p>• <strong>Vercel</strong> : Settings → Environment Variables</p>
                    <p>• <strong>Netlify</strong> : Site settings → Environment variables</p>
                    <p>• <strong>Firebase Hosting</strong> : Créez un fichier .env.local</p>
                  </div>
                </div>
              </li>
            </ol>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6">
            <h3 className="font-bold text-amber-900 mb-2">⚠️ Important</h3>
            <p className="text-sm text-amber-800">
              Les variables d'environnement doivent commencer par <code className="bg-amber-100 px-2 py-1 rounded font-mono">VITE_</code> pour être accessibles dans l'application.
            </p>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6">
            <h3 className="font-bold text-slate-900 mb-3">📝 Exemple de configuration :</h3>
            <pre className="bg-slate-900 text-green-400 p-4 rounded-xl text-xs overflow-x-auto">
{`VITE_FIREBASE_API_KEY="AIzaSyC..."
VITE_FIREBASE_AUTH_DOMAIN="votre-projet.firebaseapp.com"
VITE_FIREBASE_PROJECT_ID="votre-projet-id"
VITE_FIREBASE_STORAGE_BUCKET="votre-projet.appspot.com"
VITE_FIREBASE_MESSAGING_SENDER_ID="123456789"
VITE_FIREBASE_APP_ID="1:123456789:web:abc123"`}
            </pre>
          </div>
        </div>

        <div className="mt-6 pt-6 border-t border-slate-200">
          <p className="text-xs text-slate-500 text-center">
            Besoin d'aide ? Consultez le fichier <code className="bg-slate-100 px-2 py-1 rounded">DEPLOYMENT.md</code> dans le projet
          </p>
        </div>
      </div>
    </div>
  );
};
