import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { Package } from '../types';
import {
  ScanBarcode, X, Search, MapPin, Phone,
  CheckCircle2, Clock, Truck, RotateCcw, XCircle,
  Building2, Banknote, Weight, AlertTriangle, Package as PackageIcon
} from 'lucide-react';

const statusLabel: Record<string, string> = {
  Pending:      'En attente',
  Received:     'Reçu à l\'agence',
  'In Transit': 'En cours de livraison',
  Delivered:    'Livré',
  Postponed:    'Reporté',
  Returned:     'Retourné',
  Cancelled:    'Annulé',
};

const statusConfig: Record<string, { color: string; bg: string; icon: React.ReactNode }> = {
  Pending:      { color: 'text-amber-700',  bg: 'bg-amber-50  border-amber-200',  icon: <Clock size={18} /> },
  Received:     { color: 'text-indigo-700', bg: 'bg-indigo-50 border-indigo-200', icon: <Building2 size={18} /> },
  'In Transit': { color: 'text-blue-700',   bg: 'bg-blue-50   border-blue-200',   icon: <Truck size={18} /> },
  Delivered:    { color: 'text-green-700',  bg: 'bg-green-50  border-green-200',  icon: <CheckCircle2 size={18} /> },
  Postponed:    { color: 'text-orange-700', bg: 'bg-orange-50 border-orange-200', icon: <Clock size={18} /> },
  Returned:     { color: 'text-red-700',    bg: 'bg-red-50    border-red-200',    icon: <RotateCcw size={18} /> },
  Cancelled:    { color: 'text-slate-600',  bg: 'bg-slate-50  border-slate-200',  icon: <XCircle size={18} /> },
};

export const BarcodeScanner = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [pkg, setPkg] = useState<Package | null>(null);
  const [loading, setLoading] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  // Focus automatique sur l'input quand le modal s'ouvre
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
      setInput('');
      setPkg(null);
      setNotFound(false);
    }
  }, [isOpen]);

  // Raccourci clavier global : F2 ou Ctrl+B pour ouvrir le scanner
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'F2' || (e.ctrlKey && e.key === 'b')) {
        e.preventDefault();
        setIsOpen(true);
      }
      if (e.key === 'Escape') setIsOpen(false);
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, []);

  const search = async (trackingId: string) => {
    const id = trackingId.trim().toUpperCase();
    if (!id) return;
    setLoading(true);
    setPkg(null);
    setNotFound(false);
    try {
      const q = query(collection(db, 'packages'), where('trackingId', '==', id));
      const snap = await getDocs(q);
      if (snap.empty) {
        setNotFound(true);
      } else {
        const data = snap.docs[0].data();
        setPkg({ id: snap.docs[0].id, ...data, history: Array.isArray(data.history) ? data.history : [] } as Package);
      }
    } catch {
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  };

  // La douchette envoie le code + Enter → déclenche la recherche
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      search(input);
    }
  };

  const handleViewFull = () => {
    if (pkg) {
      navigate(`/scan/${pkg.trackingId}`);
      setIsOpen(false);
    }
  };

  const st = pkg ? (statusConfig[pkg.status] || statusConfig['Pending']) : null;

  return (
    <>
      {/* Bouton déclencheur dans la sidebar */}
      <button
        onClick={() => setIsOpen(true)}
        title="Scanner un colis (F2)"
        className="flex items-center gap-3 py-2.5 rounded-xl transition-all duration-200 text-slate-500 hover:bg-slate-50 hover:text-slate-900 w-full px-4 group"
      >
        <ScanBarcode size={19} className="transition-colors min-w-[19px] group-hover:text-blue-600" />
        <span className="text-sm whitespace-nowrap flex-1 text-left">Scanner un colis</span>
        <span className="text-[9px] text-slate-300 font-mono">F2</span>
      </button>

      {/* Modal scanner */}
      {isOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-start justify-center pt-20 p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden">

            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center">
                  <ScanBarcode size={20} />
                </div>
                <div>
                  <h2 className="font-bold text-slate-900">Scanner un colis</h2>
                  <p className="text-[10px] text-slate-400">Scannez ou saisissez l'ID de suivi</p>
                </div>
              </div>
              <button onClick={() => setIsOpen(false)}
                className="p-2 text-slate-400 hover:bg-slate-100 rounded-xl transition-colors">
                <X size={18} />
              </button>
            </div>

            {/* Input */}
            <div className="px-6 py-4">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="AT-XXXXXX — Scannez ou tapez + Entrée"
                  className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border-2 border-blue-200 rounded-2xl text-sm font-mono font-bold focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all"
                  autoComplete="off"
                  spellCheck={false}
                />
                {input && (
                  <button
                    onClick={() => { setInput(''); setPkg(null); setNotFound(false); inputRef.current?.focus(); }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 rounded-lg">
                    <X size={14} />
                  </button>
                )}
              </div>
              <div className="flex gap-2 mt-3">
                <button
                  onClick={() => search(input)}
                  disabled={!input.trim() || loading}
                  className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl font-bold text-sm hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading
                    ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    : <Search size={15} />
                  }
                  {loading ? 'Recherche...' : 'Rechercher'}
                </button>
              </div>
            </div>

            {/* Résultat */}
            <div className="px-6 pb-6">
              {/* Chargement */}
              {loading && (
                <div className="flex items-center justify-center py-8 gap-3 text-slate-400">
                  <div className="w-5 h-5 border-2 border-slate-300 border-t-blue-500 rounded-full animate-spin" />
                  <span className="text-sm">Recherche en cours...</span>
                </div>
              )}

              {/* Introuvable */}
              {!loading && notFound && (
                <div className="flex flex-col items-center py-8 text-center">
                  <div className="w-12 h-12 bg-red-50 text-red-400 rounded-2xl flex items-center justify-center mb-3">
                    <XCircle size={24} />
                  </div>
                  <p className="font-bold text-slate-900">Colis introuvable</p>
                  <p className="text-sm text-slate-500 mt-1">
                    Aucun colis avec l'identifiant <span className="font-mono font-bold">{input.toUpperCase()}</span>
                  </p>
                </div>
              )}

              {/* Résultat trouvé */}
              {!loading && pkg && st && (
                <div className="space-y-3">
                  {/* Statut */}
                  <div className={`flex items-center gap-3 p-3 rounded-2xl border ${st.bg}`}>
                    <div className={`${st.color} flex-shrink-0`}>{st.icon}</div>
                    <div className="flex-1">
                      <p className="text-[10px] font-bold text-slate-400 uppercase">Statut</p>
                      <p className={`font-black text-base ${st.color}`}>{statusLabel[pkg.status] || pkg.status}</p>
                    </div>
                    <span className="font-mono text-xs font-bold text-blue-600 bg-white px-2 py-1 rounded-lg border border-blue-100">
                      {pkg.trackingId}
                    </span>
                  </div>

                  {/* Infos principales */}
                  <div className="bg-slate-50 rounded-2xl p-4 space-y-2.5">
                    <div className="flex items-start gap-2">
                      <PackageIcon size={14} className="text-slate-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-[10px] text-slate-400 font-bold uppercase">Destinataire</p>
                        <p className="text-sm font-bold text-slate-900">{pkg.recipientName}</p>
                        <div className="flex items-center gap-1 mt-0.5">
                          <Phone size={11} className="text-slate-400" />
                          <span className="text-xs text-slate-600">{pkg.recipientPhone}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <MapPin size={14} className="text-slate-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-[10px] text-slate-400 font-bold uppercase">Adresse</p>
                        <p className="text-xs text-slate-700">{pkg.recipientAddress}</p>
                        <p className="text-xs font-bold text-slate-900">{pkg.city}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2 pt-1 border-t border-slate-200">
                      <div>
                        <p className="text-[10px] text-slate-400 font-bold uppercase">Expéditeur</p>
                        <p className="text-xs font-bold text-slate-900 truncate">{pkg.shipper}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-400 font-bold uppercase">Montant</p>
                        <p className="text-xs font-bold text-slate-900">{(pkg.collectedAmount || 0).toFixed(3)} TND</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-400 font-bold uppercase">Livreur</p>
                        <p className="text-xs font-bold text-slate-900 truncate">{pkg.courier || '—'}</p>
                      </div>
                    </div>
                    {pkg.fragile && (
                      <div className="flex items-center gap-1.5 px-2 py-1.5 bg-orange-50 border border-orange-100 rounded-xl">
                        <AlertTriangle size={12} className="text-orange-500" />
                        <p className="text-[10px] font-bold text-orange-700">Colis fragile</p>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <button
                      onClick={handleViewFull}
                      className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl font-bold text-sm hover:bg-blue-700 transition-colors"
                    >
                      Voir la page complète
                    </button>
                    <button
                      onClick={() => { setInput(''); setPkg(null); setNotFound(false); inputRef.current?.focus(); }}
                      className="px-4 py-2.5 bg-slate-100 text-slate-600 rounded-xl font-medium text-sm hover:bg-slate-200 transition-colors"
                    >
                      Nouveau scan
                    </button>
                  </div>
                </div>
              )}

              {/* État initial */}
              {!loading && !pkg && !notFound && (
                <div className="flex flex-col items-center py-6 text-center text-slate-400">
                  <ScanBarcode size={36} className="mb-2 opacity-30" />
                  <p className="text-sm">Prêt à scanner</p>
                  <p className="text-xs mt-1 opacity-70">Pointez la douchette sur le code barre du colis</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
