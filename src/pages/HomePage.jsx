import { Shield, Award, CheckCircle } from 'lucide-react';

function HomePage({ onConnectWallet, onVerifyCertificate }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50">
      <nav className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-gradient-to-br from-blue-600 to-cyan-600 p-2 rounded-lg">
                <Shield className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                  CertiChain
                </h1>
                <p className="text-xs text-gray-500">Certification sur Blockchain</p>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-16">
        <div className="text-center mb-16">
          <div className="inline-flex items-center space-x-2 bg-blue-100 text-blue-700 px-4 py-2 rounded-full text-sm font-medium mb-6">
            <Award className="w-4 h-4" />
            <span>Plateforme de Certification Décentralisée</span>
          </div>

          <h2 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
            Vos compétences certifiées
            <br />
            <span className="bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
              sur la blockchain
            </span>
          </h2>

          <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-12">
            Une solution sécurisée, transparente et infalsifiable pour la certification
            des compétences professionnelles et académiques.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <button
              onClick={onConnectWallet}
              className="group relative px-8 py-4 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-xl font-semibold text-lg shadow-xl hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-200 flex items-center space-x-3"
            >
              <svg className="w-6 h-6" viewBox="0 0 40 40" fill="none">
                <path d="M37.5 20C37.5 29.665 29.665 37.5 20 37.5C10.335 37.5 2.5 29.665 2.5 20C2.5 10.335 10.335 2.5 20 2.5C29.665 2.5 37.5 10.335 37.5 20Z" fill="white" fillOpacity="0.2"/>
                <path d="M20 5L19.375 7.1875L15 22.5L17.5 25L20 22.5L22.5 25L25 22.5L20.625 7.1875L20 5Z" fill="white"/>
                <path d="M15 27.5L20 30L25 27.5L22.5 25L20 27.5L17.5 25L15 27.5Z" fill="white"/>
              </svg>
              <span>Connecter avec MetaMask</span>
            </button>

            <button
              onClick={onVerifyCertificate}
              className="px-8 py-4 bg-white text-gray-700 rounded-xl font-semibold text-lg border-2 border-gray-200 hover:border-blue-600 hover:text-blue-600 transform hover:-translate-y-1 transition-all duration-200 flex items-center space-x-3 shadow-lg"
            >
              <CheckCircle className="w-6 h-6" />
              <span>Vérifier un certificat</span>
            </button>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mt-24">
          <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow duration-300 border border-gray-100">
            <div className="bg-blue-100 w-14 h-14 rounded-xl flex items-center justify-center mb-6">
              <Shield className="w-8 h-8 text-blue-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">
              Sécurité Maximale
            </h3>
            <p className="text-gray-600 leading-relaxed">
              Vos certificats sont enregistrés sur la blockchain Ethereum,
              garantissant leur authenticité et leur immuabilité.
            </p>
          </div>

          <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow duration-300 border border-gray-100">
            <div className="bg-cyan-100 w-14 h-14 rounded-xl flex items-center justify-center mb-6">
              <Award className="w-8 h-8 text-cyan-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">
              Vérification Instantanée
            </h3>
            <p className="text-gray-600 leading-relaxed">
              Vérifiez l'authenticité de n'importe quel certificat en quelques
              secondes grâce à la technologie blockchain.
            </p>
          </div>

          <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow duration-300 border border-gray-100">
            <div className="bg-green-100 w-14 h-14 rounded-xl flex items-center justify-center mb-6">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">
              Reconnaissance Universelle
            </h3>
            <p className="text-gray-600 leading-relaxed">
              Des certificats reconnus par les organisations du monde entier,
              accessibles partout et à tout moment.
            </p>
          </div>
        </div>

        <div className="mt-24 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-3xl p-12 text-center text-white shadow-2xl">
          <h3 className="text-3xl font-bold mb-4">
            Prêt à sécuriser vos certifications ?
          </h3>
          <p className="text-xl text-blue-100 mb-8">
            Rejoignez des milliers d'organisations et d'utilisateurs qui font confiance à CertiChain
          </p>
          <button
            onClick={onConnectWallet}
            className="px-8 py-4 bg-white text-blue-600 rounded-xl font-semibold text-lg hover:bg-blue-50 transform hover:-translate-y-1 transition-all duration-200 shadow-xl"
          >
            Commencer maintenant
          </button>
        </div>
      </main>

      <footer className="bg-gray-900 text-gray-300 mt-24">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-3 mb-4 md:mb-0">
              <div className="bg-gradient-to-br from-blue-600 to-cyan-600 p-2 rounded-lg">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold text-white">CertiChain</span>
            </div>
            <p className="text-sm text-gray-400">
              © 2024 CertiChain. Propulsé par Ethereum.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default HomePage;
