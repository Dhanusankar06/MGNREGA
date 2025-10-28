import { createContext, useContext, useState, useCallback } from 'react';
import { useLanguage } from './LanguageContext';

const AudioContext = createContext();

// Audio messages for different actions
const audioMessages = {
  welcome_message: {
    hi: 'मनरेगा लोकदेखो में आपका स्वागत है। यहाँ आप अपने जिले की मनरेगा जानकारी देख सकते हैं।',
    en: 'Welcome to MGNREGA LokDekho. Here you can view your district\'s MGNREGA information.'
  },
  district_selected: {
    hi: '{district_name} जिला चुना गया है। डैशबोर्ड लोड हो रहा है।',
    en: '{district_name} district selected. Loading dashboard.'
  },
  district_detected: {
    hi: 'आपका जिला {district_name} मिल गया है।',
    en: 'Your district {district_name} has been detected.'
  },
  location_requested: {
    hi: 'आपकी जगह का पता लगाया जा रहा है। कृपया अनुमति दें।',
    en: 'Detecting your location. Please allow permission.'
  },
  navigation_help: {
    hi: 'मुख्य पृष्ठ पर जाने के लिए होम बटन दबाएं। सहायता के लिए हेल्प बटन दबाएं।',
    en: 'Press home button to go to main page. Press help button for assistance.'
  },
  metric_households: {
    hi: 'यह परिवारों की संख्या दिखाता है। पंजीकृत परिवार और जिन्हें काम मिला।',
    en: 'This shows number of households. Registered families and those who got work.'
  },
  metric_persondays: {
    hi: 'यह व्यक्ति-दिन दिखाता है। कुल कितने दिन काम हुआ।',
    en: 'This shows person-days. Total number of work days generated.'
  },
  metric_wages: {
    hi: 'यह मजदूरी दिखाता है। कुल कितनी मजदूरी दी गई।',
    en: 'This shows wages. Total amount of wages paid.'
  },
  metric_women: {
    hi: 'यह महिला भागीदारी दिखाता है। कितनी प्रतिशत महिलाओं को काम मिला।',
    en: 'This shows women participation. What percentage of women got work.'
  }
};

export function AudioProvider({ children }) {
  const { formatMessage, locale } = useLanguage();
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentAudio, setCurrentAudio] = useState(null);

  // Text-to-speech function
  const speak = useCallback((text) => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      // Stop any currently playing speech
      window.speechSynthesis.cancel();
      
      const utterance = new SpeechSynthesisUtterance(text);
      
      // Set language based on current locale
      utterance.lang = locale === 'hi' ? 'hi-IN' : locale === 'ur' ? 'ur-PK' : 'en-IN';
      
      // Set voice properties for better accessibility
      utterance.rate = 0.8; // Slightly slower for better comprehension
      utterance.pitch = 1;
      utterance.volume = 1;
      
      // Event handlers
      utterance.onstart = () => {
        setIsPlaying(true);
        setCurrentAudio(utterance);
      };
      
      utterance.onend = () => {
        setIsPlaying(false);
        setCurrentAudio(null);
      };
      
      utterance.onerror = (event) => {
        console.error('Speech synthesis error:', event);
        setIsPlaying(false);
        setCurrentAudio(null);
      };
      
      // Speak the text
      window.speechSynthesis.speak(utterance);
      
      return utterance;
    } else {
      console.warn('Speech synthesis not supported in this browser');
      return null;
    }
  }, [locale]);

  // Play predefined audio messages
  const playAudio = useCallback((messageKey, variables = {}) => {
    const message = audioMessages[messageKey];
    if (!message) {
      console.warn(`Audio message not found: ${messageKey}`);
      return;
    }
    
    let text = message[locale] || message.en || message.hi;
    
    // Replace variables in the text
    Object.keys(variables).forEach(key => {
      text = text.replace(`{${key}}`, variables[key]);
    });
    
    return speak(text);
  }, [speak, locale]);

  // Stop current audio
  const stopAudio = useCallback(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsPlaying(false);
    setCurrentAudio(null);
  }, []);

  // Play custom text
  const playText = useCallback((text) => {
    return speak(text);
  }, [speak]);

  // Check if speech synthesis is supported
  const isSupported = typeof window !== 'undefined' && 'speechSynthesis' in window;

  const value = {
    playAudio,
    playText,
    stopAudio,
    isPlaying,
    isSupported,
    currentAudio
  };

  return (
    <AudioContext.Provider value={value}>
      {children}
    </AudioContext.Provider>
  );
}

export function useAudio() {
  const context = useContext(AudioContext);
  if (!context) {
    throw new Error('useAudio must be used within an AudioProvider');
  }
  return context;
}