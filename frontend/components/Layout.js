import Link from 'next/link';
import { useRouter } from 'next/router';
import { useLanguage } from '../contexts/LanguageContext';
import { useAudio } from '../contexts/AudioContext';
import LanguageSelector from './LanguageSelector';

const Layout = ({ children }) => {
  const router = useRouter();
  const { formatMessage } = useLanguage();
  const { isAudioEnabled, toggleAudio, playAudio } = useAudio();

  const navItems = [
    { href: '/', label: 'मुख्य पेज', icon: '🏠' },
    { href: '/about', label: 'जानकारी', icon: 'ℹ️' }
  ];

  return (
    <div className="min-h-screen">
      {/* Government Identity Strip - More Prominent */}
      <div className="bg-gradient-to-r from-orange-600 via-white to-green-600 text-gray-800 border-b-4 border-blue-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="flex items-center gap-4 mb-2 md:mb-0">
              <div className="text-4xl">🇮🇳</div>
              <div>
                <p className="text-lg font-bold text-gray-900">भारत सरकार</p>
                <p className="text-sm text-gray-700">ग्रामीण विकास मंत्रालय</p>
              </div>
            </div>
            <div className="text-center">
              <p className="text-sm font-semibold text-blue-800">सार्वजनिक सूचना पोर्टल</p>
              <p className="text-xs text-gray-600">Public Information Portal</p>
            </div>
          </div>
        </div>
      </div>

      {/* Large, Accessible Header */}
      <header className="bg-white shadow-2xl sticky top-0 z-50 border-b-4 border-blue-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            {/* Large Logo */}
            <Link href="/" className="flex items-center space-x-4 hover:scale-105 transition-transform duration-300">
              <div className="text-5xl">🏛️</div>
              <div>
                <div className="text-3xl font-black bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">
                  मनरेगा लोकदेखो
                </div>
                <div className="text-sm text-gray-600 font-medium">
                  MGNREGA LokDekho
                </div>
              </div>
            </Link>

            {/* Large Navigation */}
            <nav className="hidden md:flex space-x-4">
              {navItems.map((item) => {
                const isActive = router.pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center px-6 py-3 rounded-2xl font-semibold text-lg transition-all duration-300 hover:scale-105 ${
                      isActive 
                        ? 'bg-blue-600 text-white shadow-lg' 
                        : 'bg-gray-100 text-gray-700 hover:bg-blue-100'
                    }`}
                  >
                    <span className="text-2xl mr-3">{item.icon}</span>
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            {/* Large Controls */}
            <div className="flex items-center gap-4">
              <LanguageSelector />
              <button
                onClick={toggleAudio}
                className={`audio-btn ${isAudioEnabled ? 'bg-green-500' : 'bg-gray-400'}`}
                aria-label={isAudioEnabled ? 'आवाज़ बंद करें' : 'आवाज़ चालू करें'}
              >
                {isAudioEnabled ? (
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.617.816L4.846 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.846l3.537-3.816a1 1 0 011.617.816zM16 8a2 2 0 11-4 0 2 2 0 014 0zm-2 6a4 4 0 100-8 4 4 0 000 8z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.617.816L4.846 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.846l3.537-3.816a1 1 0 011.617.816zM13.254 5.254a.5.5 0 00-.708.708L14.293 7.5H13a.5.5 0 000 1h1.293l-1.747 1.538a.5.5 0 00.708.708L15 9l1.746 1.746a.5.5 0 00.708-.708L15.707 8.5H17a.5.5 0 000-1h-1.293l1.747-1.538a.5.5 0 00-.708-.708L15 7l-1.746-1.746z" clipRule="evenodd" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Navigation */}
      <div className="md:hidden bg-white border-b-2 border-gray-200 px-4 py-3">
        <div className="flex justify-center space-x-4">
          {navItems.map((item) => {
            const isActive = router.pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center px-4 py-2 rounded-xl font-semibold transition-all duration-300 ${
                  isActive 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-100 text-gray-700'
                }`}
              >
                <span className="text-xl mb-1">{item.icon}</span>
                <span className="text-sm">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Main Content */}
      <main className="min-h-screen">
        {children}
      </main>

      {/* Rural-Friendly Footer */}
      <footer className="bg-gradient-to-r from-blue-800 to-green-800 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center md:text-left">
            <div>
              <div className="text-4xl mb-4">🏛️</div>
              <h3 className="text-2xl font-bold mb-3">मनरेगा लोकदेखो</h3>
              <p className="text-lg opacity-90 leading-relaxed">
                गांव के लोगों के लिए मनरेगा की जानकारी आसान भाषा में
              </p>
            </div>
            
            <div>
              <div className="text-4xl mb-4">📊</div>
              <h3 className="text-2xl font-bold mb-3">डेटा का स्रोत</h3>
              <p className="text-lg opacity-90 leading-relaxed">
                भारत सरकार के data.gov.in से सीधी और सच्ची जानकारी
              </p>
            </div>
            
            <div>
              <div className="text-4xl mb-4">♿</div>
              <h3 className="text-2xl font-bold mb-3">सभी के लिए</h3>
              <p className="text-lg opacity-90 leading-relaxed">
                आवाज़ की सुविधा और आसान भाषा के साथ बनाया गया
              </p>
            </div>
          </div>
          
          <div className="mt-12 pt-8 border-t-2 border-white/20 text-center">
            <div className="flex flex-col md:flex-row items-center justify-between">
              <p className="text-lg mb-4 md:mb-0">
                © 2024 मनरेगा लोकदेखो • सभी अधिकार सुरक्षित
              </p>
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => playAudio('footer_help')}
                  className="audio-btn-small"
                  aria-label="फुटर की जानकारी सुनें"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.617.816L4.846 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.846l3.537-3.816a1 1 0 011.617.816zM16 8a2 2 0 11-4 0 2 2 0 014 0zm-2 6a4 4 0 100-8 4 4 0 000 8z" clipRule="evenodd" />
                  </svg>
                </button>
                <span className="text-sm opacity-75">Made with ❤️ for Rural India</span>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Layout;