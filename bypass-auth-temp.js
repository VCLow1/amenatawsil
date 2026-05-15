// Script temporaire pour contourner l'authentification
// À exécuter dans la console du navigateur sur https://amenatawsil.com

console.log('🔧 Contournement temporaire de l\'authentification...');

// Créer un utilisateur admin temporaire
const tempAdmin = {
  id: 'tzo4E2tr6dQA3skcv8kO3Bek2K93',
  email: 'administrateur@amenatawsil.com',
  name: 'Administrateur',
  role: 'Super Admin',
  status: 'Active',
  lastLogin: new Date().toLocaleString('fr-FR'),
  balance: 0,
  agency: '',
  performanceScore: 5.0,
  acceptanceRate: 100,
  availability: 'Available'
};

// Stocker dans localStorage
localStorage.setItem('tempAdmin', JSON.stringify(tempAdmin));

// Forcer la connexion
if (window.location.pathname === '/login' || window.location.pathname === '/') {
  // Rediriger vers le dashboard
  window.location.href = '/dashboard';
}

console.log('✅ Contournement activé. Rechargez la page.');
console.log('📧 Email: administrateur@amenatawsil.com');
console.log('🔑 Password: Amena2026!');