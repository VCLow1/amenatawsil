// Alias pour référence future si besoin (ex: comparaison de types Auth)
import type { User as FirebaseUser } from "firebase/auth";

export type UserRole = 'Super Admin' | 'Agency Moderator' | 'Shipper' | 'Courier';
export type PackageStatus = 'Pending' | 'Received' | 'In Transit' | 'Delivered' | 'Postponed' | 'Returned' | 'Cancelled';

export interface PackageHistory {
  status: PackageStatus;
  date: string;
  message: string;
  location?: string;
}

export interface Agency {
  id: string;
  name: string;
  location: string;
  manager: string;
  phone: string;
  email: string;
  status: 'Active' | 'Inactive';
  packages: number;
}

/**
 * Représente un document utilisateur Firestore.
 * Distinct de firebase/auth User — l'UID Firebase Auth correspond à l'id du document.
 */
export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  agency?: string;
  status: 'Active' | 'Inactive' | 'Pending' | 'Rejected' | 'Suspended';
  lastLogin: string;
  phone?: string;
  companyName?: string;
  balance?: number;
  vehicle?: string;
  zone?: string;
  address?: string;
  matricule?: string;
  password?: string;
  cin?: string;
  photo?: string;
  performanceScore?: number;
  acceptanceRate?: number;
  availability?: 'Available' | 'Busy' | 'Offline';
  pickupFee?: number; // Montant de transfert agence → expéditeur (frais de collecte)
  shippingFee?: number; // Frais de livraison par défaut pour cet expéditeur
  returnFee?: number; // Frais de retour par défaut pour cet expéditeur
}

// Ré-export de FirebaseUser pour les rares cas où le type Auth est nécessaire
export type { FirebaseUser };

export interface Package {
  id: string;
  trackingId: string;
  // Expéditeur
  shipper: string;
  shipperAddress?: string;
  pickupLat?: number;
  pickupLng?: number;
  // Destinataire
  recipientName: string;
  recipientPhone: string;
  recipientAddress: string;
  city: string;
  // Colis
  packageName?: string;
  weight: number;
  fragile: boolean;
  description?: string;
  // Financier
  collectedAmount: number;
  shippingFee: number;
  platformCommission?: number;
  netEarnings?: number;
  paymentStatus: 'Pending' | 'Collected' | 'Paid';
  // Statuts
  status: PackageStatus;
  approvalStatus?: 'waiting' | 'approved' | 'rejected';
  // Dates
  date: string;
  deliveryDate?: string;
  assignedAt?: string;
  pickedUpAt?: string;
  // Livreur
  courier?: string;
  courierId?: string;
  distance?: number;
  // Transfert inter-agences
  transferredFromAgency?: string;  // Agence source du transfert
  transferredToAgency?: string;    // Agence destination du transfert
  // Historique
  history: PackageHistory[];
}

export interface Transaction {
  id: string;
  courierId: string;
  amount: number;
  type: 'Earning' | 'Withdrawal';
  date: string;
  status: 'Pending' | 'Completed' | 'Failed';
  orderId?: string;
}

export interface Settings {
  companyName: string;
  contactEmail: string;
  primaryPhone: string;
  defaultCurrency: string;
  maintenanceMode: boolean;
  autoAssign: boolean;
  notifApprovals: boolean;
  notifDelivered: boolean;
  notifReturned: boolean;
  notifDailyReport: boolean;
}

export interface DashboardStats {
  totalPackages: number;
  delivered: number;
  pending: number;
  failed: number;
  revenue: number;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  date: string;
  read: boolean;
  type: 'success' | 'warning' | 'error' | 'info';
}
