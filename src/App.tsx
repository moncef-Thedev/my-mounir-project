import React, { useState } from 'react';
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

function App() {
  const { isAuthenticated, isAdmin, isStudent, loading, profile } = useAuth();
  const [currentSection, setCurrentSection] = useState('accueil');
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-700 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  // Si l'utilisateur est connecté, afficher le tableau de bord approprié
  if (isAuthenticated) {
    if (profile?.role === 'admin') {
      return (
        <>
          <AdminDashboard />
          <Toaster position="top-right" />
        </>
      );
    } else if (profile?.role === 'student') {
      return (
        <>
          <StudentDashboard />
          <Toaster position="top-right" />
        </>
      );
    } else if (profile?.role === 'teacher') {
      return (
        <>
          <AdminDashboard />
          <Toaster position="top-right" />
        </>
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
    <div className="min-h-screen bg-gray-50">
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
                Enseignant retraité spécialisé dans le soutien scolaire primaire avec 30+ années d'expérience et des techniques pédagogiques innovantes.
              </p>
            </div>
            
            <div>
              <h4 className="text-lg font-semibold mb-4">Liens Rapides</h4>
              <ul className="space-y-2 text-gray-300">
                <li>
                  <button 
                    onClick={() => setCurrentSection('accueil')}
                    className="hover:text-white transition-colors duration-200"
                  >
                    Accueil
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => setCurrentSection('apropos')}
                    className="hover:text-white transition-colors duration-200"
                  >
                    À propos
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => setCurrentSection('cours')}
                    className="hover:text-white transition-colors duration-200"
                  >
                    Cours
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => setCurrentSection('calendrier')}
                    className="hover:text-white transition-colors duration-200"
                  >
                    Calendrier
                  </button>
                </li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-lg font-semibold mb-4">Contact</h4>
              <div className="space-y-2 text-gray-300">
                <p>📧 mounir.benyahia@exemple.com</p>
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
      
      <Toaster position="top-right" />
    </div>
  );
}

export default App;