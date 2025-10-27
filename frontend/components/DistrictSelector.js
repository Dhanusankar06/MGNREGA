import { useState, useEffect, useRef } from 'react';
import { useIntl } from 'react-intl';
import { useQuery } from 'react-query';
import axios from 'axios';

import LoadingSpinner from './LoadingSpinner';
import { useAudio } from '../contexts/AudioContext';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export default function DistrictSelector({ onSelect }) {
  const intl = useIntl();
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

  // Fetch districts with search
  const { data: districts, isLoading, error } = useQuery(
    ['districts', debouncedSearchTerm],
    async () => {
      const response = await axios.get(`${API_URL}/api/districts`, {
        params: {
          limit: 50,
          ...(debouncedSearchTerm && { search: debouncedSearchTerm })
        }
      });
      return response.data.districts;
    },
    {
      enabled: true,
      staleTime: 5 * 60 * 1000, // 5 minutes
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
  };

  const handleInputFocus = () => {
    setIsOpen(true);
    playAudio('district_search_help');
  };

  if (error) {
    return (
      <div className="card text-center p-8">
        <div className="text-error-600 mb-4">
          <svg className="w-12 h-12 mx-auto" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          {intl.formatMessage({ id: 'error.data_load' })}
        </h3>
        <p className="text-gray-600 mb-4">
          {intl.formatMessage({ id: 'error.network' })}
        </p>
        <button 
          onClick={() => window.location.reload()}
          className="btn-primary"
        >
          {intl.formatMessage({ id: 'error.try_again' })}
        </button>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Search Input */}
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={searchTerm}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          placeholder={intl.formatMessage({ id: 'district.selector.placeholder' })}
          className="w-full px-4 py-4 text-lg border-2 border-gray-300 rounded-lg focus:border-primary-500 focus:ring-2 focus:ring-primary-200 focus:outline-none"
          aria-label={intl.formatMessage({ id: 'district.selector.placeholder' })}
          aria-expanded={isOpen}
          aria-haspopup="listbox"
          role="combobox"
        />
        
        {/* Search Icon */}
        <div className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400">
          {isLoading ? (
            <LoadingSpinner size="small" />
          ) : (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          )}
        </div>
      </div>

      {/* Dropdown List */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-2 bg-white border-2 border-gray-200 rounded-lg shadow-xl max-h-80 overflow-y-auto">
          {isLoading ? (
            <div className="p-4 text-center">
              <LoadingSpinner />
              <p className="mt-2 text-gray-600">
                {intl.formatMessage({ id: 'district.selector.loading' })}
              </p>
            </div>
          ) : filteredDistricts.length > 0 ? (
            <ul ref={listRef} role="listbox" className="py-2">
              {filteredDistricts.map((district, index) => (
                <li
                  key={district.id}
                  role="option"
                  aria-selected={index === selectedIndex}
                  className={`px-4 py-3 cursor-pointer transition-colors duration-150 ${
                    index === selectedIndex
                      ? 'bg-primary-100 text-primary-900'
                      : 'hover:bg-gray-100'
                  }`}
                  onClick={() => handleSelect(district)}
                  onMouseEnter={() => setSelectedIndex(index)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-gray-900">
                        {district.name}
                      </div>
                      <div className="text-sm text-gray-600">
                        {district.state_name}
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSelect(district);
                      }}
                      className="btn btn-primary btn-sm"
                    >
                      {intl.formatMessage({ id: 'district.selector.select' })}
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          ) : searchTerm ? (
            <div className="p-4 text-center text-gray-600">
              <svg className="w-8 h-8 mx-auto mb-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 15c-2.34 0-4.47-.881-6.08-2.33" />
              </svg>
              {intl.formatMessage({ id: 'district.selector.no_results' })}
            </div>
          ) : (
            <div className="p-4 text-center text-gray-600">
              <svg className="w-8 h-8 mx-auto mb-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 15c-2.34 0-4.47-.881-6.08-2.33" />
              </svg>
              {intl.formatMessage({ id: 'district.selector.empty' })}
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
    </div>
  );
}