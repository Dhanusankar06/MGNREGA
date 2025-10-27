import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useIntl } from 'react-intl';
import { FaVolumeUp, FaVolumeMute, FaHome, FaChartBar, FaInfoCircle } from 'react-icons/fa';
import { useAudio } from '../contexts/AudioContext';
import LanguageSelector from './LanguageSelector';

const Layout = ({ children }) => {
  const router = useRouter();
  const intl = useIntl();
  const { isAudioEnabled, toggleAudio } = useAudio();

  const navItems = [
    { href: '/', label: 'nav.home', icon: FaHome },
    { href: '/dashboard', label: 'nav.dashboard', icon: FaChartBar },
    { href: '/about', label: 'nav.about', icon: FaInfoCircle }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Government Identity Strip */}
      <div className="bg-gradient-to-r from-blue-900 to-blue-700 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 rounded-sm bg-white/20 flex items-center justify-center" aria-hidden="true">🏛️</div>
            <p className="text-xs md:text-sm tracking-wide">Government of India • Ministry of Rural Development</p>
          </div>
          <div className="hidden md:block text-xs text-blue-100">Public Information Portal</div>
        </div>
      </div>

      {/* Clean Header */}
      <header className="header sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center space-x-2">
              <div className="logo">
                MGNREGA LokDekho
              </div>
            </Link>

            {/* Navigation */}
            <nav className="hidden md:flex space-x-1">
              {navItems.map((item) => {
                const IconComponent = item.icon;
                const isActive = router.pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`nav-link ${isActive ? 'active' : ''}`}
                  >
                    <IconComponent className="w-4 h-4 mr-2" />
                    {intl.formatMessage({ id: item.label })}
                  </Link>
                );
              })}
            </nav>

            {/* Controls */}
            <div className="flex items-center gap-3">
              <LanguageSelector />
              <button
                onClick={toggleAudio}
                className="audio-btn"
                aria-label={intl.formatMessage({ 
                  id: isAudioEnabled ? 'audio.disable' : 'audio.enable' 
                })}
              >
                {isAudioEnabled ? <FaVolumeUp /> : <FaVolumeMute />}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>

      {/* Clean Footer */}
      <footer className="footer">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h3 className="title">MGNREGA LokDekho</h3>
              <p className="text">
                Empowering citizens with transparent access to MGNREGA data and insights.
              </p>
            </div>
            
            <div>
              <h3 className="title">Data Source</h3>
              <p className="text">
                Real-time data from Government of India's official MGNREGA portal.
              </p>
            </div>
            
            <div>
              <h3 className="title">Accessibility</h3>
              <p className="text">
                Designed for users with different literacy levels and abilities.
              </p>
            </div>
          </div>
          
          <div className="mt-8 pt-8 border-t border-gray-200 text-center">
            <p className="text-sm text-gray-500">
              © 2024 MGNREGA LokDekho. Built with accessibility in mind.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Layout;