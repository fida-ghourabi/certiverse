// src/pages/AdminDashboard.jsx
import { useState, useEffect } from 'react';
import {
  LogOut, Search, Building2, Award, TrendingUp, Plus, X, Copy, Check,
  AlertCircle, CheckCircle, Ban, ExternalLink, Loader2
} from 'lucide-react';

export default function AdminDashboard({ adminAddress, onDisconnect, contract }) {
  const [organizations, setOrganizations] = useState([]);
  const [stats, setStats] = useState({
    totalOrgs: 0,
    activeOrgs: 0,
    totalCertificates: 0,
    revokedCertificates: 0
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [searchType, setSearchType] = useState('all');
  const [showAddForm, setShowAddForm] = useState(false);
  const [copiedAddress, setCopiedAddress] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitStatus, setSubmitStatus] = useState(null);
  const [revokingAddress, setRevokingAddress] = useState(null); // Pour spinner sur le bouton

  const [formData, setFormData] = useState({
    address: '',
    name: '',
    email: '',
    type: 'Université',
    registeredAt: Math.floor(Date.now() / 1000)
  });
  const [formErrors, setFormErrors] = useState({});

  // Charger toutes les données depuis le contrat
  const loadData = async () => {
    if (!contract) return;
    try {
      setLoading(true);
      const globalStats = await contract.getGlobalStats();
      setStats({
        totalOrgs: Number(globalStats[0]),
        activeOrgs: Number(globalStats[1]),
        totalCertificates: Number(globalStats[2]),
        revokedCertificates: Number(globalStats[3])
      });

      const [
        addresses, names, emails, types, actives,
        totalIssued, totalRevoked, uniqueStudents, registeredAt
      ] = await contract.getAllOrganizations();

      const orgsList = addresses.map((addr, i) => ({
        address: addr,
        name: names[i],
        email: emails[i],
        type: types[i],
        status: actives[i] ? 'actif' : 'révoqué',
        certificates: Number(totalIssued[i]),
        dateAdded: new Date(Number(registeredAt[i]) * 1000).toLocaleDateString('fr-FR'),
        registeredAt: Number(registeredAt[i])
      }));

      setOrganizations(orgsList);
      setLoading(false);
    } catch (err) {
      console.error("Erreur chargement données:", err);
      setLoading(false);
    }
  };

  useEffect(() => {
    if (contract) loadData();
  }, [contract]);

  // Copier adresse
  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedAddress(id);
    setTimeout(() => setCopiedAddress(null), 2000);
  };

  // Valider adresse Ethereum
  const validateAddress = (addr) => {
    if (!addr) return 'Adresse requise';
    if (!addr.startsWith('0x')) return 'Doit commencer par 0x';
    if (addr.length !== 42) return 'Doit faire 42 caractères';
    if (!/^0x[a-fA-F0-9]{40}$/.test(addr)) return 'Caractères invalides';
    return '';
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (field === 'address') {
      const error = validateAddress(value);
      setFormErrors(prev => ({ ...prev, address: error }));
    }
  };

  // Ajouter une organisation
  const handleSubmit = async (e) => {
    e.preventDefault();
    const addressError = validateAddress(formData.address);
    if (addressError || !formData.name || !formData.email) {
      setFormErrors({
        address: addressError,
        name: !formData.name ? 'Nom requis' : '',
        email: !formData.email ? 'Email requis' : ''
      });
      return;
    }

    try {
      setSubmitStatus({ type: 'loading', message: 'Envoi de la transaction...' });
      const tx = await contract.registerOrganization(
        formData.address,
        formData.name,
        formData.email,
        formData.type,
        formData.registeredAt
      );
      setSubmitStatus({ type: 'loading', message: 'Transaction en attente...', txHash: tx.hash });
      await tx.wait();

      setSubmitStatus({
        type: 'success',
        message: 'Organisation enregistrée avec succès !',
        txHash: tx.hash
      });

      await loadData(); // Recharge les données

      setTimeout(() => {
        setShowAddForm(false);
        setFormData({ address: '', name: '', email: '', type: 'Université', registeredAt: Math.floor(Date.now() / 1000) });
        setSubmitStatus(null);
        setFormErrors({});
      }, 3000);
    } catch (err) {
      console.error(err);
      setSubmitStatus({
        type: 'error',
        message: err.reason || err.error?.message || err.message || "Transaction refusée"
      });
    }
  };

  // RÉVOCATION INSTANTANÉE (mise à jour optimiste)
  const handleRevoke = async (orgAddress) => {
    if (!window.confirm(`Révoquer définitivement l'organisation ${orgAddress.slice(0, 8)}... ?`)) return;

    // Mise à jour optimiste (UI instantanée)
    setOrganizations(prev =>
      prev.map(org =>
        org.address === orgAddress
          ? { ...org, status: 'révoqué' }
          : org
      )
    );
    setStats(prev => ({ ...prev, activeOrgs: prev.activeOrgs - 1 }));
    setRevokingAddress(orgAddress);

    try {
      const tx = await contract.revokeOrganization(orgAddress);
      await tx.wait();
      // Succès → rien à faire, déjà mis à jour localement
    } catch (err) {
      console.error("Échec révocation:", err);

      // Rollback en cas d'erreur
      setOrganizations(prev =>
        prev.map(org =>
          org.address === orgAddress
            ? { ...org, status: 'actif' }
            : org
        )
      );
      setStats(prev => ({ ...prev, activeOrgs: prev.activeOrgs + 1 }));

      alert("Échec de la révocation : " + (err.reason || err.message || "Transaction refusée"));
    } finally {
      setRevokingAddress(null);
    }
  };

  const truncateAddress = (addr) => `${addr.slice(0, 6)}...${addr.slice(-4)}`;

  const getTypeColor = (type) => {
    const colors = {
      'Université': 'bg-blue-100 text-blue-700',
      'Formation': 'bg-purple-100 text-purple-700',
      'Organisme de formation': 'bg-purple-100 text-purple-700',
      'Centre': 'bg-orange-100 text-orange-700',
      'Centre de certification': 'bg-orange-100 text-orange-700',
      'Entreprise': 'bg-cyan-100 text-cyan-700'
    };
    return colors[type] || 'bg-gray-100 text-gray-700';
  };

  const filteredOrgs = organizations.filter(org => {
    const matchesSearch = org.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
      org.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = searchType === 'all' || org.type === searchType;
    return matchesSearch && matchesType;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-cyan-50 flex items-center justify-center">
        <div className="text-2xl font-bold text-blue-600">Chargement des données blockchain...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-cyan-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Administration - Gestion des Organisations</h1>
              <p className="text-sm text-gray-500 mt-1">Gérez les organisations autorisées à émettre des certificats</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="bg-gradient-to-r from-blue-600 to-cyan-600 px-5 py-3 rounded-lg cursor-pointer hover:from-blue-700 hover:to-cyan-700 transition-all">
  <button
    onClick={() => copyToClipboard(adminAddress, 'admin')}
    className="flex items-center space-x-2 text-white"
  >
    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
    <span className="text-sm font-mono">{truncateAddress(adminAddress)}</span>
    {copiedAddress === 'admin' ? (
      <Check className="w-4 h-4 text-green-300" />
    ) : (
      <Copy className="w-4 h-4 opacity-70 hover:opacity-100" />
    )}
  </button>
</div>
              <button onClick={onDisconnect} className="flex items-center space-x-2 px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 font-medium">
                <LogOut className="w-4 h-4" />
                <span>Déconnexion</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Stats */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm font-medium mb-1">Total Organisations</p>
                <p className="text-3xl font-bold text-gray-900">{stats.totalOrgs}</p>
              </div>
              <Building2 className="w-8 h-8 text-blue-600" />
            </div>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm font-medium mb-1">Organisations Actives</p>
                <p className="text-3xl font-bold text-gray-900">{stats.activeOrgs}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm font-medium mb-1">Total Certificats</p>
                <p className="text-3xl font-bold text-gray-900">{stats.totalCertificates}</p>
              </div>
              <Award className="w-8 h-8 text-purple-600" />
            </div>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm font-medium mb-1">Certificats Révoqués</p>
                <p className="text-3xl font-bold text-gray-900">{stats.revokedCertificates}</p>
              </div>
              <Ban className="w-8 h-8 text-red-600" />
            </div>
          </div>
        </div>

        {/* Liste des organisations */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0 mb-6">
              <h2 className="text-xl font-bold text-gray-900">Organisations Enregistrées</h2>
              <button
                onClick={() => setShowAddForm(true)}
                className="inline-flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-lg hover:from-blue-700 hover:to-cyan-700 font-medium shadow-md"
              >
                <Plus className="w-5 h-5" />
                <span>Ajouter une organisation</span>
              </button>
            </div>
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Rechercher par adresse ou nom..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              <select
                value={searchType}
                onChange={(e) => setSearchType(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
              >
                <option value="all">Tous les types</option>
                <option value="Université">Université</option>
                <option value="Organisme de formation">Organisme de formation</option>
                <option value="Centre de certification">Centre de certification</option>
                <option value="Entreprise">Entreprise</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Adresse</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Organisation</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Certificats</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Statut</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredOrgs.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-12 text-center text-gray-500">
                      Aucune organisation trouvée
                    </td>
                  </tr>
                ) : (
                  filteredOrgs.map((org) => (
                    <tr key={org.address} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <button
                          onClick={() => copyToClipboard(org.address, org.address)}
                          className="flex items-center space-x-2 font-mono text-sm text-gray-700 hover:text-blue-600"
                        >
                          <span>{truncateAddress(org.address)}</span>
                          {copiedAddress === org.address ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                        </button>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-semibold text-gray-900">{org.name}</p>
                          <p className="text-sm text-gray-500">{org.email}</p>
                          <p className="text-xs text-gray-400 mt-1">Ajouté le {org.dateAdded}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${getTypeColor(org.type)}`}>
                          {org.type}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-semibold text-gray-900">{org.certificates}</span>
                      </td>
                      <td className="px-6 py-4">
                        {org.status === 'actif' ? (
                          <span className="inline-flex items-center space-x-1 px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                            <CheckCircle className="w-4 h-4" />
                            <span>Actif</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center space-x-1 px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-medium">
                            <Ban className="w-4 h-4" />
                            <span>Révoqué</span>
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {org.status === 'actif' && (
                          <button
                            onClick={() => handleRevoke(org.address)}
                            disabled={revokingAddress === org.address}
                            className="px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                          >
                            {revokingAddress === org.address ? (
                              <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                <span>Révocation...</span>
                              </>
                            ) : (
                              'Révoquer'
                            )}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Modal Ajout Organisation */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h3 className="text-2xl font-bold text-gray-900">Ajouter une Organisation</h3>
              <button
                onClick={() => {
                  setShowAddForm(false);
                  setFormData({ address: '', name: '', email: '', type: 'Université' });
                  setFormErrors({});
                  setSubmitStatus(null);
                }}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-6 h-6 text-gray-500" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {submitStatus && (
                <div className={`p-4 rounded-lg border ${submitStatus.type === 'success' ? 'bg-green-50 border-green-200' : submitStatus.type === 'loading' ? 'bg-blue-50 border-blue-200' : 'bg-red-50 border-red-200'}`}>
                  <div className="flex items-start space-x-3">
                    {submitStatus.type === 'success' ? <CheckCircle className="w-5 h-5 text-green-600" /> :
                     submitStatus.type === 'loading' ? <div className="w-5 h-5 border-2 border-blue-600 rounded-full animate-spin" /> :
                     <AlertCircle className="w-5 h-5 text-red-600" />}
                    <div>
                      <p className={`font-medium ${submitStatus.type === 'success' ? 'text-green-800' : submitStatus.type === 'loading' ? 'text-blue-800' : 'text-red-800'}`}>
                        {submitStatus.message}
                      </p>
                      {submitStatus.txHash && (
                        <a
                          href={`https://sepolia.etherscan.io/tx/${submitStatus.txHash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-blue-600 hover:underline flex items-center gap-1 mt-1"
                        >
                          Voir sur Etherscan <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              )}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Adresse Ethereum *</label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  placeholder="0x..."
                  className={`w-full px-4 py-3 border rounded-lg font-mono ${formErrors.address ? 'border-red-300 bg-red-50' : 'border-gray-300'} focus:ring-2 focus:ring-blue-500 outline-none`}
                />
                {formErrors.address && <p className="mt-1 text-sm text-red-600">{formErrors.address}</p>}
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Nom *</label>
                <input type="text" value={formData.name} onChange={(e) => handleInputChange('name', e.target.value)} placeholder="Université de Tunis" className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Email *</label>
                <input type="email" value={formData.email} onChange={(e) => handleInputChange('email', e.target.value)} placeholder="contact@org.tn" className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Type *</label>
                <select value={formData.type} onChange={(e) => handleInputChange('type', e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white">
                  <option>Université</option>
                  <option>Organisme de formation</option>
                  <option>Centre de certification</option>
                  <option>Entreprise</option>
                </select>
              </div>
              <div className="flex space-x-4 pt-4">
                <button type="button" onClick={() => setShowAddForm(false)} className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-semibold">
                  Annuler
                </button>
                <button type="submit" className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-lg hover:from-blue-700 hover:to-cyan-700 font-semibold shadow-lg">
                  Enregistrer sur la blockchain
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}