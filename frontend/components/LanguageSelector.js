import { useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { useAudio } from '../contexts/AudioContext';

export default function LanguageSelector() {
  const { language, languages, changeLanguage } = useLanguage();
  const { playAudio } = useAudio();
  const [isOpen, setIsOpen] = useState(false);

  const handleLanguageChange = (langCode) => {
    setIsOpen(false);
    changeLanguage(langCode);
    
    // Play audio confirmation
    const selectedLang = languages.find(lang => lang.code === langCode);
    playAudio('language_changed', { language: selectedLang.name });
  };

  return (
    <div className="relative">
      {/* Large, Accessible Language Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="language-selector"
        aria-label="भाषा चुनें / Select Language"
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <span className="text-2xl mr-2">{language.flag}</span>
        <span className="font-bold text-lg">{language.name}</span>
        <svg 
          className={`w-5 h-5 ml-2 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)}
            aria-hidden="true"
          />
          
          {/* Large Dropdown */}
          <div className="absolute right-0 mt-4 w-72 bg-white rounded-2xl shadow-2xl border-4 border-blue-200 z-50">
            <div className="p-4">
              <div className="text-center mb-4">
                <h3 className="text-xl font-bold text-gray-800 mb-2">
                  🌐 भाषा चुनें
                </h3>
                <p className="text-sm text-gray-600">
                  Select Language / زبان منتخب کریں
                </p>
              </div>
              
              <div className="space-y-2">
                {languages.map((lang) => (
                  <button
                    type="button"
                    key={lang.code}
                    onClick={() => handleLanguageChange(lang.code)}
                    className={`w-full p-4 rounded-xl border-2 transition-all duration-300 hover:scale-105 ${
                      lang.code === language.code 
                        ? 'border-blue-500 bg-blue-50 shadow-lg scale-105' 
                        : 'border-gray-200 bg-white hover:border-blue-300 hover:bg-blue-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <span className="text-3xl mr-4">{lang.flag}</span>
                        <div className="text-left">
                          <div className="font-bold text-lg text-gray-800">
                            {lang.name}
                          </div>
                          <div className="text-sm text-gray-600">
                            {lang.description}
                          </div>
                        </div>
                      </div>
                      
                      {lang.code === language.code && (
                        <div className="text-2xl text-blue-600">
                          ✅
                        </div>
                      )}
                    </div>
                  </button>
                ))}
              </div>
              
              {/* Audio Help */}
              <div className="mt-4 text-center">
                <button
                  onClick={() => playAudio('language_help')}
                  className="audio-btn-small"
                  aria-label="भाषा चुनने की मदद सुनें"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.617.816L4.846 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.846l3.537-3.816a1 1 0 011.617.816zM16 8a2 2 0 11-4 0 2 2 0 014 0zm-2 6a4 4 0 100-8 4 4 0 000 8z" clipRule="evenodd" />
                  </svg>
                </button>
                <p className="text-xs text-gray-500 mt-1">
                  मदद के लिए क्लिक करें
                </p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}