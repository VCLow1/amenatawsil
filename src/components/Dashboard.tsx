import React, { useState, useRef, useMemo } from 'react';
import {
  Package, CheckCircle2, Clock, AlertCircle,
  MapPin, Calendar, Sparkles, Building2,
  FileText, Loader2, Download, Banknote
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import {
  AreaChart, Area, PieChart, Pie, Cell,
  ResponsiveContainer, CartesianGrid, XAxis, YAxis, Tooltip,
  BarChart, Bar, Legend
} from 'recharts';
import { useData } from '../context/DataContext';
import { filterPackagesForAgency } from '../lib/packageUtils';

// Vérification des variables d'environnement au chargement
const checkFirebaseConfig = () => {
  const requiredVars = [
    'VITE_FIREBASE_API_KEY',
    'VITE_FIREBASE_AUTH_DOMAIN',
    'VITE_FIREBASE_PROJECT_ID',
  ];
  
  const missing = requiredVars.filter(varName => !import.meta.env[varName]);
  
  if (missing.length > 0) {
    console.error('❌ Variables d\'environnement Firebase manquantes:', missing);
    console.error('📝 Configurez ces variables sur votre plateforme de déploiement');
    return false;
  }
  return true;
};

// Vérifier au chargement du module
if (!checkFirebaseConfig()) {
  console.warn('⚠️ Firebase n\'est pas correctement configuré');
}

export const Dashboard = () => {
  const { packages, currentUser, agencies, settings, users } = useData();
  const [reportPeriod, setReportPeriod] = useState('month');
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiReport, setAiReport] = useState<string | null>(null);
  const reportRef = useRef<HTMLDivElement>(null);
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });

  // ── Filtrage des données selon le rôle ────────────────────────────
  const agencyUsers = useMemo(() =>
    currentUser?.role === 'Agency Moderator'
      ? users.filter(u => u.agency === currentUser.agency || (u as any).pendingAgency === currentUser.agency)
      : users,
    [users, currentUser]
  );

  const agencyUserNames = useMemo(() => agencyUsers.map(u => u.name), [agencyUsers]);
  const agencyCompanyNames = useMemo(() =>
    agencyUsers.map(u => u.companyName).filter(Boolean) as string[],
    [agencyUsers]
  );

  const relevantPackages = useMemo(() =>
    currentUser?.role === 'Agency Moderator'
      ? filterPackagesForAgency(packages, currentUser.agency || '', agencyUserNames, agencyCompanyNames)
      : packages,
    [packages, currentUser, agencyUserNames, agencyCompanyNames]
  );

  const filteredPackages = useMemo(() =>
    relevantPackages.filter(pkg => pkg.date.startsWith(selectedMonth)),
    [relevantPackages, selectedMonth]
  );

  // ── Stats du mois sélectionné ─────────────────────────────────────
  const monthStats = useMemo(() => {
    const deliveredPackages = filteredPackages.filter(p => p.status === 'Delivered');
    const returnedPackages = filteredPackages.filter(p => ['Returned', 'Cancelled'].includes(p.status));
    
    return {
      total: filteredPackages.length,
      delivered: deliveredPackages.length,
      inTransit: filteredPackages.filter(p => p.status === 'In Transit').length,
      failed: returnedPackages.length,
      pending: filteredPackages.filter(p => p.status === 'Pending').length,
      revenue: deliveredPackages.reduce((acc, p) => acc + (p.collectedAmount || 0), 0),
      deliveredAmount: deliveredPackages.reduce((acc, p) => acc + (p.collectedAmount || 0), 0),
      returnedAmount: returnedPackages.reduce((acc, p) => acc + (p.collectedAmount || 0), 0),
    };
  }, [filteredPackages]);

  // ── Graphique performance 7 derniers jours ────────────────────────
  const last7Days = useMemo(() =>
    Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - i);
      return d.toISOString().split('T')[0];
    }).reverse(),
    []
  );

  const performanceData = useMemo(() =>
    last7Days.map(date => {
      const dayName = new Date(date).toLocaleDateString('fr-FR', { weekday: 'short' });
      const dayPkgs = relevantPackages.filter(p => p.date === date);
      return {
        name: dayName.charAt(0).toUpperCase() + dayName.slice(1),
        total: dayPkgs.length,
        livrés: dayPkgs.filter(p => p.status === 'Delivered').length,
      };
    }),
    [last7Days, relevantPackages]
  );

  // ── Revenus du jour (modérateur) ─────────────────────────────────
  const today = new Date().toISOString().split('T')[0];
  const todayRevenue = useMemo(() =>
    relevantPackages
      .filter(p => p.status === 'Delivered' && (p.deliveryDate === today || p.date === today))
      .reduce((acc, p) => acc + (p.collectedAmount || 0), 0),
    [relevantPackages, today]
  );

  // ── Pie chart statuts ─────────────────────────────────────────────
  const pieData = useMemo(() => [
    { name: 'Livré',      value: monthStats.delivered, color: '#10B981' },
    { name: 'En transit', value: monthStats.inTransit,  color: '#3B82F6' },
    { name: 'En attente', value: monthStats.pending,    color: '#F59E0B' },
    { name: 'Annulé',     value: monthStats.failed,     color: '#EF4444' },
  ], [monthStats]);

  const totalForPie = pieData.reduce((acc, c) => acc + c.value, 0);
  const successRate = totalForPie > 0 ? Math.round((monthStats.delivered / totalForPie) * 100) : 0;

  // ── Données par agence (Super Admin) ─────────────────────────────
  const agencyChartData = useMemo(() =>
    agencies.map(agency => {
      const aShippers = users.filter(u => u.agency === agency.name && u.role === 'Shipper');
      const aCouriers = users.filter(u => u.agency === agency.name && u.role === 'Courier');
      const aPkgs = packages.filter(p =>
        aShippers.some(s => s.name === p.shipper || s.companyName === p.shipper) ||
        aCouriers.some(c => c.name === p.courier)
      );
      return {
        name: agency.name.replace(/^Agence\s+/i, ''),
        total: aPkgs.length,
        livrés: aPkgs.filter(p => p.status === 'Delivered').length,
        enAttente: aPkgs.filter(p => p.status === 'Pending').length,
        expéditeurs: aShippers.length,
        livreurs: aCouriers.length,
      };
    }),
    [agencies, users, packages]
  );

  // ── Régions actives ───────────────────────────────────────────────
  const tunisiaRegions = useMemo(() => Object.entries(
    filteredPackages.reduce((acc, pkg) => {
      if (pkg.city) acc[pkg.city] = (acc[pkg.city] || 0) + 1;
      return acc;
    }, {} as Record<string, number>)
  ).map(([name, count]) => ({ name, packages: count }))
    .sort((a, b) => b.packages - a.packages)
    .slice(0, 6),
    [filteredPackages]
  );

  const maxRegionCount = tunisiaRegions[0]?.packages || 1;

  // ── Rapport généré localement ────────────────────────────────────
  const generateAIReport = async () => {
    setIsGenerating(true);
    setAiReport(null);

    // Simulation d'un délai de génération
    await new Promise(r => setTimeout(r, 600));

    const periodLabel = reportPeriod === 'week' ? 'cette semaine' :
      reportPeriod === 'month' ? 'ce mois' :
      reportPeriod === 'quarter' ? 'ce trimestre' : 'cette année';

    const tauxSucces = monthStats.total > 0
      ? Math.round((monthStats.delivered / monthStats.total) * 100)
      : 0;

    const agenciesLines = agencyChartData.length > 0
      ? agencyChartData.map(a =>
          `  • ${a.name} : ${a.total} colis — ${a.livrés} livrés (${a.total > 0 ? Math.round(a.livrés / a.total * 100) : 0}%) — ${a.enAttente} en attente`
        ).join('\n')
      : '  Aucune agence enregistrée.';

    const report = `RAPPORT FINANCIER — ${settings.companyName.toUpperCase()}
Période : ${periodLabel.charAt(0).toUpperCase() + periodLabel.slice(1)}
Généré le : ${new Date().toLocaleDateString('fr-FR')}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

RÉSUMÉ EXÉCUTIF

Sur ${periodLabel}, ${settings.companyName} a traité ${monthStats.total} colis avec un taux de succès de ${tauxSucces}%.
Montant total collecté sur les livraisons réussies : ${monthStats.revenue.toFixed(3)} TND.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

INDICATEURS CLÉS

  • Total colis traités    : ${monthStats.total}
  • Colis livrés          : ${monthStats.delivered} (${tauxSucces}%)
  • Colis en transit      : ${monthStats.inTransit}
  • Colis en attente      : ${monthStats.pending}
  • Colis annulés/retournés : ${monthStats.failed}
  • Montant collecté      : ${monthStats.revenue.toFixed(3)} TND

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PERFORMANCE PAR AGENCE

${agenciesLines}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

ANALYSE

${tauxSucces >= 80
  ? `✓ Excellente performance : le taux de livraison de ${tauxSucces}% dépasse le seuil cible de 80%.`
  : tauxSucces >= 60
  ? `⚠ Performance correcte : le taux de livraison de ${tauxSucces}% est acceptable mais peut être amélioré.`
  : `✗ Performance insuffisante : le taux de livraison de ${tauxSucces}% nécessite une attention immédiate.`
}

${monthStats.failed > 0
  ? `${monthStats.failed} colis annulés représentent ${monthStats.total > 0 ? Math.round(monthStats.failed / monthStats.total * 100) : 0}% du volume total. Une analyse des causes est recommandée.`
  : `Aucun colis annulé ce mois — excellente maîtrise opérationnelle.`
}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

RECOMMANDATIONS

1. ${monthStats.pending > monthStats.delivered
  ? `Réduire le stock de colis en attente (${monthStats.pending} actuellement) en accélérant le processus de validation et d'affectation aux livreurs.`
  : `Maintenir le rythme de traitement actuel et anticiper les pics de volume.`
}

2. ${agencyChartData.length > 1
  ? `Analyser les écarts de performance entre agences et partager les bonnes pratiques des agences les plus performantes.`
  : `Développer le réseau d'agences pour augmenter la couverture géographique.`
}`;

    setAiReport(report);
    setIsGenerating(false);
  };

  const downloadPDF = () => {
    if (!aiReport) return;
    const doc = new jsPDF();
    doc.setFontSize(20); doc.setTextColor(15, 23, 42);
    doc.text(settings.companyName, 20, 25);
    doc.setFontSize(10); doc.setTextColor(100, 116, 139);
    doc.text('Rapport Financier — ' + new Date().toLocaleDateString('fr-FR'), 20, 33);
    doc.setDrawColor(226, 232, 240); doc.line(20, 38, 190, 38);
    doc.setFontSize(10); doc.setTextColor(51, 65, 85);
    const lines = doc.splitTextToSize(aiReport.replace(/\*\*/g, '').replace(/#/g, ''), 170);
    let y = 48;
    lines.forEach((line: string) => {
      if (y > 270) { doc.addPage(); y = 20; }
      doc.text(line, 20, y); y += 6;
    });
    doc.save(`Rapport_${settings.companyName.replace(/\s+/g, '_')}.pdf`);
  };

  const getStatusLabel = (status: string) => {
    const map: Record<string, string> = {
      Delivered: 'livré', Pending: 'en attente', 'In Transit': 'en transit',
      Returned: 'retourné', Cancelled: 'annulé', Received: 'reçu',
    };
    return map[status] || status.toLowerCase();
  };

  return (
    <div className="space-y-6">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Tableau de bord</h1>
          <p className="text-slate-500 text-sm">Bonjour, {currentUser?.name}.</p>
        </div>
      </div>

      {/* ── Stats cards ── */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total colis',    value: monthStats.total,     icon: Package,     bg: 'bg-blue-50',   text: 'text-blue-600' },
          { label: 'Livrés',         value: monthStats.delivered, icon: CheckCircle2, bg: 'bg-green-50',  text: 'text-green-600' },
          { label: 'En transit',     value: monthStats.inTransit, icon: Clock,        bg: 'bg-amber-50',  text: 'text-amber-600' },
          ...(currentUser?.role !== 'Agency Moderator' ? [{ label: 'Annulés', value: monthStats.failed, icon: AlertCircle, bg: 'bg-red-50', text: 'text-red-600' }] : []),
        ].map(s => (
          <div key={s.label} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
            <div className={`w-10 h-10 ${s.bg} ${s.text} rounded-xl flex items-center justify-center mb-3`}>
              <s.icon size={20} />
            </div>
            <p className="text-2xl font-black text-slate-900">{s.value}</p>
            <p className="text-xs text-slate-500 mt-1">{s.label}</p>
          </div>
        ))}
        {currentUser?.role === 'Agency Moderator' && (
          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm col-span-2 sm:col-span-1">
            <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center mb-3">
              <Banknote size={20} />
            </div>
            <p className="text-2xl font-black text-slate-900">{todayRevenue.toFixed(3)}</p>
            <p className="text-xs text-slate-500 mt-1">TND collecté aujourd'hui</p>
          </div>
        )}
      </div>

      {/* ── Montants financiers (Agency Moderator) ── */}
      {currentUser?.role === 'Agency Moderator' && (
        <div className="grid grid-cols-2 gap-4">
          {/* Montant des colis livrés */}
          <div className="bg-gradient-to-br from-green-600 to-green-700 p-5 rounded-2xl shadow-lg">
            <div className="flex items-center justify-between mb-2">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                <CheckCircle2 size={20} className="text-white" />
              </div>
              <span className="text-xs font-bold text-green-100 uppercase">Livrés</span>
            </div>
            <p className="text-3xl font-black text-white">{monthStats.deliveredAmount.toFixed(3)}</p>
            <p className="text-xs text-green-100 mt-1">TND collecté sur {monthStats.delivered} colis</p>
          </div>
          
          {/* Montant des colis retournés */}
          <div className="bg-gradient-to-br from-red-600 to-red-700 p-5 rounded-2xl shadow-lg">
            <div className="flex items-center justify-between mb-2">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                <AlertCircle size={20} className="text-white" />
              </div>
              <span className="text-xs font-bold text-red-100 uppercase">Retournés</span>
            </div>
            <p className="text-3xl font-black text-white">{monthStats.returnedAmount.toFixed(3)}</p>
            <p className="text-xs text-red-100 mt-1">TND sur {monthStats.failed} colis</p>
          </div>
        </div>
      )}

      {/* ── Liste des colis retournés et annulés (Agency Moderator) ── */}
      {currentUser?.role === 'Agency Moderator' && monthStats.failed > 0 && (
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-red-50 text-red-600 rounded-xl flex items-center justify-center">
                <AlertCircle size={20} />
              </div>
              <div>
                <h3 className="font-bold text-slate-900">Colis retournés et annulés</h3>
                <p className="text-xs text-slate-500">{monthStats.failed} colis ce mois</p>
              </div>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-100">
                  <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase">ID Suivi</th>
                  <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase">Expéditeur</th>
                  <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase">Destinataire</th>
                  <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase">Ville</th>
                  <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase">Statut</th>
                  <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase">Montant</th>
                  <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredPackages
                  .filter(p => ['Returned', 'Cancelled'].includes(p.status))
                  .slice(0, 10)
                  .map(pkg => (
                    <tr key={pkg.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <span className="text-sm font-mono font-bold text-blue-600">{pkg.trackingId}</span>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm font-medium text-slate-900">{pkg.shipper}</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-slate-900">{pkg.recipientName}</p>
                        <p className="text-xs text-slate-500">{pkg.recipientPhone}</p>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-slate-600">{pkg.city}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
                          pkg.status === 'Returned' 
                            ? 'bg-orange-100 text-orange-700' 
                            : 'bg-red-100 text-red-700'
                        }`}>
                          {pkg.status === 'Returned' ? 'Retourné' : 'Annulé'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm font-bold text-slate-900">{(pkg.collectedAmount || 0).toFixed(3)} TND</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-xs text-slate-500">{pkg.date}</span>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
          {filteredPackages.filter(p => ['Returned', 'Cancelled'].includes(p.status)).length > 10 && (
            <div className="px-6 py-3 bg-slate-50 border-t border-slate-100 text-center">
              <p className="text-xs text-slate-500">
                Affichage de 10 sur {filteredPackages.filter(p => ['Returned', 'Cancelled'].includes(p.status)).length} colis
              </p>
            </div>
          )}
        </div>
      )}

      {/* ── Graphiques ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Courbe 7 jours */}
        <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
          <h3 className="font-bold text-slate-900 mb-6">Activité — 7 derniers jours</h3>
          <div className="h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={performanceData}>
                <defs>
                  <linearGradient id="gTotal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.15}/>
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="gLivres" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.15}/>
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 12 }} dy={8} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 12 }} allowDecimals={false} />
                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                <Legend />
                <Area type="monotone" dataKey="total" name="Total" stroke="#3B82F6" strokeWidth={2} fill="url(#gTotal)" />
                <Area type="monotone" dataKey="livrés" name="Livrés" stroke="#10B981" strokeWidth={2} fill="url(#gLivres)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Pie statuts */}
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
          <h3 className="font-bold text-slate-900 mb-4">Statuts du mois</h3>
          <div className="h-[200px] relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={75} paddingAngle={4} dataKey="value">
                  {pieData.map((e, i) => <Cell key={i} fill={e.color} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
              <p className="text-2xl font-black text-slate-900">{successRate}%</p>
              <p className="text-[10px] text-slate-500 font-bold uppercase">Succès</p>
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
        </div>
      </div>

      {/* ── Section Super Admin ── */}
      {currentUser?.role === 'Super Admin' && (
        <>
          {/* Cartes agences */}
          <div>
            <h2 className="text-lg font-bold text-slate-900 mb-4">Vue par agence</h2>
            {agencies.length === 0 ? (
              <div className="bg-white rounded-2xl border border-dashed border-slate-200 p-10 text-center text-slate-400 text-sm">
                Aucune agence créée.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {agencyChartData.map((a, i) => {
                  const agency = agencies[i];
                  return (
                    <div key={agency.id} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
                            <Building2 size={18} />
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 text-sm">{agency.name}</p>
                            <p className="text-xs text-slate-500">{agency.location}</p>
                          </div>
                        </div>
                        <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase ${
                          agency.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'
                        }`}>{agency.status === 'Active' ? 'Active' : 'Inactive'}</span>
                      </div>
                      <div className="grid grid-cols-4 gap-2 text-center">
                        <div className="bg-indigo-50 rounded-xl p-2">
                          <p className="text-lg font-black text-indigo-700">{a.expéditeurs}</p>
                          <p className="text-[9px] text-indigo-500 font-bold uppercase">Exp.</p>
                        </div>
                        <div className="bg-orange-50 rounded-xl p-2">
                          <p className="text-lg font-black text-orange-700">{a.livreurs}</p>
                          <p className="text-[9px] text-orange-500 font-bold uppercase">Livr.</p>
                        </div>
                        <div className="bg-amber-50 rounded-xl p-2">
                          <p className="text-lg font-black text-amber-700">{a.enAttente}</p>
                          <p className="text-[9px] text-amber-500 font-bold uppercase">Att.</p>
                        </div>
                        <div className="bg-green-50 rounded-xl p-2">
                          <p className="text-lg font-black text-green-700">{a.livrés}</p>
                          <p className="text-[9px] text-green-500 font-bold uppercase">Livr.</p>
                        </div>
                      </div>
                      {agency.manager && (
                        <p className="text-[10px] text-slate-400 mt-3 text-center">Modérateur : {agency.manager}</p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* BarChart agences + Rapport IA */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
              <h3 className="font-bold text-slate-900 mb-6">Comparaison des agences</h3>
              {agencyChartData.length === 0 ? (
                <div className="h-[260px] flex items-center justify-center text-slate-400 text-sm">Aucune donnée</div>
              ) : (
                <div className="h-[260px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={agencyChartData} margin={{ top: 10, right: 10, left: 0, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 11 }} dy={8} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 11 }} allowDecimals={false} />
                      <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                      <Legend />
                      <Bar dataKey="total" name="Total" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="livrés" name="Livrés" fill="#10B981" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="enAttente" name="En attente" fill="#F59E0B" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            {/* Rapport IA */}
            <div className="bg-gradient-to-br from-indigo-900 to-blue-900 p-6 rounded-3xl text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10"><Sparkles size={80} /></div>
              <div className="relative z-10 flex flex-col h-full gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Sparkles className="text-blue-300" size={18} />
                    <h3 className="font-bold">Rapport IA</h3>
                  </div>
                  <p className="text-blue-200 text-xs">Analyse automatique basée sur vos données</p>
                </div>
                <div>
                  <label className="text-xs text-blue-300 font-bold uppercase tracking-wider block mb-1">Période</label>
                  <select value={reportPeriod} onChange={e => setReportPeriod(e.target.value)}
                    className="w-full bg-white/10 border border-white/20 text-white rounded-xl px-3 py-2 text-sm focus:outline-none">
                    <option value="week" className="text-slate-900">Cette semaine</option>
                    <option value="month" className="text-slate-900">Ce mois</option>
                    <option value="quarter" className="text-slate-900">Ce trimestre</option>
                    <option value="year" className="text-slate-900">Cette année</option>
                  </select>
                </div>
                <button onClick={generateAIReport} disabled={isGenerating}
                  className="w-full flex items-center justify-center gap-2 bg-white text-indigo-900 py-3 rounded-xl font-bold hover:bg-blue-50 transition-colors disabled:opacity-70 mt-auto">
                  {isGenerating ? <Loader2 size={16} className="animate-spin" /> : <FileText size={16} />}
                  {isGenerating ? 'Analyse...' : 'Générer'}
                </button>
              </div>
            </div>
          </div>

          {/* Résultat rapport IA */}
          {aiReport && (
            <div className="bg-white p-6 rounded-3xl border border-indigo-100 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500" />
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Sparkles className="text-indigo-500" size={18} />
                  <h3 className="font-bold text-slate-900">Analyse Financière IA</h3>
                </div>
                <button onClick={downloadPDF}
                  className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-600 rounded-xl text-sm font-bold hover:bg-indigo-100 transition-colors">
                  <Download size={15} />PDF
                </button>
              </div>
              <div ref={reportRef} className="prose prose-sm max-w-none text-slate-700 whitespace-pre-line leading-relaxed text-sm">
                {aiReport}
              </div>
            </div>
          )}
        </>
      )}

      {/* ── Bas de page : régions + activité récente ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Régions */}
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
          <h3 className="font-bold text-slate-900 mb-4">Activité par ville</h3>
          {tunisiaRegions.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-8">Aucune donnée pour ce mois.</p>
          ) : (
            <div className="space-y-3">
              {tunisiaRegions.map(region => (
                <div key={region.name} className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                    <MapPin size={14} />
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm font-medium text-slate-900">{region.name}</span>
                      <span className="text-xs font-bold text-slate-600">{region.packages}</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-1.5">
                      <div className="bg-blue-500 h-1.5 rounded-full transition-all"
                        style={{ width: `${Math.round((region.packages / maxRegionCount) * 100)}%` }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Activité récente */}
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
          <h3 className="font-bold text-slate-900 mb-4">Activité récente</h3>
          {relevantPackages.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-8">Aucun colis.</p>
          ) : (
            <div className="space-y-4">
              {relevantPackages.slice(0, 5).map((pkg, i) => (
                <div key={pkg.id} className="flex gap-3 relative">
                  {i < 4 && <div className="absolute left-4 top-8 bottom-0 w-px bg-slate-100" />}
                  <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0 z-10">
                    <Package size={14} className="text-slate-400" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm text-slate-900">
                      <span className="font-bold text-blue-600">#{pkg.trackingId}</span>
                      {' '}<span className="text-slate-500">{getStatusLabel(pkg.status)}</span>
                      {' → '}<span className="font-medium">{pkg.city}</span>
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">{pkg.date} • {pkg.courier || 'Non assigné'}</p>
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
