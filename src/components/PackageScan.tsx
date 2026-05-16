import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { db } from '../lib/firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { Package } from '../types';
import { useData } from '../context/DataContext';
import {
  MapPin, Phone, Package as PackageIcon, User,
  Weight, AlertTriangle, Banknote, Calendar,
  CheckCircle2, Clock, Truck, RotateCcw, XCircle,
  Building2, CalendarClock, UserCheck, ArrowRightLeft
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
  Pending:      { color: 'text-amber-700',  bg: 'bg-amber-50  border-amber-200',  icon: <Clock size={20} /> },
  Received:     { color: 'text-indigo-700', bg: 'bg-indigo-50 border-indigo-200', icon: <Building2 size={20} /> },
  'In Transit': { color: 'text-blue-700',   bg: 'bg-blue-50   border-blue-200',   icon: <Truck size={20} /> },
  Delivered:    { color: 'text-green-700',  bg: 'bg-green-50  border-green-200',  icon: <CheckCircle2 size={20} /> },
  Postponed:    { color: 'text-orange-700', bg: 'bg-orange-50 border-orange-200', icon: <Clock size={20} /> },
  Returned:     { color: 'text-red-700',    bg: 'bg-red-50    border-red-200',    icon: <RotateCcw size={20} /> },
  Cancelled:    { color: 'text-slate-600',  bg: 'bg-slate-50  border-slate-200',  icon: <XCircle size={20} /> },
};

// ── Contenu de la page (partagé entre connecté et anonyme) ────────
const PackageScanContent = ({
  pkg,
  currentUser,
  updatePackageStatus,
  returnPackage,
  users,
  agencies,
  assignPackage,
  transferPackages,
}: {
  pkg: Package;
  currentUser: any;
  updatePackageStatus: any;
  returnPackage: any;
  users: any[];
  agencies: any[];
  assignPackage: any;
  transferPackages: any;
}) => {
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [confirmAction, setConfirmAction] = useState<'cancel' | 'return' | 'postpone' | null>(null);

  // États pour l'affectation livreur
  const [showAssignCourier, setShowAssignCourier] = useState(false);
  const [selectedCourierId, setSelectedCourierId] = useState('');
  const [assigning, setAssigning] = useState(false);

  // États pour le transfert agence
  const [showTransferAgency, setShowTransferAgency] = useState(false);
  const [selectedAgency, setSelectedAgency] = useState('');
  const [transferring, setTransferring] = useState(false);

  const isCourierAssigned =
    currentUser?.role === 'Courier' &&
    (pkg.courierId === currentUser.id || pkg.courier === currentUser.name) &&
    ['Received', 'In Transit', 'Postponed'].includes(pkg.status);

  // Le modérateur peut affecter si le colis est Received et sans livreur
  const canAssignCourier =
    currentUser?.role === 'Agency Moderator' &&
    pkg.status === 'Received' &&
    !pkg.courierId;

  // Le modérateur peut transférer si le colis est Received
  const canTransfer =
    currentUser?.role === 'Agency Moderator' &&
    ['Received', 'Pending'].includes(pkg.status);

  // Livreurs disponibles de l'agence du modérateur
  const availableCouriers = users.filter(u =>
    u.role === 'Courier' &&
    u.status === 'Active' &&
    (u.agency === currentUser?.agency) &&
    u.availability !== 'Offline'
  );

  // Agences cibles (toutes sauf la sienne)
  const targetAgencies = agencies.filter(a =>
    a.name !== currentUser?.agency && a.status === 'Active'
  );

  const st = statusConfig[pkg.status] || statusConfig['Pending'];

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-4 py-4 flex items-center gap-3">
        <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center">
          <PackageIcon size={18} className="text-white" />
        </div>
        <div>
          <h1 className="font-black text-slate-900 text-sm">AMENA TAWSIL</h1>
          <p className="text-[10px] text-slate-400">Votre colis, notre priorité</p>
        </div>
        <span className="ml-auto font-mono text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-lg">
          {pkg.trackingId}
        </span>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-4">

        {/* Statut */}
        <div className={`flex items-center gap-3 p-4 rounded-2xl border ${st.bg}`}>
          <div className={`${st.color} flex-shrink-0`}>{st.icon}</div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase">Statut actuel</p>
            <p className={`font-black text-lg ${st.color}`}>{statusLabel[pkg.status] || pkg.status}</p>
          </div>
          {pkg.courier && (
            <div className="ml-auto text-right">
              <p className="text-[10px] text-slate-400">Livreur</p>
              <p className="text-xs font-bold text-slate-700">{pkg.courier}</p>
            </div>
          )}
        </div>

        {/* ── Boutons affectation — modérateur uniquement ── */}
        {(canAssignCourier || canTransfer) && (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 space-y-3">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Gestion</p>

            {/* Affecter un livreur */}
            {canAssignCourier && (
              <div>
                {!showAssignCourier ? (
                  <button
                    onClick={() => { setShowAssignCourier(true); setShowTransferAgency(false); }}
                    className="w-full flex items-center justify-center gap-2 py-2.5 bg-green-600 text-white rounded-xl font-bold text-sm hover:bg-green-700 transition-colors"
                  >
                    <UserCheck size={16} />Affecter un livreur
                  </button>
                ) : (
                  <div className="space-y-2">
                    <select
                      value={selectedCourierId}
                      onChange={e => setSelectedCourierId(e.target.value)}
                      className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20"
                    >
                      <option value="">Sélectionner un livreur</option>
                      {availableCouriers.map(c => (
                        <option key={c.id} value={c.id}>
                          {c.name} {c.availability === 'Available' ? '✓' : '• Occupé'}
                        </option>
                      ))}
                    </select>
                    <div className="flex gap-2">
                      <button onClick={() => { setShowAssignCourier(false); setSelectedCourierId(''); }}
                        className="flex-1 py-2 border border-slate-200 text-slate-600 rounded-xl text-sm font-medium">
                        Annuler
                      </button>
                      <button
                        disabled={!selectedCourierId || assigning}
                        onClick={async () => {
                          setAssigning(true);
                          try {
                            await assignPackage(pkg.id, selectedCourierId);
                            setShowAssignCourier(false);
                            setSelectedCourierId('');
                          } finally {
                            setAssigning(false);
                          }
                        }}
                        className="flex-1 py-2 bg-green-600 text-white rounded-xl text-sm font-bold disabled:opacity-50 flex items-center justify-center gap-1.5"
                      >
                        {assigning
                          ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          : <UserCheck size={14} />
                        }
                        Confirmer
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Transférer vers une agence */}
            {canTransfer && (
              <div>
                {!showTransferAgency ? (
                  <button
                    onClick={() => { setShowTransferAgency(true); setShowAssignCourier(false); }}
                    className="w-full flex items-center justify-center gap-2 py-2.5 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700 transition-colors"
                  >
                    <ArrowRightLeft size={16} />Affecter à une agence
                  </button>
                ) : (
                  <div className="space-y-2">
                    <select
                      value={selectedAgency}
                      onChange={e => setSelectedAgency(e.target.value)}
                      className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    >
                      <option value="">Sélectionner une agence</option>
                      {targetAgencies.map(a => (
                        <option key={a.id} value={a.name}>{a.name} — {a.location}</option>
                      ))}
                    </select>
                    <div className="flex gap-2">
                      <button onClick={() => { setShowTransferAgency(false); setSelectedAgency(''); }}
                        className="flex-1 py-2 border border-slate-200 text-slate-600 rounded-xl text-sm font-medium">
                        Annuler
                      </button>
                      <button
                        disabled={!selectedAgency || transferring}
                        onClick={async () => {
                          setTransferring(true);
                          try {
                            await transferPackages([pkg.id], selectedAgency);
                            setShowTransferAgency(false);
                            setSelectedAgency('');
                          } finally {
                            setTransferring(false);
                          }
                        }}
                        className="flex-1 py-2 bg-indigo-600 text-white rounded-xl text-sm font-bold disabled:opacity-50 flex items-center justify-center gap-1.5"
                      >
                        {transferring
                          ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          : <ArrowRightLeft size={14} />
                        }
                        Confirmer
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ── Boutons d'action — livreur assigné uniquement ── */}
        {isCourierAssigned && (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Actions</p>
            <div className="grid grid-cols-2 gap-2">
              <button
                disabled={actionLoading !== null}
                onClick={() => setConfirmAction('cancel')}
                className="flex flex-col items-center gap-1.5 py-3 px-2 bg-red-50 text-red-600 border border-red-200 rounded-xl font-bold text-xs active:scale-95 transition-all disabled:opacity-50"
              >
                <XCircle size={20} />Annuler
              </button>
              <button
                disabled={actionLoading !== null}
                onClick={() => setConfirmAction('return')}
                className="flex flex-col items-center gap-1.5 py-3 px-2 bg-orange-50 text-orange-600 border border-orange-200 rounded-xl font-bold text-xs active:scale-95 transition-all disabled:opacity-50"
              >
                <RotateCcw size={20} />Retourner
              </button>
              <button
                disabled={actionLoading !== null}
                onClick={() => setConfirmAction('postpone')}
                className="flex flex-col items-center gap-1.5 py-3 px-2 bg-purple-50 text-purple-600 border border-purple-200 rounded-xl font-bold text-xs active:scale-95 transition-all disabled:opacity-50"
              >
                <CalendarClock size={20} />Reporté
              </button>
              <button
                disabled={actionLoading !== null}
                onClick={async () => {
                  setActionLoading('delivered');
                  try {
                    await updatePackageStatus(pkg.id, 'Delivered');
                  } finally {
                    setActionLoading(null);
                  }
                }}
                className="flex flex-col items-center gap-1.5 py-3 px-2 bg-green-600 text-white rounded-xl font-bold text-xs active:scale-95 transition-all disabled:opacity-50"
              >
                {actionLoading === 'delivered'
                  ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  : <CheckCircle2 size={20} />
                }
                Livré ✓
              </button>
            </div>
          </div>
        )}

        {/* Destinataire */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-3">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Destinataire</p>
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 bg-slate-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <User size={16} className="text-slate-500" />
            </div>
            <div>
              <p className="font-bold text-slate-900">{pkg.recipientName}</p>
              <div className="flex items-center gap-1 mt-1">
                <Phone size={12} className="text-slate-400" />
                <a href={`tel:${pkg.recipientPhone}`}
                  className="text-sm text-blue-600 font-medium">
                  {pkg.recipientPhone}
                </a>
              </div>
              <div className="flex items-start gap-1 mt-1">
                <MapPin size={12} className="text-slate-400 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-slate-600">
                  {pkg.recipientAddress}, <span className="font-bold text-slate-900">{pkg.city}</span>
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Infos colis */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Détails du colis</p>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center gap-2">
              <Weight size={14} className="text-slate-400" />
              <div>
                <p className="text-[10px] text-slate-400">Poids</p>
                <p className="text-sm font-bold text-slate-900">{pkg.weight} kg</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Banknote size={14} className="text-slate-400" />
              <div>
                <p className="text-[10px] text-slate-400">À collecter</p>
                <p className="text-sm font-bold text-slate-900">{(pkg.collectedAmount || 0).toFixed(3)} TND</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Calendar size={14} className="text-slate-400" />
              <div>
                <p className="text-[10px] text-slate-400">Date création</p>
                <p className="text-sm font-bold text-slate-900">{pkg.date}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <PackageIcon size={14} className="text-slate-400" />
              <div>
                <p className="text-[10px] text-slate-400">Expéditeur</p>
                <p className="text-sm font-bold text-slate-900 truncate max-w-[100px]">{pkg.shipper}</p>
              </div>
            </div>
          </div>
          {pkg.fragile && (
            <div className="mt-3 flex items-center gap-2 px-3 py-2 bg-orange-50 border border-orange-100 rounded-xl">
              <AlertTriangle size={14} className="text-orange-500" />
              <p className="text-xs font-bold text-orange-700">Colis fragile — manipuler avec précaution</p>
            </div>
          )}
          {pkg.packageName && (
            <p className="mt-2 text-xs text-slate-500">
              Contenu : <span className="font-medium text-slate-700">{pkg.packageName}</span>
            </p>
          )}
        </div>

        {/* Historique */}
        {pkg.history && pkg.history.length > 0 && (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Historique</p>
            <div className="space-y-4">
              {[...pkg.history].reverse().map((h, i) => (
                <div key={i} className="flex gap-3 relative">
                  {i < pkg.history.length - 1 && (
                    <div className="absolute left-[7px] top-5 bottom-0 w-px bg-slate-100" />
                  )}
                  <div className={`w-3.5 h-3.5 rounded-full mt-1 flex-shrink-0 z-10 ${
                    i === 0 ? 'bg-blue-500' : 'bg-slate-200'
                  }`} />
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-900">{statusLabel[h.status] || h.status}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">{h.date}</p>
                    {h.message && (
                      <p className="text-[10px] text-slate-500 mt-0.5 italic">{h.message}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <p className="text-center text-[10px] text-slate-400 pb-4">
          AMENA TAWSIL · Votre colis, notre priorité
        </p>
      </div>

      {/* Modale Annuler */}
      {confirmAction === 'cancel' && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 bg-red-50 rounded-2xl flex items-center justify-center">
                <XCircle size={22} className="text-red-500" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900">Annuler la commande ?</h3>
                <p className="text-xs text-slate-500">#{pkg.trackingId}</p>
              </div>
            </div>
            <p className="text-sm text-slate-600">
              Le colis de <span className="font-bold">{pkg.recipientName}</span> sera marqué comme annulé.
            </p>
            <div className="flex gap-2">
              <button onClick={() => setConfirmAction(null)}
                className="flex-1 py-3 border border-slate-200 text-slate-600 rounded-xl font-medium text-sm">
                Retour
              </button>
              <button
                disabled={actionLoading !== null}
                onClick={async () => {
                  setConfirmAction(null);
                  setActionLoading('cancel');
                  try {
                    await updatePackageStatus(pkg.id, 'Cancelled', 'Annulé par le livreur');
                  } finally {
                    setActionLoading(null);
                  }
                }}
                className="flex-1 py-3 bg-red-600 text-white rounded-xl font-bold text-sm">
                Confirmer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modale Retourner */}
      {confirmAction === 'return' && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 bg-orange-50 rounded-2xl flex items-center justify-center">
                <RotateCcw size={22} className="text-orange-500" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900">Retourner le colis ?</h3>
                <p className="text-xs text-slate-500">#{pkg.trackingId}</p>
              </div>
            </div>
            <p className="text-sm text-slate-600">
              Le colis sera remis à l'agence et prêt à être réaffecté.
            </p>
            <div className="flex gap-2">
              <button onClick={() => setConfirmAction(null)}
                className="flex-1 py-3 border border-slate-200 text-slate-600 rounded-xl font-medium text-sm">
                Retour
              </button>
              <button
                disabled={actionLoading !== null}
                onClick={async () => {
                  setConfirmAction(null);
                  setActionLoading('return');
                  try {
                    await returnPackage(pkg.id);
                  } finally {
                    setActionLoading(null);
                  }
                }}
                className="flex-1 py-3 bg-orange-500 text-white rounded-xl font-bold text-sm">
                Confirmer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modale Reporté */}
      {confirmAction === 'postpone' && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 bg-purple-50 rounded-2xl flex items-center justify-center">
                <CalendarClock size={22} className="text-purple-500" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900">Reporter la livraison ?</h3>
                <p className="text-xs text-slate-500">#{pkg.trackingId}</p>
              </div>
            </div>
            <div className="bg-purple-50 border border-purple-100 rounded-2xl p-3 space-y-1">
              <p className="text-sm text-slate-700">
                Le client <span className="font-bold">{pkg.recipientName}</span> n'est pas disponible.
              </p>
              <p className="text-xs text-purple-700 font-medium">→ Statut : Reporté · Vous restez assigné</p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setConfirmAction(null)}
                className="flex-1 py-3 border border-slate-200 text-slate-600 rounded-xl font-medium text-sm">
                Retour
              </button>
              <button
                disabled={actionLoading !== null}
                onClick={async () => {
                  setConfirmAction(null);
                  setActionLoading('postpone');
                  try {
                    await updatePackageStatus(pkg.id, 'Postponed', 'Client non disponible — livraison reportée');
                  } finally {
                    setActionLoading(null);
                  }
                }}
                className="flex-1 py-3 bg-purple-600 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-1.5">
                <CalendarClock size={15} />Confirmer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ── Wrapper connecté — a accès au DataContext ─────────────────────
const PackageScanConnected = () => {
  const { trackingId } = useParams<{ trackingId: string }>();
  const { currentUser, updatePackageStatus, returnPackage, users, agencies, assignPackage, transferPackages } = useData();
  const [pkg, setPkg] = useState<Package | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!trackingId) { setNotFound(true); setLoading(false); return; }

    let unsub: (() => void) | null = null;
    let retryCount = 0;
    const MAX_RETRIES = 3;

    const subscribe = () => {
      const q = query(collection(db, 'packages'), where('trackingId', '==', trackingId.toUpperCase()));
      unsub = onSnapshot(q,
        (snap) => {
          if (snap.empty) { setNotFound(true); }
          else {
            const data = snap.docs[0].data();
            setPkg({ id: snap.docs[0].id, ...data, history: Array.isArray(data.history) ? data.history : [] } as Package);
            setNotFound(false);
          }
          setLoading(false);
        },
        (error) => {
          // Erreur de permission — réessayer après délai (token Auth pas encore propagé)
          if (retryCount < MAX_RETRIES) {
            retryCount++;
            setTimeout(() => {
              if (unsub) { unsub(); unsub = null; }
              subscribe();
            }, 800 * retryCount);
          } else {
            setNotFound(true);
            setLoading(false);
          }
        }
      );
    };

    subscribe();
    return () => { if (unsub) unsub(); };
  }, [trackingId]);

  if (loading) return <LoadingScreen />;
  if (notFound || !pkg) return <NotFoundScreen trackingId={trackingId} />;

  return (
    <PackageScanContent
      pkg={pkg}
      currentUser={currentUser}
      updatePackageStatus={updatePackageStatus}
      returnPackage={returnPackage}
      users={users}
      agencies={agencies}
      assignPackage={assignPackage}
      transferPackages={transferPackages}
    />
  );
};

// ── Wrapper public — sans DataContext ─────────────────────────────
const PackageScanPublic = () => {
  const { trackingId } = useParams<{ trackingId: string }>();
  const [pkg, setPkg] = useState<Package | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!trackingId) { setNotFound(true); setLoading(false); return; }
    const q = query(collection(db, 'packages'), where('trackingId', '==', trackingId.toUpperCase()));
    const unsub = onSnapshot(q, (snap) => {
      if (snap.empty) { setNotFound(true); }
      else {
        const data = snap.docs[0].data();
        setPkg({ id: snap.docs[0].id, ...data, history: Array.isArray(data.history) ? data.history : [] } as Package);
      }
      setLoading(false);
    }, () => { setNotFound(true); setLoading(false); });
    return () => unsub();
  }, [trackingId]);

  if (loading) return <LoadingScreen />;
  if (notFound || !pkg) return <NotFoundScreen trackingId={trackingId} />;

  return (
    <PackageScanContent
      pkg={pkg}
      currentUser={null}
      updatePackageStatus={null}
      returnPackage={null}
      users={[]}
      agencies={[]}
      assignPackage={null}
      transferPackages={null}
    />
  );
};

// ── Écrans utilitaires ────────────────────────────────────────────
const LoadingScreen = () => (
  <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
    <div className="flex flex-col items-center gap-3">
      <div className="w-12 h-12 rounded-2xl bg-blue-100 flex items-center justify-center animate-pulse">
        <PackageIcon size={24} className="text-blue-500" />
      </div>
      <p className="text-slate-500 text-sm font-medium">Chargement du colis...</p>
    </div>
  </div>
);

const NotFoundScreen = ({ trackingId }: { trackingId?: string }) => (
  <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-6">
    <div className="text-center max-w-sm">
      <div className="w-16 h-16 bg-red-50 text-red-400 rounded-3xl flex items-center justify-center mx-auto mb-4">
        <XCircle size={32} />
      </div>
      <h2 className="text-xl font-bold text-slate-900 mb-2">Colis introuvable</h2>
      <p className="text-slate-500 text-sm">
        Aucun colis trouvé avec l'identifiant{' '}
        <span className="font-mono font-bold text-slate-700">{trackingId}</span>.
      </p>
    </div>
  </div>
);

// ── Export — App.tsx choisit lequel utiliser selon l'auth ─────────
export { PackageScanConnected as PackageScan, PackageScanPublic };
