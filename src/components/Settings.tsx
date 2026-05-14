import React, { useState } from 'react';
import {
  Save, Bell, Shield, Globe,
  CheckCircle2, Building2, Phone, Mail,
  Lock, Info
} from 'lucide-react';
import { useData } from '../context/DataContext';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

type Tab = 'Général' | 'Sécurité' | 'Notifications';

const Toggle = ({ checked, onChange, label, description }: {
  checked: boolean; onChange: (v: boolean) => void; label: string; description: string;
}) => (
  <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
    <div className="flex-1 pr-4">
      <p className="font-medium text-slate-900 text-sm">{label}</p>
      <p className="text-xs text-slate-500 mt-0.5">{description}</p>
    </div>
    <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
      <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} className="sr-only peer" />
      <div className="w-10 h-5 bg-slate-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600" />
    </label>
  </div>
);

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="space-y-1.5">
    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">{label}</label>
    {children}
  </div>
);

const inputClass = "w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all";

export const Settings = () => {
  const { settings, updateSettings, currentUser, users, agencies, packages } = useData();
  const [activeTab, setActiveTab] = useState<Tab>('Général');
  const [formData, setFormData] = useState(settings);
  const [saving, setSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    await updateSettings(formData);
    setSaving(false);
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };

  // Stats globales
  const totalUsers = users.length;
  const activeUsers = users.filter(u => u.status === 'Active').length;
  const totalPackages = packages.length;
  const deliveredPackages = packages.filter(p => p.status === 'Delivered').length;
  const deliveryRate = totalPackages > 0 ? Math.round((deliveredPackages / totalPackages) * 100) : 0;

  const tabs: { id: Tab; icon: any; label: string }[] = [
    { id: 'Général',       icon: Globe,        label: 'Général' },
    { id: 'Sécurité',      icon: Shield,       label: 'Sécurité' },
    { id: 'Notifications', icon: Bell,         label: 'Notifications' },
  ];

  const renderContent = () => {
    switch (activeTab) {

      case 'Général':
        return (
          <div className="space-y-6">
            {/* Infos plateforme */}
            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
                <div className="p-2 bg-blue-50 text-blue-600 rounded-xl"><Building2 size={18} /></div>
                <h2 className="font-bold text-slate-900">Informations de la plateforme</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <Field label="Nom de l'entreprise">
                  <input type="text" value={formData.companyName}
                    onChange={e => setFormData({...formData, companyName: e.target.value})}
                    className={inputClass} />
                </Field>
                <Field label="Devise par défaut">
                  <select value={formData.defaultCurrency}
                    onChange={e => setFormData({...formData, defaultCurrency: e.target.value})}
                    className={inputClass}>
                    <option value="TND (Dinar Tunisien)">TND — Dinar Tunisien</option>
                    <option value="EUR (Euro)">EUR — Euro</option>
                    <option value="USD (Dollar US)">USD — Dollar US</option>
                  </select>
                </Field>
                <Field label="Email de contact">
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input type="email" value={formData.contactEmail}
                      onChange={e => setFormData({...formData, contactEmail: e.target.value})}
                      className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
                  </div>
                </Field>
                <Field label="Téléphone principal">
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input type="text" value={formData.primaryPhone}
                      onChange={e => setFormData({...formData, primaryPhone: e.target.value})}
                      className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
                  </div>
                </Field>
              </div>
            </div>

            {/* Stats rapides */}
            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
                <div className="p-2 bg-green-50 text-green-600 rounded-xl"><Info size={18} /></div>
                <h2 className="font-bold text-slate-900">Vue d'ensemble</h2>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: 'Utilisateurs',   value: totalUsers,          sub: `${activeUsers} actifs`,                                              color: 'bg-blue-50 text-blue-700' },
                  { label: 'Agences',        value: agencies.length,     sub: `${agencies.filter(a => a.status === 'Active').length} actives`,      color: 'bg-indigo-50 text-indigo-700' },
                  { label: 'Colis total',    value: totalPackages,       sub: `${deliveredPackages} livrés`,                                        color: 'bg-green-50 text-green-700' },
                  { label: 'Taux livraison', value: `${deliveryRate}%`,  sub: 'sur tous les colis',                                                 color: 'bg-amber-50 text-amber-700' },
                ].map(stat => (
                  <div key={stat.label} className={`${stat.color} rounded-2xl p-4 text-center`}>
                    <p className="text-2xl font-black">{stat.value}</p>
                    <p className="text-xs font-bold uppercase mt-1">{stat.label}</p>
                    <p className="text-[10px] opacity-70 mt-0.5">{stat.sub}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case 'Sécurité':
        return (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
                <div className="p-2 bg-red-50 text-red-600 rounded-xl"><Shield size={18} /></div>
                <h2 className="font-bold text-slate-900">Sécurité du compte</h2>
              </div>
              <div className="space-y-4">
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="font-medium text-slate-900 text-sm">Compte connecté</p>
                      <p className="text-xs text-slate-500">{currentUser?.email}</p>
                    </div>
                    <span className="px-2 py-1 bg-green-100 text-green-700 text-[10px] font-bold rounded-lg uppercase">Actif</span>
                  </div>
                  <p className="text-xs text-slate-400">Dernière connexion : {currentUser?.lastLogin}</p>
                </div>

                <div className="p-4 bg-blue-50 border border-blue-100 rounded-2xl">
                  <div className="flex items-start gap-3">
                    <Lock size={16} className="text-blue-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-bold text-blue-900">Authentification Firebase</p>
                      <p className="text-xs text-blue-700 mt-1">
                        La gestion des mots de passe et la sécurité des comptes sont assurées par Firebase Authentication.
                        Pour changer votre mot de passe, utilisez la fonction "Mot de passe oublié" sur la page de connexion.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <p className="text-sm font-bold text-slate-900 mb-3">Règles Firestore actives</p>
                  <div className="space-y-2">
                    {[
                      { role: 'Super Admin', perms: 'Lecture + Écriture complète' },
                      { role: 'Modérateur', perms: 'Lecture + Écriture agence' },
                      { role: 'Expéditeur', perms: 'Lecture + Création colis' },
                      { role: 'Livreur', perms: 'Lecture + Mise à jour colis assignés' },
                    ].map(r => (
                      <div key={r.role} className="flex items-center justify-between text-xs">
                        <span className="font-medium text-slate-700">{r.role}</span>
                        <span className="text-slate-500">{r.perms}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 'Notifications':
        return (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
                <div className="p-2 bg-amber-50 text-amber-600 rounded-xl"><Bell size={18} /></div>
                <div>
                  <h2 className="font-bold text-slate-900">Préférences de notifications</h2>
                  <p className="text-xs text-slate-500 mt-0.5">Choisissez les événements qui déclenchent une notification.</p>
                </div>
              </div>
              <div className="space-y-3">
                <Toggle
                  checked={formData.notifApprovals ?? true}
                  onChange={v => setFormData({...formData, notifApprovals: v})}
                  label="Nouvelles demandes d'approbation"
                  description="Notifier quand un modérateur crée un expéditeur ou livreur en attente."
                />
                <Toggle
                  checked={formData.notifDelivered ?? true}
                  onChange={v => setFormData({...formData, notifDelivered: v})}
                  label="Colis livrés"
                  description="Notifier à chaque livraison réussie."
                />
                <Toggle
                  checked={formData.notifReturned ?? true}
                  onChange={v => setFormData({...formData, notifReturned: v})}
                  label="Colis retournés"
                  description="Notifier quand un colis est retourné à l'expéditeur."
                />
                <Toggle
                  checked={formData.notifDailyReport ?? false}
                  onChange={v => setFormData({...formData, notifDailyReport: v})}
                  label="Rapport quotidien"
                  description="Recevoir un résumé quotidien des activités de la plateforme."
                />
              </div>
              <div className="mt-6 p-4 bg-blue-50 rounded-2xl border border-blue-100">
                <p className="text-xs text-blue-700 font-medium">
                  💡 Les modifications sont appliquées après avoir cliqué sur "Enregistrer".
                  Les notifications désactivées ne seront plus créées pour les nouveaux événements.
                </p>
              </div>
            </div>
          </div>
        );

      default: return null;
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Paramètres</h1>
          <p className="text-slate-500 text-sm">Configuration globale de la plateforme AMENA TAWSIL.</p>
        </div>
        <button onClick={handleSave} disabled={saving}
          className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200 disabled:opacity-60">
          {showSuccess ? <CheckCircle2 size={18} /> : <Save size={18} />}
          <span>{showSuccess ? 'Enregistré !' : saving ? 'Enregistrement...' : 'Enregistrer'}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Tabs — horizontal sur mobile, vertical sur desktop */}
        <div className="md:col-span-1">
          <div className="flex flex-row md:flex-col gap-1 overflow-x-auto pb-1 md:pb-0">
            {tabs.map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm transition-colors whitespace-nowrap flex-shrink-0 md:w-full",
                  activeTab === tab.id ? "bg-blue-50 text-blue-700" : "text-slate-600 hover:bg-slate-50"
                )}>
                <tab.icon size={16} />
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="md:col-span-3">
          {renderContent()}
        </div>
      </div>
    </div>
  );
};
