import React from 'react';
import { useLocation } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { ShipperDashboard } from './shipper/ShipperDashboard';
import { ShipperOrders } from './shipper/ShipperOrders';

export const ShipperPortal = () => {
  const { currentUser } = useData();
  const location = useLocation();

  const getActiveTab = (): 'dashboard' | 'orders' => {
    if (location.pathname.includes('/orders')) return 'orders';
    return 'dashboard';
  };

  const activeTab = getActiveTab();
  const shipperName = currentUser?.companyName || currentUser?.name || 'Expéditeur';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Espace Expéditeur</h1>
        <p className="text-slate-500 text-sm">Bienvenue, {shipperName}. Gérez vos envois et suivez votre performance.</p>
      </div>

      {/* Content */}
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
        {activeTab === 'dashboard' ? <ShipperDashboard /> : <ShipperOrders />}
      </div>
    </div>
  );
};
