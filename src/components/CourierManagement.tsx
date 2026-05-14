import React, { useState } from 'react';
import { Truck, Plus, Search, MapPin, Phone, Edit, Trash2, Star, X, Key, RefreshCw, AlertCircle } from 'lucide-react';
import { useData } from '../context/DataContext';
import { User } from '../types';

const GOUVERNORATS = [
  'Ariana', 'Béja', 'Ben Arous', 'Bizerte', 'Gabès', 'Gafsa', 'Jendouba',
  'Kairouan', 'Kasserine', 'Kébili', 'Kef', 'Mahdia', 'Manouba', 'Médenine',
  'Monastir', 'Nabeul', 'Sfax', 'Sidi Bouzid', 'Siliana', 'Sousse',
  'Tataouine', 'Tozeur', 'Tunis', 'Zaghouan',
];

export const CourierManagement = () => {
  const { users, addUser, updateUser, deleteUsers, packages, currentUser, agencies } = useData();
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCourier, setEditingCourier] = useState<User | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const [formData, setFormData] = useState({
    name: '', phone: '', email: '', zone: '', vehicle: '',
    matricule: '', address: '', password: '', selectedAgency: '',
  });

  const generatePassword = () => {
    const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
    let pwd = '';
    for (let i = 0; i < 12; i++) pwd += chars.charAt(Math.floor(Math.random() * chars.length));
    setFormData(prev => ({ ...prev, password: pwd }));
  };

  const couriers = users.filter(u =>
    u.role === 'Courier' &&
    (currentUser?.role === 'Super Admin' ||
      u.agency === currentUser?.agency ||
      (u as any).pendingAgency === currentUser?.agency)
  );

  const filteredCouriers = couriers.filter(c =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (c.zone || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (c.vehicle || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getCourierStats = (courier: User) => {
    const pkgs = packages.filter(p => p.courier === courier.id || p.courier === courier.name);
    const active = pkgs.filter(p => ['Received', 'In Transit'].includes(p.status)).length;
    return { deliveries: pkgs.filter(p => p.status === 'Delivered').length, active };
  };

  const getAgencyCity = (agencyName: string) => {
    return agencies.find(a => a.name === agencyName)?.location || '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    const isSuperAdmin = currentUser?.role === 'Super Admin';
    const agencyToAssign = isSuperAdmin ? formData.selectedAgency : currentUser?.agency || '';
    const agencyCity = getAgencyCity(agencyToAssign);

    setSubmitting(true);
    try {
      if (editingCourier) {
        await updateUser(editingCourier.id, {
          name: formData.name, phone: formData.phone, email: formData.email,
          zone: formData.zone, vehicle: formData.vehicle, matricule: formData.matricule,
          address: formData.address,
          ...(agencyToAssign && { agency: agencyToAssign }),
        });
      } else {
        await addUser({
          name: formData.name, phone: formData.phone, email: formData.email,
          zone: formData.zone, vehicle: formData.vehicle, matricule: formData.matricule,
          address: formData.address,
          password: formData.password,
          role: 'Courier',
          status: isSuperAdmin ? 'Active' : 'Pending',
          agency: agencyToAssign,
          availability: 'Available',
        });
      }
      closeModal();
    } catch (err: any) {
      setFormError(err.message || 'Une erreur est survenue.');
    } finally {
      setSubmitting(false);
    }
  };

  const openModal = (courier?: User) => {
    setFormError('');
    if (courier) {
      setEditingCourier(courier);
      setFormData({
        name: courier.name, phone: courier.phone || '', email: courier.email,
        zone: courier.zone || '', vehicle: courier.vehicle || '',
        matricule: courier.matricule || '',
        address: courier.address || '', password: '',
        selectedAgency: courier.agency || '',
      });
    } else {
      setEditingCourier(null);
      setFormData({ name: '', phone: '', email: '', zone: '', vehicle: '', matricule: '', address: '', password: '', selectedAgency: '' });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => { setIsModalOpen(false); setEditingCourier(null); };

  const availabilityConfig: Record<string, { label: string; cls: string }> = {
    Available: { label: 'Disponible', cls: 'bg-green-100 text-green-700' },
    Busy:      { label: 'Occupé',     cls: 'bg-amber-100 text-amber-700' },
    Offline:   { label: 'Hors ligne', cls: 'bg-slate-100 text-slate-500' },
  };

  // Gouvernorats filtrés selon la ville de l'agence (modérateur)
  const moderatorAgencyCity = currentUser?.role === 'Agency Moderator'
    ? getAgencyCity(currentUser.agency || '')
    : '';

  // Pour le formulaire : agence sélectionnée
  const selectedAgencyCity = currentUser?.role === 'Super Admin'
    ? getAgencyCity(formData.selectedAgency)
    : moderatorAgencyCity;

  // Si une agence est sélectionnée, filtrer les gouvernorats à ceux qui correspondent
  const availableGouvernorats = selectedAgencyCity
    ? GOUVERNORATS.filter(g => g === selectedAgencyCity)
    : GOUVERNORATS;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Gestion des Livreurs</h1>
          <p className="text-slate-500 text-sm">
            {moderatorAgencyCity
              ? `Livreurs de l'agence — ville : ${moderatorAgencyCity}`
              : 'Gérez la flotte de livreurs et leurs affectations.'}
          </p>
        </div>
        {currentUser?.role === 'Agency Moderator' && (
          <button onClick={() => openModal()}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors">
            <Plus size={20} /><span>Nouveau Livreur</span>
          </button>
        )}
      </div>

      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-4 sm:p-6 border-b border-slate-100">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input type="text" placeholder="Rechercher un livreur..."
              value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
                <th className="px-6 py-4 font-medium">Livreur</th>
                <th className="px-6 py-4 font-medium hidden sm:table-cell">Gouvernorat / Véhicule</th>
                <th className="px-6 py-4 font-medium">Disponibilité</th>
                <th className="px-6 py-4 font-medium hidden md:table-cell">Colis actifs</th>
                <th className="px-6 py-4 font-medium hidden md:table-cell">Livraisons</th>
                <th className="px-6 py-4 font-medium hidden sm:table-cell">Statut</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredCouriers.length === 0 ? (
                <tr><td colSpan={7} className="px-6 py-16 text-center text-slate-400">Aucun livreur trouvé</td></tr>
              ) : filteredCouriers.map(courier => {
                const stats = getCourierStats(courier);
                const avail = courier.availability || 'Available';
                const availCfg = availabilityConfig[avail] || availabilityConfig.Available;
                return (
                  <tr key={courier.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-orange-50 flex items-center justify-center text-orange-600 font-bold">
                          {courier.name.split(' ').map(n => n[0]).join('')}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900">{courier.name}</p>
                          <div className="flex items-center gap-1 text-xs text-slate-500 mt-0.5">
                            <Phone size={12} /> {courier.phone || 'N/A'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 hidden sm:table-cell">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-1 text-sm text-slate-900 font-medium">
                          <MapPin size={14} className="text-slate-400" /> {courier.zone || '—'}
                        </div>
                        <div className="flex items-center gap-1 text-xs text-slate-500">
                          <Truck size={12} /> {courier.vehicle || '—'}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {currentUser?.role === 'Agency Moderator' && courier.agency === currentUser.agency ? (
                        <select value={avail}
                          onChange={e => updateUser(courier.id, { availability: e.target.value as any })}
                          className={`px-2 py-1 rounded-full text-[10px] font-bold border-none focus:ring-0 cursor-pointer ${availCfg.cls}`}>
                          <option value="Available">Disponible</option>
                          <option value="Busy">Occupé</option>
                          <option value="Offline">Hors ligne</option>
                        </select>
                      ) : (
                        <span className={`px-2 py-1 rounded-full text-[10px] font-bold ${availCfg.cls}`}>
                          {availCfg.label}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 hidden md:table-cell">
                      <span className={`text-sm font-bold ${stats.active > 0 ? 'text-amber-600' : 'text-slate-400'}`}>
                        {stats.active}
                      </span>
                    </td>
                    <td className="px-6 py-4 hidden md:table-cell">
                      <div className="flex items-center gap-1 text-sm font-bold text-slate-900">
                        <Star size={14} className="text-amber-400 fill-amber-400" /> {stats.deliveries}
                      </div>
                    </td>
                    <td className="px-6 py-4 hidden sm:table-cell">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase ${
                        courier.status === 'Active' ? 'bg-green-100 text-green-700' :
                        courier.status === 'Pending' ? 'bg-amber-100 text-amber-700' :
                        'bg-slate-100 text-slate-600'
                      }`}>{courier.status}</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {currentUser?.role === 'Agency Moderator' && courier.agency === currentUser.agency && (
                          <>
                            <button onClick={() => openModal(courier)}
                              className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                              <Edit size={18} />
                            </button>
                            <button onClick={() => { if (window.confirm('Supprimer ce livreur ?')) deleteUsers(courier.id); }}
                              className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                              <Trash2 size={18} />
                            </button>
                          </>
                        )}
                        {currentUser?.role === 'Super Admin' && (
                          <span className="text-xs text-slate-400 italic">Vue seule</span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-slate-900">
                {editingCourier ? 'Modifier le livreur' : 'Nouveau livreur'}
              </h2>
              <button onClick={closeModal} className="text-slate-400 hover:text-slate-600"><X size={24} /></button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nom complet</label>
                <input required type="text" value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Téléphone</label>
                  <input required type="tel" value={formData.phone}
                    onChange={e => setFormData({...formData, phone: e.target.value})}
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                  <input required type="email" value={formData.email}
                    onChange={e => setFormData({...formData, email: e.target.value})}
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
                </div>
              </div>

              {/* Agence (Super Admin seulement) */}
              {currentUser?.role === 'Super Admin' && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Agence</label>
                  <select value={formData.selectedAgency}
                    onChange={e => { setFormData({...formData, selectedAgency: e.target.value, zone: ''}); }}
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20">
                    <option value="">Sans agence</option>
                    {agencies.map(a => <option key={a.id} value={a.name}>{a.name} — {a.location}</option>)}
                  </select>
                </div>
              )}

              {/* Gouvernorat */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Gouvernorat</label>
                <select required value={formData.zone}
                  onChange={e => setFormData({...formData, zone: e.target.value})}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20">
                  <option value="">Sélectionner un gouvernorat</option>
                  {GOUVERNORATS.map(g => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Véhicule</label>
                <select required value={formData.vehicle}
                  onChange={e => setFormData({...formData, vehicle: e.target.value})}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20">
                  <option value="">Sélectionner un véhicule</option>
                  <option value="Moto">Moto</option>
                  <option value="Scooter">Scooter</option>
                  <option value="Voiture">Voiture</option>
                  <option value="Camionnette">Camionnette</option>
                  <option value="Camion">Camion</option>
                  <option value="Vélo">Vélo</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Matricule</label>
                <input type="text" value={formData.matricule}
                  onChange={e => setFormData({...formData, matricule: e.target.value})}
                  placeholder="Ex: 123 TU 4567"
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 uppercase"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Adresse</label>
                <input type="text" value={formData.address}
                  onChange={e => setFormData({...formData, address: e.target.value})}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
              </div>

              {!editingCourier && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Mot de passe</label>
                  <div className="relative">
                    <input required type="text" value={formData.password}
                      onChange={e => setFormData({...formData, password: e.target.value})}
                      className="w-full pl-10 pr-12 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                      placeholder="Min. 6 caractères" />
                    <Key className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <button type="button" onClick={generatePassword}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                      <RefreshCw size={16} />
                    </button>
                  </div>
                </div>
              )}

              {formError && (
                <div className="flex items-start gap-2 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">
                  <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={closeModal}
                  className="flex-1 px-4 py-2 border border-slate-200 text-slate-600 rounded-xl font-medium hover:bg-slate-50 transition-colors">
                  Annuler
                </button>
                <button type="submit" disabled={submitting}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors disabled:opacity-60">
                  {submitting ? 'Enregistrement...' : editingCourier ? 'Enregistrer' : 'Créer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
