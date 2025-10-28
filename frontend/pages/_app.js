import { useState, useEffect } from 'react';
import { QueryClient, QueryClientProvider } from 'react-query';
import Head from 'next/head';

import '../styles/globals.css';
import { LanguageProvider } from '../contexts/LanguageContext';
import { AudioProvider } from '../contexts/AudioContext';
import { GeolocationProvider } from '../contexts/GeolocationContext';

function MyApp({ Component, pageProps }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        retry: 2,
        staleTime: 5 * 60 * 1000, // 5 minutes
        cacheTime: 10 * 60 * 1000, // 10 minutes
      },
    },
  }));



  // Register service worker for PWA support
  useEffect(() => {
    if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          // SW registered successfully
        })
        .catch((registrationError) => {
          // SW registration failed
        });
    }
  }, []);

  return (
    <>
      <Head>
        <title>MGNREGA LokDekho - मनरेगा लोकदेखो</title>
        <meta name="description" content="District MGNREGA performance dashboard for rural citizens" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5" />
        <meta name="theme-color" content="#0ea5e9" />
        
        {/* PWA manifest */}
        <link rel="manifest" href="/manifest.json" />
        
        {/* Icons */}
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/icon-192x192.png" />
        
        {/* Preconnect to API */}
        <link rel="preconnect" href={process.env.NEXT_PUBLIC_API_URL} />
        
        {/* Accessibility */}
        <meta name="color-scheme" content="light" />
        
        {/* Open Graph */}
        <meta property="og:title" content="MGNREGA LokDekho" />
        <meta property="og:description" content="Check your district's MGNREGA performance" />
        <meta property="og:type" content="website" />
        
        {/* Fonts - using system fonts for better performance */}
        <style jsx>{`
          @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Devanagari:wght@400;500;600;700&family=Noto+Sans:wght@400;500;600;700&display=swap');
        `}</style>
      </Head>

      <QueryClientProvider client={queryClient}>
        <LanguageProvider>
          <AudioProvider>
            <GeolocationProvider>
              <div className="min-h-screen bg-gray-50">
                <Component {...pageProps} />
              </div>
            </GeolocationProvider>
          </AudioProvider>
        </LanguageProvider>
      </QueryClientProvider>
    </>
  );
}

export default MyApp;