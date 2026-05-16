import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { Check, X, User as UserIcon, Clock, Building2, Bike, Store, Package as PackageIcon, AlertCircle } from 'lucide-react';
import { filterPendingPackagesForAgency } from '../lib/packageUtils';

export const ApprovalManagement = () => {
  const { users, packages, approveUser, rejectUser, approvePackage, rejectPackage, notifications, currentUser } = useData();
  const [processingUser, setProcessingUser] = useState<string | null>(null);
  const [processingPkg, setProcessingPkg] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [rejectingPkgId, setRejectingPkgId] = useState<string | null>(null);

  const pendingUsers = users.filter(u => u.status === 'Pending');

  const pendingPackages = (() => {
    const waiting = packages.filter(p => p.approvalStatus === 'waiting');
    if (currentUser?.role === 'Agency Moderator') {
      const agencyUserNames = users
        .filter(u => u.agency === currentUser.agency || (u as any).pendingAgency === currentUser.agency)
        .flatMap(u => [u.name, u.companyName].filter(Boolean)) as string[];
      return filterPendingPackagesForAgency(packages, currentUser.agency || '', agencyUserNames);
    }
    return waiting;
  })();

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'Courier': return <Bike size={18} className="text-orange-500" />;
      case 'Shipper': return <Store size={18} className="text-indigo-500" />;
      default: return <UserIcon size={18} className="text-slate-500" />;
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'Courier': return 'Livreur';
      case 'Shipper': return 'Expéditeur';
      case 'Agency Moderator': return 'Modérateur';
      default: return role;
    }
  };

  const handleApproveUser = async (id: string) => {
    setProcessingUser(id);
    await approveUser(id);
    setProcessingUser(null);
  };

  const handleRejectUser = async (id: string) => {
    setProcessingUser(id);
    await rejectUser(id);
    setProcessingUser(null);
  };

  const handleApprovePkg = async (id: string) => {
    setProcessingPkg(id);
    await approvePackage(id);
    setProcessingPkg(null);
  };

  const handleRejectPkg = async () => {
    if (!rejectingPkgId) return;
    setProcessingPkg(rejectingPkgId);
    await rejectPackage(rejectingPkgId, rejectReason || undefined);
    setProcessingPkg(null);
    setRejectingPkgId(null);
    setRejectReason('');
  };

  const totalPending = pendingUsers.length + pendingPackages.length;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Demandes d'approbation</h1>
          <p className="text-slate-500 text-sm">
            {currentUser?.role === 'Agency Moderator'
              ? 'Confirmez la réception des colis soumis par les expéditeurs de votre agence.'
              : 'Vue globale des comptes et colis en attente.'}
          </p>
        </div>
        {totalPending > 0 && (
          <span className="px-3 py-1.5 bg-amber-100 text-amber-700 text-sm font-bold rounded-xl">
            {totalPending} en attente
          </span>
        )}
      </div>

      {/* ── Section Comptes (Super Admin seulement) ── */}
      {currentUser?.role === 'Super Admin' && (
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <UserIcon size={16} className="text-slate-500" />
            <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wide">Comptes utilisateurs</h2>
            {pendingUsers.length > 0 && (
              <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-xs font-bold rounded-full">
                {pendingUsers.length}
              </span>
            )}
          </div>
          {pendingUsers.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-100 p-8 text-center">
              <Check size={24} className="mx-auto text-green-400 mb-2" />
              <p className="text-slate-500 text-sm">Aucun compte en attente.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {pendingUsers.map((user) => (
                <div key={user.id} className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 flex flex-col gap-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-600 font-bold text-lg">
                        {user.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-bold text-slate-900">{user.name}</p>
                        <p className="text-xs text-slate-500">{user.email}</p>
                      </div>
                    </div>
                    <span className="flex items-center gap-1 px-2 py-1 bg-amber-50 text-amber-600 text-[10px] font-bold rounded-lg uppercase">
                      <Clock size={10} />En attente
                    </span>
                  </div>
                  <div className="space-y-2 py-3 border-t border-b border-slate-100">
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      {getRoleIcon(user.role)}
                      <span className="font-medium">{getRoleLabel(user.role)}</span>
                    </div>
                    {(user.agency || (user as any).pendingAgency) && (
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <Building2 size={16} className="text-blue-500" />
                        <span>{(user as any).pendingAgency || user.agency}</span>
                      </div>
                    )}
                    {user.phone && (
                      <div className="flex items-center gap-2 text-sm text-slate-500">
                        <span className="text-xs">📞</span>
                        <span>{user.phone}</span>
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => handleRejectUser(user.id)} disabled={processingUser === user.id}
                      className="flex-1 flex items-center justify-center gap-2 py-2.5 border border-red-200 text-red-600 rounded-xl font-medium hover:bg-red-50 transition-colors disabled:opacity-50 text-sm">
                      <X size={16} />Refuser
                    </button>
                    <button onClick={() => handleApproveUser(user.id)} disabled={processingUser === user.id}
                      className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-green-600 text-white rounded-xl font-medium hover:bg-green-700 transition-colors disabled:opacity-50 text-sm shadow-lg shadow-green-100">
                      <Check size={16} />Approuver
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* ── Section Colis ── */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <PackageIcon size={16} className="text-slate-500" />
          <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wide">
            {currentUser?.role === 'Agency Moderator' ? 'Colis en attente de réception' : 'Colis en attente'}
          </h2>
          {pendingPackages.length > 0 && (
            <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-xs font-bold rounded-full">
              {pendingPackages.length}
            </span>
          )}
        </div>

        {pendingPackages.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-100 p-8 text-center">
            <Check size={24} className="mx-auto text-green-400 mb-2" />
            <p className="text-slate-500 text-sm">Aucun colis en attente.</p>
          </div>
        ) : (
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-100">
                  <th className="px-4 py-4 text-xs font-bold text-slate-500 uppercase">ID Suivi</th>
                  <th className="px-4 py-4 text-xs font-bold text-slate-500 uppercase">Expéditeur</th>
                  <th className="px-4 py-4 text-xs font-bold text-slate-500 uppercase hidden sm:table-cell">Destinataire</th>
                  <th className="px-4 py-4 text-xs font-bold text-slate-500 uppercase hidden md:table-cell">Destination</th>
                  <th className="px-4 py-4 text-xs font-bold text-slate-500 uppercase hidden sm:table-cell">Montant</th>
                  <th className="px-4 py-4 text-xs font-bold text-slate-500 uppercase hidden md:table-cell">Date</th>
                  <th className="px-4 py-4 text-xs font-bold text-slate-500 uppercase">
                    {currentUser?.role === 'Agency Moderator' ? 'Réception' : 'Statut'}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {pendingPackages.map(pkg => (
                  <tr key={pkg.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-4 py-4">
                      <span className="text-sm font-mono font-bold text-blue-600">{pkg.trackingId}</span>
                    </td>
                    <td className="px-4 py-4 text-sm font-medium text-slate-900">{pkg.shipper}</td>
                    <td className="px-4 py-4 hidden sm:table-cell">
                      <p className="text-sm text-slate-700">{pkg.recipientName}</p>
                      <p className="text-xs text-slate-400">{pkg.recipientPhone}</p>
                    </td>
                    <td className="px-4 py-4 hidden md:table-cell">
                      <p className="text-sm text-slate-700">{pkg.city}</p>
                      <p className="text-xs text-slate-400 truncate max-w-[120px]">{pkg.recipientAddress}</p>
                    </td>
                    <td className="px-4 py-4 text-sm font-bold text-slate-900 hidden sm:table-cell">{(pkg.collectedAmount || 0).toFixed(3)} TND</td>
                    <td className="px-4 py-4 text-xs text-slate-500 hidden md:table-cell">{pkg.date}</td>
                    <td className="px-4 py-4">
                      {currentUser?.role === 'Agency Moderator' ? (
                        <div className="flex items-center gap-2">
                          <button onClick={() => setRejectingPkgId(pkg.id)} disabled={processingPkg === pkg.id}
                            className="flex items-center gap-1.5 px-3 py-1.5 border border-red-200 text-red-600 rounded-lg text-xs font-medium hover:bg-red-50 transition-colors disabled:opacity-50">
                            <X size={13} />Non reçu
                          </button>
                          <button onClick={() => handleApprovePkg(pkg.id)} disabled={processingPkg === pkg.id}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 text-white rounded-lg text-xs font-medium hover:bg-green-700 transition-colors disabled:opacity-50 shadow-sm shadow-green-100">
                            <Check size={13} />Reçu
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400 italic">Vue seule</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* ── Modal raison non reçu ── */}
      {rejectingPkgId && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center">
                <AlertCircle size={20} className="text-red-500" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900">Colis non reçu</h3>
                <p className="text-xs text-slate-500">
                  {packages.find(p => p.id === rejectingPkgId)?.trackingId}
                </p>
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase">Raison (optionnel)</label>
              <textarea
                value={rejectReason}
                onChange={e => setRejectReason(e.target.value)}
                rows={3}
                placeholder="Ex: Adresse incomplète, colis introuvable..."
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 resize-none"
              />
            </div>
            <div className="flex gap-2 pt-1">
              <button onClick={() => { setRejectingPkgId(null); setRejectReason(''); }}
                className="flex-1 py-2.5 border border-slate-200 text-slate-600 rounded-xl font-medium hover:bg-slate-50 transition-colors text-sm">
                Annuler
              </button>
              <button onClick={handleRejectPkg} disabled={processingPkg === rejectingPkgId}
                className="flex-1 py-2.5 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700 transition-colors disabled:opacity-50 text-sm">
                Confirmer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
