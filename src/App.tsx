/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { PackageMonitoring } from './components/PackageMonitoring';
import { ShipperPortal } from './components/ShipperPortal';
import { AgencyManagement } from './components/AgencyManagement';
import { ShipperManagement } from './components/ShipperManagement';
import { CourierManagement } from './components/CourierManagement';
import { CourierDashboard } from './components/CourierDashboard';
import { CourierRegistration } from './components/CourierRegistration';
import { ApprovalManagement } from './components/ApprovalManagement';
import { Settings } from './components/Settings';
import { Login } from './components/Login';
import { PackageScan } from './components/PackageScan';
import { motion, AnimatePresence } from 'motion/react';
import { DataProvider, useData } from './context/DataContext';
import { Menu } from 'lucide-react';

const PageWrapper = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.2 }}
        className="p-4 md:p-8"
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
};

// Redirige vers / si le rôle n'est pas autorisé
const Guard = ({ roles, children }: { roles: string[]; children: React.ReactNode }) => {
  const { currentUser } = useData();
  if (!currentUser || !roles.includes(currentUser.role)) return <Navigate to="/" replace />;
  return <>{children}</>;
};

const AppContent = () => {
  const { currentUser, settings, loading } = useData();
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(true);
  const [isMobileOpen, setIsMobileOpen] = React.useState(false);

  React.useEffect(() => {
    setIsMobileOpen(false);
  }, [location.pathname]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-14 h-14 rounded-2xl overflow-hidden shadow-lg shadow-blue-200 animate-pulse">
            <img src="/logo.jpg" alt="Logo" className="w-full h-full object-cover" />
          </div>
          <p className="text-slate-500 font-medium text-sm">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!currentUser && location.pathname !== '/register-courier') {
    if (location.pathname.startsWith('/scan/')) {
      return <Login redirectTo={location.pathname} />;
    }
    return <Login />;
  }

  if (!currentUser && location.pathname === '/register-courier') {
    return <CourierRegistration />;
  }

  return (
    <div className="flex min-h-screen bg-[#F8FAFC]">
      <Sidebar 
        isOpen={isSidebarOpen} 
        setIsOpen={setIsSidebarOpen} 
        isMobileOpen={isMobileOpen} 
        setIsMobileOpen={setIsMobileOpen} 
      />
      <main className={`flex-1 min-h-screen transition-all duration-300 ${isSidebarOpen ? 'md:ml-64' : 'md:ml-20'} ml-0 flex flex-col w-full overflow-x-hidden`}>
        {/* Mobile Header */}
        <div className="md:hidden bg-white border-b border-slate-200 p-4 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg overflow-hidden">
              <img src="/logo.jpg" alt="Logo" className="w-full h-full object-cover" />
            </div>
            <span className="font-bold text-slate-900">{settings?.companyName || 'AMENA TAWSIL'}</span>
          </div>
          <button onClick={() => setIsMobileOpen(true)} className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
            <Menu size={24} />
          </button>
        </div>
        <PageWrapper>
          <Routes>
            <Route path="/" element={
              currentUser.role === 'Shipper' ? <Navigate to="/shipper" /> :
              currentUser.role === 'Courier' ? <Navigate to="/courier-dashboard" /> :
              <Dashboard />
            } />
            <Route path="/agencies" element={<Guard roles={['Super Admin']}><AgencyManagement /></Guard>} />
            <Route path="/shippers" element={<Guard roles={['Super Admin', 'Agency Moderator']}><ShipperManagement /></Guard>} />
            <Route path="/couriers" element={<Guard roles={['Super Admin', 'Agency Moderator']}><CourierManagement /></Guard>} />
            <Route path="/courier-dashboard" element={<Guard roles={['Courier']}><CourierDashboard /></Guard>} />
            <Route path="/courier/*" element={<Guard roles={['Courier']}><CourierDashboard /></Guard>} />
            <Route path="/register-courier" element={<CourierRegistration />} />
            <Route path="/scan/:trackingId" element={<PackageScan />} />
            <Route path="/approvals" element={<Guard roles={['Super Admin', 'Agency Moderator']}><ApprovalManagement /></Guard>} />
            <Route path="/settings" element={<Guard roles={['Super Admin']}><Settings /></Guard>} />
            <Route path="/packages" element={<Guard roles={['Super Admin', 'Agency Moderator']}><PackageMonitoring /></Guard>} />
            <Route path="/shipper/*" element={<Guard roles={['Shipper']}><ShipperPortal /></Guard>} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </PageWrapper>
      </main>
    </div>
  );
};

export default function App() {
  return (
    <DataProvider>
      <Router>
        <AppContent />
      </Router>
    </DataProvider>
  );
}
