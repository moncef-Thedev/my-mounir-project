import React, { useState } from 'react';
import { Globe, ChevronDown } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

const LanguageSwitcher: React.FC = () => {
  const { language, setLanguage, isRTL } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);

  const languages = [
    { code: 'fr', name: 'Français', flag: '🇫🇷' },
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'ar', name: 'العربية', flag: '🇲🇦' }
  ];

  const currentLanguage = languages.find(lang => lang.code === language);

  const handleLanguageChange = (langCode: string) => {
    setLanguage(langCode as any);
    setIsOpen(false);
    
    // Force immediate re-render of all components
    setTimeout(() => {
      window.dispatchEvent(new Event('resize'));
    }, 100);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center space-x-2 px-3 py-2 text-gray-700 hover:text-blue-700 transition-colors duration-200 ${isRTL ? 'space-x-reverse' : ''}`}
      >
        <Globe className="h-4 w-4" />
        <span className="text-sm">{currentLanguage?.flag}</span>
        <ChevronDown className="h-3 w-3" />
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)}
          />
          
          {/* Dropdown */}
          <div className={`absolute mt-2 w-40 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50 ${isRTL ? 'left-0' : 'right-0'}`}>
            {languages.map((lang) => (
              <button
                key={lang.code}
                onClick={() => handleLanguageChange(lang.code)}
                className={`w-full px-4 py-2 text-sm hover:bg-gray-50 transition-colors duration-200 flex items-center space-x-2 ${
                  language === lang.code ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
                } ${isRTL ? 'text-right space-x-reverse' : 'text-left'}`}
              >
                <span>{lang.flag}</span>
                <span>{lang.name}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default LanguageSwitcher;