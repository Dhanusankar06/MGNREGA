import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useIntl } from 'react-intl';
import Head from 'next/head';

import Layout from '../components/Layout';
import DistrictSelector from '../components/DistrictSelector';
import DistrictDashboard from '../components/DistrictDashboard';
import LoadingSpinner from '../components/LoadingSpinner';
import { useGeolocation } from '../contexts/GeolocationContext';
import { useAudio } from '../contexts/AudioContext';

export default function Home() {
  const intl = useIntl();
  const router = useRouter();
  const { location, requestLocation, isLoading: locationLoading } = useGeolocation();
  const { playAudio } = useAudio();
  
  const [selectedDistrict, setSelectedDistrict] = useState(null);
  const [showDistrictSelector, setShowDistrictSelector] = useState(true);
  // Removed internet-based auto-detect; rely only on browser geolocation

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
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/districts/detect?lat=${coords.latitude}&lng=${coords.longitude}`
      );
      
      if (response.ok) {
        const district = await response.json();
        setSelectedDistrict(district);
        setShowDistrictSelector(false);
        
        // Play audio confirmation
        playAudio('district_detected', {
          district_name: district.name
        });
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

  // Removed internet-based auto-detect handler

  return (
    <>
      <Head>
        <title>
          {selectedDistrict 
            ? `${selectedDistrict.name} - MGNREGA LokDekho`
            : intl.formatMessage({ id: 'app.title' })
          }
        </title>
        <meta 
          name="description" 
          content={intl.formatMessage({ id: 'app.description' })} 
        />
      </Head>

      <Layout>
        {showDistrictSelector ? (
          <div className="container-safe py-10">
            {/* Welcome Section */}
            <div className="text-center mb-10">
              <h1 className="text-5xl md:text-6xl font-extrabold text-gray-900 tracking-tight mb-3">
                {intl.formatMessage({ id: 'home.welcome.title' })}
              </h1>
              <p className="text-lg md:text-xl text-gray-600 mb-6 max-w-3xl mx-auto">
                {intl.formatMessage({ id: 'home.welcome.subtitle' })}
              </p>
              
              {/* Audio button for welcome message */}
              <button 
                className="audio-btn mb-8"
                onClick={() => playAudio('welcome_message')}
                aria-label={intl.formatMessage({ id: 'audio.play_welcome' })}
              >
                <svg className="w-5 h-5 text-primary-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.617.816L4.846 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.846l3.537-3.816a1 1 0 011.617.816zM16 8a2 2 0 11-4 0 2 2 0 014 0zm-2 6a4 4 0 100-8 4 4 0 000 8z" clipRule="evenodd" />
                </svg>
              </button>
            </div>

            {/* Location Detection */}
            {process.env.NEXT_PUBLIC_ENABLE_GEOLOCATION === 'true' && (
              <div className="grid grid-cols-1 md:grid-cols-1 gap-8 max-w-3xl mx-auto mb-10">
                <div className="card p-6 flex flex-col h-full">
                  <div className="flex items-center justify-center h-28 mb-4">
                    <svg className="w-20 h-20 text-primary-600" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                      <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <h2 className="text-2xl font-semibold text-gray-900 text-center mb-2">{intl.formatMessage({ id: 'home.location.title' })}</h2>
                  <p className="text-gray-600 text-center mb-6">{intl.formatMessage({ id: 'home.location.description' })}</p>
                  <div className="mt-auto">
                    <button
                      onClick={handleRequestLocation}
                      disabled={locationLoading}
                      className="btn btn-primary w-full"
                    >
                      {locationLoading ? (
                        <LoadingSpinner size="small" />
                      ) : (
                        intl.formatMessage({ id: 'home.location.button' })
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Section Divider */}
            <div className="flex items-center justify-center my-6">
              <span className="px-3 py-1.5 bg-white border border-gray-200 rounded-full text-sm text-gray-600 shadow-sm">
                {intl.formatMessage({ id: 'home.or_manual', defaultMessage: 'या अपना जिला चुनें' })}
              </span>
            </div>

            {/* Manual District Selection */}
            <div className="max-w-2xl mx-auto">
              <div className="text-center mb-6">
                <h2 className="text-2xl md:text-3xl font-semibold mb-2">
                  {intl.formatMessage({ id: 'home.manual_select.title' })}
                </h2>
                <p className="text-gray-600">
                  {intl.formatMessage({ id: 'home.manual_select.description' })}
                </p>
              </div>
              
              <div className="card p-4 md:p-6">
                <DistrictSelector onSelect={handleDistrictSelect} />
              </div>
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