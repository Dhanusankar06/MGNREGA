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
        'audio.play_welcome': 'स्वागत संदेश सुनें',
        'dashboard.title': '{district} जिला',
        'dashboard.subtitle': 'मनरेगा कार्यक्रम की जानकारी',
        'dashboard.change_district': 'जिला बदलें',
        'dashboard.refresh_data': 'नया डेटा लाएं',
        'dashboard.refreshing': 'अपडेट हो रहा है...',
        'tabs.overview': 'मुख्य जानकारी',
        'tabs.trends': 'महीने की तुलना',
        'tabs.compare': 'जिलों की तुलना',
        'tabs.export': 'रिपोर्ट डाउनलोड',
        'metrics.households': 'पंजीकृत परिवार',
        'metrics.wages': 'कुल मजदूरी',
        'metrics.persondays': 'व्यक्ति-दिन',
        'metrics.women': 'महिला भागीदारी',
        'metrics.works_completed': 'पूरे हुए काम',
        'metrics.works_ongoing': 'चालू काम',
        'error.data_load_failed': 'डेटा लोड नहीं हो सका',
        'error.check_connection': 'कृपया अपना इंटरनेट कनेक्शन चेक करें',
        'dashboard.data_source': 'सरकारी डेटा से सीधी जानकारी',
        'dashboard.help_audio': 'डैशबोर्ड की जानकारी सुनें',
        'change.better': 'पिछले महीने से बेहतर',
        'change.worse': 'पिछले महीने से कम',
        'change.same': 'पिछले महीने के बराबर',
        'number.crore': 'करोड़',
        'number.lakh': 'लाख',
        'number.thousand': 'हज़ार'
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
        'audio.play_welcome': 'Play welcome message',
        'dashboard.title': '{district} District',
        'dashboard.subtitle': 'MGNREGA Program Information',
        'dashboard.change_district': 'Change District',
        'dashboard.refresh_data': 'Refresh Data',
        'dashboard.refreshing': 'Updating...',
        'tabs.overview': 'Overview',
        'tabs.trends': 'Monthly Trends',
        'tabs.compare': 'Compare Districts',
        'tabs.export': 'Download Report',
        'metrics.households': 'Registered Households',
        'metrics.wages': 'Total Wages',
        'metrics.persondays': 'Person-Days',
        'metrics.women': 'Women Participation',
        'metrics.works_completed': 'Completed Works',
        'metrics.works_ongoing': 'Ongoing Works',
        'error.data_load_failed': 'Failed to Load Data',
        'error.check_connection': 'Please check your internet connection',
        'dashboard.data_source': 'Direct Government Data',
        'dashboard.help_audio': 'Listen to dashboard information',
        'change.better': 'Better than last month',
        'change.worse': 'Lower than last month',
        'change.same': 'Same as last month',
        'number.crore': 'Cr',
        'number.lakh': 'L',
        'number.thousand': 'K'
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