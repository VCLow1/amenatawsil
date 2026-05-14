import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { User, Package, DashboardStats, Notification, Agency, Settings, Transaction } from '../types';
import { auth, db, secondaryAuth } from '../lib/firebase';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  createUserWithEmailAndPassword,
} from 'firebase/auth';
import {
  collection,
  onSnapshot,
  doc,
  setDoc,
  updateDoc,
  addDoc,
  deleteDoc,
  query,
  orderBy,
  writeBatch,
  getDoc,
  limit,
} from 'firebase/firestore';

interface DataContextType {
  users: User[];
  agencies: Agency[];
  packages: Package[];
  currentUser: User | null;
  notifications: Notification[];
  transactions: Transaction[];
  loading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  register: (userData: Omit<User, 'id' | 'lastLogin'>) => Promise<void>;
  addUser: (user: Omit<User, 'id' | 'lastLogin'>) => Promise<void>;
  updateUser: (id: string, updates: Partial<User>) => Promise<void>;
  deleteUsers: (id: string) => Promise<void>;
  approveUser: (id: string) => Promise<void>;
  rejectUser: (id: string) => Promise<void>;
  approvePackage: (id: string) => Promise<void>;
  rejectPackage: (id: string, reason?: string) => Promise<void>;
  assignPackage: (pkgId: string, courierId: string) => Promise<void>;
  addAgency: (agency: Omit<Agency, 'id' | 'packages'>) => Promise<void>;
  updateAgency: (id: string, updates: Partial<Agency>) => Promise<void>;
  deleteAgency: (id: string) => Promise<void>;
  addPackage: (pkg: Omit<Package, 'id' | 'trackingId' | 'date' | 'history'>) => Promise<void>;
  updatePackage: (id: string, updates: Partial<Package>) => Promise<void>;
  updatePackageStatus: (id: string, status: Package['status'], message?: string) => Promise<void>;
  deletePackage: (id: string) => Promise<void>;
  cancelPackage: (id: string) => Promise<void>;
  returnPackage: (id: string) => Promise<void>;
  importPackages: (newPackages: Omit<Package, 'id' | 'trackingId' | 'date' | 'history'>[]) => Promise<void>;
  acceptOrder: (pkgId: string, courierId: string) => Promise<void>;
  transferPackages: (pkgIds: string[], targetAgencyName: string) => Promise<void>;
  markNotificationAsRead: (id: string) => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
  stats: DashboardStats;
  settings: Settings;
  updateSettings: (updates: Partial<Settings>) => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

const DEFAULT_SETTINGS: Settings = {
  companyName: 'AMENA TAWSIL',
  contactEmail: 'contact@logitrac.tn',
  primaryPhone: '+216 71 000 000',
  defaultCurrency: 'TND (Dinar Tunisien)',
  maintenanceMode: false,
  autoAssign: true,
  notifApprovals: true,
  notifDelivered: true,
  notifReturned: true,
  notifDailyReport: false,
};

const generateTrackingId = () => `LT-${Math.floor(100000 + Math.random() * 900000)}`;

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [agencies, setAgencies] = useState<Agency[]>([]);
  const [packages, setPackages] = useState<Package[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);

  // ─── Auth listener ────────────────────────────────────────────────
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        let userDoc;
        for (let i = 0; i < 3; i++) {
          try {
            userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
            if (userDoc.exists()) break;
          } catch (err: any) {
            console.error(`[FIRESTORE] Erreur lecture:`, err.code, err.message);
          }
          await new Promise(r => setTimeout(r, 800));
        }

        if (userDoc && userDoc.exists()) {
          const userData = { id: userDoc.id, ...userDoc.data() } as User;
          if (userData.status === 'Active') {
            setCurrentUser(userData);
            updateDoc(doc(db, 'users', firebaseUser.uid), {
              lastLogin: new Date().toLocaleString('fr-FR'),
            }).catch(() => {});
          } else {
            await signOut(auth);
            setCurrentUser(null);
          }
        } else {
          await signOut(auth);
          setCurrentUser(null);
        }
      } else {
        setCurrentUser(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // ─── Firestore real-time listeners — démarrent après auth ────────
  useEffect(() => {
    // Attendre que le chargement auth soit terminé avant d'ouvrir les listeners
    if (loading) return;

    const unsubs: (() => void)[] = [];

    const onErr = (label: string) => (err: any) => {
      console.warn(`[Firestore] Listener "${label}" erreur:`, err?.code);
    };

    unsubs.push(
      onSnapshot(collection(db, 'users'),
        (snap) => { setUsers(snap.docs.map((d) => ({ id: d.id, ...d.data() } as User))); },
        onErr('users')
      )
    );

    unsubs.push(
      onSnapshot(collection(db, 'agencies'),
        (snap) => { setAgencies(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Agency))); },
        onErr('agencies')
      )
    );

    unsubs.push(
      onSnapshot(
        query(collection(db, 'packages'), orderBy('date', 'desc'), limit(500)),
        (snap) => {
          setPackages(
            snap.docs.map((d) => {
              const data = d.data();
              return { id: d.id, ...data, history: Array.isArray(data.history) ? data.history : [] } as Package;
            })
          );
        },
        onErr('packages')
      )
    );

    unsubs.push(
      onSnapshot(
        query(collection(db, 'notifications'), orderBy('date', 'desc'), limit(100)),
        (snap) => { setNotifications(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Notification))); },
        onErr('notifications')
      )
    );

    unsubs.push(
      onSnapshot(
        query(collection(db, 'transactions'), orderBy('date', 'desc'), limit(200)),
        (snap) => { setTransactions(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Transaction))); },
        onErr('transactions')
      )
    );

    unsubs.push(
      onSnapshot(
        doc(db, 'settings', 'global'),
        (snap) => { if (snap.exists()) setSettings(snap.data() as Settings); },
        onErr('settings')
      )
    );

    return () => unsubs.forEach((u) => u());
  }, [loading]); // Se relance quand loading passe à false (auth prête)

  // ─── Helpers ──────────────────────────────────────────────────────
  const addNotification = async (title: string, message: string, type: Notification['type']) => {
    // Vérifier les préférences de notifications
    if (title === 'Nouveau compte en attente' && settings.notifApprovals === false) return;
    if (title === 'Colis livré' && settings.notifDelivered === false) return;
    if (title === 'Colis retourné' && settings.notifReturned === false) return;

    await addDoc(collection(db, 'notifications'), {
      title,
      message,
      type,
      date: new Date().toLocaleString('fr-FR'),
      read: false,
    });
  };

  // ─── Auth ─────────────────────────────────────────────────────────
  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      return true;
    } catch (error: any) {
      console.error('Login error:', error.code, error.message);
      return false;
    }
  };

  const logout = async () => {
    await signOut(auth);
    setCurrentUser(null);
  };

  const register = async (userData: Omit<User, 'id' | 'lastLogin'>) => {
    const { password, ...rest } = userData as any;
    // Utiliser secondaryAuth pour ne pas déconnecter l'admin si connecté
    const credential = await createUserWithEmailAndPassword(secondaryAuth, userData.email, password);
    const newUser: Omit<User, 'id'> = {
      ...rest,
      lastLogin: new Date().toLocaleString('fr-FR'),
      status: 'Pending',
      balance: 0,
      performanceScore: 5.0,
      acceptanceRate: 100,
    };
    await setDoc(doc(db, 'users', credential.user.uid), newUser);
    await secondaryAuth.signOut();
    await addNotification('Nouvelle inscription', `${userData.name} a soumis une demande d'inscription.`, 'info');
  };

  // ─── Users ────────────────────────────────────────────────────────
  const addUser = async (userData: Omit<User, 'id' | 'lastLogin'>) => {
    const { password, ...rest } = userData as any;
    let uid: string;

    try {
      // Tentative de création normale
      const credential = await createUserWithEmailAndPassword(secondaryAuth, userData.email, password || 'LogiTrack2024!');
      uid = credential.user.uid;
      await secondaryAuth.signOut();
    } catch (err: any) {
      if (err.code === 'auth/email-already-in-use') {
        // Email existe dans Auth (compte supprimé de Firestore mais pas d'Auth)
        // On tente avec le nouveau mot de passe fourni
        try {
          const credential = await signInWithEmailAndPassword(secondaryAuth, userData.email, password || 'LogiTrack2024!');
          uid = credential.user.uid;
          // Mettre à jour le mot de passe si différent
          const { updatePassword } = await import('firebase/auth');
          await updatePassword(credential.user, password || 'LogiTrack2024!');
          await secondaryAuth.signOut();
        } catch (loginErr: any) {
          if (loginErr.code === 'auth/invalid-credential' || loginErr.code === 'auth/wrong-password') {
            // Ancien mot de passe inconnu → envoyer reset et bloquer
            const { sendPasswordResetEmail } = await import('firebase/auth');
            await sendPasswordResetEmail(secondaryAuth, userData.email);
            throw {
              code: 'auth/email-already-in-use',
              message: `Cet email existe déjà. Un email de réinitialisation a été envoyé à ${userData.email}. Demandez à l'utilisateur de réinitialiser son mot de passe, puis réessayez.`
            };
          }
          throw loginErr;
        }
      } else {
        throw err;
      }
    }

    // Pour Shipper et Courier en Pending : ne pas assigner l'agence maintenant
    const isPending = userData.status === 'Pending';
    const docData: any = {
      ...rest,
      lastLogin: new Date().toLocaleString('fr-FR'),
    };
    if (isPending) {
      docData.pendingAgency = userData.agency || '';
      docData.agency = '';
    }

    await setDoc(doc(db, 'users', uid), docData);

    if (isPending) {
      const roleLabel = userData.role === 'Shipper' ? 'expéditeur' : 'livreur';
      await addNotification(
        'Nouveau compte en attente',
        `${userData.name} (${roleLabel}) de l'agence ${userData.agency || 'N/A'} attend une approbation.`,
        'info'
      );
    }

    if (!isPending && userData.role === 'Agency Moderator' && userData.agency) {
      const agency = agencies.find((a) => a.name === userData.agency);
      if (agency) await updateDoc(doc(db, 'agencies', agency.id), { manager: userData.name });
    }
  };

  const updateUser = async (id: string, updates: Partial<User>) => {
    const { id: _id, ...data } = updates as any;
    await updateDoc(doc(db, 'users', id), data);
    const existingUser = users.find((u) => u.id === id);
    if (existingUser?.role === 'Agency Moderator' && existingUser.agency && updates.name && updates.name !== existingUser.name) {
      const agency = agencies.find((a) => a.name === existingUser.agency);
      if (agency) await updateDoc(doc(db, 'agencies', agency.id), { manager: updates.name });
    }
  };

  const deleteUsers = async (id: string) => {
    const existingUser = users.find((u) => u.id === id);

    // ── Gestion des colis liés à un Shipper ───────────────────────
    if (existingUser?.role === 'Shipper') {
      const shipperName = existingUser.companyName || existingUser.name;
      const shipperPackages = packages.filter(p => p.shipper === shipperName);
      const activeStatuses = ['Pending', 'Received', 'In Transit'];

      // Collecter toutes les opérations
      const operations: Array<{ ref: any; data: any }> = [];
      shipperPackages.forEach(pkg => {
        const pkgRef = doc(db, 'packages', pkg.id);
        if (activeStatuses.includes(pkg.status)) {
          operations.push({
            ref: pkgRef,
            data: {
              status: 'Cancelled',
              approvalStatus: 'rejected',
              history: [
                ...(pkg.history || []),
                {
                  status: 'Cancelled',
                  date: new Date().toLocaleString('fr-FR'),
                  message: `Expéditeur supprimé — colis annulé automatiquement`,
                },
              ],
            },
          });
        } else {
          operations.push({
            ref: pkgRef,
            data: { shipper: '[Compte supprimé]' },
          });
        }
      });

      // Découper en batches de 499 (limite Firestore = 500 ops/batch)
      const BATCH_SIZE = 499;
      for (let i = 0; i < operations.length; i += BATCH_SIZE) {
        const chunk = operations.slice(i, i + BATCH_SIZE);
        const batch = writeBatch(db);
        chunk.forEach(op => batch.update(op.ref, op.data));
        await batch.commit();
      }
    }

    // Supprime le document Firestore — bloque l'accès à l'app
    // Note: le compte Firebase Auth reste (nécessite Admin SDK pour le supprimer)
    await deleteDoc(doc(db, 'users', id));

    if (existingUser?.role === 'Agency Moderator' && existingUser.agency) {
      const agency = agencies.find((a) => a.name === existingUser.agency);
      if (agency) await updateDoc(doc(db, 'agencies', agency.id), { manager: '' });
    }
  };

  // Suspension — alternative à la suppression, conserve l'historique
  // const suspendUser = async (id: string) => { ... } — non exposé, conservé pour usage futur

  const approveUser = async (id: string) => {
    const user = users.find(u => u.id === id);
    const pendingAgency = (user as any)?.pendingAgency || user?.agency || '';

    const updateData: any = { status: 'Active' };
    if (pendingAgency) {
      updateData.agency = pendingAgency;
      updateData.pendingAgency = '';
    }

    await updateDoc(doc(db, 'users', id), updateData);
    await addNotification(
      'Compte approuvé',
      `Le compte de ${user?.name || 'l\'utilisateur'} a été activé avec succès.`,
      'success'
    );
  };

  const rejectUser = async (id: string) => {
    await updateDoc(doc(db, 'users', id), { status: 'Rejected' });
    await addNotification('Compte rejeté', 'Le compte a été rejeté.', 'error');
  };

  const approvePackage = async (id: string) => {
    const pkg = packages.find(p => p.id === id);
    if (!pkg) return;
    const newHistory = [
      ...(pkg.history || []),
      { status: 'Received' as const, date: new Date().toLocaleString('fr-FR'), message: 'Colis reçu à l\'agence' },
    ];
    await updateDoc(doc(db, 'packages', id), {
      approvalStatus: 'approved',
      status: 'Received',
      history: newHistory,
    });
    await addNotification('Colis reçu', `Le colis #${pkg.trackingId} a été reçu à l'agence.`, 'success');
  };

  const rejectPackage = async (id: string, reason?: string) => {
    const pkg = packages.find(p => p.id === id);
    if (!pkg) return;
    const newHistory = [
      ...(pkg.history || []),
      { status: 'Cancelled' as const, date: new Date().toLocaleString('fr-FR'), message: reason || 'Colis rejeté par le modérateur' },
    ];
    await updateDoc(doc(db, 'packages', id), {
      approvalStatus: 'rejected',
      status: 'Cancelled',
      history: newHistory,
    });
    await addNotification('Colis rejeté', `Le colis #${pkg.trackingId} a été rejeté.`, 'error');
  };

  // ─── Agencies ─────────────────────────────────────────────────────
  const addAgency = async (agencyData: Omit<Agency, 'id' | 'packages'>) => {
    await addDoc(collection(db, 'agencies'), { ...agencyData, packages: 0 });
    if (agencyData.manager) {
      const manager = users.find((u) => u.name === agencyData.manager);
      if (manager) await updateDoc(doc(db, 'users', manager.id), { agency: agencyData.name });
    }
  };

  const updateAgency = async (id: string, updates: Partial<Agency>) => {
    const existingAgency = agencies.find((a) => a.id === id);
    await updateDoc(doc(db, 'agencies', id), updates);
    if (existingAgency && updates.manager !== undefined && updates.manager !== existingAgency.manager) {
      if (existingAgency.manager) {
        const oldManager = users.find((u) => u.name === existingAgency.manager);
        if (oldManager) await updateDoc(doc(db, 'users', oldManager.id), { agency: '' });
      }
      if (updates.manager) {
        const newManager = users.find((u) => u.name === updates.manager);
        if (newManager) await updateDoc(doc(db, 'users', newManager.id), { agency: updates.name || existingAgency.name });
      }
    }
  };

  const deleteAgency = async (id: string) => {
    const existingAgency = agencies.find((a) => a.id === id);
    if (!existingAgency) return;

    // Trouver tous les utilisateurs liés à cette agence
    const agencyUsers = users.filter(u =>
      u.agency === existingAgency.name ||
      (u as any).pendingAgency === existingAgency.name
    );

    // ── Traiter les colis de chaque Shipper de l'agence ───────────
    const shippers = agencyUsers.filter(u => u.role === 'Shipper');
    const activeStatuses = ['Pending', 'Received', 'In Transit'];

    if (shippers.length > 0) {
      // Collecter toutes les opérations à effectuer
      const operations: Array<{ ref: any; data: any }> = [];

      shippers.forEach(shipper => {
        const shipperName = shipper.companyName || shipper.name;
        const shipperPackages = packages.filter(p => p.shipper === shipperName);

        shipperPackages.forEach(pkg => {
          const pkgRef = doc(db, 'packages', pkg.id);
          if (activeStatuses.includes(pkg.status)) {
            operations.push({
              ref: pkgRef,
              data: {
                status: 'Cancelled',
                approvalStatus: 'rejected',
                history: [
                  ...(pkg.history || []),
                  {
                    status: 'Cancelled',
                    date: new Date().toLocaleString('fr-FR'),
                    message: `Agence "${existingAgency.name}" supprimée — colis annulé automatiquement`,
                  },
                ],
              },
            });
          } else {
            operations.push({
              ref: pkgRef,
              data: { shipper: '[Compte supprimé]' },
            });
          }
        });
      });

      // Découper en batches de 499 (limite Firestore = 500 ops/batch)
      const BATCH_SIZE = 499;
      for (let i = 0; i < operations.length; i += BATCH_SIZE) {
        const chunk = operations.slice(i, i + BATCH_SIZE);
        const batch = writeBatch(db);
        chunk.forEach(op => batch.update(op.ref, op.data));
        await batch.commit();
      }
    }

    // Supprimer tous les docs Firestore des utilisateurs liés en parallèle
    await Promise.all(agencyUsers.map(u => deleteDoc(doc(db, 'users', u.id))));

    // Supprimer l'agence
    await deleteDoc(doc(db, 'agencies', id));

    await addNotification(
      'Agence supprimée',
      `L'agence "${existingAgency.name}" et ses ${agencyUsers.length} utilisateur(s) ont été supprimés.`,
      'warning'
    );
  };

  // ─── Packages ─────────────────────────────────────────────────────
  const addPackage = async (pkgData: Omit<Package, 'id' | 'trackingId' | 'date' | 'history'>) => {
    await addDoc(collection(db, 'packages'), {
      ...pkgData,
      trackingId: generateTrackingId(),
      date: new Date().toISOString().split('T')[0],
      approvalStatus: 'waiting',
      history: [{ status: 'Pending', date: new Date().toLocaleString('fr-FR'), message: 'Colis créé — en attente d\'approbation' }],
    });
  };

  const updatePackage = async (id: string, updates: Partial<Package>) => {
    const { id: _id, ...data } = updates as any;
    await updateDoc(doc(db, 'packages', id), data);
  };

  const updatePackageStatus = async (id: string, status: Package['status'], message?: string) => {
    const pkg = packages.find((p) => p.id === id);
    if (!pkg) return;

    const newHistory = [
      ...(pkg.history || []),
      { status, date: new Date().toLocaleString('fr-FR'), message: message || `Statut mis à jour vers ${status}` },
    ];

    const updates: any = {
      status,
      history: newHistory,
      ...(status === 'Delivered' && { deliveryDate: new Date().toISOString().split('T')[0] }),
    };

    if (status === 'Delivered' && pkg.courierId) {
      const earnings = pkg.netEarnings || 0;
      updates.paymentStatus = 'Collected';

      const batch = writeBatch(db);
      batch.update(doc(db, 'packages', id), updates);

      const courier = users.find((u) => u.id === pkg.courierId);
      if (courier) {
        batch.update(doc(db, 'users', pkg.courierId), { balance: (courier.balance || 0) + earnings });
      }

      const txRef = doc(collection(db, 'transactions'));
      batch.set(txRef, {
        courierId: pkg.courierId,
        amount: earnings,
        type: 'Earning',
        date: new Date().toLocaleString('fr-FR'),
        status: 'Completed',
        orderId: id,
      });

      await batch.commit();

      // Vérifier si tous les colis actifs du livreur sont livrés → remettre disponible
      const remainingActive = packages.filter(
        p => p.id !== id &&
          (p.courierId === pkg.courierId || p.courier === pkg.courier) &&
          ['Received', 'In Transit'].includes(p.status)
      );
      if (remainingActive.length === 0 && pkg.courierId) {
        await updateDoc(doc(db, 'users', pkg.courierId), { availability: 'Available' });
        await addNotification(
          'Livreur disponible',
          `${pkg.courier || 'Le livreur'} a terminé toutes ses livraisons et est de nouveau disponible.`,
          'success'
        );
      }

      await addNotification('Colis livré', `Le colis #${pkg.trackingId} a été livré par ${pkg.courier || 'le livreur'}.`, 'success');
    } else {
      await updateDoc(doc(db, 'packages', id), updates);
      if (status === 'Returned') {
        await addNotification('Colis retourné', `Le colis #${pkg.trackingId} a été retourné.`, 'warning');
      }
      if (status === 'In Transit') {
        await addNotification('Colis en transit', `Le colis #${pkg.trackingId} est en cours de livraison par ${pkg.courier || 'le livreur'}.`, 'info');
      }
    }
  };

  const deletePackage = async (id: string) => {
    await deleteDoc(doc(db, 'packages', id));
  };

  const cancelPackage = async (id: string) => {
    await updatePackageStatus(id, 'Cancelled', "Colis annulé par l'expéditeur");
  };

  /**
   * Remet le colis à son état initial (Pending / waiting) :
   * - Désassigne le livreur
   * - Remet approvalStatus à 'waiting'
   * - Remet le livreur à 'Available' si plus de colis actifs
   * - Conserve l'historique complet + ajoute une entrée de retour
   */
  const returnPackage = async (id: string) => {
    const pkg = packages.find((p) => p.id === id);
    if (!pkg) return;

    const newHistory = [
      ...(pkg.history || []),
      {
        status: 'Received' as const,
        date: new Date().toLocaleString('fr-FR'),
        message: 'Colis retourné à l\'agence — en attente de réaffectation',
      },
    ];

    const batch = writeBatch(db);

    // Remettre le colis à Received (déjà approuvé, pas besoin de repasser par l'approbation)
    batch.update(doc(db, 'packages', id), {
      status: 'Received',
      approvalStatus: 'approved',
      courierId: '',
      courier: '',
      assignedAt: '',
      history: newHistory,
    });

    // Remettre le livreur disponible si plus de colis actifs
    if (pkg.courierId) {
      const remainingActive = packages.filter(
        p => p.id !== id &&
          p.courierId === pkg.courierId &&
          ['Received', 'In Transit'].includes(p.status)
      );
      if (remainingActive.length === 0) {
        batch.update(doc(db, 'users', pkg.courierId), { availability: 'Available' });
      }
    }

    await batch.commit();

    await addNotification(
      'Colis retourné à l\'agence',
      `Le colis #${pkg.trackingId} a été retourné par ${pkg.courier || 'le livreur'} — prêt à être réaffecté.`,
      'warning'
    );
  };

  const importPackages = async (newPkgs: Omit<Package, 'id' | 'trackingId' | 'date' | 'history'>[]) => {
    const batch = writeBatch(db);
    newPkgs.forEach((pkgData) => {
      const ref = doc(collection(db, 'packages'));
      batch.set(ref, {
        ...pkgData,
        trackingId: generateTrackingId(),
        date: new Date().toISOString().split('T')[0],
        history: [{ status: 'Pending', date: new Date().toLocaleString('fr-FR'), message: 'Colis créé via import' }],
      });
    });
    await batch.commit();
    await addNotification('Import réussi', `${newPkgs.length} colis ont été importés avec succès.`, 'success');
  };

  const acceptOrder = async (pkgId: string, courierId: string) => {
    const courier = users.find((u) => u.id === courierId);
    const pkg = packages.find((p) => p.id === pkgId);
    if (!courier || !pkg) return;

    const newHistory = [
      ...(pkg.history || []),
      { status: 'Received' as const, date: new Date().toLocaleString('fr-FR'), message: `Commande acceptée par ${courier.name}` },
    ];

    await updateDoc(doc(db, 'packages', pkgId), {
      status: 'Received',
      courierId,
      courier: courier.name,
      assignedAt: new Date().toISOString(),
      history: newHistory,
    });

    // Marquer le livreur comme occupé
    await updateDoc(doc(db, 'users', courierId), { availability: 'Busy' });

    await addNotification('Commande acceptée', `Vous avez accepté la commande #${pkg.trackingId}`, 'success');
  };

  const assignPackage = async (pkgId: string, courierId: string) => {
    const courier = users.find((u) => u.id === courierId);
    const pkg = packages.find((p) => p.id === pkgId);
    if (!courier || !pkg) return;

    const newHistory = [
      ...(pkg.history || []),
      { status: 'Received' as const, date: new Date().toLocaleString('fr-FR'), message: `Affecté à ${courier.name} par le modérateur` },
    ];

    await updateDoc(doc(db, 'packages', pkgId), {
      status: 'Received',
      courierId,
      courier: courier.name,
      assignedAt: new Date().toISOString(),
      history: newHistory,
    });

    // Marquer le livreur comme occupé
    await updateDoc(doc(db, 'users', courierId), { availability: 'Busy' });

    await addNotification('Colis affecté', `Le colis #${pkg.trackingId} a été affecté à ${courier.name}`, 'success');
  };

  /**
   * Transfère une sélection de colis vers une autre agence.
   * - Ajoute transferredFromAgency / transferredToAgency sur chaque colis
   * - Ajoute une entrée dans l'historique
   * - Les colis apparaissent dans la liste de l'agence cible avec un badge
   */
  const transferPackages = async (pkgIds: string[], targetAgencyName: string) => {
    if (!pkgIds.length || !targetAgencyName) return;

    const sourceAgencyName = currentUser?.agency || '';
    const now = new Date().toLocaleString('fr-FR');

    const BATCH_SIZE = 499;
    for (let i = 0; i < pkgIds.length; i += BATCH_SIZE) {
      const chunk = pkgIds.slice(i, i + BATCH_SIZE);
      const batch = writeBatch(db);

      chunk.forEach(pkgId => {
        const pkg = packages.find(p => p.id === pkgId);
        if (!pkg) return;

        const newHistory = [
          ...(pkg.history || []),
          {
            status: 'Received' as const,
            date: now,
            message: `Transféré de "${sourceAgencyName}" vers "${targetAgencyName}"`,
          },
        ];

        batch.update(doc(db, 'packages', pkgId), {
          transferredFromAgency: sourceAgencyName,
          transferredToAgency: targetAgencyName,
          history: newHistory,
        });
      });

      await batch.commit();
    }

    await addNotification(
      'Transfert inter-agences',
      `${pkgIds.length} colis transféré${pkgIds.length > 1 ? 's' : ''} de "${sourceAgencyName}" vers "${targetAgencyName}".`,
      'info'
    );
  };

  const markNotificationAsRead = async (id: string) => {
    await updateDoc(doc(db, 'notifications', id), { read: true });
  };

  const deleteNotification = async (id: string) => {
    await deleteDoc(doc(db, 'notifications', id));
  };

  const updateSettings = async (updates: Partial<Settings>) => {
    await setDoc(doc(db, 'settings', 'global'), { ...settings, ...updates }, { merge: true });
  };

  // ─── Stats ────────────────────────────────────────────────────────
  const stats: DashboardStats = useMemo(() => {
    // Exclure les colis transférés depuis une agence (déjà comptés dans l'agence cible)
    const countablePackages = packages.filter(p =>
      !(p.transferredFromAgency && p.transferredToAgency && p.transferredFromAgency !== p.transferredToAgency)
    );
    return {
      totalPackages: countablePackages.length,
      delivered: countablePackages.filter((p) => p.status === 'Delivered').length,
      pending: countablePackages.filter((p) => p.status === 'Pending').length,
      failed: countablePackages.filter((p) => p.status === 'Returned' || p.status === 'Cancelled').length,
      revenue: countablePackages.reduce((acc, p) => acc + (p.collectedAmount || 0), 0),
    };
  }, [packages]);

  return (
    <DataContext.Provider
      value={{
        users,
        agencies,
        packages,
        currentUser,
        notifications,
        transactions,
        loading,
        login,
        logout,
        register,
        addUser,
        updateUser,
        deleteUsers,
        approveUser,
        rejectUser,
        approvePackage,
        rejectPackage,
        addAgency,
        updateAgency,
        deleteAgency,
        addPackage,
        updatePackage,
        updatePackageStatus,
        deletePackage,
        cancelPackage,
        returnPackage,
        importPackages,
        acceptOrder,
        assignPackage,
        transferPackages,
        markNotificationAsRead,
        deleteNotification,
        stats,
        settings,
        updateSettings,
      }}
    >
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) throw new Error('useData must be used within a DataProvider');
  return context;
};
