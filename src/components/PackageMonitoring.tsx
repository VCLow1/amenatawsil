import React, { useState, useRef, useMemo } from 'react';
import Papa from 'papaparse';
import { useSearchParams } from 'react-router-dom';
import {
  Search, Package as PackageIcon, Truck, CheckCircle2,
  AlertCircle, Eye, Plus, Upload, X, Store, UserCheck, FileDown,
  ArrowRightLeft, Building2
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import { useData } from '../context/DataContext';
import { Modal } from './Modal';
import { PackageStatus, Package } from '../types';
import { filterPackagesForAgency } from '../lib/packageUtils';

export const PackageMonitoring = () => {
  const { packages, addPackage, updatePackageStatus, currentUser, users, importPackages, agencies, assignPackage, transferPackages } = useData();
  const [searchParams, setSearchParams] = useSearchParams();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [detailPkg, setDetailPkg] = useState<Package | null>(null);
  const [assigningPkg, setAssigningPkg] = useState<Package | null>(null);
  const [assigningCourierId, setAssigningCourierId] = useState('');
  const [assigning, setAssigning] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [transitLoading, setTransitLoading] = useState(false);
  const [bulkAssignCourierId, setBulkAssignCourierId] = useState('');
  const [bulkAssigning, setBulkAssigning] = useState(false);
  const [showBulkAssignModal, setShowBulkAssignModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [transferTargetAgency, setTransferTargetAgency] = useState('');
  const [transferring, setTransferring] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [filterAgency, setFilterAgency] = useState(searchParams.get('agency') || '');
  const [filterShipper, setFilterShipper] = useState(searchParams.get('shipper') || '');
  const [filterCourier, setFilterCourier] = useState(searchParams.get('courier') || '');
  const [filterStatus, setFilterStatus] = useState<PackageStatus | ''>('');

  // Sync filtres quand l'URL change (ex: navigation depuis ShipperManagement)
  React.useEffect(() => {
    const agency = searchParams.get('agency') || '';
    const shipper = searchParams.get('shipper') || '';
    const courier = searchParams.get('courier') || '';
    setFilterAgency(agency);
    setFilterShipper(shipper);
    setFilterCourier(courier);
  }, [searchParams]);

  const agencyUsers = useMemo(() =>
    currentUser?.role === 'Agency Moderator'
      ? users.filter(u =>
          u.agency === currentUser.agency ||
          (u as any).pendingAgency === currentUser.agency
        )
      : users,
    [users, currentUser]
  );

  const agencyUserIds = useMemo(() => agencyUsers.map(u => u.id), [agencyUsers]);
  const agencyUserNames = useMemo(() => agencyUsers.map(u => u.name), [agencyUsers]);
  const agencyCompanyNames = useMemo(() =>
    agencyUsers.map(u => u.companyName).filter(Boolean),
    [agencyUsers]
  );

  const basePackages = useMemo(() =>
    currentUser?.role === 'Agency Moderator'
      ? filterPackagesForAgency(
          packages,
          currentUser.agency || '',
          agencyUserNames,
          agencyCompanyNames as string[]
        )
      : packages,
    [packages, currentUser, agencyUserNames, agencyCompanyNames]
  );

  const filteredPackages = useMemo(() =>
    basePackages.filter(pkg => {
      const matchSearch = !searchQuery ||
        pkg.trackingId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        pkg.recipientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        pkg.shipper.toLowerCase().includes(searchQuery.toLowerCase());

      const matchAgency = !filterAgency || (() => {
        const agencyShippers = users.filter(u => u.agency === filterAgency && u.role === 'Shipper');
        const agencyCouriers = users.filter(u => u.agency === filterAgency && u.role === 'Courier');
        return agencyShippers.some(s => s.name === pkg.shipper || s.companyName === pkg.shipper) ||
               agencyCouriers.some(c => c.name === pkg.courier);
      })();

      const matchShipper = !filterShipper || pkg.shipper === filterShipper;
      const matchCourier = !filterCourier || pkg.courier === filterCourier;
      const matchStatus = !filterStatus || pkg.status === filterStatus;

      return matchSearch && matchAgency && matchShipper && matchCourier && matchStatus;
    }),
    [basePackages, searchQuery, filterAgency, filterShipper, filterCourier, filterStatus, users]
  );

  const hasActiveFilters = !!(filterAgency || filterShipper || filterCourier || filterStatus);

  const clearFilters = () => {
    setFilterAgency(''); setFilterShipper(''); setFilterCourier(''); setFilterStatus('');
    setSearchParams({});
  };

  const allShippers = useMemo(() =>
    [...new Set(basePackages.map(p => p.shipper).filter(Boolean))],
    [basePackages]
  );
  const allCouriers = useMemo(() =>
    [...new Set(basePackages.map(p => p.courier).filter(Boolean))] as string[],
    [basePackages]
  );

  const [formData, setFormData] = useState({
    shipper: '', recipientName: '', recipientPhone: '', recipientAddress: '', city: '',
    status: 'Pending' as PackageStatus, collectedAmount: 0,
    weight: 1, fragile: false, packageName: '', courier: '', paymentStatus: 'Pending' as const,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addPackage({ ...formData, shippingFee: 0 });
    setIsModalOpen(false);
    setFormData({ shipper: '', recipientName: '', recipientPhone: '', recipientAddress: '', city: '',
      status: 'Pending', collectedAmount: 0, weight: 1, fragile: false, packageName: '', courier: '', paymentStatus: 'Pending' });
  };

  const handleCsvImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    Papa.parse(file, {
      header: true, skipEmptyLines: true,
      complete: (results) => {
        const importedData = results.data as any[];
        const validPackages: Omit<Package, 'id' | 'trackingId' | 'date' | 'history'>[] = importedData.map(row => ({
          shipper: row.shipper || 'Importé',
          recipientName: row.recipientName || row.customer || '',
          recipientPhone: row.recipientPhone || row.customerPhone || '',
          recipientAddress: row.recipientAddress || row.destination || '',
          city: row.city || '',
          status: (row.status as PackageStatus) || 'Pending',
          collectedAmount: parseFloat(row.collectedAmount || row.price) || 0,
          shippingFee: 0,
          weight: parseFloat(row.weight) || 1,
          fragile: row.fragile === 'true' || row.fragile === true || false,
          courier: row.courier || '',
          paymentStatus: 'Pending',
        }));
        if (validPackages.length > 0) importPackages(validPackages);
      },
    });
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const getStatusClass = (status: string) => {
    switch (status) {
      case 'Delivered': return 'bg-green-100 text-green-700';
      case 'In Transit': return 'bg-blue-100 text-blue-700';
      case 'Pending': return 'bg-amber-100 text-amber-700';
      case 'Received': return 'bg-indigo-100 text-indigo-700';
      case 'Returned': case 'Cancelled': return 'bg-red-100 text-red-700';
      default: return 'bg-slate-100 text-slate-600';
    }
  };

  // ── Export PDF livreur ────────────────────────────────────────────
  const exportCourierPDF = (courierName: string) => {
    const courierPkgs = basePackages.filter(p => p.courier === courierName);
    if (courierPkgs.length === 0) return;

    const doc = new jsPDF();
    const pageW = doc.internal.pageSize.getWidth();
    const today = new Date().toLocaleDateString('fr-FR');

    const statusFr: Record<string, string> = {
      Pending: 'En attente', Received: 'Reçu', 'In Transit': 'En transit',
      Delivered: 'Livré', Postponed: 'Reporté', Returned: 'Retourné', Cancelled: 'Annulé',
    };

    // ── En-tête ──
    doc.setFillColor(37, 99, 235);
    doc.rect(0, 0, pageW, 28, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('Feuille de route — Livreur', 14, 12);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(`Généré le ${today}`, 14, 20);
    doc.text(`${courierPkgs.length} colis`, pageW - 14, 20, { align: 'right' });

    // ── Infos livreur ──
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.text(courierName, 14, 40);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);

    const delivered = courierPkgs.filter(p => p.status === 'Delivered').length;
    const inTransit = courierPkgs.filter(p => p.status === 'In Transit').length;
    const totalAmount = courierPkgs.reduce((acc, p) => acc + (p.collectedAmount || 0), 0);
    doc.text(`Livrés: ${delivered}   En transit: ${inTransit}   Total à collecter: ${totalAmount.toFixed(3)} TND`, 14, 47);

    // ── Séparateur ──
    doc.setDrawColor(226, 232, 240);
    doc.line(14, 52, pageW - 14, 52);

    // ── En-têtes colonnes ──
    let y = 60;
    const cols = { id: 14, recipient: 42, city: 100, amount: 130, status: 158 };

    doc.setFillColor(248, 250, 252);
    doc.rect(14, y - 5, pageW - 28, 8, 'F');
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(100, 116, 139);
    doc.text('ID SUIVI', cols.id, y);
    doc.text('DESTINATAIRE', cols.recipient, y);
    doc.text('VILLE', cols.city, y);
    doc.text('MONTANT', cols.amount, y);
    doc.text('STATUT', cols.status, y);
    y += 6;

    // ── Lignes colis ──
    doc.setFont('helvetica', 'normal');
    courierPkgs.forEach((pkg, i) => {
      if (y > 270) {
        doc.addPage();
        y = 20;
      }

      // Fond alterné
      if (i % 2 === 0) {
        doc.setFillColor(249, 250, 251);
        doc.rect(14, y - 4, pageW - 28, 10, 'F');
      }

      doc.setFontSize(8);
      doc.setTextColor(37, 99, 235);
      doc.setFont('helvetica', 'bold');
      doc.text(pkg.trackingId, cols.id, y + 2);

      doc.setTextColor(15, 23, 42);
      doc.setFont('helvetica', 'normal');
      const recipientText = doc.splitTextToSize(
        `${pkg.recipientName}\n${pkg.recipientPhone}`, 55
      );
      doc.text(recipientText, cols.recipient, y);

      doc.text(pkg.city || '—', cols.city, y + 2);

      doc.setFont('helvetica', 'bold');
      doc.text(`${(pkg.collectedAmount || 0).toFixed(3)}`, cols.amount, y + 2);

      // Badge statut coloré
      const st = pkg.status;
      const stLabel = statusFr[st] || st;
      const stColors: Record<string, [number, number, number]> = {
        Delivered:    [16, 185, 129],
        'In Transit': [59, 130, 246],
        Received:     [99, 102, 241],
        Pending:      [245, 158, 11],
        Returned:     [239, 68, 68],
        Cancelled:    [148, 163, 184],
        Postponed:    [249, 115, 22],
      };
      const [r, g, b] = stColors[st] || [148, 163, 184];
      doc.setFillColor(r, g, b);
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7);
      const badgeW = doc.getTextWidth(stLabel) + 6;
      doc.roundedRect(cols.status, y - 2, badgeW, 6, 1.5, 1.5, 'F');
      doc.text(stLabel, cols.status + 3, y + 2);

      doc.setTextColor(15, 23, 42);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      y += 12;
    });

    // ── Pied de page ──
    doc.setDrawColor(226, 232, 240);
    doc.line(14, y + 4, pageW - 14, y + 4);
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text(
      `Total collecté (livrés) : ${courierPkgs.filter(p => p.status === 'Delivered').reduce((a, p) => a + (p.collectedAmount || 0), 0).toFixed(3)} TND`,
      14, y + 10
    );
    doc.text(`AMENA TAWSIL — ${today}`, pageW - 14, y + 10, { align: 'right' });

    doc.save(`Feuille_route_${courierName.replace(/\s+/g, '_')}_${today.replace(/\//g, '-')}.pdf`);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Suivi des colis
            {filterAgency && <span className="ml-2 text-blue-600">— {filterAgency}</span>}
            {filterShipper && <span className="ml-2 text-indigo-600">— {filterShipper}</span>}
          </h1>
          <p className="text-slate-500 text-sm">{filteredPackages.length} colis{hasActiveFilters ? ' (filtrés)' : ''}</p>
        </div>
        <div className="flex gap-2">
          <input type="file" accept=".csv" className="hidden" ref={fileInputRef} onChange={handleCsvImport} />
          <button onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors">
            <Upload size={16} /><span>CSV</span>
          </button>
          {currentUser?.role === 'Super Admin' && (
            <button onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200">
              <Plus size={16} /><span>Nouvel envoi</span>
            </button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total', count: filteredPackages.length, icon: PackageIcon, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'En transit', count: filteredPackages.filter(p => p.status === 'In Transit').length, icon: Truck, color: 'text-amber-600', bg: 'bg-amber-50' },
          { label: 'Livré', count: filteredPackages.filter(p => p.status === 'Delivered').length, icon: CheckCircle2, color: 'text-green-600', bg: 'bg-green-50' },
          { label: 'Échoué', count: filteredPackages.filter(p => p.status === 'Returned' || p.status === 'Cancelled').length, icon: AlertCircle, color: 'text-red-600', bg: 'bg-red-50' },
        ].map(stat => (
          <div key={stat.label} className="bg-white p-4 rounded-2xl border border-slate-100 flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl ${stat.bg} ${stat.color} flex items-center justify-center`}>
              <stat.icon size={20} />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500">{stat.label}</p>
              <p className="text-xl font-bold text-slate-900">{stat.count}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input type="text" placeholder="Rechercher ID, client, expéditeur..."
            value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
        </div>
        {currentUser?.role === 'Super Admin' && (
          <select value={filterAgency} onChange={e => setFilterAgency(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none min-w-[160px]">
            <option value="">Toutes les agences</option>
            {agencies.map(a => <option key={a.id} value={a.name}>{a.name}</option>)}
          </select>
        )}
        <select value={filterCourier} onChange={e => setFilterCourier(e.target.value)}
          className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none min-w-[140px]">
          <option value="">Tous les livreurs</option>
          {allCouriers.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        {/* Bouton export PDF — visible uniquement si un livreur est sélectionné */}
        {filterCourier && (
          <button
            onClick={() => exportCourierPDF(filterCourier)}
            title={`Exporter les colis de ${filterCourier}`}
            className="flex items-center gap-2 px-3 py-2 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700 transition-colors shadow-sm shadow-indigo-200 whitespace-nowrap"
          >
            <FileDown size={15} />
            <span>PDF livreur</span>
          </button>
        )}
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value as PackageStatus | '')}
          className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none min-w-[140px]">
          <option value="">Tous les statuts</option>
          <option value="Pending">En attente</option>
          <option value="Received">Reçu</option>
          <option value="In Transit">En transit</option>
          <option value="Delivered">Livré</option>
          <option value="Returned">Retourné</option>
          <option value="Cancelled">Annulé</option>
        </select>
        {hasActiveFilters && (
          <button onClick={clearFilters}
            className="flex items-center gap-1.5 px-3 py-2 bg-red-50 text-red-600 rounded-xl text-sm font-medium hover:bg-red-100 transition-colors">
            <X size={14} />Effacer
          </button>
        )}
      </div>

      {/* Table */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        {/* Barre d'action sélection multiple — modérateur */}
        {currentUser?.role === 'Agency Moderator' && selectedIds.size > 0 && (
          <div className="px-6 py-3 bg-green-50 border-b border-green-100 flex items-center justify-between flex-wrap gap-2">
            <span className="text-sm font-bold text-green-700">
              {selectedIds.size} colis sélectionné{selectedIds.size > 1 ? 's' : ''}
            </span>
            <div className="flex items-center gap-2">
              <button onClick={() => setSelectedIds(new Set())}
                className="px-3 py-1.5 text-xs text-slate-600 border border-slate-200 rounded-lg hover:bg-white transition-colors">
                Désélectionner
              </button>
              <button
                onClick={() => { setBulkAssignCourierId(''); setShowBulkAssignModal(true); }}
                className="flex items-center gap-1.5 px-4 py-1.5 bg-green-600 text-white text-xs font-bold rounded-lg hover:bg-green-700 transition-colors">
                <UserCheck size={14} />
                Affecter un livreur
              </button>
              <button
                onClick={() => { setTransferTargetAgency(''); setShowTransferModal(true); }}
                className="flex items-center gap-1.5 px-4 py-1.5 bg-indigo-600 text-white text-xs font-bold rounded-lg hover:bg-indigo-700 transition-colors">
                <ArrowRightLeft size={14} />
                Affecter à une agence
              </button>
            </div>
          </div>
        )}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                {currentUser?.role === 'Agency Moderator' && (
                  <th className="px-3 py-4 w-10">
                    {(() => {
                      const eligible = filteredPackages.filter(p => p.status === 'Received' && !p.courierId);
                      return (
                        <input type="checkbox"
                          className="w-4 h-4 text-blue-600 rounded"
                          disabled={eligible.length === 0}
                          checked={eligible.length > 0 && eligible.every(p => selectedIds.has(p.id))}
                          onChange={e => {
                            setSelectedIds(e.target.checked ? new Set(eligible.map(p => p.id)) : new Set());
                          }}
                        />
                      );
                    })()}
                  </th>
                )}
                <th className="px-4 py-4 text-xs font-bold text-slate-500 uppercase">ID Suivi</th>
                <th className="px-4 py-4 text-xs font-bold text-slate-500 uppercase">Expéditeur / Client</th>
                <th className="px-4 py-4 text-xs font-bold text-slate-500 uppercase hidden md:table-cell">Destination</th>
                <th className="px-4 py-4 text-xs font-bold text-slate-500 uppercase hidden sm:table-cell">Coursier</th>
                <th className="px-4 py-4 text-xs font-bold text-slate-500 uppercase">Statut</th>
                <th className="px-4 py-4 text-xs font-bold text-slate-500 uppercase hidden sm:table-cell">Prix</th>
                <th className="px-4 py-4 text-xs font-bold text-slate-500 uppercase hidden md:table-cell">Date</th>
                <th className="px-4 py-4 text-xs font-bold text-slate-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredPackages.length === 0 ? (
                <tr>
                  <td colSpan={currentUser?.role === 'Agency Moderator' ? 9 : 8} className="px-6 py-16 text-center">
                    <PackageIcon size={40} className="mx-auto text-slate-200 mb-3" />
                    <p className="text-slate-500 font-medium">Aucun colis trouvé</p>
                    {hasActiveFilters && (
                      <button onClick={clearFilters} className="mt-2 text-blue-600 text-sm hover:underline">
                        Effacer les filtres
                      </button>
                    )}
                  </td>
                </tr>
              ) : filteredPackages.map(pkg => {
                const isEligible = pkg.status === 'Received' && !pkg.courierId;
                const isSelected = selectedIds.has(pkg.id);
                return (
                <tr key={pkg.id} className={`hover:bg-slate-50/50 transition-colors group ${isSelected ? 'bg-blue-50/40' : ''}`}>
                  {currentUser?.role === 'Agency Moderator' && (
                    <td className="px-4 py-4">
                      {isEligible ? (
                        <input type="checkbox"
                          className="w-4 h-4 text-blue-600 rounded cursor-pointer"
                          checked={isSelected}
                          onChange={e => {
                            const next = new Set(selectedIds);
                            e.target.checked ? next.add(pkg.id) : next.delete(pkg.id);
                            setSelectedIds(next);
                          }}
                        />
                      ) : <span className="w-4 h-4 block" />}
                    </td>
                  )}
                  <td className="px-4 py-4">
                    <span className="text-sm font-mono font-bold text-blue-600">{pkg.trackingId}</span>
                  </td>
                  <td className="px-4 py-4">
                    <p className="text-sm font-bold text-slate-900">{pkg.shipper}</p>
                    <p className="text-xs text-slate-500">→ {pkg.recipientName}</p>
                  </td>
                  <td className="px-4 py-4 hidden md:table-cell">
                    <p className="text-sm text-slate-700">{pkg.city}</p>
                    <p className="text-xs text-slate-400 truncate max-w-[120px]">{pkg.recipientAddress}</p>
                  </td>
                  <td className="px-4 py-4 hidden sm:table-cell">
                    <span className="text-sm text-slate-600">{pkg.courier || '—'}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-1">
                      {/* Select statut — modérateur uniquement */}
                      {currentUser?.role === 'Agency Moderator' ? (
                        <select value={pkg.status}
                          onChange={e => updatePackageStatus(pkg.id, e.target.value as PackageStatus)}
                          className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase border-none focus:ring-0 cursor-pointer ${getStatusClass(pkg.status)}`}>
                          <option value="Pending">En attente</option>
                          <option value="Received">Reçu</option>
                          <option value="In Transit">En transit</option>
                          <option value="Delivered">Livré</option>
                          <option value="Postponed">Reporté</option>
                          <option value="Returned">Retourné</option>
                          <option value="Cancelled">Annulé</option>
                        </select>
                      ) : (
                        <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase w-fit ${getStatusClass(pkg.status)}`}>
                          {pkg.status === 'Pending' ? 'En attente' :
                           pkg.status === 'Received' ? 'Reçu' :
                           pkg.status === 'In Transit' ? 'En transit' :
                           pkg.status === 'Delivered' ? 'Livré' :
                           pkg.status === 'Postponed' ? 'Reporté' :
                           pkg.status === 'Returned' ? 'Retourné' :
                           pkg.status === 'Cancelled' ? 'Annulé' : pkg.status}
                        </span>
                      )}
                      {pkg.approvalStatus === 'waiting' && (
                        <span className="px-2 py-0.5 bg-orange-100 text-orange-600 text-[9px] font-bold rounded-full uppercase w-fit">
                          ⏳ Approbation requise
                        </span>
                      )}
                      {pkg.approvalStatus === 'rejected' && (
                        <span className="px-2 py-0.5 bg-red-100 text-red-600 text-[9px] font-bold rounded-full uppercase w-fit">
                          ✗ Rejeté
                        </span>
                      )}
                      {pkg.transferredFromAgency && (
                        <span className="flex items-center gap-1 px-2 py-0.5 bg-indigo-100 text-indigo-700 text-[9px] font-bold rounded-full w-fit">
                          <ArrowRightLeft size={9} />
                          Depuis {pkg.transferredFromAgency}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <span className="text-sm font-bold text-slate-900">{(pkg.collectedAmount || 0).toFixed(3)} TND</span>
                  </td>
                  <td className="px-4 py-4 hidden md:table-cell">
                    <span className="text-xs text-slate-500">{pkg.date}</span>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setDetailPkg(pkg)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Détails"
                      >
                        <Eye size={16} />
                      </button>
                      {currentUser?.role === 'Agency Moderator' && pkg.status === 'Received' && pkg.courierId && (
                        <button
                          title="Mettre en transit"
                          onClick={() => updatePackageStatus(pkg.id, 'In Transit', 'Véhicule chargé — en transit')}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        >
                          <Truck size={16} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              )})}
            </tbody>
          </table>
        </div>
      </div>

      {/* New Package Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Nouvel envoi">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase">Expéditeur</label>
              <input required type="text" value={formData.shipper}
                onChange={e => setFormData({...formData, shipper: e.target.value})}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                placeholder="Fashion Store" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase">Destinataire</label>
              <input required type="text" value={formData.recipientName}
                onChange={e => setFormData({...formData, recipientName: e.target.value})}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                placeholder="Amine Abdellaoui" />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase">Nom du colis</label>
            <input required type="text" value={formData.packageName}
              onChange={e => setFormData({...formData, packageName: e.target.value})}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              placeholder="Ex: Vêtements, Électronique..." />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase">Téléphone</label>
              <input required type="tel" value={formData.recipientPhone}
                onChange={e => setFormData({...formData, recipientPhone: e.target.value})}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                placeholder="98765432" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase">Ville</label>
              <select required value={formData.city}
                onChange={e => setFormData({...formData, city: e.target.value})}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20">
                <option value="">Sélectionner une ville</option>
                {['Ariana','Béja','Ben Arous','Bizerte','Gabès','Gafsa','Jendouba','Kairouan','Kasserine','Kébili','Kef','Mahdia','Manouba','Médenine','Monastir','Nabeul','Sfax','Sidi Bouzid','Siliana','Sousse','Tataouine','Tozeur','Tunis','Zaghouan'].map(v => (
                  <option key={v} value={v}>{v}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase">Adresse complète</label>
            <input required type="text" value={formData.recipientAddress}
              onChange={e => setFormData({...formData, recipientAddress: e.target.value})}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              placeholder="Tunis, El Menzah 6" />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase">Montant (TND)</label>
              <input required type="number" step="0.001" value={formData.collectedAmount}
                onChange={e => setFormData({...formData, collectedAmount: parseFloat(e.target.value) || 0})}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase">Poids (kg)</label>
              <input required type="number" step="0.1" value={formData.weight}
                onChange={e => setFormData({...formData, weight: parseFloat(e.target.value) || 1})}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase">Fragile</label>
              <div className="flex items-center h-[42px] px-4 bg-slate-50 border border-slate-200 rounded-xl">
                <input type="checkbox" checked={formData.fragile}
                  onChange={e => setFormData({...formData, fragile: e.target.checked})}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500/20" />
                <span className="ml-2 text-sm text-slate-600">Oui</span>
              </div>
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase">Coursier (optionnel)</label>
            <input type="text" value={formData.courier}
              onChange={e => setFormData({...formData, courier: e.target.value})}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              placeholder="Optionnel" />
          </div>
          <button type="submit"
            className="w-full py-3.5 bg-blue-600 text-white rounded-2xl font-bold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200">
            Enregistrer l'envoi
          </button>
        </form>
      </Modal>

      {/* Detail Modal */}
      {detailPkg && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900">Détails du colis</h3>
                <p className="text-xs font-mono text-blue-600">{detailPkg.trackingId}</p>
              </div>
              <button onClick={() => setDetailPkg(null)} className="p-2 text-slate-400 hover:bg-slate-100 rounded-xl">
                <X size={18} />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-3">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Expéditeur</p>
                  <p className="text-sm font-bold text-slate-900">{detailPkg.shipper}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Destinataire</p>
                  <p className="text-sm font-bold text-slate-900">{detailPkg.recipientName}</p>
                  <p className="text-xs text-slate-500">{detailPkg.recipientPhone}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Adresse</p>
                  <p className="text-xs text-slate-700">{detailPkg.recipientAddress}</p>
                  <p className="text-xs font-bold text-slate-900">{detailPkg.city}</p>
                </div>
              </div>
              <div className="space-y-3">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Montant</p>
                  <p className="text-sm font-bold text-slate-900">{(detailPkg.collectedAmount || 0).toFixed(3)} TND</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Poids</p>
                  <p className="text-sm text-slate-700">{detailPkg.weight} kg {detailPkg.fragile && <span className="text-orange-500">⚠️ Fragile</span>}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Livreur</p>
                  <p className="text-sm text-slate-700">{detailPkg.courier || 'Non assigné'}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Date</p>
                  <p className="text-xs text-slate-500">{detailPkg.date}</p>
                </div>
              </div>
            </div>

            {/* Historique */}
            {detailPkg.history?.length > 0 && (
              <div className="border-t border-slate-100 pt-4">
                <p className="text-xs font-bold text-slate-500 uppercase mb-3">Historique</p>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {[...detailPkg.history].reverse().map((h, i) => (
                    <div key={i} className="flex gap-3 text-xs">
                      <span className="text-slate-400 whitespace-nowrap">{h.date}</span>
                      <span className="text-slate-700">{h.message}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <button onClick={() => setDetailPkg(null)}
              className="w-full py-2.5 bg-slate-100 text-slate-700 rounded-xl font-medium hover:bg-slate-200 transition-colors text-sm">
              Fermer
            </button>
          </div>
        </div>
      )}

      {/* Assign Courier Modal */}
      {assigningPkg && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg p-6 space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center">
                <UserCheck size={20} className="text-green-600" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900">Affecter un livreur</h3>
                <p className="text-xs text-slate-500">Colis #{assigningPkg.trackingId} — {assigningPkg.city}</p>
              </div>
            </div>

            {(() => {
              const agencyCouriers = users.filter(u =>
                u.role === 'Courier' &&
                u.agency === currentUser?.agency &&
                u.status === 'Active' &&
                u.zone === assigningPkg.city
              );

              const availabilityLabel: Record<string, { label: string; cls: string }> = {
                Available: { label: 'Disponible', cls: 'bg-green-100 text-green-700' },
                Busy:      { label: 'Occupé',     cls: 'bg-amber-100 text-amber-700' },
                Offline:   { label: 'Hors ligne', cls: 'bg-slate-100 text-slate-500' },
              };

              return (
                <>
                  {agencyCouriers.length === 0 ? (
                    <div className="p-8 text-center bg-slate-50 rounded-2xl">
                      <AlertCircle size={32} className="mx-auto text-slate-300 mb-2" />
                      <p className="text-sm text-slate-500">Aucun livreur actif pour la ville <strong>{assigningPkg.city}</strong>.</p>
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-72 overflow-y-auto">
                      {agencyCouriers.map(courier => {
                        const avail = courier.availability || 'Available';
                        const cfg = availabilityLabel[avail] || availabilityLabel.Available;
                        const activeCount = packages.filter(p =>
                          (p.courierId === courier.id || p.courier === courier.name) &&
                          ['Received', 'In Transit'].includes(p.status)
                        ).length;
                        return (
                          <label key={courier.id}
                            className={`flex items-center gap-3 p-3 border-2 rounded-xl cursor-pointer transition-all ${
                              assigningCourierId === courier.id
                                ? 'border-blue-500 bg-blue-50'
                                : 'border-slate-200 hover:border-blue-300 hover:bg-slate-50'
                            }`}
                          >
                            <input type="radio" name="courier" value={courier.id}
                              checked={assigningCourierId === courier.id}
                              onChange={() => setAssigningCourierId(courier.id)}
                              className="w-4 h-4 text-blue-600" />
                            <div className="flex-1">
                              <p className="text-sm font-bold text-slate-900">{courier.name}</p>
                              <p className="text-xs text-slate-500">{courier.vehicle} • {activeCount} colis en cours</p>
                            </div>
                            <span className={`px-2 py-0.5 text-[9px] font-bold rounded-full ${cfg.cls}`}>{cfg.label}</span>
                          </label>
                        );
                      })}
                    </div>
                  )}
                </>
              );
            })()}

            <div className="flex gap-2 pt-2">
              <button onClick={() => setAssigningPkg(null)}
                className="flex-1 py-2.5 border border-slate-200 text-slate-600 rounded-xl font-medium hover:bg-slate-50 transition-colors text-sm">
                Annuler
              </button>
              <button
                onClick={async () => {
                  if (!assigningCourierId) return;
                  setAssigning(true);
                  await assignPackage(assigningPkg.id, assigningCourierId);
                  setAssigning(false);
                  setAssigningPkg(null);
                }}
                disabled={!assigningCourierId || assigning}
                className="flex-1 py-2.5 bg-green-600 text-white rounded-xl font-medium hover:bg-green-700 transition-colors disabled:opacity-50 text-sm">
                {assigning ? 'Affectation...' : 'Affecter'}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Bulk Assign Modal */}
      {showBulkAssignModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-6 space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center">
                <UserCheck size={20} className="text-green-600" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900">Affecter un livreur</h3>
                <p className="text-xs text-slate-500">{selectedIds.size} colis sélectionné{selectedIds.size > 1 ? 's' : ''}</p>
              </div>
            </div>

            {(() => {
              const agencyCouriers = users.filter(u =>
                u.role === 'Courier' &&
                u.agency === currentUser?.agency &&
                u.status === 'Active'
              );
              const availabilityLabel: Record<string, { label: string; cls: string }> = {
                Available: { label: 'Disponible', cls: 'bg-green-100 text-green-700' },
                Busy:      { label: 'Occupé',     cls: 'bg-amber-100 text-amber-700' },
                Offline:   { label: 'Hors ligne', cls: 'bg-slate-100 text-slate-500' },
              };
              return agencyCouriers.length === 0 ? (
                <div className="p-8 text-center bg-slate-50 rounded-2xl">
                  <AlertCircle size={32} className="mx-auto text-slate-300 mb-2" />
                  <p className="text-sm text-slate-500">Aucun livreur actif dans cette agence.</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {agencyCouriers.map(courier => {
                    const avail = courier.availability || 'Available';
                    const cfg = availabilityLabel[avail] || availabilityLabel.Available;
                    const activeCount = packages.filter(p =>
                      (p.courierId === courier.id || p.courier === courier.name) &&
                      ['Received', 'In Transit'].includes(p.status)
                    ).length;
                    return (
                      <label key={courier.id}
                        className={`flex items-center gap-3 p-3 border-2 rounded-xl cursor-pointer transition-all ${
                          bulkAssignCourierId === courier.id
                            ? 'border-green-500 bg-green-50'
                            : 'border-slate-200 hover:border-green-300 hover:bg-slate-50'
                        }`}
                      >
                        <input type="radio" name="bulk-courier" value={courier.id}
                          checked={bulkAssignCourierId === courier.id}
                          onChange={() => setBulkAssignCourierId(courier.id)}
                          className="w-4 h-4 text-green-600" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-slate-900">{courier.name}</p>
                          <p className="text-xs text-slate-500">{courier.vehicle} • {courier.zone} • {activeCount} colis en cours</p>
                        </div>
                        <span className={`px-2 py-0.5 text-[9px] font-bold rounded-full flex-shrink-0 ${cfg.cls}`}>{cfg.label}</span>
                      </label>
                    );
                  })}
                </div>
              );
            })()}

            <div className="flex gap-2 pt-1">
              <button onClick={() => setShowBulkAssignModal(false)}
                className="flex-1 py-2.5 border border-slate-200 text-slate-600 rounded-xl font-medium hover:bg-slate-50 transition-colors text-sm">
                Annuler
              </button>
              <button
                disabled={!bulkAssignCourierId || bulkAssigning}
                onClick={async () => {
                  if (!bulkAssignCourierId) return;
                  setBulkAssigning(true);
                  await Promise.all([...selectedIds].map(id => assignPackage(id, bulkAssignCourierId)));
                  setSelectedIds(new Set());
                  setShowBulkAssignModal(false);
                  setBulkAssigning(false);
                }}
                className="flex-1 py-2.5 bg-green-600 text-white rounded-xl font-medium hover:bg-green-700 transition-colors disabled:opacity-50 text-sm font-bold">
                {bulkAssigning ? 'Affectation...' : `Affecter ${selectedIds.size} colis`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal transfert inter-agences */}
      {showTransferModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-6 space-y-5">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center">
                  <ArrowRightLeft size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900">Affecter à une agence</h3>
                  <p className="text-xs text-slate-500">{selectedIds.size} colis sélectionné{selectedIds.size > 1 ? 's' : ''}</p>
                </div>
              </div>
              <button onClick={() => setShowTransferModal(false)}
                className="p-2 text-slate-400 hover:bg-slate-100 rounded-xl">
                <X size={18} />
              </button>
            </div>

            {/* Agence source */}
            <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-2xl">
              <Building2 size={16} className="text-slate-400 flex-shrink-0" />
              <div>
                <p className="text-[10px] text-slate-400 font-bold uppercase">Agence source</p>
                <p className="text-sm font-bold text-slate-900">{currentUser?.agency}</p>
              </div>
            </div>

            {/* Flèche */}
            <div className="flex justify-center">
              <div className="w-8 h-8 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center">
                <ArrowRightLeft size={14} />
              </div>
            </div>

            {/* Sélection agence cible */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase">Agence de destination</label>
              <select
                value={transferTargetAgency}
                onChange={e => setTransferTargetAgency(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              >
                <option value="">Sélectionner une agence</option>
                {agencies
                  .filter(a => a.name !== currentUser?.agency && a.status === 'Active')
                  .map(a => (
                    <option key={a.id} value={a.name}>{a.name} — {a.location}</option>
                  ))
                }
              </select>
            </div>

            {/* Récap colis sélectionnés */}
            {transferTargetAgency && (
              <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-3">
                <p className="text-xs text-indigo-700 font-medium">
                  {selectedIds.size} colis seront transférés de{' '}
                  <span className="font-bold">"{currentUser?.agency}"</span> vers{' '}
                  <span className="font-bold">"{transferTargetAgency}"</span>.
                </p>
                <p className="text-[10px] text-indigo-500 mt-1">
                  Ils apparaîtront dans la liste de l'agence cible avec le badge "Depuis {currentUser?.agency}".
                </p>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2 pt-1">
              <button
                onClick={() => { setShowTransferModal(false); setTransferTargetAgency(''); }}
                className="flex-1 py-2.5 border border-slate-200 text-slate-600 rounded-xl font-medium hover:bg-slate-50 transition-colors text-sm">
                Annuler
              </button>
              <button
                disabled={!transferTargetAgency || transferring}
                onClick={async () => {
                  setTransferring(true);
                  await transferPackages([...selectedIds], transferTargetAgency);
                  setSelectedIds(new Set());
                  setShowTransferModal(false);
                  setTransferTargetAgency('');
                  setTransferring(false);
                }}
                className="flex-1 py-2.5 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                <ArrowRightLeft size={15} />
                {transferring ? 'Transfert...' : `Transférer ${selectedIds.size} colis`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
