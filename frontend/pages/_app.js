import { useState } from 'react';
import { QueryClient, QueryClientProvider } from 'react-query';
import { IntlProvider } from 'react-intl';
import { useRouter } from 'next/router';
import Head from 'next/head';

import '../styles/globals.css';
import { AudioProvider } from '../contexts/AudioContext';
import { GeolocationProvider } from '../contexts/GeolocationContext';

// Import translations
import en from '../locales/en.json';
import hi from '../locales/hi.json';
import ur from '../locales/ur.json';

const messages = { en, hi, ur };

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

  const router = useRouter();
  const { locale = 'hi' } = router;

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
        <IntlProvider 
          key={locale}
          locale={locale} 
          messages={messages[locale]} 
          defaultLocale="hi"
          onError={() => {}} // Suppress missing translation errors in production
        >
          <AudioProvider>
            <GeolocationProvider>
              <div className="min-h-screen bg-gray-50" dir={locale === 'ur' ? 'rtl' : 'ltr'} lang={locale}>
                <Component {...pageProps} />
              </div>
            </GeolocationProvider>
          </AudioProvider>
        </IntlProvider>
      </QueryClientProvider>
    </>
  );
}

export default MyApp;