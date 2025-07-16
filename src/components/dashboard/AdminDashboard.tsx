import React from 'react';
import { Award, Users, BookOpen, Star } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext'; // Fixed import path

const Accueil: React.FC = () => {
  const { t } = useLanguage();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white">
      {/* Hero Section */}
      <div className="pt-20 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
                {t('home.title')}
              </h1>
              <p className="text-xl text-gray-600 mb-8">
                {t('home.subtitle')}
              </p>
              <p className="text-lg text-gray-700 mb-8 leading-relaxed">
                {t('home.description')}
              </p>
              <div className="flex flex-wrap gap-4">
                <button className="bg-blue-700 text-white px-8 py-3 rounded-lg hover:bg-blue-800 transition-colors duration-200 font-medium">
                  {t('home.discover_courses')}
                </button>
                <button 
                  onClick={() => window.open('https://wa.me/212123456789?text=Bonjour%20Mounir,%20je%20souhaite%20avoir%20des%20informations%20sur%20vos%20cours%20de%20soutien%20scolaire.', '_blank')}
                  className="border border-blue-700 text-blue-700 px-8 py-3 rounded-lg hover:bg-blue-50 transition-colors duration-200 font-medium"
                >
                  {t('home.contact_me')}
                </button>
              </div>
            </div>
            <div className="flex justify-center">
              <div className="relative">
                <div className="w-80 h-80 bg-gradient-to-br from-blue-200 to-blue-300 rounded-full flex items-center justify-center">
                  <img 
                    src="/mounir-photo.jpg"
                    alt="Mounir Ben Yahia"
                    onError={(e) => {
                      e.currentTarget.src = "https://images.pexels.com/photos/5212317/pexels-photo-5212317.jpeg?auto=compress&cs=tinysrgb&w=800";
                    }}
                    className="w-72 h-72 rounded-full object-cover border-4 border-white shadow-xl"
                  />
                </div>
                <div className="absolute -top-4 -right-4 w-16 h-16 bg-yellow-400 rounded-full flex items-center justify-center">
                  <Star className="h-8 w-8 text-white" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="h-8 w-8 text-blue-700" />
              </div>
              <h3 className="text-3xl font-bold text-gray-900 mb-2">3000+</h3>
              <p className="text-gray-600">{t('home.students_helped')}</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <BookOpen className="h-8 w-8 text-blue-700" />
              </div>
              <h3 className="text-3xl font-bold text-gray-900 mb-2">15+</h3>
              <p className="text-gray-600">{t('home.subjects_taught')}</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Award className="h-8 w-8 text-blue-700" />
              </div>
              <h3 className="text-3xl font-bold text-gray-900 mb-2">30+</h3>
              <p className="text-gray-600">{t('home.years_experience')}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Approach Section */}
      <div className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">{t('home.modern_approach')}</h2>
            <p className="text-lg text-gray-600 max-w-4xl mx-auto">
              {t('home.approach_description')}
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-xl shadow-lg">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <BookOpen className="h-6 w-6 text-blue-700" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Pédagogies Innovantes</h3>
              <p className="text-gray-600">
                Utilisation des nouvelles méthodes pédagogiques adaptées aux besoins de chaque élève du primaire.
              </p>
            </div>
            
            <div className="bg-white p-8 rounded-xl shadow-lg">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <Users className="h-6 w-6 text-blue-700" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Soutien Personnalisé</h3>
              <p className="text-gray-600">
                Accompagnement individualisé pour améliorer le niveau d'apprentissage de votre enfant.
              </p>
            </div>
            
            <div className="bg-white p-8 rounded-xl shadow-lg">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <Award className="h-6 w-6 text-blue-700" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">30 Ans d'Expérience</h3>
              <p className="text-gray-600">
                Plus de 30 années d'expérience dans l'enseignement primaire avec 3000+ élèves accompagnés.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Accueil;