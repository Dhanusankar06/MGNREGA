import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useLanguage } from '../contexts/LanguageContext';
import Head from 'next/head';

import Layout from '../components/Layout';
import DistrictSelector from '../components/DistrictSelector';
import DistrictDashboard from '../components/DistrictDashboard';
import { useGeolocation } from '../contexts/GeolocationContext';
import { useAudio } from '../contexts/AudioContext';

export default function Home() {
  const { formatMessage } = useLanguage();
  const router = useRouter();
  const { location, requestLocation, isLoading: locationLoading } = useGeolocation();
  const { playAudio } = useAudio();
  
  const [selectedDistrict, setSelectedDistrict] = useState(null);
  const [showDistrictSelector, setShowDistrictSelector] = useState(true);

  // Handle district from URL parameter if provided
  useEffect(() => {
    const { district_id } = router.query;
    
    if (district_id && !selectedDistrict) {
      setSelectedDistrict({ id: parseInt(district_id) });
      setShowDistrictSelector(false);
    }
  }, [router.query, selectedDistrict]);

  // Detect district from browser geolocation when available
  useEffect(() => {
    if (location && !selectedDistrict) {
      detectDistrictFromLocation(location);
    }
  }, [location, selectedDistrict]);

  const detectDistrictFromLocation = async (coords) => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://mgnrega-eirq.onrender.com';
      const url = `${apiUrl}/api/districts/detect?lat=${coords.latitude}&lng=${coords.longitude}`;
      
      console.log('Detecting district from location:', coords);
      console.log('API URL:', url);
      
      const response = await fetch(url);
      
      if (response.ok) {
        const district = await response.json();
        console.log('Detected district:', district);
        setSelectedDistrict(district);
        setShowDistrictSelector(false);
        
        // Play audio confirmation
        playAudio('district_detected', {
          district_name: district.name
        });
      } else {
        console.error('District detection failed:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('Failed to detect district:', error);
    }
  };

  const handleDistrictSelect = (district) => {
    setSelectedDistrict(district);
    setShowDistrictSelector(false);
    
    // Update URL
    router.push(`/?district_id=${district.id}`, undefined, { shallow: true });
    
    // Play audio confirmation
    playAudio('district_selected', {
      district_name: district.name
    });
  };

  const handleChangeDistrict = () => {
    setShowDistrictSelector(true);
    setSelectedDistrict(null);
    router.push('/', undefined, { shallow: true });
  };

  const handleRequestLocation = () => {
    requestLocation();
    playAudio('location_requested');
  };

  return (
    <>
      <Head>
        <title>
          {selectedDistrict 
            ? `${selectedDistrict.name} - MGNREGA LokDekho`
            : formatMessage('app.title')
          }
        </title>
        <meta 
          name="description" 
          content={formatMessage('app.description')} 
        />
      </Head>

      <Layout>
        {showDistrictSelector ? (
          <div className="container-safe py-8">
            {/* Hero Welcome Section */}
            <div className="welcome-section fade-in">
              <div className="text-8xl mb-8 animate-bounce-gentle">🏛️</div>
              <h1 className="welcome-title">
                {formatMessage('home.welcome.title')}
              </h1>
              <p className="welcome-subtitle">
                {formatMessage('home.welcome.subtitle')}
              </p>
              
              {/* Large Audio button for welcome message */}
              <button 
                className="audio-btn mb-8 animate-pulse-slow"
                onClick={() => playAudio('welcome_message')}
                aria-label={formatMessage('audio.play_welcome')}
              >
                <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.617.816L4.846 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.846l3.537-3.816a1 1 0 011.617.816zM16 8a2 2 0 11-4 0 2 2 0 014 0zm-2 6a4 4 0 100-8 4 4 0 000 8z" clipRule="evenodd" />
                </svg>
              </button>
            </div>

            {/* District Selection Options */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl mx-auto mb-12">
              
              {/* Auto Location Detection */}
              {process.env.NEXT_PUBLIC_ENABLE_GEOLOCATION === 'true' && (
                <div className="district-option slide-up hover-lift">
                  <div className="icon">📍</div>
                  <h2 className="title">{formatMessage('home.location.title')}</h2>
                  <p className="description mb-6">{formatMessage('home.location.description')}</p>
                  <button
                    onClick={handleRequestLocation}
                    disabled={locationLoading}
                    className="btn btn-primary btn-large w-full"
                  >
                    {locationLoading ? (
                      <div className="flex items-center">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white mr-3"></div>
                        खोजा जा रहा है...
                      </div>
                    ) : (
                      <>
                        <svg className="w-6 h-6 mr-3" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                        </svg>
                        {formatMessage('home.location.button')}
                      </>
                    )}
                  </button>
                </div>
              )}

              {/* Manual District Selection */}
              <div className="district-option slide-up hover-lift">
                <div className="icon">🗺️</div>
                <h2 className="title">{formatMessage('home.manual_select.title')}</h2>
                <p className="description mb-6">{formatMessage('home.manual_select.description')}</p>
                <div className="bg-gray-50 rounded-2xl p-6">
                  <DistrictSelector onSelect={handleDistrictSelect} />
                  
                  {/* Debug info */}
                  <div className="mt-4 text-xs text-gray-500">
                    API: {process.env.NEXT_PUBLIC_API_URL || 'https://mgnrega-eirq.onrender.com'}
                    <br />
                    <a href="/debug" target="_blank" className="text-blue-500 hover:underline">
                      🔍 Debug API
                    </a>
                  </div>
                </div>
              </div>
            </div>

            {/* Information Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
              <div className="card-simple p-6 text-center hover-lift">
                <div className="text-4xl mb-4">👥</div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">परिवार की जानकारी</h3>
                <p className="text-gray-600">अपने जिले में कितने परिवारों को काम मिला</p>
              </div>
              
              <div className="card-simple p-6 text-center hover-lift">
                <div className="text-4xl mb-4">💰</div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">मजदूरी की जानकारी</h3>
                <p className="text-gray-600">कुल मजदूरी और औसत दैनिक मजदूरी</p>
              </div>
              
              <div className="card-simple p-6 text-center hover-lift">
                <div className="text-4xl mb-4">📊</div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">प्रगति रिपोर्ट</h3>
                <p className="text-gray-600">महीने-दर-महीने की तुलना और चार्ट</p>
              </div>
            </div>

            {/* Footer Information */}
            <div className="text-center mt-16 p-8 bg-white rounded-3xl shadow-lg">
              <div className="data-source-indicator mb-4">
                <div className="dot"></div>
                <span className="text-lg font-semibold text-green-700">
                  📊 सरकारी डेटा से सीधे जानकारी
                </span>
              </div>
              <p className="text-gray-600 text-lg">
                यह जानकारी भारत सरकार के data.gov.in से आती है
              </p>
            </div>
          </div>
        ) : (
          selectedDistrict && (
            <DistrictDashboard 
              district={selectedDistrict}
              onChangeDistrict={handleChangeDistrict}
            />
          )
        )}
      </Layout>
    </>
  );
}