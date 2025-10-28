import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useLanguage } from '../contexts/LanguageContext';
import Head from 'next/head';

import Layout from '../components/Layout';
import DistrictSelector from '../components/DistrictSelector';
import DistrictDashboard from '../components/DistrictDashboard';
import { useGeolocation } from '../contexts/GeolocationContext';
import { useAudio } from '../contexts/AudioContext';
import { 
  MdLocationOn, 
  MdMap, 
  MdVolumeUp,
  MdPeople,
  MdAttachMoney,
  MdBarChart,
  MdVerifiedUser,
  MdAccessibility,
  MdLanguage,
  MdAccountBalance
} from 'react-icons/md';
import { 
  IoLocationOutline, 
  IoMapOutline,
  IoShieldCheckmarkOutline,
  IoGlobeOutline
} from 'react-icons/io5';
import { 
  FaUsers, 
  FaRupeeSign, 
  FaChartLine,
  FaHandsHelping
} from 'react-icons/fa';

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
            {/* Enhanced Hero Welcome Section */}
            <div className="welcome-section fade-in relative overflow-hidden">
              {/* Background Icons */}
              <div className="absolute inset-0 opacity-10">
                <MdAccountBalance className="absolute top-10 left-10 w-20 h-20" />
                <FaUsers className="absolute top-20 right-20 w-16 h-16" />
                <FaChartLine className="absolute bottom-20 left-1/4 w-18 h-18" />
              </div>
              
              <div className="relative z-10">
                <div className="flex justify-center mb-8">
                  <div className="p-6 bg-white/20 rounded-full animate-bounce-gentle">
                    <MdAccountBalance className="w-20 h-20 text-white" />
                  </div>
                </div>
                <h1 className="welcome-title">
                  {formatMessage('home.welcome.title')}
                </h1>
                <p className="welcome-subtitle">
                  {formatMessage('home.welcome.subtitle')}
                </p>
                
                {/* Enhanced Audio button */}
                <button 
                  className="flex items-center px-8 py-4 bg-white/20 text-white rounded-2xl hover:bg-white/30 transition-all duration-300 hover:scale-110 animate-pulse-slow shadow-2xl backdrop-blur-sm border border-white/30"
                  onClick={() => playAudio('welcome_message')}
                  aria-label={formatMessage('audio.play_welcome')}
                >
                  <MdVolumeUp className="w-8 h-8 mr-3" />
                  <span className="text-xl font-bold">स्वागत संदेश सुनें</span>
                </button>
              </div>
            </div>

            {/* District Selection Options */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl mx-auto mb-12">
              
              {/* Enhanced Auto Location Detection */}
              {process.env.NEXT_PUBLIC_ENABLE_GEOLOCATION === 'true' && (
                <div className="district-option slide-up hover-lift group">
                  <div className="flex justify-center mb-4">
                    <div className="p-4 bg-blue-100 rounded-2xl group-hover:bg-blue-200 transition-colors duration-300">
                      <IoLocationOutline className="w-12 h-12 text-blue-600" />
                    </div>
                  </div>
                  <h2 className="title flex items-center justify-center">
                    <MdLocationOn className="w-6 h-6 mr-2 text-blue-600" />
                    {formatMessage('home.location.title')}
                  </h2>
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
                        <MdLocationOn className="w-6 h-6 mr-3" />
                        {formatMessage('home.location.button')}
                      </>
                    )}
                  </button>
                </div>
              )}

              {/* Enhanced Manual District Selection */}
              <div className="district-option slide-up hover-lift group">
                <div className="flex justify-center mb-4">
                  <div className="p-4 bg-green-100 rounded-2xl group-hover:bg-green-200 transition-colors duration-300">
                    <IoMapOutline className="w-12 h-12 text-green-600" />
                  </div>
                </div>
                <h2 className="title flex items-center justify-center">
                  <MdMap className="w-6 h-6 mr-2 text-green-600" />
                  {formatMessage('home.manual_select.title')}
                </h2>
                <p className="description mb-6">{formatMessage('home.manual_select.description')}</p>
                <div className="bg-gradient-to-br from-gray-50 to-blue-50 rounded-2xl p-6 border border-gray-200">
                  <DistrictSelector onSelect={handleDistrictSelect} />
                  
                  {/* Enhanced Debug info */}
                  <div className="mt-4 p-3 bg-white rounded-lg border border-gray-200">
                    <div className="flex items-center text-xs text-gray-500 mb-1">
                      <IoShieldCheckmarkOutline className="w-3 h-3 mr-1" />
                      API: {process.env.NEXT_PUBLIC_API_URL || 'https://mgnrega-eirq.onrender.com'}
                    </div>
                    <a href="/debug" target="_blank" className="flex items-center text-blue-500 hover:underline text-xs">
                      <MdVerifiedUser className="w-3 h-3 mr-1" />
                      Debug API
                    </a>
                  </div>
                </div>
              </div>
            </div>

            {/* Enhanced Information Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
              <div className="card-simple p-6 text-center hover-lift group">
                <div className="flex justify-center mb-4">
                  <div className="p-4 bg-blue-100 rounded-2xl group-hover:bg-blue-200 transition-colors duration-300">
                    <FaUsers className="w-8 h-8 text-blue-600" />
                  </div>
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-2 flex items-center justify-center">
                  <MdPeople className="w-5 h-5 mr-2" />
                  परिवार की जानकारी
                </h3>
                <p className="text-gray-600">अपने जिले में कितने परिवारों को काम मिला</p>
              </div>
              
              <div className="card-simple p-6 text-center hover-lift group">
                <div className="flex justify-center mb-4">
                  <div className="p-4 bg-green-100 rounded-2xl group-hover:bg-green-200 transition-colors duration-300">
                    <FaRupeeSign className="w-8 h-8 text-green-600" />
                  </div>
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-2 flex items-center justify-center">
                  <MdAttachMoney className="w-5 h-5 mr-2" />
                  मजदूरी की जानकारी
                </h3>
                <p className="text-gray-600">कुल मजदूरी और औसत दैनिक मजदूरी</p>
              </div>
              
              <div className="card-simple p-6 text-center hover-lift group">
                <div className="flex justify-center mb-4">
                  <div className="p-4 bg-purple-100 rounded-2xl group-hover:bg-purple-200 transition-colors duration-300">
                    <FaChartLine className="w-8 h-8 text-purple-600" />
                  </div>
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-2 flex items-center justify-center">
                  <MdBarChart className="w-5 h-5 mr-2" />
                  प्रगति रिपोर्ट
                </h3>
                <p className="text-gray-600">महीने-दर-महीने की तुलना और चार्ट</p>
              </div>
            </div>

            {/* Enhanced Footer Information */}
            <div className="text-center mt-16 p-8 bg-gradient-to-br from-white to-blue-50 rounded-3xl shadow-2xl border border-gray-200">
              <div className="flex items-center justify-center mb-4">
                <div className="flex items-center px-6 py-3 bg-green-100 rounded-full border-2 border-green-300 shadow-lg">
                  <div className="w-3 h-3 bg-green-500 rounded-full mr-3 animate-pulse"></div>
                  <IoShieldCheckmarkOutline className="w-5 h-5 text-green-600 mr-2" />
                  <span className="text-lg font-semibold text-green-700">
                    सरकारी डेटा से सीधे जानकारी
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-center text-gray-600 text-lg">
                <MdVerifiedUser className="w-5 h-5 mr-2" />
                <span>यह जानकारी भारत सरकार के data.gov.in से आती है</span>
              </div>
              
              {/* Additional Trust Indicators */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                <div className="flex items-center justify-center p-3 bg-blue-50 rounded-xl">
                  <MdAccessibility className="w-5 h-5 text-blue-600 mr-2" />
                  <span className="text-sm text-blue-700">सभी के लिए सुलभ</span>
                </div>
                <div className="flex items-center justify-center p-3 bg-green-50 rounded-xl">
                  <MdLanguage className="w-5 h-5 text-green-600 mr-2" />
                  <span className="text-sm text-green-700">बहुभाषी सहायता</span>
                </div>
                <div className="flex items-center justify-center p-3 bg-purple-50 rounded-xl">
                  <FaHandsHelping className="w-5 h-5 text-purple-600 mr-2" />
                  <span className="text-sm text-purple-700">ग्रामीण मित्र</span>
                </div>
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