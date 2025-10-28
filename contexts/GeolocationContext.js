import { createContext, useContext, useState, useCallback } from 'react';

const GeolocationContext = createContext();

export function GeolocationProvider({ children }) {
  const [location, setLocation] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hasPermission, setHasPermission] = useState(null);

  // Request user's location
  const requestLocation = useCallback(() => {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      setError('Geolocation is not supported by this browser');
      return;
    }

    setIsLoading(true);
    setError(null);

    const options = {
      enableHighAccuracy: true,
      timeout: 10000, // 10 seconds
      maximumAge: 300000 // 5 minutes
    };

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coords = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy
        };
        
        setLocation(coords);
        setHasPermission(true);
        setIsLoading(false);
        setError(null);
        
        // Store in localStorage for future use (with expiry)
        const locationData = {
          coords,
          timestamp: Date.now(),
          expires: Date.now() + 24 * 60 * 60 * 1000 // 24 hours
        };
        
        try {
          if (typeof window !== 'undefined') {
            localStorage.setItem('mgnrega_location', JSON.stringify(locationData));
          }
        } catch (e) {
          console.warn('Could not save location to localStorage:', e);
        }
      },
      (error) => {
        setIsLoading(false);
        setHasPermission(false);
        
        let errorMessage = 'Unable to get your location';
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Location access denied by user';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Location information is unavailable';
            break;
          case error.TIMEOUT:
            errorMessage = 'Location request timed out';
            break;
          default:
            errorMessage = 'An unknown error occurred while getting location';
            break;
        }
        
        setError(errorMessage);
        
        // Try IP-based geolocation as fallback
        tryIPGeolocation();
      },
      options
    );
  }, []);

  // Fallback to IP-based geolocation using our API
  const tryIPGeolocation = useCallback(async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/districts/auto-detect`);
      const data = await response.json();
      
      if (data.latitude && data.longitude) {
        const coords = {
          latitude: data.latitude,
          longitude: data.longitude,
          accuracy: 10000, // IP geolocation is less accurate
          source: 'ip',
          district: data.name,
          state: data.state_name
        };
        
        setLocation(coords);
        setError(null);
      }
    } catch (ipError) {
      console.warn('IP geolocation also failed:', ipError);
      // Keep the original GPS error message
    }
  }, []);

  // Load cached location on mount
  const loadCachedLocation = useCallback(() => {
    try {
      if (typeof window === 'undefined') return false;
      const cached = localStorage.getItem('mgnrega_location');
      if (cached) {
        const locationData = JSON.parse(cached);
        
        // Check if cached location is still valid
        if (locationData.expires > Date.now()) {
          setLocation(locationData.coords);
          setHasPermission(true);
          return true;
        } else {
          // Remove expired location
          if (typeof window !== 'undefined') {
            localStorage.removeItem('mgnrega_location');
          }
        }
      }
    } catch (e) {
      console.warn('Could not load cached location:', e);
    }
    
    return false;
  }, []);

  // Auto-detect location using IP (no permission required)
  const autoDetectLocation = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/districts/auto-detect`);
      
      if (response.ok) {
        const data = await response.json();
        
        const coords = {
          latitude: data.latitude,
          longitude: data.longitude,
          accuracy: 10000, // IP geolocation is less accurate
          source: 'ip_auto',
          district: data.name,
          state: data.state_name,
          city: data.ip_location?.city
        };
        
        setLocation(coords);
        setIsLoading(false);
        setError(null);
        
        return data; // Return the full district data
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Auto-detection failed');
      }
    } catch (autoError) {
      setIsLoading(false);
      setError(`Auto-detection failed: ${autoError.message}`);
      console.warn('Auto-detection failed:', autoError);
      return null;
    }
  }, []);

  // Clear location data
  const clearLocation = useCallback(() => {
    setLocation(null);
    setError(null);
    setHasPermission(null);
    
    try {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('mgnrega_location');
      }
    } catch (e) {
      console.warn('Could not clear cached location:', e);
    }
  }, []);

  // Check if geolocation is supported
  const isSupported = typeof window !== 'undefined' && 'geolocation' in navigator;

  const value = {
    location,
    isLoading,
    error,
    hasPermission,
    isSupported,
    requestLocation,
    autoDetectLocation,
    clearLocation,
    loadCachedLocation
  };

  return (
    <GeolocationContext.Provider value={value}>
      {children}
    </GeolocationContext.Provider>
  );
}

export function useGeolocation() {
  const context = useContext(GeolocationContext);
  if (!context) {
    throw new Error('useGeolocation must be used within a GeolocationProvider');
  }
  return context;
}