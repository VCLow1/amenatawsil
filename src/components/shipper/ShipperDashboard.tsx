import React, { useMemo } from 'react';
import {
  Package, CheckCircle2, Clock, RotateCcw,
  TrendingUp, MapPin, AlertCircle, ArrowRight,
  Banknote, Truck, CalendarDays
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';
import { useData } from '../../context/DataContext';
import { useNavigate } from 'react-router-dom';

export const ShipperDashboard = () => {
  const { packages, currentUser } = useData();
  const navigate = useNavigate();

  const shipperName = currentUser?.companyName || currentUser?.name || '';

  const myPackages = useMemo(() =>
    packages.filter(p => p.shipper === shipperName),
    [packages, shipperName]
  );

  // ── Stats globales ────────────────────────────────────────────────
  const stats = useMemo(() => {
    const total      = myPackages.length;
    const delivered  = myPackages.filter(p => p.status === 'Delivered').length;
    const inTransit  = myPackages.filter(p => p.status === 'In Transit').length;
    const received   = myPackages.filter(p => p.status === 'Received').length;
    const pending    = myPackages.filter(p => p.status === 'Pending').length;
    const returned   = myPackages.filter(p => p.status === 'Returned').length;
    const cancelled  = myPackages.filter(p => p.status === 'Cancelled').length;
    const revenue    = myPackages
      .filter(p => p.status === 'Delivered')
      .reduce((acc, p) => acc + (p.collectedAmount || 0), 0);
    const deliveryRate = total > 0 ? Math.round((delivered / total) * 100) : 0;
    const returnRate   = total > 0 ? Math.round((returned  / total) * 100) : 0;
    return { total, delivered, inTransit, received, pending, returned, cancelled, revenue, deliveryRate, returnRate };
  }, [myPackages]);

  // ── Activité 7 derniers jours (données réelles) ───────────────────
  const last7Days = useMemo(() =>
    Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      return d.toISOString().split('T')[0];
    }),
    []
  );

  const activityData = useMemo(() =>
    last7Days.map(date => {
      const label = new Date(date).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric' });
      const dayPkgs = myPackages.filter(p => p.date === date);
      return {
        name: label.charAt(0).toUpperCase() + label.slice(1),
        envois:  dayPkgs.length,
        livrés:  dayPkgs.filter(p => p.status === 'Delivered').length,
      };
    }),
    [last7Days, myPackages]
  );

  // ── Pie chart ─────────────────────────────────────────────────────
  const pieData = useMemo(() => [
    { name: 'Livré',      value: stats.delivered,               color: '#10B981' },
    { name: 'En transit', value: stats.inTransit + stats.received, color: '#3B82F6' },
    { name: 'En attente', value: stats.pending,                 color: '#F59E0B' },
    { name: 'Retourné',   value: stats.returned + stats.cancelled, color: '#EF4444' },
  ].filter(d => d.value > 0), [stats]);

  // ── Top villes ────────────────────────────────────────────────────
  const topCities = useMemo(() => {
    const counts = myPackages.reduce((acc, p) => {
      if (p.city) acc[p.city] = (acc[p.city] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4)
      .map(([city, count]) => ({ city, count }));
  }, [myPackages]);

  const maxCityCount = topCities[0]?.count || 1;

  // ── Colis récents ─────────────────────────────────────────────────
  const recentPackages = useMemo(() => myPackages.slice(0, 5), [myPackages]);

  const statusLabel: Record<string, string> = {
    Pending: 'En attente', Received: 'Reçu', 'In Transit': 'En transit',
    Delivered: 'Livré', Returned: 'Retourné', Cancelled: 'Annulé', Postponed: 'Reporté',
  };
  const statusColor: Record<string, string> = {
    Pending: 'bg-amber-100 text-amber-700',
    Received: 'bg-indigo-100 text-indigo-700',
    'In Transit': 'bg-blue-100 text-blue-700',
    Delivered: 'bg-green-100 text-green-700',
    Returned: 'bg-red-100 text-red-700',
    Cancelled: 'bg-slate-100 text-slate-500',
    Postponed: 'bg-orange-100 text-orange-700',
  };

  // ── État vide ─────────────────────────────────────────────────────
  if (myPackages.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="w-16 h-16 bg-blue-50 text-blue-400 rounded-3xl flex items-center justify-center mb-4">
          <Package size={32} />
        </div>
        <h2 className="text-xl font-bold text-slate-900 mb-2">Aucun envoi pour l'instant</h2>
        <p className="text-slate-500 text-sm mb-6 max-w-xs">
          Créez votre premier colis pour commencer à suivre vos livraisons.
        </p>
        <button
          onClick={() => navigate('/shipper/orders?new=1')}
          className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200"
        >
          <Package size={16} />Créer un envoi
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {/* ── KPI cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: 'Total envois',
            value: stats.total,
            icon: Package,
            bg: 'bg-blue-50', text: 'text-blue-600',
            sub: `${stats.pending} en attente`,
          },
          {
            label: 'Livrés',
            value: stats.delivered,
            icon: CheckCircle2,
            bg: 'bg-green-50', text: 'text-green-600',
            sub: `Taux : ${stats.deliveryRate}%`,
          },
          {
            label: 'En cours',
            value: stats.inTransit + stats.received,
            icon: Truck,
            bg: 'bg-indigo-50', text: 'text-indigo-600',
            sub: `${stats.inTransit} en transit`,
          },
          {
            label: 'Retournés',
            value: stats.returned,
            icon: RotateCcw,
            bg: 'bg-red-50', text: 'text-red-600',
            sub: `Taux : ${stats.returnRate}%`,
          },
        ].map(card => (
          <div key={card.label} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
            <div className={`w-10 h-10 ${card.bg} ${card.text} rounded-xl flex items-center justify-center mb-3`}>
              <card.icon size={20} />
            </div>
            <p className="text-2xl font-black text-slate-900">{card.value}</p>
            <p className="text-xs font-medium text-slate-500 mt-0.5">{card.label}</p>
            <p className="text-[10px] text-slate-400 mt-1">{card.sub}</p>
          </div>
        ))}
      </div>

      {/* ── Revenus + taux de livraison ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-5 rounded-2xl text-white">
          <div className="flex items-center gap-2 mb-3">
            <Banknote size={18} className="text-blue-200" />
            <p className="text-sm font-medium text-blue-100">Revenus collectés</p>
          </div>
          <p className="text-3xl font-black">{stats.revenue.toFixed(3)}</p>
          <p className="text-blue-200 text-sm font-medium mt-0.5">TND</p>
          <p className="text-blue-300 text-xs mt-3">Sur {stats.delivered} livraison{stats.delivered > 1 ? 's' : ''} réussie{stats.delivered > 1 ? 's' : ''}</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp size={18} className="text-green-500" />
            <p className="text-sm font-medium text-slate-600">Taux de livraison</p>
          </div>
          <div className="flex items-end gap-3">
            <p className="text-3xl font-black text-slate-900">{stats.deliveryRate}%</p>
            <div className="flex-1 mb-1">
              <div className="w-full bg-slate-100 rounded-full h-2.5">
                <div
                  className="h-2.5 rounded-full bg-green-500 transition-all"
                  style={{ width: `${stats.deliveryRate}%` }}
                />
              </div>
            </div>
          </div>
          <p className="text-slate-400 text-xs mt-2">
            {stats.deliveryRate >= 80
              ? '✓ Excellente performance'
              : stats.deliveryRate >= 60
              ? '⚠ Performance correcte'
              : '✗ À améliorer'}
          </p>
        </div>
      </div>

      {/* ── Graphique activité + Pie ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Courbe 7 jours */}
        <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-2 mb-6">
            <CalendarDays size={16} className="text-slate-400" />
            <h3 className="font-bold text-slate-900">Activité — 7 derniers jours</h3>
          </div>
          <div className="h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={activityData}>
                <defs>
                  <linearGradient id="gEnvois" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#3B82F6" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gLivres" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#10B981" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false}
                  tick={{ fill: '#94A3B8', fontSize: 11 }} dy={8} />
                <YAxis axisLine={false} tickLine={false}
                  tick={{ fill: '#94A3B8', fontSize: 11 }} allowDecimals={false} />
                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                <Area type="monotone" dataKey="envois" name="Envois"
                  stroke="#3B82F6" strokeWidth={2} fill="url(#gEnvois)" />
                <Area type="monotone" dataKey="livrés" name="Livrés"
                  stroke="#10B981" strokeWidth={2} fill="url(#gLivres)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Pie statuts */}
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
          <h3 className="font-bold text-slate-900 mb-4">Répartition</h3>
          {pieData.length > 0 ? (
            <>
              <div className="h-[160px] relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%"
                      innerRadius={48} outerRadius={68} paddingAngle={4} dataKey="value">
                      {pieData.map((e, i) => <Cell key={i} fill={e.color} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
                  <p className="text-xl font-black text-slate-900">{stats.deliveryRate}%</p>
                  <p className="text-[9px] text-slate-400 font-bold uppercase">Succès</p>
                </div>
              </div>
              <div className="space-y-2 mt-4">
                {pieData.map(item => (
                  <div key={item.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                      <span className="text-xs text-slate-600">{item.name}</span>
                    </div>
                    <span className="text-xs font-bold text-slate-900">{item.value}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="h-[160px] flex items-center justify-center text-slate-300 text-sm">
              Aucune donnée
            </div>
          )}
        </div>
      </div>

      {/* ── Top villes + Activité récente ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Top villes */}
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <MapPin size={16} className="text-slate-400" />
            <h3 className="font-bold text-slate-900">Top destinations</h3>
          </div>
          {topCities.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-8">Aucune donnée</p>
          ) : (
            <div className="space-y-3">
              {topCities.map(({ city, count }) => (
                <div key={city} className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                    <MapPin size={13} />
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm font-medium text-slate-900">{city}</span>
                      <span className="text-xs font-bold text-slate-600">{count}</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-1.5">
                      <div className="bg-blue-500 h-1.5 rounded-full transition-all"
                        style={{ width: `${Math.round((count / maxCityCount) * 100)}%` }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Activité récente */}
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-900">Envois récents</h3>
            <button
              onClick={() => navigate('/shipper/orders')}
              className="flex items-center gap-1 text-xs text-blue-600 font-bold hover:underline"
            >
              Voir tout <ArrowRight size={12} />
            </button>
          </div>
          {recentPackages.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-8">Aucun colis</p>
          ) : (
            <div className="space-y-3">
              {recentPackages.map(pkg => (
                <div key={pkg.id} className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Package size={13} className="text-slate-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-slate-900 truncate">{pkg.recipientName}</p>
                    <p className="text-xs text-slate-400">{pkg.city} · {pkg.date}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1 flex-shrink-0">
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${statusColor[pkg.status] || 'bg-slate-100 text-slate-500'}`}>
                      {statusLabel[pkg.status] || pkg.status}
                    </span>
                    <span className="text-xs font-bold text-slate-700">{(pkg.collectedAmount || 0).toFixed(3)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

    </div>
  );
};
