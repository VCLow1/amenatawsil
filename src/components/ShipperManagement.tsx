import React, { useState } from 'react';
import { Store, Plus, Search, Phone, Mail, Edit, Trash2, Package, X, Key, RefreshCw, CheckCircle2, Clock, AlertCircle, Banknote } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { User } from '../types';

export const ShipperManagement = () => {
  const { users, addUser, updateUser, deleteUsers, packages, currentUser, agencies } = useData();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingShipper, setEditingShipper] = useState<User | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const [formData, setFormData] = useState({
    companyName: '', name: '', phone: '', email: '',
    address: '', password: '', selectedAgency: '',
    pickupFee: 0,
  });

  const generatePassword = () => {
    const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
    let pwd = "";
    for (let i = 0; i < 12; i++) pwd += chars.charAt(Math.floor(Math.random() * chars.length));
    setFormData(prev => ({ ...prev, password: pwd }));
  };

  const shippers = users.filter(u =>
    u.role === 'Shipper' &&
    (currentUser?.role === 'Super Admin' ||
      u.agency === currentUser?.agency ||
      (u as any).pendingAgency === currentUser?.agency)
  );

  const filteredShippers = shippers.filter(s =>
    (s.companyName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStats = (shipper: User) => {
    const pkgs = packages.filter(p =>
      p.shipper === shipper.companyName || p.shipper === shipper.name
    );
    return {
      total: pkgs.length,
      delivered: pkgs.filter(p => p.status === 'Delivered').length,
      pending: pkgs.filter(p => p.status === 'Pending').length,
      returned: pkgs.filter(p => p.status === 'Returned' || p.status === 'Cancelled').length,
      balance: pkgs.reduce((acc, p) => acc + (p.status === 'Delivered' ? p.collectedAmount : 0), 0),
    };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setSubmitting(true);
    try {
      const isSuperAdmin = currentUser?.role === 'Super Admin';
      const agencyToAssign = isSuperAdmin ? formData.selectedAgency : currentUser?.agency;
      if (editingShipper) {
        await updateUser(editingShipper.id, {
          companyName: formData.companyName, name: formData.name,
          phone: formData.phone, email: formData.email, address: formData.address,
          pickupFee: formData.pickupFee,
          ...(agencyToAssign && { agency: agencyToAssign }),
        });
      } else {
        await addUser({
          companyName: formData.companyName, name: formData.name,
          phone: formData.phone, email: formData.email, address: formData.address,
          password: formData.password, role: 'Shipper', balance: 0,
          pickupFee: formData.pickupFee,
          status: isSuperAdmin ? 'Active' : 'Pending',
          agency: agencyToAssign,
        });
      }
      closeModal();
    } catch (err: any) {
      setFormError(err.message || 'Une erreur est survenue.');
    } finally {
      setSubmitting(false);
    }
  };

  const openModal = (shipper?: User) => {
    setFormError('');
    if (shipper) {
      setEditingShipper(shipper);
      setFormData({
        companyName: shipper.companyName || '', name: shipper.name,
        phone: shipper.phone || '', email: shipper.email,
        address: shipper.address || '', password: '',
        selectedAgency: shipper.agency || '',
        pickupFee: shipper.pickupFee ?? 0,
      });
    } else {
      setEditingShipper(null);
      setFormData({ companyName: '', name: '', phone: '', email: '', address: '', password: '', selectedAgency: '', pickupFee: 0 });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => { setIsModalOpen(false); setEditingShipper(null); };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Gestion des Expéditeurs</h1>
          <p className="text-slate-500 text-sm">{filteredShippers.length} expéditeur{filteredShippers.length > 1 ? 's' : ''}</p>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:flex-none">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input type="text" placeholder="Rechercher..." value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full sm:w-56 pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
          </div>
          {currentUser?.role === 'Agency Moderator' && (
            <button onClick={() => openModal()}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200 whitespace-nowrap">
              <Plus size={18} /><span>Nouvel Expéditeur</span>
            </button>
          )}
        </div>
      </div>

      {/* Cards */}
      {filteredShippers.length === 0 ? (
        <div className="bg-white rounded-3xl border border-dashed border-slate-200 p-16 text-center">
          <Store size={48} className="mx-auto text-slate-200 mb-4" />
          <p className="text-slate-500 font-medium">Aucun expéditeur trouvé</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filteredShippers.map(shipper => {
            const stats = getStats(shipper);
            return (
              <div key={shipper.id} className="bg-white rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-all flex flex-col">
                {/* Card Header */}
                <div className="p-5 border-b border-slate-100">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center font-bold text-lg">
                        {(shipper.companyName || shipper.name).charAt(0)}
                      </div>
                      <div>
                        <p className="font-bold text-slate-900">{shipper.companyName || shipper.name}</p>
                        <p className="text-xs text-slate-500">{shipper.name}</p>
                      </div>
                    </div>
                    <span className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase flex-shrink-0 ${
                      shipper.status === 'Active' ? 'bg-green-100 text-green-700' :
                      shipper.status === 'Pending' ? 'bg-amber-100 text-amber-700' :
                      'bg-slate-100 text-slate-500'
                    }`}>
                      {shipper.status === 'Active' ? 'Actif' : shipper.status === 'Pending' ? 'En attente' : shipper.status}
                    </span>
                  </div>

                  {/* Contact */}
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <Phone size={11} /><span>{shipper.phone || 'N/A'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <Mail size={11} /><span className="truncate">{shipper.email}</span>
                    </div>
                    {shipper.agency && (
                      <div className="flex items-center gap-2 text-xs text-indigo-600 font-medium">
                        <Store size={11} /><span>{shipper.agency}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Stats colis */}
                <div className="p-4 grid grid-cols-3 gap-2">
                  <div className="bg-amber-50 rounded-xl p-2.5 text-center">
                    <p className="text-lg font-black text-amber-700">{stats.pending}</p>
                    <p className="text-[9px] text-amber-500 font-bold uppercase">En attente</p>
                  </div>
                  <div className="bg-green-50 rounded-xl p-2.5 text-center">
                    <p className="text-lg font-black text-green-700">{stats.delivered}</p>
                    <p className="text-[9px] text-green-500 font-bold uppercase">Livrés</p>
                  </div>
                  <div className="bg-blue-50 rounded-xl p-2.5 text-center">
                    <p className="text-lg font-black text-blue-700">{stats.total}</p>
                    <p className="text-[9px] text-blue-500 font-bold uppercase">Total</p>
                  </div>
                </div>

                {/* Solde + Pick-up */}
                <div className="px-4 pb-3 space-y-2">
                  <div className="flex items-center justify-between px-3 py-2 bg-slate-50 rounded-xl">
                    <span className="text-xs text-slate-500 font-medium">Solde net</span>
                    <span className="text-sm font-black text-slate-900">{(shipper.balance || stats.balance).toFixed(3)} TND</span>
                  </div>
                  {shipper.pickupFee !== undefined && shipper.pickupFee > 0 && (
                    <div className="flex items-center justify-between px-3 py-2 bg-indigo-50 rounded-xl">
                      <div className="flex items-center gap-1.5">
                        <Banknote size={13} className="text-indigo-500" />
                        <span className="text-xs text-indigo-700 font-medium">Frais pick-up</span>
                      </div>
                      <span className="text-sm font-black text-indigo-700">{shipper.pickupFee.toFixed(3)} TND</span>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="p-4 pt-0 mt-auto flex gap-2">
                  <button
                    onClick={() => navigate(`/packages?shipper=${encodeURIComponent(shipper.companyName || shipper.name)}`)}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors text-sm shadow-lg shadow-blue-100"
                  >
                    <Package size={15} />
                    Voir colis
                  </button>
                  {currentUser?.role === 'Agency Moderator' && (
                    <>
                      <button onClick={() => openModal(shipper)}
                        className="p-2.5 bg-slate-100 text-slate-600 rounded-xl hover:bg-slate-200 transition-colors" title="Modifier">
                        <Edit size={15} />
                      </button>
                      <button onClick={() => { if (window.confirm('Supprimer cet expéditeur ?')) deleteUsers(shipper.id); }}
                        className="p-2.5 bg-red-50 text-red-500 rounded-xl hover:bg-red-100 transition-colors" title="Supprimer">
                        <Trash2 size={15} />
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl w-full max-w-md p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-slate-900">
                {editingShipper ? 'Modifier l\'expéditeur' : 'Nouvel expéditeur'}
              </h2>
              <button onClick={closeModal} className="p-2 text-slate-400 hover:bg-slate-100 rounded-xl"><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nom de l'entreprise</label>
                <input required type="text" value={formData.companyName}
                  onChange={e => setFormData({...formData, companyName: e.target.value})}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nom du contact</label>
                <input required type="text" value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Téléphone</label>
                  <input required type="tel" value={formData.phone}
                    onChange={e => setFormData({...formData, phone: e.target.value})}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                  <input required type="email" value={formData.email}
                    onChange={e => setFormData({...formData, email: e.target.value})}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Adresse</label>
                <input type="text" value={formData.address}
                  onChange={e => setFormData({...formData, address: e.target.value})}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  placeholder="123 Rue, Tunis" />
              </div>
              {/* Frais de pick-up */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Frais de pick-up (TND)
                </label>
                <div className="relative">
                  <Banknote className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
                  <input
                    type="number"
                    step="0.001"
                    min="0"
                    value={formData.pickupFee}
                    onChange={e => setFormData({...formData, pickupFee: parseFloat(e.target.value) || 0})}
                    className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    placeholder="0.000"
                  />
                </div>
                <p className="text-[10px] text-slate-400 mt-1">
                  Montant de transfert des produits entre l'agence et l'expéditeur.
                </p>
              </div>
              {currentUser?.role === 'Super Admin' && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Agence</label>
                  <select value={formData.selectedAgency}
                    onChange={e => setFormData({...formData, selectedAgency: e.target.value})}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20">
                    <option value="">Sans agence</option>
                    {agencies.map(a => <option key={a.id} value={a.name}>{a.name}</option>)}
                  </select>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Mot de passe</label>
                <div className="relative">
                  <input required={!editingShipper} type="text" value={formData.password}
                    onChange={e => setFormData({...formData, password: e.target.value})}
                    className="w-full pl-10 pr-12 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    placeholder="Min. 6 caractères" />
                  <Key className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
                  <button type="button" onClick={generatePassword}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg">
                    <RefreshCw size={14} />
                  </button>
                </div>
              </div>
              {formError && (
                <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm font-medium text-red-600">{formError}</div>
              )}
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={closeModal}
                  className="flex-1 px-4 py-3 border border-slate-200 text-slate-600 rounded-xl font-medium hover:bg-slate-50 transition-colors">
                  Annuler
                </button>
                <button type="submit" disabled={submitting}
                  className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors disabled:opacity-60">
                  {submitting ? 'Enregistrement...' : editingShipper ? 'Enregistrer' : 'Créer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
