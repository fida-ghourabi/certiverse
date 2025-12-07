// src/App.jsx
import { Web3Provider, useWeb3 } from './context/Web3Context';
import HomePage from './pages/HomePage';
import AdminDashboard from './pages/AdminDashboard';
import OrganizationDashboard from './pages/OrganizationDashboard';
import StudentDashboard from './pages/StudentDashboard';
import EmployerVerification from './pages/EmployerVerification';
import CertificateVerification from './pages/CertificateVerification';
import StudentProfileViewer from './pages/StudentProfileViewer';
import { useEffect, useState } from 'react';

function AppContent() {
  const { account, isAdmin, isRegisteredOrg, orgData, loading, connectWallet, disconnect } = useWeb3();
  const [currentPage, setCurrentPage] = useState('home');

  useEffect(() => {
    // Check URL for routing
    const path = window.location.pathname;
    if (path.includes('/employer')) {
      setCurrentPage('employer');
    } else if (path.includes('/verify')) {
      setCurrentPage('verify');
    } else if (path.includes('/profile')) {
      setCurrentPage('profile');
    } else {
      setCurrentPage('home');
    }

    // Optionnel : auto-connect si déjà connecté
    if (window.ethereum?.selectedAddress) {
      connectWallet();
    }
  }, []);

  // Update URL when page changes
  const navigate = (page) => {
    setCurrentPage(page);
    window.history.pushState({}, '', `/${page === 'home' ? '' : page}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-mesh flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-[var(--color-primary-500)] border-t-transparent mx-auto mb-4"></div>
          <p className="text-xl font-semibold gradient-text font-display">Connexion à la blockchain...</p>
        </div>
      </div>
    );
  }

  // Employer/Verifier routes (accessible without account)
  if (currentPage === 'employer') {
    return (
      <EmployerVerification
        onNavigateToVerify={() => navigate('verify')}
        onNavigateToProfile={() => navigate('profile')}
        onNavigateHome={() => navigate('home')}
      />
    );
  }

  if (currentPage === 'verify') {
    return <CertificateVerification onBack={() => navigate('employer')} />;
  }

  if (currentPage === 'profile') {
    return <StudentProfileViewer onBack={() => navigate('employer')} />;
  }

  // Regular user flows (require account connection)
  if (!account) {
    return <HomePage onConnectWallet={connectWallet} onNavigateToEmployer={() => navigate('employer')} />;
  }

  if (isAdmin) {
    return <AdminDashboard adminAddress={account} onDisconnect={disconnect} contract={useWeb3().contract} />;
  }

  if (isRegisteredOrg && orgData) {
    return (
      <OrganizationDashboard
        orgAddress={account}
        orgName={orgData.name}
        orgType={orgData.orgType}
        onDisconnect={disconnect}
        contract={useWeb3().contract}
        orgData={orgData}
      />
    );
  }

  // Si l'utilisateur n'est ni admin ni organisation, c'est un étudiant
  // Rediriger vers le StudentDashboard
  return <StudentDashboard studentAddress={account} onDisconnect={disconnect} contract={useWeb3().contract} />;
}

function App() {
  return (
    <Web3Provider>
      <AppContent />
    </Web3Provider>
  );
}

export default App;