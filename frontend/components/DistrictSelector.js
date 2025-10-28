import { useState, useEffect, useRef } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { useQuery } from 'react-query';
import axios from 'axios';
import { useAudio } from '../contexts/AudioContext';
import { fallbackMGNREGAData } from '../utils/fallbackMGNREGAData';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://mgnrega-eirq.onrender.com';

export default function DistrictSelector({ onSelect }) {
  const { formatMessage } = useLanguage();
  const { playAudio } = useAudio();
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef(null);
  const listRef = useRef(null);
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');

  // Debounce search term to avoid spamming API
  useEffect(() => {
    const id = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm.trim());
    }, 300);
    return () => clearTimeout(id);
  }, [searchTerm]);

  // Fetch districts with fallback support
  const { data: districts, isLoading, error } = useQuery(
    ['districts', debouncedSearchTerm],
    async () => {
      try {
        console.log('Fetching districts from:', `${API_URL}/api/districts`);
        const response = await axios.get(`${API_URL}/api/districts`, {
          params: {
            limit: 50,
            ...(debouncedSearchTerm && { search: debouncedSearchTerm })
          },
          timeout: 10000 // 10 second timeout
        });
        
        console.log('Districts API response:', response.data);
        
        if (response.data && response.data.districts) {
          return response.data.districts;
        } else {
          console.error('Unexpected API response structure:', response.data);
          return fallbackMGNREGAData.districts;
        }
      } catch (apiError) {
        console.log('API failed, using fallback MGNREGA data:', apiError.message);
        // Return fallback data when API fails
        return fallbackMGNREGAData.districts;
      }
    },
    {
      enabled: true,
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 1, // Reduce retries to fail faster to fallback
      retryDelay: 1000,
    }
  );

  // Filter districts based on search term
  const filteredDistricts = districts?.filter(district => {
    const term = searchTerm.toLowerCase();
    return (
      district.name.toLowerCase().includes(term) ||
      (district.state_name || '').toLowerCase().includes(term)
    );
  }) || [];

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isOpen) return;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex(prev => 
            prev < filteredDistricts.length - 1 ? prev + 1 : prev
          );
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex(prev => prev > 0 ? prev - 1 : -1);
          break;
        case 'Enter':
          e.preventDefault();
          if (selectedIndex >= 0 && filteredDistricts[selectedIndex]) {
            handleSelect(filteredDistricts[selectedIndex]);
          }
          break;
        case 'Escape':
          setIsOpen(false);
          setSelectedIndex(-1);
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, selectedIndex, filteredDistricts]);

  // Scroll selected item into view
  useEffect(() => {
    if (selectedIndex >= 0 && listRef.current) {
      const selectedElement = listRef.current.children[selectedIndex];
      if (selectedElement) {
        selectedElement.scrollIntoView({
          block: 'nearest',
          behavior: 'smooth'
        });
      }
    }
  }, [selectedIndex]);

  const handleInputChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    setIsOpen(true);
    setSelectedIndex(-1);
  };

  const handleSelect = (district) => {
    setSearchTerm(district.name);
    setIsOpen(false);
    setSelectedIndex(-1);
    onSelect(district);
    playAudio('district_selected', { district_name: district.name });
  };

  const handleInputFocus = () => {
    setIsOpen(true);
    playAudio('district_search_help');
  };

  // Show fallback data info instead of error (since we have fallback)
  const showFallbackInfo = error && districts && districts.length > 0;
  
  if (error && (!districts || districts.length === 0)) {
    console.error('Districts loading error:', error);
    return (
      <div className="error-card">
        <div className="error-icon">❌</div>
        <h3 className="error-title">
          जानकारी लोड नहीं हो सकी
        </h3>
        <p className="error-message">
          कृपया अपना इंटरनेट कनेक्शन चेक करें
        </p>
        <div className="text-sm text-gray-500 mb-4">
          API URL: {API_URL}<br/>
          Error: {error.message}
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => window.location.reload()}
            className="btn btn-primary"
          >
            दोबारा कोशिश करें
          </button>
          <a 
            href="/debug" 
            className="btn btn-secondary"
            target="_blank"
          >
            Debug Page
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Instructions */}
      <div className="text-center p-4 bg-blue-50 rounded-2xl border-2 border-blue-200">
        <div className="text-4xl mb-3">🔍</div>
        <h3 className="text-xl font-bold text-blue-800 mb-2">
          अपना जिला खोजें
        </h3>
        <p className="text-blue-600 text-lg">
          नीचे बॉक्स में अपने जिले का नाम लिखें
        </p>
        <button 
          className="audio-btn-small mt-3"
          onClick={() => playAudio('district_search_help')}
          aria-label="खोज की मदद सुनें"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.617.816L4.846 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.846l3.537-3.816a1 1 0 011.617.816zM16 8a2 2 0 11-4 0 2 2 0 014 0zm-2 6a4 4 0 100-8 4 4 0 000 8z" clipRule="evenodd" />
          </svg>
        </button>
      </div>

      {/* Large Search Input */}
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={searchTerm}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          placeholder="जिले का नाम लिखें (जैसे: आगरा, दिल्ली)"
          className="w-full px-6 py-6 text-xl border-4 border-blue-300 rounded-2xl focus:border-blue-500 focus:ring-4 focus:ring-blue-200 focus:outline-none bg-white shadow-lg font-semibold"
          aria-label="जिले का नाम खोजें"
          aria-expanded={isOpen}
          aria-haspopup="listbox"
          role="combobox"
        />
        
        {/* Fallback Data Indicator */}
        {showFallbackInfo && (
          <div className="absolute -top-12 left-0 right-0">
            <div className="bg-green-100 border border-green-300 rounded-lg px-3 py-2 text-sm text-green-700 flex items-center">
              <span className="mr-2">✅</span>
              <span>सरकारी डेटा उपलब्ध है (ऑफलाइन मोड)</span>
            </div>
          </div>
        )}
        
        {/* Large Search Icon */}
        <div className="absolute right-6 top-1/2 transform -translate-y-1/2">
          {isLoading ? (
            <div className="animate-spin rounded-full h-8 w-8 border-b-4 border-blue-600"></div>
          ) : (
            <svg className="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          )}
        </div>
      </div>

      {/* Large Dropdown List */}
      {isOpen && (
        <div className="bg-white border-4 border-blue-200 rounded-2xl shadow-2xl max-h-96 overflow-y-auto">
          {isLoading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-blue-600 mx-auto mb-4"></div>
              <p className="text-xl text-gray-600 font-semibold">
                जिले खोजे जा रहे हैं...
              </p>
            </div>
          ) : filteredDistricts.length > 0 ? (
            <ul ref={listRef} role="listbox" className="py-4">
              {filteredDistricts.slice(0, 10).map((district, index) => (
                <li
                  key={district.id}
                  role="option"
                  aria-selected={index === selectedIndex}
                  className={`px-6 py-4 cursor-pointer transition-all duration-300 border-b border-gray-100 hover:bg-blue-50 ${
                    index === selectedIndex
                      ? 'bg-blue-100 border-blue-300 scale-[1.02]'
                      : ''
                  }`}
                  onClick={() => handleSelect(district)}
                  onMouseEnter={() => setSelectedIndex(index)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="text-3xl mr-4">🏛️</div>
                      <div>
                        <div className="text-xl font-bold text-gray-900">
                          {district.name}
                        </div>
                        <div className="text-lg text-gray-600">
                          {district.state_name || 'भारत'}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSelect(district);
                      }}
                      className="btn btn-primary"
                    >
                      <span className="mr-2">✅</span>
                      चुनें
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          ) : searchTerm ? (
            <div className="p-8 text-center">
              <div className="text-6xl mb-4">😔</div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">
                कोई जिला नहीं मिला
              </h3>
              <p className="text-lg text-gray-600">
                कृपया दूसरा नाम लिखकर कोशिश करें
              </p>
            </div>
          ) : (
            <div className="p-8 text-center">
              <div className="text-6xl mb-4">📝</div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">
                जिले का नाम लिखें
              </h3>
              <p className="text-lg text-gray-600">
                ऊपर बॉक्स में अपने जिले का नाम टाइप करें
              </p>
            </div>
          )}
        </div>
      )}

      {/* Click outside to close */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Popular Districts Quick Select */}
      <div className="mt-8">
        <h4 className="text-lg font-bold text-gray-800 mb-4 text-center">
          🔥 लोकप्रिय जिले
        </h4>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {districts?.slice(0, 6).map((district) => (
            <button
              key={district.id}
              onClick={() => handleSelect(district)}
              className="p-3 bg-white border-2 border-gray-200 rounded-xl hover:border-blue-400 hover:bg-blue-50 transition-all duration-300 text-center hover:scale-105"
            >
              <div className="text-2xl mb-1">🏛️</div>
              <div className="font-semibold text-gray-800 text-sm">
                {district.name}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}