import React from 'react';
import { BookOpen, Menu, X, User, LogIn } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useLanguage } from '../contexts/LanguageContext';
import LanguageSwitcher from './LanguageSwitcher';

interface HeaderProps {
  currentSection: string;
  onSectionChange: (section: string) => void;
  onAuthClick?: (mode: 'login' | 'register') => void;
}

const Header: React.FC<HeaderProps> = ({ currentSection, onSectionChange, onAuthClick }) => {
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  const { isAuthenticated, profile, signOut } = useAuth();
  const { t, isRTL } = useLanguage();

  const menuItems = [
    { id: 'accueil', label: t('nav.home') },
    { id: 'apropos', label: t('nav.about') },
    { id: 'cours', label: t('nav.courses') },
    { id: 'calendrier', label: t('nav.calendar') },
    { id: 'contact', label: t('nav.contact') }
  ];

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm shadow-lg ${isRTL ? 'rtl' : 'ltr'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className={`flex items-center space-x-2 ${isRTL ? 'space-x-reverse' : ''}`}>
            <BookOpen className="h-8 w-8 text-blue-700" />
            <span className="text-xl font-bold text-gray-900">Mounir Ben Yahia</span>
          </div>

          {/* Desktop Navigation */}
          <nav className={`hidden md:flex space-x-8 ${isRTL ? 'space-x-reverse' : ''}`}>
            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => onSectionChange(item.id)}
                className={`px-3 py-2 text-sm font-medium transition-colors duration-200 ${
                  currentSection === item.id
                    ? 'text-blue-700 border-b-2 border-blue-700'
                    : 'text-gray-700 hover:text-blue-700'
                }`}
              >
                {item.label}
              </button>
            ))}
          </nav>

          {/* Auth Section */}
          <div className={`hidden md:flex items-center space-x-2 ${isRTL ? 'space-x-reverse' : ''}`}>
            <LanguageSwitcher />
            {isAuthenticated ? (
              <div className={`flex items-center space-x-3 ${isRTL ? 'space-x-reverse' : ''}`}>
                <div className={`flex items-center space-x-2 ${isRTL ? 'space-x-reverse' : ''}`}>
                  <User className="h-5 w-5 text-gray-600" />
                  <span className="text-sm text-gray-700">{profile?.full_name}</span>
                </div>
                <button
                  onClick={signOut}
                  className="text-sm text-gray-600 hover:text-gray-800 transition-colors"
                >
                  {t('nav.logout')}
                </button>
              </div>
            ) : (
              <div className={`flex items-center space-x-3 ${isRTL ? 'space-x-reverse' : ''}`}>
                <button
                  onClick={() => onAuthClick?.('login')}
                  className="text-sm text-gray-700 hover:text-blue-700 transition-colors"
                >
                  {t('nav.login')}
                </button>
                <button
                  onClick={() => onAuthClick?.('register')}
                  className="bg-blue-700 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-800 transition-colors"
                >
                  {t('nav.register')}
                </button>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            className="md:hidden p-2"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <nav className="md:hidden py-4 border-t">
            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  onSectionChange(item.id);
                  setIsMenuOpen(false);
                }}
                className={`block w-full text-left px-3 py-2 text-base font-medium transition-colors duration-200 ${
                  currentSection === item.id
                    ? 'text-blue-700 bg-blue-50'
                    : 'text-gray-700 hover:text-blue-700 hover:bg-gray-50'
                } ${isRTL ? 'text-right' : 'text-left'}`}
              >
                {item.label}
              </button>
            ))}
            
            {/* Mobile Auth */}
            <div className="border-t pt-4 mt-4">
              <div className="px-3 py-2 mb-2">
                <LanguageSwitcher />
              </div>
              {isAuthenticated ? (
                <div className="space-y-2">
                  <div className={`flex items-center space-x-2 px-3 py-2 ${isRTL ? 'space-x-reverse' : ''}`}>
                    <User className="h-5 w-5 text-gray-600" />
                    <span className="text-sm text-gray-700">{profile?.full_name}</span>
                  </div>
                  <button
                    onClick={signOut}
                    className={`w-full px-3 py-2 text-red-600 hover:bg-red-50 transition-colors ${isRTL ? 'text-right' : 'text-left'}`}
                  >
                    {t('nav.logout')}
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <button
                    onClick={() => {
                      onAuthClick?.('login');
                      setIsMenuOpen(false);
                    }}
                    className={`w-full px-3 py-2 text-gray-700 hover:bg-gray-50 transition-colors ${isRTL ? 'text-right' : 'text-left'}`}
                  >
                    {t('nav.login')}
                  </button>
                  <button
                    onClick={() => {
                      onAuthClick?.('register');
                      setIsMenuOpen(false);
                    }}
                    className={`w-full px-3 py-2 bg-blue-700 text-white rounded-lg hover:bg-blue-800 transition-colors ${isRTL ? 'text-right' : 'text-left'}`}
                  >
                    {t('nav.register')}
                  </button>
                </div>
              )}
            </div>
          </nav>
        )}
      </div>
    </header>
  );
};

export default Header;