import React, { useState } from 'react';
import {
  Building2, Plus, Search, MapPin, Phone, Mail, Edit, Trash2, X,
  Package, Store, Bike, Shield, Eye, ChevronRight, Users, Key, RefreshCw
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { Agency } from '../types';
import { filterPackagesForAgency } from '../lib/packageUtils';

const GOUVERNORATS = [
  'Ariana','Béja','Ben Arous','Bizerte','Gabès','Gafsa','Jendouba',
  'Kairouan','Kasserine','Kébili','Kef','Mahdia','Manouba','Médenine',
  'Monastir','Nabeul','Sfax','Sidi Bouzid','Siliana','Sousse',
  'Tataouine','Tozeur','Tunis','Zaghouan',
];

export const AgencyManagement = () => {
  const { agencies, addAgency, updateAgency, deleteAgency, users, addUser, packages, currentUser } = useData();
  const navigate = useNavigate();

  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [agencyToDelete, setAgencyToDelete] = useState<Agency | null>(null);
  const [editingAgency, setEditingAgency] = useState<Agency | null>(null);
  const [selectedModerator, setSelectedModerator] = useState<any | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const generatePassword = () => {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
    let pwd = '';
    for (let i = 0; i < 12; i++) pwd += chars.charAt(Math.floor(Math.random() * chars.length));
    setFormData(prev => ({ ...prev, moderatorPassword: pwd }));
  };

  const [formData, setFormData] = useState({
    name: '', location: '', phone: '', email: '',
    status: 'Active' as 'Active' | 'Inactive',
    moderatorName: '', moderatorEmail: '', moderatorPassword: '', moderatorPhone: '',
  });

  const filteredAgencies = agencies.filter(a =>
    a.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.manager.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Stats par agence
  const getAgencyStats = (agency: Agency) => {
    const shippers = users.filter(u =>
      u.role === 'Shipper' &&
      (u.agency === agency.name || (u as any).pendingAgency === agency.name)
    );
    const couriers = users.filter(u =>
      u.role === 'Courier' &&
      (u.agency === agency.name || (u as any).pendingAgency === agency.name)
    );
    const agencyUserNames = shippers.flatMap(s => [s.name, s.companyName].filter(Boolean)) as string[];
    const courierNames = couriers.map(c => c.name);

    // Utiliser le filtrage centralisé (exclut les transférés sortants, inclut les transférés entrants)
    const agencyPkgs = filterPackagesForAgency(
      packages,
      agency.name,
      [...agencyUserNames, ...courierNames],
      agencyUserNames
    );

    return {
      shippers,
      couriers,
      pending: agencyPkgs.filter(p => p.status === 'Pending').length,
      delivered: agencyPkgs.filter(p => p.status === 'Delivered').length,
      total: agencyPkgs.length,
    };
  };

  const getFirebaseError = (code: string) => {
    switch (code) {
      case 'auth/email-already-in-use': return 'Cet email est déjà utilisé par un autre compte.';
      case 'auth/invalid-email': return 'Adresse email invalide.';
      case 'auth/weak-password': return 'Le mot de passe doit contenir au moins 6 caractères.';
      default: return 'Une erreur est survenue. Veuillez réessayer.';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    if (!editingAgency) {
      if (!formData.moderatorEmail.includes('@')) { setFormError('Email du modérateur invalide.'); return; }
      if (formData.moderatorPassword.length < 6) { setFormError('Mot de passe : min. 6 caractères.'); return; }
      if (!formData.moderatorName.trim()) { setFormError('Nom du modérateur requis.'); return; }
    }
    setSubmitting(true);
    try {
      if (editingAgency) {
        await updateAgency(editingAgency.id, {
          name: formData.name, location: formData.location,
          manager: formData.moderatorName, phone: formData.phone,
          email: formData.email, status: formData.status,
        });
      } else {
        await addUser({
          name: formData.moderatorName, email: formData.moderatorEmail,
          password: formData.moderatorPassword, role: 'Agency Moderator',
          agency: formData.name, status: 'Active', phone: formData.moderatorPhone, address: '',
        });
        await addAgency({
          name: formData.name, location: formData.location,
          manager: formData.moderatorName, phone: formData.phone,
          email: formData.email, status: formData.status,
        });
      }
      closeModal();
    } catch (err: any) {
      setFormError(getFirebaseError(err.code || ''));
    } finally {
      setSubmitting(false);
    }
  };

  const openModal = (agency?: Agency) => {
    setFormError('');
    if (agency) {
      setEditingAgency(agency);
      setFormData({ name: agency.name, location: agency.location, phone: agency.phone,
        email: agency.email, status: agency.status, moderatorName: agency.manager,
        moderatorEmail: '', moderatorPassword: '', moderatorPhone: '' });
    } else {
      setEditingAgency(null);
      setFormData({ name: '', location: '', phone: '', email: '', status: 'Active',
        moderatorName: '', moderatorEmail: '', moderatorPassword: '', moderatorPhone: '' });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => { setIsModalOpen(false); setEditingAgency(null); };

  const handleViewPackages = (agency: Agency) => {
    navigate(`/packages?agency=${encodeURIComponent(agency.name)}`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Gestion des Agences</h1>
          <p className="text-slate-500 text-sm">{agencies.length} agence{agencies.length > 1 ? 's' : ''} enregistrée{agencies.length > 1 ? 's' : ''}</p>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:flex-none">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="text"
              placeholder="Rechercher..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full sm:w-56 pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
          {currentUser?.role === 'Super Admin' && (
            <button
              onClick={() => openModal()}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200 whitespace-nowrap"
            >
              <Plus size={18} />
              <span>Nouvelle Agence</span>
            </button>
          )}
        </div>
      </div>

      {/* Agency Cards */}
      {filteredAgencies.length === 0 ? (
        <div className="bg-white rounded-3xl border border-dashed border-slate-200 p-16 text-center">
          <Building2 size={48} className="mx-auto text-slate-200 mb-4" />
          <p className="text-slate-500 font-medium">Aucune agence trouvée</p>
          {currentUser?.role === 'Super Admin' && (
            <button onClick={() => openModal()} className="mt-4 text-blue-600 font-bold hover:underline text-sm">
              Créer la première agence
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredAgencies.map(agency => {
            const stats = getAgencyStats(agency);
            return (
              <div key={agency.id} className="bg-white rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-all flex flex-col">
                {/* Card Header */}
                <div className="p-6 border-b border-slate-100">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center">
                        <Building2 size={22} />
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-900">{agency.name}</h3>
                        <div className="flex items-center gap-1 text-xs text-slate-500 mt-0.5">
                          <MapPin size={11} />
                          {agency.location}
                        </div>
                      </div>
                    </div>
                    <span className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase ${
                      agency.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'
                    }`}>
                      {agency.status === 'Active' ? 'Active' : 'Inactive'}
                    </span>
                  </div>

                  {/* Moderator — cliquable */}
                  {(() => {
                    const mod = users.find(u => u.name === agency.manager && u.role === 'Agency Moderator');
                    return (
                      <button
                        onClick={() => mod && setSelectedModerator(mod)}
                        className={`w-full flex items-center gap-2 p-3 bg-slate-50 rounded-xl text-left transition-colors ${mod ? 'hover:bg-indigo-50 cursor-pointer' : 'cursor-default'}`}
                      >
                        <div className="w-8 h-8 bg-indigo-100 text-indigo-600 rounded-lg flex items-center justify-center flex-shrink-0">
                          <Shield size={14} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[10px] text-slate-400 uppercase font-bold">Modérateur</p>
                          <p className="text-sm font-semibold text-slate-900 truncate">
                            {agency.manager || <span className="text-slate-400 italic font-normal">Non assigné</span>}
                          </p>
                        </div>
                        {mod && <ChevronRight size={14} className="text-slate-400 flex-shrink-0" />}
                      </button>
                    );
                  })()}
                </div>

                {/* Stats */}
                <div className="p-6 grid grid-cols-2 gap-3">
                  {/* Shippers */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase">
                      <Store size={11} />
                      Expéditeurs ({stats.shippers.length})
                    </div>
                    <div className="space-y-1 max-h-20 overflow-y-auto">
                      {stats.shippers.length === 0 ? (
                        <p className="text-xs text-slate-400 italic">Aucun</p>
                      ) : stats.shippers.map(s => (
                        <div key={s.id} className="flex items-center gap-1.5 px-2 py-1 bg-indigo-50 rounded-lg">
                          <div className="w-4 h-4 bg-indigo-200 rounded-full flex items-center justify-center text-[8px] font-bold text-indigo-700">
                            {s.name.charAt(0)}
                          </div>
                          <span className="text-xs text-indigo-700 font-medium truncate">{s.companyName || s.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Couriers */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase">
                      <Bike size={11} />
                      Livreurs ({stats.couriers.length})
                    </div>
                    <div className="space-y-1 max-h-20 overflow-y-auto">
                      {stats.couriers.length === 0 ? (
                        <p className="text-xs text-slate-400 italic">Aucun</p>
                      ) : stats.couriers.map(c => (
                        <div key={c.id} className="flex items-center gap-1.5 px-2 py-1 bg-orange-50 rounded-lg">
                          <div className="w-4 h-4 bg-orange-200 rounded-full flex items-center justify-center text-[8px] font-bold text-orange-700">
                            {c.name.charAt(0)}
                          </div>
                          <span className="text-xs text-orange-700 font-medium truncate">{c.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Package Stats */}
                <div className="px-6 pb-4 grid grid-cols-3 gap-2">
                  <div className="bg-amber-50 rounded-xl p-2 text-center">
                    <p className="text-lg font-black text-amber-700">{stats.pending}</p>
                    <p className="text-[9px] text-amber-500 font-bold uppercase">En attente</p>
                  </div>
                  <div className="bg-green-50 rounded-xl p-2 text-center">
                    <p className="text-lg font-black text-green-700">{stats.delivered}</p>
                    <p className="text-[9px] text-green-500 font-bold uppercase">Livrés</p>
                  </div>
                  <div className="bg-blue-50 rounded-xl p-2 text-center">
                    <p className="text-lg font-black text-blue-700">{stats.total}</p>
                    <p className="text-[9px] text-blue-500 font-bold uppercase">Total</p>
                  </div>
                </div>

                {/* Actions */}
                <div className="p-4 pt-0 mt-auto flex gap-2">
                  <button
                    onClick={() => handleViewPackages(agency)}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors text-sm shadow-lg shadow-blue-100"
                  >
                    <Package size={16} />
                    Voir colis
                  </button>
                  {currentUser?.role === 'Super Admin' && (
                    <>
                      <button
                        onClick={() => openModal(agency)}
                        className="p-2.5 bg-slate-100 text-slate-600 rounded-xl hover:bg-slate-200 transition-colors"
                        title="Modifier"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={() => { setAgencyToDelete(agency); setIsDeleteModalOpen(true); }}
                        className="p-2.5 bg-red-50 text-red-500 rounded-xl hover:bg-red-100 transition-colors"
                        title="Supprimer"
                      >
                        <Trash2 size={16} />
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-slate-900">
                {editingAgency ? 'Modifier l\'agence' : 'Nouvelle agence'}
              </h2>
              <button onClick={closeModal} className="p-2 text-slate-400 hover:bg-slate-100 rounded-xl transition-colors">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Agence info */}
              <div className="space-y-4">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Informations de l'agence</p>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Nom de l'agence</label>
                  <input required type="text" value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    placeholder="Ex: Agence Tunis Nord" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Gouvernorat</label>
                  <select required value={formData.location}
                    onChange={e => setFormData({...formData, location: e.target.value})}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20">
                    <option value="">Sélectionner un gouvernorat</option>
                    {GOUVERNORATS.map(g => <option key={g}>{g}</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Téléphone</label>
                    <input required type="tel" value={formData.phone}
                      onChange={e => setFormData({...formData, phone: e.target.value})}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                      placeholder="+216 XX XXX XXX" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Email agence</label>
                    <input required type="email" value={formData.email}
                      onChange={e => setFormData({...formData, email: e.target.value})}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                      placeholder="agence@amenatawsil.com" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Statut</label>
                  <select value={formData.status}
                    onChange={e => setFormData({...formData, status: e.target.value as 'Active' | 'Inactive'})}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20">
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>

              {/* Moderator info */}
              <div className="space-y-4 pt-4 border-t border-slate-100">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Modérateur assigné</p>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Nom complet</label>
                  <input required type="text" value={formData.moderatorName}
                    onChange={e => setFormData({...formData, moderatorName: e.target.value})}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    placeholder="Prénom Nom" />
                </div>
                {!editingAgency && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Email du modérateur</label>
                      <input required type="email" value={formData.moderatorEmail}
                        onChange={e => setFormData({...formData, moderatorEmail: e.target.value})}
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                        placeholder="moderateur@amenatawsil.com" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Téléphone</label>
                      <input type="tel" value={formData.moderatorPhone}
                        onChange={e => setFormData({...formData, moderatorPhone: e.target.value})}
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                        placeholder="+216 XX XXX XXX" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Mot de passe</label>
                      <div className="relative">
                        <input required type="text" minLength={6} value={formData.moderatorPassword}
                          onChange={e => setFormData({...formData, moderatorPassword: e.target.value})}
                          className="w-full pl-10 pr-12 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                          placeholder="Min. 6 caractères" />
                        <Key className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
                        <button type="button" onClick={generatePassword}
                          className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Générer un mot de passe">
                          <RefreshCw size={15} />
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>

              {formError && (
                <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm font-medium text-red-600">
                  {formError}
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={closeModal}
                  className="flex-1 px-4 py-3 border border-slate-200 text-slate-600 rounded-xl font-medium hover:bg-slate-50 transition-colors">
                  Annuler
                </button>
                <button type="submit" disabled={submitting}
                  className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors disabled:opacity-60">
                  {submitting ? 'Enregistrement...' : editingAgency ? 'Enregistrer' : 'Créer l\'agence'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl w-full max-w-md p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-slate-900">Supprimer l'agence</h2>
              <button onClick={() => setIsDeleteModalOpen(false)} className="p-2 text-slate-400 hover:bg-slate-100 rounded-xl">
                <X size={20} />
              </button>
            </div>
            <p className="text-slate-600 mb-2">
              Supprimer <span className="font-bold text-slate-900">{agencyToDelete?.name}</span> ?
            </p>
            <p className="text-sm text-red-500 mb-6">Cette action est irréversible.</p>
            <div className="flex gap-3">
              <button onClick={() => setIsDeleteModalOpen(false)}
                className="flex-1 px-4 py-3 border border-slate-200 text-slate-600 rounded-xl font-medium hover:bg-slate-50 transition-colors">
                Annuler
              </button>
              <button onClick={() => { if (agencyToDelete) { deleteAgency(agencyToDelete.id); setIsDeleteModalOpen(false); setAgencyToDelete(null); } }}
                className="flex-1 px-4 py-3 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700 transition-colors">
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Moderator Details Modal */}
      {selectedModerator && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl w-full max-w-sm p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-bold text-slate-900">Détails du modérateur</h2>
              <button onClick={() => setSelectedModerator(null)} className="p-2 text-slate-400 hover:bg-slate-100 rounded-xl">
                <X size={18} />
              </button>
            </div>

            <div className="flex flex-col items-center mb-6">
              <div className="w-16 h-16 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center text-2xl font-bold mb-3">
                {selectedModerator.name.charAt(0)}
              </div>
              <h3 className="font-bold text-slate-900 text-lg">{selectedModerator.name}</h3>
              <span className={`mt-1 px-3 py-1 rounded-full text-[10px] font-bold uppercase ${
                selectedModerator.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'
              }`}>
                {selectedModerator.status === 'Active' ? 'Actif' : selectedModerator.status}
              </span>
            </div>

            <div className="space-y-3">
              {[
                { label: 'Email',       value: selectedModerator.email },
                { label: 'Téléphone',   value: selectedModerator.phone || 'Non renseigné' },
                { label: 'Agence',      value: selectedModerator.agency || 'Non assigné' },
                { label: 'Dernière connexion', value: selectedModerator.lastLogin || '—' },
              ].map(item => (
                <div key={item.label} className="flex justify-between items-center py-2 border-b border-slate-100 last:border-0">
                  <span className="text-xs font-bold text-slate-400 uppercase">{item.label}</span>
                  <span className="text-sm text-slate-700 font-medium text-right max-w-[60%] truncate">{item.value}</span>
                </div>
              ))}
            </div>

            <button onClick={() => setSelectedModerator(null)}
              className="w-full mt-6 py-3 bg-slate-100 text-slate-700 rounded-xl font-medium hover:bg-slate-200 transition-colors">
              Fermer
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
