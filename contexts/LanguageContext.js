import { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/router';

const LanguageContext = createContext();

const languages = {
    hi: {
        code: 'hi',
        name: 'हिंदी',
        flag: '🇮🇳',
        description: 'Hindi'
    },
    en: {
        code: 'en',
        name: 'English',
        flag: '🇬🇧',
        description: 'अंग्रेजी'
    },
    ur: {
        code: 'ur',
        name: 'اردو',
        flag: '🇵🇰',
        description: 'Urdu'
    }
};

// Simple translations
const translations = {
    hi: {
        'app.title': 'MGNREGA LokDekho',
        'app.description': 'अपने जिले की MGNREGA जानकारी देखें',
        'home.welcome.title': 'MGNREGA LokDekho में आपका स्वागत है',
        'home.welcome.subtitle': 'अपने जिले की MGNREGA योजना की पूरी जानकारी यहाँ देखें',
        'home.location.title': 'अपने आप खोजें',
        'home.location.description': 'आपकी लोकेशन से अपने आप जिला खोजा जाएगा',
        'home.location.button': 'मेरी लोकेशन खोजें',
        'home.manual_select.title': 'जिला चुनें',
        'home.manual_select.description': 'सूची से अपना जिला खोजकर चुनें',
        'audio.play_welcome': 'स्वागत संदेश सुनें'
    },
    en: {
        'app.title': 'MGNREGA LokDekho',
        'app.description': 'View MGNREGA information for your district',
        'home.welcome.title': 'Welcome to MGNREGA LokDekho',
        'home.welcome.subtitle': 'Get complete information about MGNREGA scheme in your district',
        'home.location.title': 'Auto Detect',
        'home.location.description': 'Your district will be automatically detected from your location',
        'home.location.button': 'Find My Location',
        'home.manual_select.title': 'Select District',
        'home.manual_select.description': 'Search and select your district from the list',
        'audio.play_welcome': 'Play welcome message'
    },
    ur: {
        'app.title': 'MGNREGA LokDekho',
        'app.description': 'اپنے ضلع کی MGNREGA معلومات دیکھیں',
        'home.welcome.title': 'MGNREGA LokDekho میں خوش آمدید',
        'home.welcome.subtitle': 'اپنے ضلع میں MGNREGA اسکیم کی مکمل معلومات یہاں دیکھیں',
        'home.location.title': 'خودکار تلاش',
        'home.location.description': 'آپ کے مقام سے خودکار طور پر ضلع تلاش کیا جائے گا',
        'home.location.button': 'میرا مقام تلاش کریں',
        'home.manual_select.title': 'ضلع منتخب کریں',
        'home.manual_select.description': 'فہرست سے اپنا ضلع تلاش کر کے منتخب کریں',
        'audio.play_welcome': 'خوش آمدید پیغام سنیں'
    }
};

export function LanguageProvider({ children }) {
    const router = useRouter();
    const [currentLanguage, setCurrentLanguage] = useState('hi');

    useEffect(() => {
        // Get language from localStorage or default to Hindi
        const savedLanguage = localStorage.getItem('language') || 'hi';
        setCurrentLanguage(savedLanguage);
    }, []);

    const changeLanguage = (langCode) => {
        setCurrentLanguage(langCode);
        localStorage.setItem('language', langCode);
    };

    const formatMessage = (id, values = {}) => {
        let message = translations[currentLanguage]?.[id] || translations['hi'][id] || id;

        // Simple variable replacement
        Object.keys(values).forEach(key => {
            message = message.replace(`{${key}}`, values[key]);
        });

        return message;
    };

    // Add locale property to formatMessage function
    formatMessage.locale = currentLanguage;

    const value = {
        locale: currentLanguage,
        language: languages[currentLanguage],
        languages: Object.values(languages),
        formatMessage,
        changeLanguage
    };

    return (
        <LanguageContext.Provider value={value}>
            {children}
        </LanguageContext.Provider>
    );
}

export function useLanguage() {
    const context = useContext(LanguageContext);
    if (!context) {
        throw new Error('useLanguage must be used within a LanguageProvider');
    }
    return context;
}

// Compatibility with react-intl
export function useIntl() {
    return useLanguage();
}