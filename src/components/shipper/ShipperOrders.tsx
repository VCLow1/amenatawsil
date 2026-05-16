import React, { useState, useEffect } from 'react';
import { 
  Search, Download, Plus, FileText, XCircle, X,
  Eye, Upload, Printer, ChevronRight
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import { Package, PackageStatus } from '../../types';
import { Modal } from '../Modal';
import * as XLSX from 'xlsx';
import QRCode from 'react-qr-code';
import { useSearchParams } from 'react-router-dom';

export const ShipperOrders = () => {
  const { packages, currentUser, addPackage, cancelPackage, importPackages } = useData();
  const [searchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<PackageStatus | 'All'>('All');
  const [cityFilter, setCityFilter] = useState('All');
  const [selectedPackage, setSelectedPackage] = useState<Package | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isLabelModalOpen, setIsLabelModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isNewPackageModalOpen, setIsNewPackageModalOpen] = useState(false);

  // Ouvrir le modal de création si ?new=1 dans l'URL (depuis le dashboard état vide)
  useEffect(() => {
    if (searchParams.get('new') === '1') {
      setIsNewPackageModalOpen(true);
    }
  }, [searchParams]);

  const shipperName = currentUser?.role === 'Shipper'
    ? (currentUser.companyName || currentUser.name)
    : 'Fashion Store';

  const [formData, setFormData] = useState({
    recipientName: '',
    recipientPhone: '',
    recipientAddress: '',
    city: '',
    collectedAmount: 0,
    weight: 1,
    fragile: false,
    packageName: '',
    description: '',
  });

  const handleCreatePackage = (e: React.FormEvent) => {
    e.preventDefault();
    addPackage({
      shipper: shipperName,
      recipientName: formData.recipientName,
      recipientPhone: formData.recipientPhone,
      recipientAddress: formData.recipientAddress,
      city: formData.city,
      status: 'Pending',
      collectedAmount: formData.collectedAmount,
      shippingFee: 7.000,
      weight: formData.weight,
      fragile: formData.fragile,
      packageName: formData.packageName,
      description: formData.description,
      paymentStatus: 'Pending'
    });
    setIsNewPackageModalOpen(false);
    setFormData({
      recipientName: '', recipientPhone: '', recipientAddress: '', city: '',
      collectedAmount: 0, weight: 1, fragile: false, packageName: '', description: '',
    });
  };
  const shipperPackages = packages.filter(p => p.shipper === shipperName);

  const filteredPackages = shipperPackages.filter(pkg => {
    const matchesSearch = pkg.trackingId.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         pkg.recipientPhone.includes(searchQuery) ||
                         pkg.recipientName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'All' || pkg.status === statusFilter;
    const matchesCity = cityFilter === 'All' || pkg.city === cityFilter;
    return matchesSearch && matchesStatus && matchesCity;
  });

  const cities = Array.from(new Set(shipperPackages.map(p => p.city)));

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const bstr = evt.target?.result;
      const wb = XLSX.read(bstr, { type: 'binary' });
      const wsname = wb.SheetNames[0];
      const ws = wb.Sheets[wsname];
      const data = XLSX.utils.sheet_to_json(ws) as any[];
      
      const formattedPackages = data.map(item => ({
        shipper: shipperName,
        recipientName: item.nom_destinataire || item.nom_client || 'Inconnu',
        recipientPhone: String(item.telephone_destinataire || item.telephone || ''),
        recipientAddress: item.adresse_destinataire || item.adresse || '',
        city: item.ville || '',
        collectedAmount: parseFloat(item.montant_collecte) || 0,
        shippingFee: 7.0,
        weight: parseFloat(item.poids_kg) || 1,
        fragile: item.fragile === 'Oui' || item.fragile === true || item.fragile === 'true' || false,
        description: item.description || '',
        status: 'Pending' as PackageStatus,
        paymentStatus: 'Pending' as const
      }));

      importPackages(formattedPackages);
      setIsImportModalOpen(false);
    };
    reader.readAsBinaryString(file);
  };

  const downloadTemplate = () => {
    const templateData = [
      {
        nom_destinataire: 'Ali Ben Salah',
        telephone_destinataire: '12345678',
        adresse_destinataire: 'Rue de la République, Bloc B',
        ville: 'Tunis',
        montant_collecte: 120,
        poids_kg: 2.5,
        fragile: 'Non',
        description: 'Vêtements',
      },
    ];
    const ws = XLSX.utils.json_to_sheet(templateData);
    // Largeur des colonnes
    ws['!cols'] = [
      { wch: 22 }, { wch: 22 }, { wch: 32 }, { wch: 12 },
      { wch: 18 }, { wch: 12 }, { wch: 10 }, { wch: 20 },
    ];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Colis');
    XLSX.writeFile(wb, 'template_colis.xlsx');
  };

  const getStatusBadgeClass = (status: PackageStatus) => {
    switch (status) {
      case 'Pending':    return 'bg-amber-100 text-amber-700';
      case 'Received':   return 'bg-indigo-100 text-indigo-700';
      case 'In Transit': return 'bg-blue-100 text-blue-700';
      case 'Delivered':  return 'bg-green-100 text-green-700';
      case 'Returned':   return 'bg-orange-100 text-orange-700';
      case 'Cancelled':  return 'bg-red-100 text-red-700';
      default:           return 'bg-slate-100 text-slate-600';
    }
  };

  const getStatusLabel = (status: PackageStatus) => {
    switch (status) {
      case 'Pending':    return 'En attente';
      case 'Received':   return 'Reçu à l\'agence';
      case 'In Transit': return 'En cours de livraison';
      case 'Delivered':  return 'Livré';
      case 'Returned':   return 'Retourné';
      case 'Cancelled':  return 'Annulé';
      default:           return status;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-slate-900">Gestion des commandes</h2>
        <div className="flex gap-3">
          <button 
            onClick={() => setIsImportModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors"
          >
            <Upload size={18} />
            <span>Importer Excel</span>
          </button>
          <button 
            onClick={() => setIsNewPackageModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200"
          >
            <Plus size={18} />
            <span>Nouveau colis</span>
          </button>
        </div>
      </div>
      {/* Stats rapides */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total',     value: shipperPackages.length,                                                                     bg: 'bg-blue-50',   text: 'text-blue-700' },
          { label: 'En cours',  value: shipperPackages.filter(p => ['Pending','Received','In Transit'].includes(p.status)).length,  bg: 'bg-indigo-50', text: 'text-indigo-700' },
          { label: 'Livrés',    value: shipperPackages.filter(p => p.status === 'Delivered').length,                               bg: 'bg-green-50',  text: 'text-green-700' },
          { label: 'Retournés', value: shipperPackages.filter(p => p.status === 'Returned' || p.status === 'Cancelled').length,    bg: 'bg-red-50',    text: 'text-red-700' },
        ].map(s => (
          <div key={s.label} className={`${s.bg} rounded-2xl p-4 text-center`}>
            <p className={`text-2xl font-black ${s.text}`}>{s.value}</p>
            <p className={`text-xs font-bold uppercase mt-0.5 ${s.text} opacity-70`}>{s.label}</p>
          </div>
        ))}
      </div>

      <div className="bg-white p-3 rounded-2xl border border-slate-100 shadow-sm flex flex-wrap gap-2 items-center">
        {/* Recherche */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
          <input
            type="text"
            placeholder="ID suivi, téléphone, nom..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          />
        </div>

        {/* Statut */}
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value as any)}
          className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none">
          <option value="All">Tous les statuts</option>
          <option value="Pending">En attente</option>
          <option value="Received">Reçu à l'agence</option>
          <option value="In Transit">En cours de livraison</option>
          <option value="Delivered">Livré</option>
          <option value="Returned">Retourné</option>
          <option value="Cancelled">Annulé</option>
        </select>

        {/* Ville */}
        {cities.length > 0 && (
          <select value={cityFilter} onChange={e => setCityFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none">
            <option value="All">Toutes les villes</option>
            {cities.map(city => <option key={city} value={city}>{city}</option>)}
          </select>
        )}

        {/* Effacer filtres */}
        {(searchQuery || statusFilter !== 'All' || cityFilter !== 'All') && (
          <button
            onClick={() => { setSearchQuery(''); setStatusFilter('All'); setCityFilter('All'); }}
            className="flex items-center gap-1.5 px-3 py-2 bg-red-50 text-red-600 rounded-xl text-sm font-medium hover:bg-red-100 transition-colors">
            <X size={14} />Effacer
          </button>
        )}

        {/* Compteur résultats */}
        <span className="ml-auto text-xs text-slate-400 font-medium">
          {filteredPackages.length} colis
        </span>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-4 py-4 text-xs font-bold text-slate-500 uppercase">Suivi</th>
                <th className="px-4 py-4 text-xs font-bold text-slate-500 uppercase">Client</th>
                <th className="px-4 py-4 text-xs font-bold text-slate-500 uppercase hidden sm:table-cell">Ville</th>
                <th className="px-4 py-4 text-xs font-bold text-slate-500 uppercase">Statut</th>
                <th className="px-4 py-4 text-xs font-bold text-slate-500 uppercase hidden sm:table-cell">Montant</th>
                <th className="px-4 py-4 text-xs font-bold text-slate-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredPackages.map((pkg) => (
                <tr key={pkg.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-4 py-4">
                    <span className="text-sm font-mono font-bold text-blue-600">{pkg.trackingId}</span>
                    <p className="text-[10px] text-slate-400 mt-0.5">{pkg.date}</p>
                  </td>
                  <td className="px-4 py-4">
                    <p className="text-sm font-bold text-slate-900">{pkg.recipientName}</p>
                    <p className="text-xs text-slate-500">{pkg.recipientPhone}</p>
                  </td>
                  <td className="px-4 py-4 text-sm text-slate-600 hidden sm:table-cell">{pkg.city}</td>
                  <td className="px-4 py-4">
                    <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${getStatusBadgeClass(pkg.status)}`}>
                      {getStatusLabel(pkg.status)}
                    </span>
                  </td>
                  <td className="px-4 py-4 hidden sm:table-cell">
                    <p className="text-sm font-bold text-slate-900">{(pkg.collectedAmount || 0).toFixed(3)} TND</p>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-1.5">
                      <button onClick={() => { setSelectedPackage(pkg); setIsDetailsModalOpen(true); }}
                        className="p-2.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Détails">
                        <Eye size={16} />
                      </button>
                      <button onClick={() => { setSelectedPackage(pkg); setIsLabelModalOpen(true); }}
                        disabled={pkg.approvalStatus !== 'approved'}
                        className="p-2.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                        title={pkg.approvalStatus !== 'approved' ? 'En attente d\'approbation' : 'Étiquette'}>
                        <Printer size={16} />
                      </button>
                      <button onClick={() => cancelPackage(pkg.id)}
                        className="p-2.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Annuler">
                        <XCircle size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Details Modal */}
      <Modal isOpen={isDetailsModalOpen} onClose={() => setIsDetailsModalOpen(false)} title="Détails du colis">
        {selectedPackage && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Destinataire</h4>
                  <p className="text-sm font-bold text-slate-900">{selectedPackage.recipientName}</p>
                  <p className="text-xs text-slate-500">{selectedPackage.recipientPhone}</p>
                </div>
                <div>
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Adresse</h4>
                  <p className="text-sm text-slate-700">{selectedPackage.recipientAddress}</p>
                  <p className="text-xs font-bold text-slate-900">{selectedPackage.city}</p>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Finances</h4>
                  <p className="text-sm font-bold text-slate-900">Montant: {(selectedPackage.collectedAmount || 0).toFixed(3)} TND</p>
                </div>
                <div>
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Colis</h4>
                  <p className="text-xs text-slate-600">Poids: {selectedPackage.weight} kg</p>
                  {selectedPackage.fragile && (
                    <span className="inline-block mt-1 px-2 py-0.5 bg-orange-100 text-orange-600 text-[10px] font-bold rounded-full">⚠️ Fragile</span>
                  )}
                </div>
                <div>
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Livreur</h4>
                  <p className="text-sm text-slate-700">{selectedPackage.courier || 'Non assigné'}</p>
                </div>
              </div>
            </div>

            <div className="border-t border-slate-100 pt-6">
              <h4 className="text-sm font-bold text-slate-900 mb-4">Historique du colis</h4>
              <div className="space-y-4">
                {(selectedPackage.history || []).map((h, i) => (
                  <div key={i} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className={`w-3 h-3 rounded-full mt-1.5 ${i === 0 ? 'bg-blue-600' : 'bg-slate-200'}`}></div>
                      {i < (selectedPackage.history || []).length - 1 && <div className="w-[2px] flex-1 bg-slate-100 my-1"></div>}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900">{getStatusLabel(h.status)}</p>
                      <p className="text-[10px] text-slate-500">{h.date}</p>
                      <p className="text-[10px] text-slate-400 mt-1 italic">{h.message}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Label Modal */}
      <Modal isOpen={isLabelModalOpen} onClose={() => setIsLabelModalOpen(false)} title="Étiquette de colis">
        {selectedPackage && (
          <div className="p-4 bg-white border-2 border-slate-900 rounded-lg max-w-sm mx-auto" id="package-label">
            <div className="flex justify-between items-start border-b-2 border-slate-900 pb-4 mb-4">
              <div>
                <h3 className="text-xl font-black tracking-tighter">AMENA TAWSIL</h3>
                <p className="text-[10px] font-bold">EXP: {selectedPackage.shipper}</p>
              </div>
              <div className="text-right">
                <p className="text-xs font-bold">{selectedPackage.trackingId}</p>
                <p className="text-[10px]">{selectedPackage.date}</p>
              </div>
            </div>
            
            <div className="space-y-4 mb-6">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase">Destinataire</p>
                <p className="text-lg font-bold leading-tight">{selectedPackage.recipientName}</p>
                <p className="text-sm font-bold">{selectedPackage.recipientPhone}</p>
                <p className="text-sm mt-1">{selectedPackage.recipientAddress}</p>
                <p className="text-md font-black uppercase mt-1">{selectedPackage.city}</p>
              </div>
              
              <div className="flex justify-between items-end">
                <div className="p-2 bg-slate-100 rounded-lg">
                  <QRCode value={`${import.meta.env.VITE_APP_URL || window.location.origin}/scan/${selectedPackage.trackingId}`} size={80} />
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-bold uppercase">Montant à collecter</p>
                  <p className="text-2xl font-black">{(selectedPackage.collectedAmount || 0).toFixed(3)} TND</p>
                  {selectedPackage.fragile && (
                    <span className="inline-block mt-1 px-2 py-0.5 bg-orange-100 text-orange-600 text-[9px] font-bold rounded-full">⚠️ FRAGILE</span>
                  )}
                </div>
              </div>
            </div>
            
            <div className="flex gap-2 no-print">
              <button 
                onClick={() => window.print()}
                className="w-full py-3 bg-slate-900 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2"
              >
                <Printer size={18} />
                Imprimer
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Import Modal */}
      <Modal isOpen={isImportModalOpen} onClose={() => setIsImportModalOpen(false)} title="Importer des colis">
        <div className="space-y-5">

          {/* Télécharger le template */}
          <div className="flex items-center justify-between p-4 bg-blue-50 border border-blue-100 rounded-2xl">
            <div>
              <p className="text-sm font-bold text-blue-900">Pas encore de fichier ?</p>
              <p className="text-xs text-blue-600 mt-0.5">Téléchargez le template Excel avec les bonnes colonnes.</p>
            </div>
            <button
              onClick={downloadTemplate}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition-colors whitespace-nowrap"
            >
              <Download size={16} />
              Template
            </button>
          </div>

          {/* Zone de dépôt */}
          <div className="p-8 border-2 border-dashed border-slate-200 rounded-3xl text-center hover:border-blue-400 transition-colors cursor-pointer relative">
            <input
              type="file"
              accept=".xlsx, .xls"
              onChange={handleFileUpload}
              className="absolute inset-0 opacity-0 cursor-pointer"
            />
            <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <FileText size={28} />
            </div>
            <h4 className="font-bold text-slate-900">Cliquez ou glissez votre fichier Excel</h4>
            <p className="text-xs text-slate-500 mt-1">Format supporté : .xlsx, .xls</p>
          </div>

          {/* Colonnes */}
          <div className="bg-slate-50 p-4 rounded-2xl">
            <h5 className="text-xs font-bold text-slate-700 mb-3 uppercase tracking-wide">Colonnes du fichier</h5>
            <div className="grid grid-cols-2 gap-2">
              {[
                { col: 'nom_destinataire',       label: 'Nom du destinataire' },
                { col: 'telephone_destinataire', label: 'Téléphone' },
                { col: 'adresse_destinataire',   label: 'Adresse complète' },
                { col: 'ville',                  label: 'Ville' },
                { col: 'montant_collecte',       label: 'Montant à collecter (TND)' },
                { col: 'poids_kg',               label: 'Poids (kg)' },
                { col: 'fragile',                label: 'Fragile (Oui / Non)' },
                { col: 'description',            label: 'Description (optionnel)' },
              ].map(({ col, label }) => (
                <div key={col} className="flex items-center gap-2 bg-white border border-slate-100 rounded-xl px-3 py-2">
                  <span className="font-mono text-[10px] text-blue-600 font-bold">{col}</span>
                  <span className="text-[10px] text-slate-400 truncate">{label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Modal>

      {/* New Package Modal */}
      <Modal isOpen={isNewPackageModalOpen} onClose={() => setIsNewPackageModalOpen(false)} title="Nouvel envoi">
        <form onSubmit={handleCreatePackage} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase">Nom du destinataire</label>
              <input 
                required
                type="text" 
                value={formData.recipientName}
                onChange={(e) => setFormData({...formData, recipientName: e.target.value})}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                placeholder="Ahmed Ben Ali"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase">Téléphone</label>
              <input 
                required
                type="tel" 
                value={formData.recipientPhone}
                onChange={(e) => setFormData({...formData, recipientPhone: e.target.value})}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                placeholder="216 XX XXX XXX"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase">Ville</label>
              <select 
                required
                value={formData.city}
                onChange={(e) => setFormData({...formData, city: e.target.value})}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              >
                <option value="">Sélectionner une ville</option>
                <option value="Ariana">Ariana</option>
                <option value="Béja">Béja</option>
                <option value="Ben Arous">Ben Arous</option>
                <option value="Bizerte">Bizerte</option>
                <option value="Gabès">Gabès</option>
                <option value="Gafsa">Gafsa</option>
                <option value="Jendouba">Jendouba</option>
                <option value="Kairouan">Kairouan</option>
                <option value="Kasserine">Kasserine</option>
                <option value="Kébili">Kébili</option>
                <option value="Kef">Kef</option>
                <option value="Mahdia">Mahdia</option>
                <option value="Manouba">Manouba</option>
                <option value="Médenine">Médenine</option>
                <option value="Monastir">Monastir</option>
                <option value="Nabeul">Nabeul</option>
                <option value="Sfax">Sfax</option>
                <option value="Sidi Bouzid">Sidi Bouzid</option>
                <option value="Siliana">Siliana</option>
                <option value="Sousse">Sousse</option>
                <option value="Tataouine">Tataouine</option>
                <option value="Tozeur">Tozeur</option>
                <option value="Tunis">Tunis</option>
                <option value="Zaghouan">Zaghouan</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase">Adresse complète</label>
              <input 
                required
                type="text" 
                value={formData.recipientAddress}
                onChange={(e) => setFormData({...formData, recipientAddress: e.target.value})}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                placeholder="123 Rue de la République"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase">Montant (TND)</label>
              <input 
                required
                type="number" 
                step="0.001"
                value={formData.collectedAmount}
                onChange={(e) => setFormData({...formData, collectedAmount: parseFloat(e.target.value)})}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                placeholder="0.000"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase">Poids (kg)</label>
              <input 
                type="number" 
                step="0.1"
                value={formData.weight}
                onChange={(e) => setFormData({...formData, weight: parseFloat(e.target.value)})}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                placeholder="1.0"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase">Fragile</label>
              <div className="flex items-center h-[42px] px-4 bg-slate-50 border border-slate-200 rounded-xl">
                <input type="checkbox" checked={formData.fragile}
                  onChange={e => setFormData({...formData, fragile: e.target.checked})}
                  className="w-4 h-4 text-blue-600 rounded" />
                <span className="ml-2 text-sm text-slate-600">Oui</span>
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase">Nom du colis</label>
            <input
              required
              type="text"
              value={formData.packageName}
              onChange={(e) => setFormData({...formData, packageName: e.target.value})}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              placeholder="Ex: Vêtements, Électronique..."
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase">Description (Optionnel)</label>
            <textarea 
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              placeholder="Contenu du colis, instructions spéciales..."
              rows={3}
            />
          </div>

          <div className="pt-4 flex justify-end gap-3">
            <button 
              type="button"
              onClick={() => setIsNewPackageModalOpen(false)}
              className="px-6 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl font-medium hover:bg-slate-50 transition-colors"
            >
              Annuler
            </button>
            <button 
              type="submit"
              className="px-6 py-2.5 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200"
            >
              Créer l'envoi
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
