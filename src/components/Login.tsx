import React, { useState, useEffect } from 'react';
import { Mail, Lock, ArrowRight, QrCode } from 'lucide-react';
import { useData } from '../context/DataContext';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';

export const Login = ({ redirectTo }: { redirectTo?: string }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login, currentUser } = useData();
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // Quand currentUser devient défini après connexion → rediriger
  useEffect(() => {
    if (currentUser && redirectTo) {
      navigate(redirectTo, { replace: true });
    }
  }, [currentUser, redirectTo, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await login(email, password);
    if (!success) {
      setError('Email ou mot de passe incorrect, ou compte inactif / en attente de validation.');
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-10">
          <div className="w-16 h-16 rounded-2xl overflow-hidden shadow-xl shadow-blue-200 mx-auto mb-6">
            <img src="/logo.jpg" alt="Logo" className="w-full h-full object-cover" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900">AMENA TAWSIL</h1>
          <p className="text-slate-500 mt-2 font-medium">Votre colis, notre priorité</p>
        </div>

        {/* Bandeau informatif si redirection depuis scan QR */}
        {redirectTo?.startsWith('/scan/') && (
          <div className="flex items-center gap-3 px-4 py-3 bg-blue-50 border border-blue-100 rounded-2xl mb-6">
            <QrCode size={18} className="text-blue-500 flex-shrink-0" />
            <p className="text-sm text-blue-700 font-medium">
              Connectez-vous pour accéder aux informations du colis et effectuer des actions.
            </p>
          </div>
        )}

        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/50">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Adresse e-mail</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                <input
                  required
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                  placeholder="nom@amenatawsil.tn"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Mot de passe</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                  placeholder="Votre mot de passe"
                />
              </div>
            </div>

            {error && (
              <p className="text-xs font-bold text-red-500 text-center bg-red-50 py-2 rounded-lg">{error}</p>
            )}

            <button
              type="submit"
              className="w-full py-4 bg-blue-600 text-white rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 active:scale-[0.98]"
            >
              Se connecter à l'espace
              <ArrowRight size={18} />
            </button>
          </form>
        </div>

        <p className="text-center text-slate-400 text-xs mt-8">
          &copy; 2024 AMENA TAWSIL. Tous droits réservés.
        </p>
      </motion.div>
    </div>
  );
};
