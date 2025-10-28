import Link from 'next/link';
import { useRouter } from 'next/router';
import { useLanguage } from '../contexts/LanguageContext';
import { useAudio } from '../contexts/AudioContext';
import LanguageSelector from './LanguageSelector';
import { 
  MdHome, 
  MdInfo, 
  MdVolumeUp, 
  MdVolumeOff,
  MdAccountBalance,
  MdPublic,
  MdAccessibility,
  MdBarChart,
  MdFavorite
} from 'react-icons/md';
import { 
  IoGlobeOutline, 
  IoHeartOutline,
  IoShieldCheckmarkOutline 
} from 'react-icons/io5';
import { 
  FaFlag, 
  FaUsers, 
  FaHandsHelping 
} from 'react-icons/fa';

const Layout = ({ children }) => {
  const router = useRouter();
  const { formatMessage } = useLanguage();
  const { isAudioEnabled, toggleAudio, playAudio } = useAudio();

  const navItems = [
    { href: '/', label: 'मुख्य पेज', icon: MdHome },
    { href: '/about', label: 'जानकारी', icon: MdInfo }
  ];

  return (
    <div className="min-h-screen">
      {/* Enhanced Government Identity Strip */}
      <div className="bg-gradient-to-r from-orange-500 via-white to-green-500 border-b-4 border-blue-600 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="flex items-center gap-4 mb-2 md:mb-0">
              <div className="flex items-center">
                <FaFlag className="w-8 h-8 text-orange-600 mr-2" />
                <span className="text-4xl">🇮🇳</span>
              </div>
              <div>
                <div className="flex items-center">
                  <MdAccountBalance className="w-6 h-6 text-blue-800 mr-2" />
                  <p className="text-lg font-bold text-gray-900">भारत सरकार</p>
                </div>
                <p className="text-sm text-gray-700 ml-8">ग्रामीण विकास मंत्रालय</p>
              </div>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center mb-1">
                <MdPublic className="w-5 h-5 text-blue-800 mr-2" />
                <p className="text-sm font-semibold text-blue-800">सार्वजनिक सूचना पोर्टल</p>
              </div>
              <p className="text-xs text-gray-600">Public Information Portal</p>
            </div>
          </div>
        </div>
      </div>

      {/* Large, Accessible Header */}
      <header className="bg-white shadow-2xl sticky top-0 z-50 border-b-4 border-blue-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            {/* Enhanced Logo with Icons */}
            <Link href="/" className="flex items-center space-x-4 hover:scale-105 transition-transform duration-300 group">
              <div className="relative">
                <MdAccountBalance className="w-12 h-12 text-blue-600 group-hover:text-blue-700 transition-colors duration-300" />
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                  <IoShieldCheckmarkOutline className="w-3 h-3 text-white" />
                </div>
              </div>
              <div>
                <div className="text-3xl font-black bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent group-hover:from-blue-700 group-hover:to-green-700 transition-all duration-300">
                  मनरेगा लोकदेखो
                </div>
                <div className="text-sm text-gray-600 font-medium flex items-center">
                  <IoGlobeOutline className="w-4 h-4 mr-1" />
                  MGNREGA LokDekho
                </div>
              </div>
            </Link>

            {/* Enhanced Navigation with React Icons */}
            <nav className="hidden md:flex space-x-4">
              {navItems.map((item) => {
                const isActive = router.pathname === item.href;
                const IconComponent = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center px-6 py-3 rounded-2xl font-semibold text-lg transition-all duration-300 hover:scale-105 group ${
                      isActive 
                        ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg' 
                        : 'bg-gray-100 text-gray-700 hover:bg-gradient-to-r hover:from-blue-100 hover:to-purple-100 hover:text-blue-800'
                    }`}
                  >
                    <IconComponent className={`w-6 h-6 mr-3 transition-transform duration-300 group-hover:scale-110 ${
                      isActive ? 'text-white' : 'text-blue-600'
                    }`} />
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            {/* Enhanced Controls */}
            <div className="flex items-center gap-4">
              <LanguageSelector />
              <button
                onClick={toggleAudio}
                className={`flex items-center justify-center w-12 h-12 rounded-xl shadow-lg border-2 transition-all duration-300 hover:scale-110 focus:outline-none focus:ring-4 focus:ring-offset-2 ${
                  isAudioEnabled 
                    ? 'bg-gradient-to-r from-green-500 to-green-600 text-white border-green-500 hover:from-green-600 hover:to-green-700 focus:ring-green-300' 
                    : 'bg-gradient-to-r from-gray-400 to-gray-500 text-white border-gray-400 hover:from-gray-500 hover:to-gray-600 focus:ring-gray-300'
                }`}
                aria-label={isAudioEnabled ? 'आवाज़ बंद करें' : 'आवाज़ चालू करें'}
              >
                {isAudioEnabled ? (
                  <MdVolumeUp className="w-6 h-6" />
                ) : (
                  <MdVolumeOff className="w-6 h-6" />
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Enhanced Mobile Navigation */}
      <div className="md:hidden bg-white border-b-2 border-gray-200 px-4 py-3 shadow-lg">
        <div className="flex justify-center space-x-4">
          {navItems.map((item) => {
            const isActive = router.pathname === item.href;
            const IconComponent = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center px-4 py-3 rounded-xl font-semibold transition-all duration-300 hover:scale-105 ${
                  isActive 
                    ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gradient-to-r hover:from-blue-100 hover:to-purple-100'
                }`}
              >
                <IconComponent className={`w-6 h-6 mb-1 ${isActive ? 'text-white' : 'text-blue-600'}`} />
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

      {/* Enhanced Footer with React Icons */}
      <footer className="bg-gradient-to-r from-blue-800 via-purple-800 to-green-800 text-white py-12 relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10">
            <MdAccountBalance className="w-20 h-20" />
          </div>
          <div className="absolute top-20 right-20">
            <FaUsers className="w-16 h-16" />
          </div>
          <div className="absolute bottom-10 left-1/3">
            <MdBarChart className="w-24 h-24" />
          </div>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center md:text-left">
            <div className="group">
              <div className="flex items-center justify-center md:justify-start mb-4">
                <MdAccountBalance className="w-12 h-12 text-blue-300 group-hover:text-blue-200 transition-colors duration-300" />
              </div>
              <h3 className="text-2xl font-bold mb-3 flex items-center justify-center md:justify-start">
                मनरेगा लोकदेखो
                <IoShieldCheckmarkOutline className="w-6 h-6 ml-2 text-green-400" />
              </h3>
              <p className="text-lg opacity-90 leading-relaxed">
                गांव के लोगों के लिए मनरेगा की जानकारी आसान भाषा में
              </p>
            </div>
            
            <div className="group">
              <div className="flex items-center justify-center md:justify-start mb-4">
                <MdBarChart className="w-12 h-12 text-green-300 group-hover:text-green-200 transition-colors duration-300" />
              </div>
              <h3 className="text-2xl font-bold mb-3 flex items-center justify-center md:justify-start">
                डेटा का स्रोत
                <IoShieldCheckmarkOutline className="w-6 h-6 ml-2 text-blue-400" />
              </h3>
              <p className="text-lg opacity-90 leading-relaxed">
                भारत सरकार के data.gov.in से सीधी और सच्ची जानकारी
              </p>
            </div>
            
            <div className="group">
              <div className="flex items-center justify-center md:justify-start mb-4">
                <MdAccessibility className="w-12 h-12 text-purple-300 group-hover:text-purple-200 transition-colors duration-300" />
              </div>
              <h3 className="text-2xl font-bold mb-3 flex items-center justify-center md:justify-start">
                सभी के लिए
                <FaHandsHelping className="w-6 h-6 ml-2 text-yellow-400" />
              </h3>
              <p className="text-lg opacity-90 leading-relaxed">
                आवाज़ की सुविधा और आसान भाषा के साथ बनाया गया
              </p>
            </div>
          </div>
          
          <div className="mt-12 pt-8 border-t-2 border-white/20">
            <div className="flex flex-col md:flex-row items-center justify-between">
              <div className="flex items-center mb-4 md:mb-0">
                <IoShieldCheckmarkOutline className="w-6 h-6 mr-2 text-green-400" />
                <p className="text-lg">
                  © 2024 मनरेगा लोकदेखो • सभी अधिकार सुरक्षित
                </p>
              </div>
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => playAudio('footer_help')}
                  className="flex items-center px-4 py-2 bg-white/20 rounded-lg hover:bg-white/30 transition-all duration-300 hover:scale-105 focus:outline-none focus:ring-4 focus:ring-white/30"
                  aria-label="फुटर की जानकारी सुनें"
                >
                  <MdVolumeUp className="w-5 h-5 mr-2" />
                  <span className="text-sm">सुनें</span>
                </button>
                <div className="flex items-center text-sm opacity-75">
                  <span>Made with</span>
                  <MdFavorite className="w-4 h-4 mx-1 text-red-400" />
                  <span>for Rural India</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Layout;