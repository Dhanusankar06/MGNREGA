import { useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { useAudio } from '../contexts/AudioContext';
import { 
  MdLanguage, 
  MdKeyboardArrowDown, 
  MdVolumeUp, 
  MdCheck,
  MdTranslate 
} from 'react-icons/md';
import { IoGlobeOutline } from 'react-icons/io5';

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
      {/* Enhanced Language Button with React Icons */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center px-4 py-3 bg-white rounded-xl shadow-lg border-2 border-gray-200 hover:border-blue-300 hover:shadow-xl transition-all duration-300 hover:scale-105 focus:outline-none focus:ring-4 focus:ring-blue-300 focus:ring-offset-2"
        aria-label="भाषा चुनें / Select Language"
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <IoGlobeOutline className="w-6 h-6 text-blue-600 mr-2" />
        <span className="text-2xl mr-2">{language.flag}</span>
        <span className="font-bold text-lg text-gray-800">{language.name}</span>
        <MdKeyboardArrowDown 
          className={`w-6 h-6 ml-2 text-gray-600 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} 
        />
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)}
            aria-hidden="true"
          />
          
          {/* Enhanced Dropdown */}
          <div className="absolute right-0 mt-4 w-80 bg-white rounded-2xl shadow-2xl border-2 border-gray-200 z-50 overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6">
              <div className="flex items-center justify-center mb-2">
                <MdTranslate className="w-8 h-8 mr-3" />
                <h3 className="text-2xl font-bold">
                  भाषा चुनें
                </h3>
              </div>
              <p className="text-center text-blue-100 text-sm">
                Select Language / زبان منتخب کریں
              </p>
            </div>
            
            {/* Language Options */}
            <div className="p-4 space-y-3 max-h-80 overflow-y-auto">
              {languages.map((lang) => (
                <button
                  type="button"
                  key={lang.code}
                  onClick={() => handleLanguageChange(lang.code)}
                  className={`w-full p-4 rounded-xl border-2 transition-all duration-300 hover:scale-[1.02] group ${
                    lang.code === language.code 
                      ? 'border-blue-500 bg-gradient-to-r from-blue-50 to-purple-50 shadow-lg scale-[1.02]' 
                      : 'border-gray-200 bg-white hover:border-blue-300 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 hover:shadow-md'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <span className="text-4xl mr-4 group-hover:scale-110 transition-transform duration-300">
                        {lang.flag}
                      </span>
                      <div className="text-left">
                        <div className="font-bold text-lg text-gray-800 group-hover:text-blue-700 transition-colors duration-300">
                          {lang.name}
                        </div>
                        <div className="text-sm text-gray-600 group-hover:text-blue-600 transition-colors duration-300">
                          {lang.description}
                        </div>
                      </div>
                    </div>
                    
                    {lang.code === language.code && (
                      <div className="flex items-center justify-center w-8 h-8 bg-blue-600 rounded-full">
                        <MdCheck className="w-5 h-5 text-white" />
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>
            
            {/* Footer with Audio Help */}
            <div className="bg-gray-50 p-4 border-t border-gray-200">
              <div className="flex items-center justify-center">
                <button
                  onClick={() => playAudio('language_help')}
                  className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-300 hover:scale-105 focus:outline-none focus:ring-4 focus:ring-blue-300"
                  aria-label="भाषा चुनने की मदद सुनें"
                >
                  <MdVolumeUp className="w-5 h-5 mr-2" />
                  <span className="text-sm font-medium">मदद सुनें</span>
                </button>
              </div>
              <p className="text-xs text-gray-500 text-center mt-2">
                भाषा बदलने की मदद के लिए क्लिक करें
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}