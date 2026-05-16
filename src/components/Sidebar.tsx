import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { 
  History, LayoutDashboard, Settings, LogOut,
  ChevronRight, ChevronLeft, Building2, Briefcase,
  Bike, Truck, X, Package, CheckCircle,
  User, Bell
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { useData } from '../context/DataContext';
import { filterPendingPackagesForAgency } from '../lib/packageUtils';
import { BarcodeScanner } from './BarcodeScanner';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Sections avec séparateurs pour Super Admin
const superAdminSections = [
  {
    label: 'Général',
    items: [
      { icon: LayoutDashboard, label: 'Tableau de bord', path: '/' },
      { icon: Package,         label: 'Colis',           path: '/packages' },
    ],
  },
  {
    label: 'Gestion',
    items: [
      { icon: Building2,   label: 'Agences',      path: '/agencies' },
      { icon: CheckCircle, label: 'Approbations', path: '/approvals' },
      { icon: Briefcase,   label: 'Expéditeurs',  path: '/shippers' },
      { icon: Bike,        label: 'Livreurs',     path: '/couriers' },
    ],
  },
  {
    label: 'Système',
    items: [
      { icon: Settings, label: 'Paramètres', path: '/settings' },
    ],
  },
];

const moderatorSections = [
  {
    label: 'Général',
    items: [
      { icon: LayoutDashboard, label: 'Tableau de bord', path: '/' },
      { icon: Package,         label: 'Colis',           path: '/packages' },
    ],
  },
  {
    label: 'Mon Agence',
    items: [
      { icon: CheckCircle, label: 'Approbations', path: '/approvals' },
      { icon: Briefcase, label: 'Expéditeurs', path: '/shippers' },
      { icon: Bike,      label: 'Livreurs',    path: '/couriers' },
    ],
  },
];

const courierItems = [
  { icon: LayoutDashboard, label: 'Tableau de bord', path: '/courier-dashboard' },
  { icon: Truck,           label: 'Mes commandes',   path: '/courier/orders' },
  { icon: History,         label: 'Historique',      path: '/courier/history' },
];

const shipperSections = [
  {
    label: 'Mon Espace',
    items: [
      { icon: LayoutDashboard, label: 'Tableau de bord', path: '/shipper' },
      { icon: Package,         label: 'Mes colis',       path: '/shipper/orders' },
    ],
  },
];

export const Sidebar = ({ 
  isOpen, setIsOpen, isMobileOpen, setIsMobileOpen
}: { 
  isOpen: boolean; setIsOpen: (v: boolean) => void;
  isMobileOpen: boolean; setIsMobileOpen: (v: boolean) => void;
}) => {
  const { currentUser, logout, settings, notifications, users, packages, markNotificationAsRead, deleteNotification } = useData();
  const [notifOpen, setNotifOpen] = useState(false);
  if (!currentUser) return null;

  const unreadNotifs = notifications.filter(n => !n.read);

  const pendingCount = users.filter(u => u.status === 'Pending').length;
  const pendingPackagesCount = packages.filter(p => p.approvalStatus === 'waiting').length;
  const moderatorPendingPackages = currentUser?.role === 'Agency Moderator'
    ? (() => {
        const agencyUserNames = users
          .filter(u => u.agency === currentUser.agency || (u as any).pendingAgency === currentUser.agency)
          .flatMap(u => [u.name, u.companyName].filter(Boolean)) as string[];
        return filterPendingPackagesForAgency(packages, currentUser.agency || '', agencyUserNames).length;
      })()
    : 0;

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'Super Admin':      return 'Super Administrateur';
      case 'Agency Moderator': return 'Modérateur d\'Agence';
      case 'Shipper':          return 'Expéditeur';
      case 'Courier':          return 'Coursier';
      default: return role;
    }
  };

  const NavItem = ({ icon: Icon, label, path, badge }: { icon: any; label: string; path: string; badge?: number }) => (
    <NavLink
      to={path}
      title={!isOpen ? label : undefined}
      className={({ isActive }) => cn(
        "flex items-center gap-3 py-2.5 rounded-xl transition-all duration-200 group relative",
        isOpen ? "px-4" : "md:px-0 md:justify-center px-4",
        isActive
          ? "bg-blue-50 text-blue-600 font-medium"
          : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
      )}
    >
      <Icon size={19} className="transition-colors min-w-[19px] group-hover:text-blue-600" />
      <span className={cn("text-sm whitespace-nowrap flex-1", !isOpen && "md:hidden")}>{label}</span>
      {badge && badge > 0 && isOpen && (
        <span className="w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
          {badge}
        </span>
      )}
      {badge && badge > 0 && !isOpen && (
        <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white" />
      )}
    </NavLink>
  );

  return (
    <>
      {isMobileOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setIsMobileOpen(false)} />
      )}
      <div className={cn(
        "h-[100dvh] bg-white border-r border-slate-200 flex flex-col fixed left-0 top-0 z-50 transition-all duration-300",
        isOpen ? "md:w-64" : "md:w-20",
        "w-64",
        isMobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
      )}>
        {/* Logo */}
        <div className={cn("p-5 flex items-center", isOpen ? "justify-between" : "justify-center md:justify-center justify-between")}>
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="min-w-[38px] w-[38px] h-[38px] rounded-xl overflow-hidden shadow-lg shadow-blue-200 flex-shrink-0">
              <img src="/logo.jpg" alt="Logo" className="w-full h-full object-cover" />
            </div>
            <div className={cn("whitespace-nowrap", !isOpen && "md:hidden")}>
              <h1 className="font-bold text-slate-900 text-sm leading-tight">{settings?.companyName || 'AMENA TAWSIL'}</h1>
              <p className="text-[9px] text-slate-400 uppercase tracking-widest font-semibold">Votre colis, notre priorité</p>
            </div>
          </div>
          <button className="md:hidden p-2 text-slate-400 hover:bg-slate-100 rounded-lg" onClick={() => setIsMobileOpen(false)}>
            <X size={18} />
          </button>
        </div>

        <button onClick={() => setIsOpen(!isOpen)}
          className="hidden md:block absolute -right-3 top-7 bg-white border border-slate-200 rounded-full p-1 text-slate-400 hover:text-blue-600 shadow-sm z-50">
          {isOpen ? <ChevronLeft size={14} /> : <ChevronRight size={14} />}
        </button>

        {/* Nav */}
        <nav className="flex-1 px-3 py-2 overflow-y-auto overflow-x-hidden space-y-1">

          {/* Super Admin — sections */}
          {currentUser.role === 'Super Admin' && superAdminSections.map((section) => (
            <div key={section.label} className="mb-2">
              {isOpen && (
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest px-4 py-2">
                  {section.label}
                </p>
              )}
              {!isOpen && <div className="border-t border-slate-100 my-2" />}
              {section.items.map(item => (
                <NavItem
                  key={item.path}
                  icon={item.icon}
                  label={item.label}
                  path={item.path}
                  badge={item.path === '/approvals' ? pendingCount + pendingPackagesCount : undefined}
                />
              ))}
            </div>
          ))}

          {/* Moderator — sections */}
          {currentUser.role === 'Agency Moderator' && (
            <>
              {moderatorSections.map(section => (
                <div key={section.label} className="mb-2">
                  {isOpen && (
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest px-4 py-2">
                      {section.label === 'Mon Agence' && currentUser.agency
                        ? currentUser.agency
                        : section.label}
                    </p>
                  )}
                  {!isOpen && <div className="border-t border-slate-100 my-2" />}
                  {section.items.map(item => (
                    <NavItem key={item.path} icon={item.icon} label={item.label} path={item.path}
                      badge={item.path === '/approvals' ? moderatorPendingPackages : undefined}
                    />
                  ))}
                </div>
              ))}
            </>
          )}

          {/* Courier */}
          {currentUser.role === 'Courier' && courierItems.map(item => (
            <NavItem key={item.path} icon={item.icon} label={item.label} path={item.path} />
          ))}

          {/* Shipper — sections */}
          {currentUser.role === 'Shipper' && (
            <>
              {shipperSections.map(section => (
                <div key={section.label} className="mb-2">
                  {isOpen && (
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest px-4 py-2">
                      {section.label}
                    </p>
                  )}
                  {!isOpen && <div className="border-t border-slate-100 my-2" />}
                  {section.items.map(item => (
                    <NavItem key={item.path} icon={item.icon} label={item.label} path={item.path} />
                  ))}
                </div>
              ))}
            </>
          )}
        </nav>

        {/* User footer */}
        <div className={cn("p-3 border-t border-slate-100", !isOpen && "md:flex md:flex-col md:items-center")}>

          {/* Scanner douchette — Modérateur uniquement */}
          {currentUser.role === 'Agency Moderator' && isOpen && (
            <div className="mb-2">
              <BarcodeScanner />
            </div>
          )}

          {/* Notifications — Super Admin uniquement */}
          {currentUser.role === 'Super Admin' && (
          <div className="relative mb-2">
            <button
              onClick={() => setNotifOpen(!notifOpen)}
              title={!isOpen ? 'Notifications' : undefined}
              className={cn(
                "flex items-center text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-colors text-sm font-medium relative",
                isOpen ? "w-full gap-3 px-4 py-2.5" : "md:p-2.5 md:justify-center w-full gap-3 px-4 py-2.5"
              )}
            >
              <Bell size={18} className="min-w-[18px]" />
              <span className={cn("whitespace-nowrap flex-1", !isOpen && "md:hidden")}>Notifications</span>
              {unreadNotifs.length > 0 && (
                <>
                  {isOpen && (
                    <span className="w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                      {unreadNotifs.length > 9 ? '9+' : unreadNotifs.length}
                    </span>
                  )}
                  {!isOpen && (
                    <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white" />
                  )}
                </>
              )}
            </button>

            {/* Panneau notifications */}
            {notifOpen && (
              <div className="absolute bottom-full left-0 mb-2 w-72 sm:w-80 bg-white rounded-2xl shadow-2xl border border-slate-100 z-50 overflow-hidden">
                <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                  <h4 className="font-bold text-slate-900 text-sm">Notifications</h4>
                  <button onClick={() => setNotifOpen(false)} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg">
                    <X size={16} />
                  </button>
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="p-8 text-center text-slate-400 text-sm">Aucune notification</div>
                  ) : notifications.map(n => (
                    <div key={n.id}
                      className={`p-3 border-b border-slate-50 hover:bg-slate-50 transition-colors group ${!n.read ? 'bg-blue-50/40' : ''}`}
                    >
                      <div className="flex gap-2.5 items-start">
                        <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${
                          n.type === 'success' ? 'bg-green-500' :
                          n.type === 'error' ? 'bg-red-500' :
                          n.type === 'warning' ? 'bg-amber-500' : 'bg-blue-500'
                        }`} />
                        <div className="flex-1 min-w-0 cursor-pointer" onClick={() => markNotificationAsRead(n.id)}>
                          <p className="text-xs font-bold text-slate-900">{n.title}</p>
                          <p className="text-xs text-slate-500 mt-0.5">{n.message}</p>
                          <p className="text-[10px] text-slate-400 mt-1">{n.date}</p>
                        </div>
                        <button
                          onClick={() => deleteNotification(n.id)}
                          className="p-1 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100 flex-shrink-0"
                          title="Supprimer"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          )}

          <div className={cn("bg-slate-50 rounded-2xl flex items-center mb-3", isOpen ? "p-3 gap-3" : "md:p-2 md:justify-center p-3 gap-3")}>
            <div className="min-w-[36px] w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xs">
              {currentUser.name.split(' ').map(n => n[0]).join('').substring(0, 2)}
            </div>
            <div className={cn("overflow-hidden whitespace-nowrap", !isOpen && "md:hidden")}>
              <p className="text-sm font-semibold text-slate-900 truncate">{currentUser.name}</p>
              <p className="text-[10px] text-slate-500 truncate">{getRoleLabel(currentUser.role)}</p>
              {currentUser.role === 'Agency Moderator' && currentUser.agency && isOpen && (
                <p className="text-[9px] text-blue-500 font-bold truncate mt-0.5">{currentUser.agency}</p>
              )}
            </div>
          </div>
          <button onClick={logout} title={!isOpen ? "Déconnexion" : undefined}
            className={cn(
              "flex items-center text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors text-sm font-medium",
              isOpen ? "w-full gap-3 px-4 py-2.5" : "md:p-2.5 md:justify-center w-full gap-3 px-4 py-2.5"
            )}>
            <LogOut size={18} className="min-w-[18px]" />
            <span className={cn("whitespace-nowrap", !isOpen && "md:hidden")}>Déconnexion</span>
          </button>
        </div>
      </div>
    </>
  );
};
