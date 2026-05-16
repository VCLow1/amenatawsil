import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useData } from '../context/DataContext';
import {
  Package as PackageIcon, Truck, CheckCircle, MapPin,
  FileText, Printer, LayoutDashboard, History, Phone, XCircle, RotateCcw, QrCode, CalendarClock
} from 'lucide-react';
import { Modal } from './Modal';
import { Package } from '../types';

const getDistance = (lat1: number, lng1: number, lat2: number, lng2: number) => {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const ZONE_COORDS: Record<string, { lat: number; lng: number }> = {
  'Tunis': { lat: 36.8065, lng: 10.1815 }, 'Ariana': { lat: 36.8625, lng: 10.1956 },
  'Ben Arous': { lat: 36.7533, lng: 10.2282 }, 'Manouba': { lat: 36.8100, lng: 10.0972 },
  'Nabeul': { lat: 36.4561, lng: 10.7376 }, 'Zaghouan': { lat: 36.4029, lng: 10.1429 },
  'Bizerte': { lat: 37.2744, lng: 9.8739 }, 'Béja': { lat: 36.7256, lng: 9.1817 },
  'Jendouba': { lat: 36.5011, lng: 8.7757 }, 'Kef': { lat: 36.1826, lng: 8.7149 },
  'Siliana': { lat: 36.0849, lng: 9.3708 }, 'Sousse': { lat: 35.8245, lng: 10.6346 },
  'Monastir': { lat: 35.7643, lng: 10.8113 }, 'Mahdia': { lat: 35.5047, lng: 11.0622 },
  'Sfax': { lat: 34.7400, lng: 10.7600 }, 'Kairouan': { lat: 35.6781, lng: 10.0963 },
  'Kasserine': { lat: 35.1676, lng: 8.8365 }, 'Sidi Bouzid': { lat: 35.0382, lng: 9.4849 },
  'Gabès': { lat: 33.8881, lng: 10.0975 }, 'Médenine': { lat: 33.3549, lng: 10.5055 },
  'Tataouine': { lat: 32.9211, lng: 10.4517 }, 'Gafsa': { lat: 34.4250, lng: 8.7842 },
  'Tozeur': { lat: 33.9197, lng: 8.1335 }, 'Kébili': { lat: 33.7042, lng: 8.9690 },
};

type TabType = 'dashboard' | 'my-orders' | 'history';

const statusLabel: Record<string, string> = {
  Received: 'Reçu', 'In Transit': 'En transit',
  Delivered: 'Livré', Returned: 'Retourné', Cancelled: 'Annulé',
  Postponed: 'Reporté',
};
const statusClass: Record<string, string> = {
  Received: 'bg-indigo-100 text-indigo-700', 'In Transit': 'bg-blue-100 text-blue-700',
  Delivered: 'bg-green-100 text-green-700', Returned: 'bg-red-100 text-red-700',
  Cancelled: 'bg-slate-100 text-slate-500', Postponed: 'bg-purple-100 text-purple-700',
};

export const CourierDashboard = () => {
  const { packages, currentUser, updatePackageStatus, settings, returnPackage } = useData();
  const location = useLocation();
  const navigate = useNavigate();
  const [selectedPackage, setSelectedPackage] = useState<Package | null>(null);
  const [isBLModalOpen, setIsBLModalOpen] = useState(false);
  const [cancelConfirmPkg, setCancelConfirmPkg] = useState<Package | null>(null);
  const [returnConfirmPkg, setReturnConfirmPkg] = useState<Package | null>(null);
  const [postponeConfirmPkg, setPostponeConfirmPkg] = useState<Package | null>(null);

  const getActiveTab = (): TabType => {
    if (location.pathname.includes('/orders')) return 'my-orders';
    if (location.pathname.includes('/history')) return 'history';
    return 'dashboard';
  };
  const activeTab = getActiveTab();

  if (!currentUser || currentUser.role !== 'Courier') return null;

  const myPackages = packages.filter(p => p.courierId === currentUser.id || p.courier === currentUser.name);
  const delivered  = myPackages.filter(p => p.status === 'Delivered');
  const returned   = myPackages.filter(p => p.status === 'Returned');
  const cancelled  = myPackages.filter(p => p.status === 'Cancelled');
  const postponed  = myPackages.filter(p => p.status === 'Postponed');
  const activeOrders = myPackages.filter(p => ['Received', 'In Transit', 'Postponed'].includes(p.status));
  const courierCoords = ZONE_COORDS[currentUser.zone || ''] || null;

  const sortedActiveOrders = courierCoords
    ? [...activeOrders].sort((a, b) => {
        const dA = ZONE_COORDS[a.city] ? getDistance(courierCoords.lat, courierCoords.lng, ZONE_COORDS[a.city].lat, ZONE_COORDS[a.city].lng) : 9999;
        const dB = ZONE_COORDS[b.city] ? getDistance(courierCoords.lat, courierCoords.lng, ZONE_COORDS[b.city].lat, ZONE_COORDS[b.city].lng) : 9999;
        return dA - dB;
      })
    : activeOrders;

  // ── Dashboard ──────────────────────────────────────────────────────
  const renderDashboard = () => (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Bonjour, {currentUser.name.split(' ')[0]} 👋</h1>
          <p className="text-slate-500 text-sm">{currentUser.zone || 'Livreur'}</p>
        </div>
        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
          {currentUser.name.charAt(0)}
        </div>
      </div>

      {/* Stats — cliquables */}
      <div className="grid grid-cols-2 gap-3">
        {/* Actifs */}
        <button onClick={() => navigate('/courier/orders')}
          className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm text-center active:scale-95 transition-transform hover:border-blue-200">
          <p className="text-2xl font-black text-blue-600">{activeOrders.length}</p>
          <p className="text-[11px] text-slate-500 mt-1">En cours</p>
        </button>
        {/* Livrés */}
        <button onClick={() => navigate('/courier/history?tab=delivered')}
          className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm text-center active:scale-95 transition-transform hover:border-green-200">
          <p className="text-2xl font-black text-green-600">{delivered.length}</p>
          <p className="text-[11px] text-slate-500 mt-1">Livrés</p>
        </button>
        {/* Retournés */}
        <button onClick={() => navigate('/courier/history?tab=returned')}
          className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm text-center active:scale-95 transition-transform hover:border-orange-200">
          <p className="text-2xl font-black text-orange-500">{returned.length}</p>
          <p className="text-[11px] text-slate-500 mt-1">Retournés</p>
        </button>
        {/* Annulés */}
        <button onClick={() => navigate('/courier/history?tab=cancelled')}
          className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm text-center active:scale-95 transition-transform hover:border-red-200">
          <p className="text-2xl font-black text-red-500">{cancelled.length}</p>
          <p className="text-[11px] text-slate-500 mt-1">Annulés</p>
        </button>
        {/* Reportés */}
        <button onClick={() => navigate('/courier/history?tab=postponed')}
          className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm text-center active:scale-95 transition-transform hover:border-purple-200">
          <p className="text-2xl font-black text-purple-600">{postponed.length}</p>
          <p className="text-[11px] text-slate-500 mt-1">Reportés</p>
        </button>
        {/* TND collecté */}
        <div className="bg-gradient-to-br from-indigo-600 to-blue-700 p-4 rounded-2xl text-center">
          <p className="text-xl font-black text-white">
            {delivered.reduce((acc, p) => acc + (p.collectedAmount || 0), 0).toFixed(0)}
          </p>
          <p className="text-[11px] text-indigo-200 mt-1">TND collecté</p>
        </div>
      </div>

      {/* Colis à livrer */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
          <h2 className="font-bold text-slate-900 text-sm">Colis à livrer</h2>
          {courierCoords && (
            <span className="flex items-center gap-1 text-[10px] text-green-600 font-medium bg-green-50 px-2 py-1 rounded-lg">
              <MapPin size={10} />Par distance
            </span>
          )}
        </div>
        {sortedActiveOrders.length === 0 ? (
          <div className="p-10 text-center">
            <PackageIcon size={32} className="mx-auto text-slate-200 mb-2" />
            <p className="text-slate-400 text-sm">Aucun colis actif.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {sortedActiveOrders.map(pkg => {
              const dist = courierCoords && ZONE_COORDS[pkg.city]
                ? getDistance(courierCoords.lat, courierCoords.lng, ZONE_COORDS[pkg.city].lat, ZONE_COORDS[pkg.city].lng)
                : null;
              return (
                <div key={pkg.id} className="p-4 flex items-center gap-3">
                  <div className="w-9 h-9 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center flex-shrink-0">
                    <PackageIcon size={16} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-slate-900 text-sm truncate">{pkg.recipientName}</p>
                    <div className="flex items-center gap-1 text-xs text-slate-500">
                      <MapPin size={9} />{pkg.city}
                      {dist !== null && <span className="text-green-600 font-bold">• {dist.toFixed(1)} km</span>}
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${statusClass[pkg.status] || ''}`}>
                      {statusLabel[pkg.status] || pkg.status}
                    </span>
                    <p className="text-xs font-black text-slate-900 mt-0.5">{(pkg.collectedAmount || 0).toFixed(3)}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );

  // ── Mes commandes ──────────────────────────────────────────────────
  const renderMyOrders = () => (
    <div className="space-y-3">
      <h1 className="text-xl font-bold text-slate-900">Mes commandes</h1>
      {sortedActiveOrders.length === 0 ? (
        <div className="py-16 text-center bg-white rounded-2xl border border-dashed border-slate-200">
          <Truck size={36} className="mx-auto text-slate-200 mb-2" />
          <p className="text-slate-400 text-sm">Aucune commande en cours.</p>
        </div>
      ) : sortedActiveOrders.map(pkg => {
        const dist = courierCoords && ZONE_COORDS[pkg.city]
          ? getDistance(courierCoords.lat, courierCoords.lng, ZONE_COORDS[pkg.city].lat, ZONE_COORDS[pkg.city].lng)
          : null;
        return (
          <div key={pkg.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            {/* Header colis */}
            <div className="p-4 border-b border-slate-50">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-bold text-slate-900">{pkg.recipientName}</p>
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${statusClass[pkg.status] || ''}`}>
                      {statusLabel[pkg.status] || pkg.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-slate-500 mt-1">
                    <Phone size={10} />{pkg.recipientPhone}
                  </div>
                  <div className="flex items-center gap-1 text-xs text-slate-500 mt-0.5">
                    <MapPin size={10} />
                    <span className="truncate">{pkg.recipientAddress}, {pkg.city}</span>
                    {dist !== null && <span className="text-green-600 font-bold flex-shrink-0">• {dist.toFixed(1)} km</span>}
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="font-black text-slate-900">{(pkg.collectedAmount || 0).toFixed(3)} TND</p>
                  <p className="text-[10px] text-slate-400">#{pkg.trackingId}</p>
                </div>
              </div>
            </div>
            {/* Actions */}
            <div className="p-3 grid grid-cols-2 gap-2">
              {/* Ligne 1 : QR + BL + Reporté */}
              <div className="col-span-2 flex gap-2">
                <button
                  onClick={() => navigate(`/scan/${pkg.trackingId}`)}
                  className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-100 transition-colors flex-shrink-0"
                  title="Voir les infos du colis">
                  <QrCode size={16} />
                </button>
                <button onClick={() => { setSelectedPackage(pkg); setIsBLModalOpen(true); }}
                  className="p-2.5 bg-slate-100 text-slate-600 rounded-xl hover:bg-slate-200 transition-colors flex-shrink-0"
                  title="Bon de livraison">
                  <FileText size={16} />
                </button>
                <button onClick={() => setPostponeConfirmPkg(pkg)}
                  className="flex-1 py-2.5 bg-purple-50 text-purple-600 border border-purple-200 rounded-xl font-bold text-sm hover:bg-purple-100 transition-colors flex items-center justify-center gap-1.5">
                  <CalendarClock size={15} />Reporté
                </button>
              </div>
              {/* Ligne 2 : Annuler + Retourner + Livré */}
              <button onClick={() => setCancelConfirmPkg(pkg)}
                className="py-2.5 bg-red-50 text-red-600 border border-red-200 rounded-xl font-bold text-sm hover:bg-red-100 transition-colors flex items-center justify-center gap-1.5">
                <XCircle size={15} />Annuler
              </button>
              <button onClick={() => setReturnConfirmPkg(pkg)}
                className="py-2.5 bg-orange-50 text-orange-600 border border-orange-200 rounded-xl font-bold text-sm hover:bg-orange-100 transition-colors flex items-center justify-center gap-1.5">
                <RotateCcw size={15} />Retourner
              </button>
              <button onClick={() => updatePackageStatus(pkg.id, 'Delivered')}
                className="col-span-2 py-2.5 bg-green-600 text-white rounded-xl font-bold text-sm hover:bg-green-700 transition-colors flex items-center justify-center gap-1.5">
                <CheckCircle size={15} />Livré ✓
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );

  // ── Historique ─────────────────────────────────────────────────────
  const renderHistory = () => {
    // Lire le tab depuis l'URL (?tab=delivered|returned|cancelled|postponed)
    const urlParams = new URLSearchParams(location.search);
    const activeHistoryTab = urlParams.get('tab') || 'delivered';

    const historyTabs = [
      { key: 'delivered', label: 'Livrés',    color: 'text-green-600',  bg: 'bg-green-50',  border: 'border-green-200',  pkgs: delivered },
      { key: 'returned',  label: 'Retournés', color: 'text-orange-500', bg: 'bg-orange-50', border: 'border-orange-200', pkgs: returned },
      { key: 'cancelled', label: 'Annulés',   color: 'text-red-500',    bg: 'bg-red-50',    border: 'border-red-200',    pkgs: cancelled },
      { key: 'postponed', label: 'Reportés',  color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-200', pkgs: postponed },
    ];

    const currentTab = historyTabs.find(t => t.key === activeHistoryTab) || historyTabs[0];
    const displayPkgs = currentTab.pkgs;

    return (
      <div className="space-y-3">
        <h1 className="text-xl font-bold text-slate-900">Historique</h1>

        {/* Onglets */}
        <div className="flex gap-1.5 overflow-x-auto pb-1">
          {historyTabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => navigate(`/courier/history?tab=${tab.key}`)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-colors flex-shrink-0 ${
                activeHistoryTab === tab.key
                  ? `${tab.bg} ${tab.color} border ${tab.border}`
                  : 'bg-white text-slate-400 border border-slate-100'
              }`}
            >
              {tab.label}
              <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-black ${
                activeHistoryTab === tab.key ? `${tab.color}` : 'text-slate-400'
              }`}>
                {tab.pkgs.length}
              </span>
            </button>
          ))}
        </div>

        {/* Liste */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          {displayPkgs.length === 0 ? (
            <div className="p-10 text-center">
              <CheckCircle size={32} className="mx-auto text-slate-200 mb-2" />
              <p className="text-slate-400 text-sm">Aucun colis {currentTab.label.toLowerCase()}.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {displayPkgs.map(pkg => (
                <div key={pkg.id} className="p-4 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-slate-900 truncate">{pkg.recipientName}</p>
                    <p className="text-xs text-slate-500">{pkg.city} · {pkg.deliveryDate || pkg.date}</p>
                    <p className="text-[10px] font-mono text-slate-400">#{pkg.trackingId}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <span className={`px-2 py-1 text-[10px] font-bold rounded-full block mb-1 ${statusClass[pkg.status] || 'bg-slate-100 text-slate-500'}`}>
                      {statusLabel[pkg.status] || pkg.status}
                    </span>
                    <p className="text-xs font-bold text-slate-700">{(pkg.collectedAmount || 0).toFixed(3)} TND</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  // ── Bottom Navigation ──────────────────────────────────────────────
  const navItems = [
    { tab: 'dashboard' as TabType, path: '/courier-dashboard', icon: LayoutDashboard, label: 'Accueil' },
    { tab: 'my-orders' as TabType, path: '/courier/orders',    icon: Truck,           label: 'Commandes', badge: activeOrders.length },
    { tab: 'history' as TabType,   path: '/courier/history',   icon: History,         label: 'Historique' },
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      {/* Top Navigation */}
      <div className="sticky top-0 z-30 bg-white border-b border-slate-200 px-4 py-2 max-w-lg mx-auto flex gap-1">
        {navItems.map(item => {
          const isActive = activeTab === item.tab;
          return (
            <button key={item.tab}
              onClick={() => navigate(item.path)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold transition-colors ${
                isActive ? 'bg-blue-50 text-blue-600' : 'text-slate-400 hover:bg-slate-50'
              }`}
            >
              <div className="relative">
                <item.icon size={16} />
                {item.badge && item.badge > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 bg-red-500 text-white text-[8px] font-bold rounded-full flex items-center justify-center">
                    {item.badge > 9 ? '9+' : item.badge}
                  </span>
                )}
              </div>
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>
      {/* Content */}
      <div className="px-4 pt-4 pb-8 space-y-4 max-w-lg mx-auto">
        {activeTab === 'dashboard' && renderDashboard()}
        {activeTab === 'my-orders' && renderMyOrders()}
        {activeTab === 'history' && renderHistory()}
      </div>



      {/* Modal confirmation reporté */}
      {postponeConfirmPkg && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 bg-purple-50 rounded-2xl flex items-center justify-center flex-shrink-0">
                <CalendarClock size={22} className="text-purple-500" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900">Reporter la livraison ?</h3>
                <p className="text-xs text-slate-500 mt-0.5">#{postponeConfirmPkg.trackingId}</p>
              </div>
            </div>
            <div className="bg-purple-50 border border-purple-100 rounded-2xl p-4 space-y-1">
              <p className="text-sm text-slate-700">
                Le client <span className="font-bold text-slate-900">{postponeConfirmPkg.recipientName}</span> n'est pas disponible.
              </p>
              <p className="text-xs text-purple-700 font-medium">
                → Statut : Reporté · À relivrer ultérieurement
              </p>
              <p className="text-xs text-purple-700 font-medium">
                → Vous restez assigné à ce colis
              </p>
            </div>
            <div className="flex gap-2 pt-1">
              <button
                onClick={() => setPostponeConfirmPkg(null)}
                className="flex-1 py-2.5 border border-slate-200 text-slate-600 rounded-xl font-medium hover:bg-slate-50 transition-colors text-sm">
                Annuler
              </button>
              <button
                onClick={() => {
                  updatePackageStatus(postponeConfirmPkg.id, 'Postponed', 'Client non disponible — livraison reportée');
                  setPostponeConfirmPkg(null);
                }}
                className="flex-1 py-2.5 bg-purple-600 text-white rounded-xl font-bold text-sm hover:bg-purple-700 transition-colors flex items-center justify-center gap-1.5">
                <CalendarClock size={15} />Confirmer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal confirmation retour */}
      {returnConfirmPkg && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 bg-orange-50 rounded-2xl flex items-center justify-center flex-shrink-0">
                <RotateCcw size={22} className="text-orange-500" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900">Retourner le colis ?</h3>
                <p className="text-xs text-slate-500 mt-0.5">#{returnConfirmPkg.trackingId}</p>
              </div>
            </div>
            <div className="bg-orange-50 border border-orange-100 rounded-2xl p-4 space-y-1">
              <p className="text-sm text-slate-700">
                Le colis de <span className="font-bold text-slate-900">{returnConfirmPkg.recipientName}</span> sera
                remis à l'agence.
              </p>
              <p className="text-xs text-orange-700 font-medium">
                → Statut : Reçu à l'agence · Prêt à réaffecter
              </p>
              <p className="text-xs text-orange-700 font-medium">
                → Livreur désassigné · Vous redevenez disponible
              </p>
            </div>
            <div className="flex gap-2 pt-1">
              <button
                onClick={() => setReturnConfirmPkg(null)}
                className="flex-1 py-2.5 border border-slate-200 text-slate-600 rounded-xl font-medium hover:bg-slate-50 transition-colors text-sm"
              >
                Annuler
              </button>
              <button
                onClick={() => {
                  returnPackage(returnConfirmPkg.id);
                  setReturnConfirmPkg(null);
                }}
                className="flex-1 py-2.5 bg-orange-500 text-white rounded-xl font-bold text-sm hover:bg-orange-600 transition-colors flex items-center justify-center gap-1.5"
              >
                <RotateCcw size={15} />Confirmer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal confirmation annulation */}
      {cancelConfirmPkg && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 bg-red-50 rounded-2xl flex items-center justify-center flex-shrink-0">
                <XCircle size={22} className="text-red-500" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900">Annuler la commande ?</h3>
                <p className="text-xs text-slate-500 mt-0.5">#{cancelConfirmPkg.trackingId}</p>
              </div>
            </div>
            <p className="text-sm text-slate-600">
              Le colis de <span className="font-bold text-slate-900">{cancelConfirmPkg.recipientName}</span> sera
              marqué comme annulé et retiré de vos commandes actives.
            </p>
            <div className="flex gap-2 pt-1">
              <button
                onClick={() => setCancelConfirmPkg(null)}
                className="flex-1 py-2.5 border border-slate-200 text-slate-600 rounded-xl font-medium hover:bg-slate-50 transition-colors text-sm"
              >
                Retour
              </button>
              <button
                onClick={() => {
                  updatePackageStatus(cancelConfirmPkg.id, 'Returned', 'Annulé par le livreur');
                  setCancelConfirmPkg(null);
                }}
                className="flex-1 py-2.5 bg-red-600 text-white rounded-xl font-bold text-sm hover:bg-red-700 transition-colors"
              >
                Confirmer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* BL Modal */}
      <Modal isOpen={isBLModalOpen} onClose={() => setIsBLModalOpen(false)} title="Bon de Livraison">
        {selectedPackage && (
          <div className="space-y-4">
            <div className="flex justify-between items-start border-b border-slate-100 pb-4">
              <div>
                <h3 className="font-bold text-slate-900">{settings.companyName}</h3>
                <p className="text-[10px] text-slate-500 uppercase tracking-widest">Bon de Livraison</p>
              </div>
              <div className="text-right">
                <p className="text-xs font-bold text-slate-900">#{selectedPackage.trackingId}</p>
                <p className="text-[10px] text-slate-500">{new Date().toLocaleDateString('fr-FR')}</p>
              </div>
            </div>
            <div className="space-y-3">
              <div>
                <p className="text-[10px] text-slate-400 uppercase font-bold mb-1">Expéditeur</p>
                <p className="text-sm font-bold text-slate-900">{selectedPackage.shipper}</p>
              </div>
              <div>
                <p className="text-[10px] text-slate-400 uppercase font-bold mb-1">Destinataire</p>
                <p className="text-sm font-bold text-slate-900">{selectedPackage.recipientName}</p>
                <p className="text-xs text-slate-500">{selectedPackage.recipientPhone}</p>
                <p className="text-xs text-slate-500">{selectedPackage.recipientAddress}, {selectedPackage.city}</p>
              </div>
            </div>
            <div className="bg-slate-50 p-4 rounded-2xl flex justify-between items-center">
              <span className="text-sm text-slate-600">Montant à collecter</span>
              <span className="text-xl font-black text-slate-900">{(selectedPackage.collectedAmount || 0).toFixed(3)} TND</span>
            </div>
            <div className="border-2 border-dashed border-slate-200 rounded-2xl p-8 text-center">
              <p className="text-xs text-slate-400 uppercase font-bold mb-4">Signature du client</p>
              <div className="h-16" />
            </div>
            <button onClick={() => window.print()}
              className="w-full flex items-center justify-center gap-2 py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-colors">
              <Printer size={16} />Imprimer
            </button>
          </div>
        )}
      </Modal>
    </div>
  );
};
