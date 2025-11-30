// src/pages/OrganizationDashboard.jsx
import { useState, useEffect } from 'react';
import {
  LogOut, Search, Award, Users, Ban, Plus, X, Download, Eye,
  CheckCircle, XCircle, ChevronRight, ChevronLeft, Calendar,
  FileText, Upload, Copy, Check, School, Building2, Briefcase
} from 'lucide-react';

// ======================== PINATA UPLOAD ========================
const uploadToPinata = async (file) => {
  const jwt = import.meta.env.VITE_PINATA_JWT;
  const gateway = import.meta.env.VITE_PINATA_GATEWAY;

  if (!jwt) throw new Error("VITE_PINATA_JWT manquant dans .env");
  if (!gateway) throw new Error("VITE_PINATA_GATEWAY manquant dans .env");

  const formData = new FormData();
  formData.append('file', file);
  formData.append('pinataMetadata', JSON.stringify({ name: file.name }));
  formData.append('pinataOptions', JSON.stringify({ cidVersion: 1 }));

  const res = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
    method: 'POST',
    headers: { Authorization: `Bearer ${jwt}` },
    body: formData
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error?.reason || 'Erreur Pinata');

  return `ipfs://${data.IpfsHash}`;
};

// ======================== FONCTION TÉLÉCHARGEMENT ========================
const downloadCertificate = async (ipfsHash, certId) => {
  try {
    const cid = ipfsHash.replace('ipfs://', '');
    const gateway = import.meta.env.VITE_PINATA_GATEWAY;
    const response = await fetch(`https://${gateway}/ipfs/${cid}`);
    
    if (!response.ok) {
      throw new Error(`Erreur HTTP ${response.status}: Impossible de charger le certificat`);
    }
    
    const htmlContent = await response.text();
    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${certId}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Erreur téléchargement:', error);
    alert(`❌ Erreur lors du téléchargement:\n${error.message}`);
  }
};

// ======================== COMPOSANT MODAL CONSULTATION ========================
const CertificateViewer = ({ certificate, onClose, onDownload }) => {
  const [loading, setLoading] = useState(true);
  const [htmlContent, setHtmlContent] = useState('');
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadCertificate = async () => {
      try {
        setLoading(true);
        setError(null);
        const cid = certificate.ipfsHash.replace('ipfs://', '');
        const gateway = import.meta.env.VITE_PINATA_GATEWAY;
        
        const response = await fetch(`https://${gateway}/ipfs/${cid}`);
        if (!response.ok) {
          throw new Error(`Erreur ${response.status}: Certificat introuvable`);
        }
        
        const content = await response.text();
        setHtmlContent(content);
      } catch (err) {
        console.error('Erreur chargement certificat:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (certificate?.ipfsHash) {
      loadCertificate();
    }
  }, [certificate]);

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] flex flex-col">
          <div className="flex items-center justify-between p-6 border-b bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-t-2xl">
            <div className="flex items-center space-x-3">
              <div className="animate-spin rounded-full h-6 w-6 border-2 border-white/30 border-t-white"></div>
              <h3 className="text-xl font-bold">Chargement du certificat</h3>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-xl transition-all">
              <X className="w-6 h-6" />
            </button>
          </div>
          <div className="flex-1 flex items-center justify-center p-8 bg-gradient-to-br from-slate-50 to-blue-50">
            <div className="text-center space-y-4">
              <FileText className="w-16 h-16 text-blue-500 mx-auto" />
              <p className="text-lg font-medium text-gray-700">Chargement du certificat {certificate?.certId}...</p>
              <p className="text-sm text-gray-500">Récupération depuis IPFS via Pinata</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col">
          <div className="flex items-center justify-between p-6 border-b bg-gradient-to-r from-red-600 to-rose-600 text-white rounded-t-2xl">
            <div className="flex items-center space-x-3">
              <XCircle className="w-6 h-6" />
              <h3 className="text-xl font-bold">Erreur de chargement</h3>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-xl transition-all">
              <X className="w-6 h-6" />
            </button>
          </div>
          <div className="p-8">
            <div className="text-center mb-8">
              <XCircle className="w-20 h-20 text-red-500 mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Impossible de charger le certificat</h3>
              <p className="text-gray-600 max-w-2xl mx-auto">{error}</p>
            </div>
            <div className="grid md:grid-cols-2 gap-6 bg-gray-50 p-6 rounded-xl">
              <div>
                <h4 className="font-semibold text-gray-900 mb-3">Détails du certificat</h4>
                <div className="space-y-3 text-sm">
                  <p><span className="font-medium">ID:</span> {certificate.certId}</p>
                  <p><span className="font-medium">Étudiant:</span> {certificate.studentName}</p>
                  <p><span className="font-medium">IPFS:</span> <span className="font-mono break-all">{certificate.ipfsHash}</span></p>
                </div>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-3">Actions possibles</h4>
                <div className="space-y-3">
                  <button
                    onClick={() => onDownload(certificate.ipfsHash, certificate.certId)}
                    className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all font-medium shadow-lg"
                  >
                    <Download className="w-4 h-4" />
                    <span>Télécharger quand même</span>
                  </button>
                  <a
                    href={`https://${import.meta.env.VITE_PINATA_GATEWAY}/ipfs/${certificate.ipfsHash.replace('ipfs://', '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all font-medium"
                  >
                    <Eye className="w-4 h-4" />
                    <span>Ouvrir dans un nouvel onglet</span>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-7xl w-full max-h-[95vh] flex flex-col">
        {/* HEADER */}
        <div className="flex items-center justify-between p-6 border-b bg-gradient-to-r from-blue-600 via-cyan-600 to-indigo-700 text-white rounded-t-2xl">
          <div className="flex items-center space-x-4">
            <div className="bg-white/20 p-3 rounded-xl backdrop-blur-sm">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-2xl font-bold">Certificat Officiel</h3>
              <p className="text-blue-100 text-sm opacity-90">{certificate.studentName}</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <button 
              onClick={() => onDownload(certificate.ipfsHash, certificate.certId)}
              className="flex items-center space-x-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-xl transition-all backdrop-blur-sm text-sm font-medium"
              title="Télécharger le certificat"
            >
              <Download className="w-4 h-4" />
              <span>Télécharger</span>
            </button>
            <a 
              href={`https://${import.meta.env.VITE_PINATA_GATEWAY}/ipfs/${certificate.ipfsHash.replace('ipfs://', '')}`}
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center space-x-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-xl transition-all backdrop-blur-sm text-sm font-medium"
              title="Ouvrir dans un nouvel onglet"
            >
              <Eye className="w-4 h-4" />
              <span>Nouvel onglet</span>
            </a>
            <button 
              onClick={onClose} 
              className="p-2 hover:bg-white/20 rounded-xl transition-all"
              title="Fermer"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* CONTENU DU CERTIFICAT */}
        <div className="flex-1 overflow-hidden relative">
          <iframe
            srcDoc={htmlContent}
            title={`Certificat ${certificate.certId}`}
            className="w-full h-full border-0 bg-white"
            sandbox="allow-scripts allow-same-origin allow-popups"
            loading="lazy"
          />
        </div>

        {/* FOOTER INFO */}
        <div className="p-6 border-t bg-gradient-to-r from-gray-50 to-blue-50">
          <div className="flex flex-wrap items-center justify-between gap-6 text-sm">
            <div className="flex flex-wrap items-center gap-6">
              <div className="flex items-center space-x-2 bg-white/60 px-4 py-2 rounded-xl backdrop-blur-sm border">
                <Calendar className="w-4 h-4 text-blue-600" />
                <span className="font-medium text-gray-700">Émis le {certificate.dateIssued}</span>
              </div>
              <div className="flex items-center space-x-2 bg-white/60 px-4 py-2 rounded-xl backdrop-blur-sm border">
                <span className="font-medium text-gray-700">{certificate.type}</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="font-medium text-gray-700">Statut:</span>
                {certificate.status === 'actif' ? (
                  <span className="inline-flex items-center space-x-1 px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                    <CheckCircle className="w-3 h-3" />
                    <span>Actif & Vérifiable</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center space-x-1 px-3 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium">
                    <XCircle className="w-3 h-3" />
                    <span>Révoqué</span>
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-xs bg-blue-100 text-blue-800 px-3 py-1 rounded-full">
                <span>IPFS:</span>
                <span className="font-mono">{certificate.ipfsHash.slice(0, 12)}...</span>
              </div>
              <div className="text-xs text-gray-500">
                Certificat immuable • Blockchain Sepolia • IPFS/Pinata
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ======================== QR CODE ========================
const QRCodeSVG = ({ value, size = 128 }) => {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100">
      <rect width="100" height="100" fill="white" />
      <rect x="10" y="10" width="30" height="30" fill="black" />
      <rect x="60" y="10" width="30" height="30" fill="black" />
      <rect x="10" y="60" width="30" height="30" fill="black" />
      <rect x="50" y="50" width="10" height="10" fill="black" />
      <text x="50" y="95" fontSize="8" textAnchor="middle" fill="black">
        {value.slice(-4)}
      </text>
    </svg>
  );
};

export default function OrganizationDashboard({
  orgAddress,
  orgName,
  orgType,
  onDisconnect,
  contract,
  orgData
}) {
  const [certificates, setCertificates] = useState([]);
  const [stats, setStats] = useState({ totalCertificates: 0, revokedCertificates: 0, totalStudents: 0 });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showIssueForm, setShowIssueForm] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [copiedId, setCopiedId] = useState(null);
  const [formData, setFormData] = useState({
    studentAddress: '',
    studentName: '',
    studentEmail: '',
    certType: 'Diplôme',
    skillName: '',
    obtainedDate: '',
    ipfsHash: '',
    certId: `CERT-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 9999)).padStart(4, '0')}`
  });
  const [issueStatus, setIssueStatus] = useState('');

  // NOUVEAUX ÉTATS POUR LA CONSULTATION
  const [showCertificateModal, setShowCertificateModal] = useState(false);
  const [selectedCertificateForView, setSelectedCertificateForView] = useState(null);

  // Charger les certificats depuis la blockchain
  useEffect(() => {
    const loadCerts = async () => {
      if (!contract || !orgAddress) return;
      try {
        setLoading(true);
        const certs = await contract.getOrganizationCertificates(orgAddress);
        const formatted = certs.map(c => ({
          id: Number(c.id),
          certId: `CERT-${new Date(Number(c.issuedAt) * 1000).getFullYear()}-${String(Number(c.id)).padStart(4, '0')}`,
          studentName: c.studentName,
          studentAddress: c.student,
          type: c.certType,
          skillName: c.formationName,
          dateIssued: new Date(Number(c.issuedAt) * 1000).toLocaleDateString('fr-FR'),
          status: c.revoked ? 'révoqué' : 'actif',
          ipfsHash: c.ipfsHash
        }));

        const revoked = formatted.filter(c => c.status === 'révoqué').length;
        const uniqueStudents = new Set(formatted.map(c => c.studentAddress)).size;

        setCertificates(formatted);
        setStats({
          totalCertificates: formatted.length,
          revokedCertificates: revoked,
          totalStudents: uniqueStudents
        });
      } catch (err) {
        console.error("Erreur chargement certificats:", err);
      } finally {
        setLoading(false);
      }
    };
    loadCerts();
  }, [contract, orgAddress]);

  const truncateAddress = (addr) => addr ? `${addr.slice(0, 6)}...${addr.slice(-4)}` : '';
  
  const copyToClipboard = (text, key = 'generic') => {
    navigator.clipboard.writeText(text);
    setCopiedId(key);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getOrgIcon = () => {
    const type = (orgType || '').toLowerCase();
    if (type.includes('université') || type.includes('école') || type.includes('school')) return <School className="w-10 h-10 text-white" />;
    if (type.includes('entreprise') || type.includes('company')) return <Building2 className="w-10 h-10 text-white" />;
    return <Briefcase className="w-10 h-10 text-white" />;
  };

  const filteredCertificates = certificates.filter(cert => {
    const matchesSearch = cert.certId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cert.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cert.studentAddress.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || cert.type === filterType;
    const matchesStatus = filterStatus === 'all' || cert.status === filterStatus;
    return matchesSearch && matchesType && matchesStatus;
  });

  // Fonction pour ouvrir la modal de consultation
  const openCertificateViewer = (certificate) => {
    setSelectedCertificateForView(certificate);
    setShowCertificateModal(true);
  };

  // ======================== PINATA UPLOAD ========================
  const handleGeneratePDF = async () => {
    if (!formData.studentName || !formData.skillName || !formData.obtainedDate) {
      alert("Remplis tous les champs obligatoires !");
      return;
    }

    setIssueStatus('Génération du certificat...');

    const certificateHTML = `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <title>${formData.certId}</title>
  <style>
    body { font-family: 'Georgia', serif; background: linear-gradient(135deg, #f0f9ff, #e0f2fe); padding: 40px; margin: 0; }
    .cert { max-width: 900px; margin: 0 auto; background: white; border: 12px double #0ea5e9; border-radius: 20px; padding: 60px; text-align: center; box-shadow: 0 30px 60px rgba(0,0,0,0.2); }
    h1 { color: #1e40af; font-size: 80px; margin: 0; letter-spacing: 5px; text-transform: uppercase; }
    h2 { color: #1e293b; font-size: 50px; margin: 30px 0; }
    .to { font-size: 34px; margin: 40px 0; color: #475569; font-style: italic; }
    .name { font-size: 70px; color: #1e40af; font-weight: bold; margin: 40px 0; text-transform: uppercase; }
    .skill { font-size: 44px; color: #1e293b; font-weight: bold; margin: 50px 0; }
    .info { color: #64748b; font-size: 28px; margin: 20px 0; }
    .id { font-family: 'Courier New', monospace; background: #ecfeff; padding: 20px 40px; border-radius: 20px; display: inline-block; margin-top: 60px; font-size: 24px; border: 3px dashed #0ea5e9; }
    footer { margin-top: 80px; font-size: 18px; color: #94a3b8; }
  </style>
</head>
<body>
  <div class="cert">
    <h1>Certificat Officiel</h1>
    <h2>${formData.certType}</h2>
    <p class="to">Est décerné à</p>
    <p class="name">${formData.studentName}</p>
    <p class="to">Pour avoir complété avec succès la formation</p>
    <p class="skill">${formData.skillName}</p>
    <p class="info">Date d'obtention : ${new Date(formData.obtainedDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
    <p class="info">Organisme : ${orgName}</p>
    <div class="id">${formData.certId}</div>
    <footer>Certificat immuable enregistré sur la blockchain Sepolia<br/>Stocké de manière décentralisée sur IPFS via Pinata</footer>
  </div>
</body>
</html>
    `;

    const blob = new Blob([certificateHTML], { type: 'text/html' });
    const file = new File([blob], `${formData.certId}.html`, { type: 'text/html' });

    setIssueStatus('Upload sur Pinata en cours...');

    try {
      const ipfsHash = await uploadToPinata(file);
      const cid = ipfsHash.replace('ipfs://', '');
      const gateway = import.meta.env.VITE_PINATA_GATEWAY;

      setFormData(prev => ({ ...prev, ipfsHash }));
      setIssueStatus(
        <div className="text-center space-y-3">
          <CheckCircle className="w-12 h-12 text-green-500 mx-auto" />
          <p className="text-green-600 font-bold text-lg">Uploadé avec succès sur Pinata !</p>
          <a href={`https://${gateway}/ipfs/${cid}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline font-medium">
            Voir le certificat (ultra rapide)
          </a>
        </div>
      );
    } catch (err) {
      console.error(err);
      setIssueStatus(<p className="text-red-600">Erreur Pinata : {err.message}</p>);
    }
  };

  const handleSubmitCertificate = async () => {
    if (!formData.ipfsHash.startsWith('ipfs://')) {
      alert("Upload d'abord le certificat sur Pinata !");
      return;
    }
    
    setIssueStatus('Émission sur la blockchain Sepolia...');

    try {
      const issuedAt = Math.floor(new Date(formData.obtainedDate).getTime() / 1000) || Math.floor(Date.now() / 1000);
      const tx = await contract.issueCertificate(
        formData.studentAddress || "0x0000000000000000000000000000000000000000",
        formData.studentName,
        formData.studentEmail,
        formData.skillName,
        formData.certType,
        formData.ipfsHash,
        issuedAt
      );
      await tx.wait();
      alert('Certificat émis avec succès sur la blockchain !');
      setShowIssueForm(false);
      setCurrentStep(1);
      setFormData({
        studentAddress: '',
        studentName: '',
        studentEmail: '',
        certType: 'Diplôme',
        skillName: '',
        obtainedDate: '',
        ipfsHash: '',
        certId: `CERT-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 9999)).padStart(4, '0')}`
      });
      setIssueStatus('');
    } catch (err) {
      console.error(err);
      alert("Erreur blockchain : " + (err.reason || err.message));
    }
  };

  const getStatusBadge = (status) => {
    if (status === 'actif') return (
      <span className="inline-flex items-center space-x-1 px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
        <CheckCircle className="w-4 h-4" /><span>Actif</span>
      </span>
    );
    return (
      <span className="inline-flex items-center space-x-1 px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-medium">
        <XCircle className="w-4 h-4" /><span>Révoqué</span>
      </span>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-cyan-50 flex items-center justify-center">
        <div className="text-3xl font-bold text-blue-600">Chargement des certificats...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-cyan-50">
      {/* HEADER */}
      <header className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-5">
              <div className="bg-gradient-to-br from-blue-600 to-cyan-600 p-4 rounded-2xl shadow-lg">
                {getOrgIcon()}
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">{orgName}</h1>
                <p className="text-sm text-gray-500">Émission de certificats sur blockchain</p>
              </div>
            </div>
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-3 bg-gradient-to-r from-blue-600 to-cyan-600 px-5 py-3 rounded-xl text-white font-medium">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span className="font-mono text-sm">{truncateAddress(orgAddress)}</span>
                <button onClick={() => copyToClipboard(orgAddress, 'org')} className="ml-2 hover:bg-white/20 p-1.5 rounded transition">
                  {copiedId === 'org' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
              <button onClick={onDisconnect} className="flex items-center space-x-2 px-5 py-3 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition font-medium">
                <LogOut className="w-5 h-5" />
                <span>Déconnexion</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* STATS */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
            <div className="flex items-center justify-between">
              <div><p className="text-gray-500 text-sm font-medium mb-1">Total Certificats</p><p className="text-3xl font-bold text-gray-900">{stats.totalCertificates}</p></div>
              <div className="bg-blue-100 p-3 rounded-xl"><Award className="w-8 h-8 text-blue-600" /></div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
            <div className="flex items-center justify-between">
              <div><p className="text-gray-500 text-sm font-medium mb-1">Révoqués</p><p className="text-3xl font-bold text-gray-900">{stats.revokedCertificates}</p></div>
              <div className="bg-red-100 p-3 rounded-xl"><Ban className="w-8 h-8 text-red-600" /></div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
            <div className="flex items-center justify-between">
              <div><p className="text-gray-500 text-sm font-medium mb-1">Étudiants Uniques</p><p className="text-3xl font-bold text-gray-900">{stats.totalStudents}</p></div>
              <div className="bg-green-100 p-3 rounded-xl"><Users className="w-8 h-8 text-green-600" /></div>
            </div>
          </div>
        </div>

        {/* TABLEAU DES CERTIFICATS */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0 mb-6">
              <h2 className="text-xl font-bold text-gray-900">Certificats Émis</h2>
              <button onClick={() => setShowIssueForm(true)} className="inline-flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-lg hover:from-blue-700 hover:to-cyan-700 transition-all font-semibold shadow-lg">
                <Plus className="w-5 h-5" /><span>Émettre un certificat</span>
              </button>
            </div>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="relative">
                <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input type="text" placeholder="Rechercher..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
              <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white">
                <option value="all">Tous les types</option>
                <option>Diplôme</option>
                <option>Certification</option>
                <option>Formation</option>
                <option>Attestation</option>
              </select>
              <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white">
                <option value="all">Tous les statuts</option>
                <option value="actif">Actif</option>
                <option value="révoqué">Révoqué</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px]">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">ID Certificat</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Étudiant</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Type</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Statut</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredCertificates.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center">
                      <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500 text-lg">Aucun certificat trouvé</p>
                      <p className="text-gray-400 text-sm mt-1">Essayez de modifier vos filtres de recherche</p>
                    </td>
                  </tr>
                ) : (
                  filteredCertificates.map((cert) => (
                    <tr key={cert.id} className="hover:bg-gray-50/80 transition-all duration-200">
                      <td className="px-6 py-4">
                        <button 
                          onClick={() => copyToClipboard(cert.certId, cert.certId)} 
                          className="flex items-center space-x-2 font-mono text-sm font-semibold text-gray-900 hover:text-blue-600 transition-colors"
                          title="Copier l'ID"
                        >
                          <span>{cert.certId}</span>
                          {copiedId === cert.certId ? (
                            <Check className="w-4 h-4 text-green-600" />
                          ) : (
                            <Copy className="w-4 h-4 text-gray-400 hover:text-blue-500" />
                          )}
                        </button>
                      </td>
                      <td className="px-6 py-4">
                        <div className="max-w-xs">
                          <p className="font-semibold text-gray-900 text-sm truncate" title={cert.studentName}>
                            {cert.studentName}
                          </p>
                          <button 
                            onClick={() => copyToClipboard(cert.studentAddress, cert.studentAddress)} 
                            className="text-xs text-gray-500 font-mono hover:text-blue-600 flex items-center space-x-1 mt-1 transition-colors"
                            title="Copier l'adresse"
                          >
                            <span className="truncate">{truncateAddress(cert.studentAddress)}</span>
                            {copiedId === cert.studentAddress ? (
                              <Check className="w-3 h-3 text-green-600" />
                            ) : (
                              <Copy className="w-3 h-3 text-gray-400" />
                            )}
                          </button>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gradient-to-r from-blue-100 to-cyan-100 text-blue-800 border border-blue-200">
                          {cert.type}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-2 text-sm text-gray-600">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          <span>{cert.dateIssued}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">{getStatusBadge(cert.status)}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-3">
                          {/* BOUTON CONSULTATION */}
                          <button
                            onClick={() => openCertificateViewer(cert)}
                            className="group relative p-3 bg-gradient-to-br from-blue-50 to-blue-100 text-blue-600 hover:from-blue-100 hover:to-blue-200 rounded-xl transition-all duration-300 shadow-sm hover:shadow-md hover:scale-105 border border-blue-200 hover:border-blue-300 active:scale-95"
                            title="👁️ Consulter le certificat complet"
                          >
                            <Eye className="w-5 h-5" />
                            <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-gradient-to-r from-blue-900 to-cyan-900 text-white text-xs px-3 py-2 rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-300 whitespace-nowrap shadow-lg z-10 before:absolute before:-top-2 before:left-1/2 before:-translate-x-1/2 before:w-0 before:h-0 before:border-l-4 before:border-r-4 before:border-t-4 before:border-transparent before:border-t-gray-900">
                              Consulter
                            </div>
                          </button>
                          
                          {/* BOUTON TÉLÉCHARGEMENT */}
                          <button
                            onClick={() => downloadCertificate(cert.ipfsHash, cert.certId)}
                            className="group relative p-3 bg-gradient-to-br from-green-50 to-emerald-100 text-green-600 hover:from-green-100 hover:to-emerald-200 rounded-xl transition-all duration-300 shadow-sm hover:shadow-md hover:scale-105 border border-green-200 hover:border-green-300 active:scale-95"
                            title="📥 Télécharger le certificat (.html)"
                          >
                            <Download className="w-5 h-5" />
                            <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-gradient-to-r from-green-900 to-emerald-900 text-white text-xs px-3 py-2 rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-300 whitespace-nowrap shadow-lg z-10 before:absolute before:-top-2 before:left-1/2 before:-translate-x-1/2 before:w-0 before:h-0 before:border-l-4 before:border-r-4 before:border-t-4 before:border-transparent before:border-t-gray-900">
                              Télécharger
                            </div>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* MODAL CONSULTATION CERTIFICAT */}
      {showCertificateModal && selectedCertificateForView && (
        <CertificateViewer
          certificate={selectedCertificateForView}
          onClose={() => {
            setShowCertificateModal(false);
            setSelectedCertificateForView(null);
          }}
          onDownload={downloadCertificate}
        />
      )}

      {/* MODAL D'ÉMISSION */}
      {showIssueForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col">
            <div className="bg-white border-b border-gray-200 px-6 py-4 rounded-t-2xl flex-shrink-0">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-2xl font-bold text-gray-900">Émettre un Nouveau Certificat</h3>
                <button onClick={() => { setShowIssueForm(false); setCurrentStep(1); setIssueStatus(''); }} className="p-2 hover:bg-gray-100 rounded-lg"><X className="w-6 h-6 text-gray-500" /></button>
              </div>
              <div className="flex items-center justify-between">
                {[1, 2, 3].map((step) => (
                  <div key={step} className="flex items-center flex-1">
                    <div className={`flex items-center justify-center w-10 h-10 rounded-full font-bold ${currentStep >= step ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white' : 'bg-gray-200 text-gray-500'}`}>
                      {step}
                    </div>
                    {step < 3 && <div className={`flex-1 h-1 mx-2 ${currentStep > step ? 'bg-gradient-to-r from-blue-600 to-cyan-600' : 'bg-gray-200'}`}></div>}
                  </div>
                ))}
              </div>
            </div>

            <div className="p-6 overflow-y-auto flex-1">
              {issueStatus && <div className="mb-6">{issueStatus}</div>}

              {currentStep === 1 && (
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Adresse Ethereum (optionnel)</label>
                    <input type="text" value={formData.studentAddress} onChange={(e) => setFormData(prev => ({ ...prev, studentAddress: e.target.value }))} placeholder="0x..." className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-mono" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Nom complet *</label>
                    <input type="text" value={formData.studentName} onChange={(e) => setFormData(prev => ({ ...prev, studentName: e.target.value }))} placeholder="Ex: Fida Ghourabi" className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Email *</label>
                    <input type="email" value={formData.studentEmail} onChange={(e) => setFormData(prev => ({ ...prev, studentEmail: e.target.value }))} placeholder="fida@example.com" className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                  </div>
                </div>
              )}

              {currentStep === 2 && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Type</label>
                      <select value={formData.certType} onChange={(e) => setFormData(prev => ({ ...prev, certType: e.target.value }))} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white">
                        <option>Diplôme</option>
                        <option>Certification</option>
                        <option>Formation</option>
                        <option>Attestation</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Date d'obtention</label>
                      <input type="date" value={formData.obtainedDate} onChange={(e) => setFormData(prev => ({ ...prev, obtainedDate: e.target.value }))} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Nom de la formation *</label>
                    <input type="text" value={formData.skillName} onChange={(e) => setFormData(prev => ({ ...prev, skillName: e.target.value }))} placeholder="Ex: Développement Mobile avec Flutter" className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                  </div>

                  <div className="mt-8">
                    <h4 className="font-semibold text-gray-900 mb-3 flex items-center space-x-2 text-sm">
                      <FileText className="w-4 h-4 text-blue-600" />
                      <span>Prévisualisation du certificat</span>
                    </h4>
                    <div className="w-full max-w-2xl mx-auto">
                      <div className="bg-white rounded-lg shadow-xl border-2 border-gray-300">
                        <div className="bg-gradient-to-r from-blue-900 to-cyan-800 text-white py-3 px-4">
                          <div className="flex items-start gap-3">
                            <div className="bg-white/20 p-2 rounded-xl backdrop-blur-sm flex-shrink-0">
                              <div className="w-6 h-6 flex items-center justify-center">{getOrgIcon()}</div>
                            </div>
                            <div>
                              <h1 className="text-sm font-bold tracking-wide leading-tight truncate">{orgName}</h1>
                              <p className="text-xs opacity-90 mt-0.5 truncate">Organisme de Formation Certifié</p>
                            </div>
                          </div>
                        </div>
                        <div className="bg-gradient-to-b from-gray-50 to-white px-4 py-4 text-center space-y-2">
                          <div>
                            <p className="text-xs uppercase tracking-wider text-gray-600">Certificat de</p>
                            <h2 className="text-xl font-bold text-blue-900 mt-1">{formData.certType}</h2>
                          </div>
                          {formData.skillName && (
                            <p className="text-base font-bold text-gray-800 leading-snug px-2">{formData.skillName}</p>
                          )}
                          <div className="my-2">
                            <p className="text-xs text-gray-700">Est décerné à</p>
                            <h3 className="text-lg font-bold text-gray-900 mt-1">
                              {formData.studentName || "[Nom de l'étudiant]"}
                            </h3>
                          </div>
                          <div className="grid grid-cols-2 gap-3 text-xs pt-2">
                            <div>
                              <p className="text-gray-600">Date d'émission</p>
                              <p className="text-sm font-bold text-gray-800 mt-1">
                                {formData.obtainedDate ? new Date(formData.obtainedDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' }) : '[Date]'}
                              </p>
                            </div>
                            <div>
                              <p className="text-gray-600">ID certificat</p>
                              <p className="text-xs font-mono font-bold text-gray-800 mt-1">{formData.certId}</p>
                            </div>
                          </div>
                          <div className="flex justify-center py-2">
                            <div className="bg-white p-2 rounded-lg shadow-lg border-2 border-gray-300">
                              <QRCodeSVG value={`https://certiverse.app/verify/${formData.certId}`} size={70} />
                            </div>
                          </div>
                          <p className="text-xs text-gray-600 italic">Scannez pour vérifier sur la blockchain</p>
                        </div>
                        <div className="bg-gray-100 py-1.5 px-3 text-center text-xs text-gray-600 font-medium">
                          Certificat immuable • IPFS: {formData.ipfsHash ? formData.ipfsHash.slice(0, 20) + '...' : 'En attente...'}
                        </div>
                      </div>
                    </div>

                    {!formData.ipfsHash ? (
                      <button onClick={handleGeneratePDF} className="w-full mt-6 px-6 py-4 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-lg hover:from-blue-700 hover:to-cyan-700 transition-all font-bold text-lg shadow-lg flex items-center justify-center space-x-3">
                        <Upload className="w-6 h-6" />
                        <span>Générer & Uploader sur Pinata</span>
                      </button>
                    ) : (
                      <div className="mt-6 p-6 bg-green-50 border-2 border-green-300 rounded-xl text-center">
                        <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-3" />
                        <p className="text-green-800 font-bold text-xl">Certificat prêt !</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {currentStep === 3 && (
                <div className="text-center py-12">
                  <CheckCircle className="w-24 h-24 text-green-500 mx-auto mb-6" />
                  <h3 className="text-3xl font-bold text-gray-900 mb-4">Tout est prêt !</h3>
                  <p className="text-lg text-gray-600 mb-8">Confirmez pour émettre sur la blockchain</p>
                  <div className="bg-gray-50 rounded-xl p-6 max-w-2xl mx-auto text-left space-y-3">
                    <p><span className="font-semibold">Étudiant :</span> {formData.studentName}</p>
                    <p><span className="font-semibold">Formation :</span> {formData.skillName}</p>
                    <p><span className="font-semibold">Type :</span> {formData.certType}</p>
                    <p><span className="font-semibold">Date :</span> {formData.obtainedDate}</p>
                    <p><span className="font-semibold">IPFS :</span> {formData.ipfsHash}</p>
                  </div>
                  <p className="mt-8 text-yellow-700 font-bold text-lg">Action irréversible • Frais estimés : ~0.003 ETH</p>
                </div>
              )}
            </div>

            <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 rounded-b-2xl flex justify-between">
              <button onClick={() => setCurrentStep(Math.max(1, currentStep - 1))} disabled={currentStep === 1} className={`flex items-center space-x-2 px-6 py-3 rounded-lg font-semibold ${currentStep === 1 ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-white border-2 border-gray-300 text-gray-700 hover:bg-gray-50'}`}>
                <ChevronLeft className="w-5 h-5" /><span>Précédent</span>
              </button>
              {currentStep < 3 ? (
                <button onClick={() => setCurrentStep(currentStep + 1)} className="px-8 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-lg hover:from-blue-700 hover:to-cyan-700 font-semibold shadow-lg flex items-center space-x-2">
                  <span>Suivant</span><ChevronRight className="w-5 h-5" />
                </button>
              ) : (
                <button onClick={handleSubmitCertificate} className="px-10 py-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 font-bold text-xl shadow-lg flex items-center space-x-3">
                  <CheckCircle className="w-7 h-7" />
                  <span>Émettre sur la blockchain</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}