import React, { useState, useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import Header from './components/Header';
import Accueil from './components/Accueil';
import APropos from './components/APropos';
import Cours from './components/Cours';
import Calendrier from './components/Calendrier';
import Contact from './components/Contact';
import AuthModal from './components/auth/AuthModal';
import StudentDashboard from './components/dashboard/StudentDashboard';
import AdminDashboard from './components/dashboard/AdminDashboard';
import { useAuth } from './hooks/useAuth';
import { useLanguage } from './contexts/LanguageContext';

function App() {
  const { isAuthenticated, profile, loading } = useAuth();
  const { t, isRTL } = useLanguage();
  const [currentSection, setCurrentSection] = useState('accueil');
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');

  // Handle language changes
  useEffect(() => {
    const handleLanguageChange = () => {
      // Force re-render when language changes
      setCurrentSection(prev => prev);
    };

    window.addEventListener('languagechange', handleLanguageChange);
    return () => window.removeEventListener('languagechange', handleLanguageChange);
  }, []);

  // Show loading screen while checking authentication
  if (loading) {
    return (
      <div className={`min-h-screen bg-gray-50 flex items-center justify-center ${isRTL ? 'rtl' : 'ltr'}`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-700 mx-auto mb-4"></div>
          <p className="text-gray-600">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  // Redirect authenticated users to appropriate dashboard
  if (isAuthenticated && profile) {
    if (profile.role === 'admin' || profile.role === 'teacher') {
      return (
        <div className={isRTL ? 'rtl' : 'ltr'}>
          <AdminDashboard />
          <Toaster 
            position={isRTL ? "top-left" : "top-right"}
            toastOptions={{
              style: {
                direction: isRTL ? 'rtl' : 'ltr',
              },
            }}
          />
        </div>
      );
    } else if (profile.role === 'student') {
      return (
        <div className={isRTL ? 'rtl' : 'ltr'}>
          <StudentDashboard />
          <Toaster 
            position={isRTL ? "top-left" : "top-right"}
            toastOptions={{
              style: {
                direction: isRTL ? 'rtl' : 'ltr',
              },
            }}
          />
        </div>
      );
    }
  }

  const renderCurrentSection = () => {
    switch (currentSection) {
      case 'accueil':
        return <Accueil />;
      case 'apropos':
        return <APropos />;
      case 'cours':
        return <Cours />;
      case 'calendrier':
        return <Calendrier onAuthClick={(mode) => {
          setAuthMode(mode);
          setShowAuthModal(true);
        }} />;
      case 'contact':
        return <Contact />;
      default:
        return <Accueil />;
    }
  };

  return (
    <div className={`min-h-screen bg-gray-50 ${isRTL ? 'rtl' : 'ltr'}`}>
      <Header 
        currentSection={currentSection} 
        onSectionChange={setCurrentSection}
        onAuthClick={(mode) => {
          setAuthMode(mode);
          setShowAuthModal(true);
        }}
      />
      <main>
        {renderCurrentSection()}
      </main>
      
      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h3 className="text-xl font-bold mb-4">Mounir Ben Yahia</h3>
              <p className="text-gray-300 mb-4">
                {t('home.subtitle')}
              </p>
            </div>
            
            <div>
              <h4 className="text-lg font-semibold mb-4">{t('nav.home')}</h4>
              <ul className="space-y-2 text-gray-300">
                <li>
                  <button 
                    onClick={() => setCurrentSection('accueil')}
                    className="hover:text-white transition-colors duration-200"
                  >
                    {t('nav.home')}
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => setCurrentSection('apropos')}
                    className="hover:text-white transition-colors duration-200"
                  >
                    {t('nav.about')}
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => setCurrentSection('cours')}
                    className="hover:text-white transition-colors duration-200"
                  >
                    {t('nav.courses')}
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => setCurrentSection('calendrier')}
                    className="hover:text-white transition-colors duration-200"
                  >
                    {t('nav.calendar')}
                  </button>
                </li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-lg font-semibold mb-4">{t('contact.title')}</h4>
              <div className="space-y-2 text-gray-300">
                <p>📧 mounir@exemple.com</p>
                <p>📞 +33 (0)1 23 45 67 89</p>
                <p>📍 Casablanca, Maroc</p>
              </div>
            </div>
          </div>
          
          <div className="border-t border-gray-700 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2025 Mounir Ben Yahia. Tous droits réservés.</p>
          </div>
        </div>
      </footer>
      
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        initialMode={authMode}
      />
      
      <Toaster 
        position={isRTL ? "top-left" : "top-right"}
        toastOptions={{
          style: {
            direction: isRTL ? 'rtl' : 'ltr',
          },
        }}
      />
    </div>
  );
}

export default App;