import React from 'react';
import { BookOpen, Users, Clock, ChevronRight } from 'lucide-react';
import { useCourses } from '../hooks/useCourses';
import { useAuth } from '../hooks/useAuth';
import { useLanguage } from '../contexts/LanguageContext';

const Cours: React.FC = () => {
  const { courses, enrollInCourse, loading } = useCourses();
  const { isAuthenticated } = useAuth();
  const { t } = useLanguage();

  const handleEnrollment = async (courseId: string) => {
    if (!isAuthenticated) {
      // Ici on pourrait ouvrir le modal d'authentification
      alert(t('courses.login_required'));
      return;
    }
    
    await enrollInCourse(courseId);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 pt-20 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-700 mx-auto mb-4"></div>
          <p className="text-gray-600">{t('loading')}...</p>
        </div>
      </div>
    );
  }

 

  return (
    <div className="min-h-screen bg-gray-50 pt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">{t('courses.title')}</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            {t('courses.subtitle')}
          </p>
        </div>

        {/* Stats Bar */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-3xl font-bold text-blue-700 mb-2">{courses.length}</div>
              <div className="text-gray-600">Cours disponibles</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-blue-700 mb-2">{courses.reduce((sum, course) => sum + (course.max_students || 0), 0)}</div>
              <div className="text-gray-600">Étudiants inscrits</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-blue-700 mb-2">{Math.round(courses.reduce((sum, course) => sum + (course.duration_months || 0), 0) / courses.length) || 0}</div>
              <div className="text-gray-600">Mois moyenne</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-blue-700 mb-2">95%</div>
              <div className="text-gray-600">Taux de satisfaction</div>
            </div>
          </div>
        </div>

        {/* Course Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {courses.map((course) => (
            <div key={course.id} className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300">
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${course.levelColor}`}>
                    {course.level}
                  </span>
                  <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                    {course.category}
                  </span>
                </div>
                
                <h3 className="text-xl font-bold text-gray-900 mb-3">{course.title}</h3>
                <p className="text-gray-600 mb-4 h-20">{course.description}</p>
                
                <div className="flex items-center justify-between text-sm text-gray-500 mb-6">
                  <div className="flex items-center">
                    <Clock className="h-4 w-4 mr-1" />
                    {course.duration_months} mois
                  </div>
                  <div className="flex items-center">
                    <Users className="h-4 w-4 mr-1" />
                    {course.max_students} places
                  </div>
                </div>
                
                <div className="flex space-x-3">
                  <button 
                    onClick={() => handleEnrollment(course.id)}
                    className="flex-1 bg-blue-700 text-white py-2 px-4 rounded-lg hover:bg-blue-800 transition-colors duration-200 font-medium"
                  >
                    {t('courses.enroll')}
                  </button>
                  <button className="flex items-center justify-center w-12 h-10 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-200">
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Call to Action */}
        <div className="mt-16 bg-gradient-to-r from-blue-700 to-blue-900 rounded-2xl p-12 text-center text-white">
          <h2 className="text-3xl font-bold mb-4">Prêt à commencer votre apprentissage ?</h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto">
            Rejoignez notre communauté d'apprenants et découvrez la richesse des sciences islamiques
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="bg-white text-blue-700 px-8 py-3 rounded-lg font-medium hover:bg-gray-100 transition-colors duration-200">
              Nous contacter
            </button>
            <button className="border border-white text-white px-8 py-3 rounded-lg font-medium hover:bg-white hover:text-blue-700 transition-colors duration-200">
              Découvrir nos tarifs
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cours;