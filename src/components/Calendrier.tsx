import React from 'react';
import { Calendar, Clock, Users, MapPin, Video } from 'lucide-react';
import { useSessions } from '../hooks/useSessions';
import { useAuth } from '../hooks/useAuth';
import { useLanguage } from '../contexts/LanguageContext';

interface CalendrierProps {
  onAuthClick?: (mode: 'login' | 'register') => void;
}

const Calendrier: React.FC<CalendrierProps> = ({ onAuthClick }) => {
  const { sessions, loading } = useSessions();
  const { isAuthenticated } = useAuth();
  const { t } = useLanguage();
  
  const getDayName = (dateString: string) => {
    const date = new Date(dateString);
    const days = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
    return days[date.getDay()];
  };

  const getFormattedDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const handleEnrollment = (sessionId: string) => {
    if (!isAuthenticated) {
      onAuthClick?.('login');
      return;
    }
    // Handle enrollment logic here
    console.log('Enrolling in session:', sessionId);
  };

  const getSessionType = (type: string) => {
    switch (type) {
      case 'online':
        return 'En ligne';
      case 'in_person':
        return 'Présentiel';
      case 'hybrid':
        return 'Hybride';
      default:
        return type;
    }
  };

  const getSessionTypeColor = (type: string) => {
    switch (type) {
      case 'online':
        return 'bg-green-100 text-green-800';
      case 'in_person':
        return 'bg-blue-100 text-blue-800';
      case 'hybrid':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
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
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">{t('calendar.title')}</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            {t('calendar.subtitle')}
          </p>
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Upcoming Events */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                <Calendar className="h-6 w-6 mr-2 text-blue-700" />
                {t('calendar.upcoming_courses')}
              </h2>
              
              <div className="space-y-4">
                {sessions.length > 0 ? sessions.map((session) => (
                  <div key={session.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow duration-200">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">{session.title}</h3>
                        <p className="text-gray-600 mb-3">{session.description || 'Session de cours'}</p>
                        
                        <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                          <div className="flex items-center">
                            <Calendar className="h-4 w-4 mr-1" />
                            {getDayName(session.session_date)} {getFormattedDate(session.session_date)}
                          </div>
                          <div className="flex items-center">
                            <Clock className="h-4 w-4 mr-1" />
                            {session.start_time} - {session.end_time}
                          </div>
                          <div className="flex items-center">
                            {session.session_type === 'online' ? (
                              <Video className="h-4 w-4 mr-1" />
                            ) : (
                              <MapPin className="h-4 w-4 mr-1" />
                            )}
                            {session.location || session.meeting_url || 'À définir'}
                          </div>
                        </div>
                      </div>
                      
                      <div className="ml-4 text-right">
                        <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getSessionTypeColor(session.session_type)}`}>
                          {getSessionType(session.session_type)}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center text-sm text-gray-500">
                        <Users className="h-4 w-4 mr-1" />
                        {session.max_participants || 'Illimité'} places
                      </div>
                      
                      <button 
                        onClick={() => handleEnrollment(session.id)}
                        className="bg-blue-700 text-white px-6 py-2 rounded-lg hover:bg-blue-800 transition-colors duration-200 font-medium"
                      >
                        {isAuthenticated ? t('courses.enroll') : t('nav.login')}
                      </button>
                    </div>
                  </div>
                )) : (
                  <div className="text-center py-12">
                    <Calendar className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-xl font-medium text-gray-900 mb-2">{t('calendar.no_sessions')}</h3>
                    <p className="text-gray-600">{t('calendar.no_sessions_desc')}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Stats */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Statistiques</h3>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-gray-600">Cours cette semaine</span>
                  <span className="font-semibold text-blue-700">{sessions.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Places disponibles</span>
                  <span className="font-semibold text-green-600">
                    {sessions.reduce((total, session) => total + (session.max_participants || 0), 0)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Cours en ligne</span>
                  <span className="font-semibold text-purple-600">
                    {sessions.filter(s => s.session_type === 'online').length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Cours présentiels</span>
                  <span className="font-semibold text-orange-600">
                    {sessions.filter(s => s.session_type === 'in_person').length}
                  </span>
                </div>
              </div>
            </div>

            {/* Legend */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Légende</h3>
              <div className="space-y-3">
                <div className="flex items-center">
                  <div className="w-4 h-4 bg-green-500 rounded-full mr-3"></div>
                  <span className="text-gray-600">Cours en ligne</span>
                </div>
                <div className="flex items-center">
                  <div className="w-4 h-4 bg-blue-500 rounded-full mr-3"></div>
                  <span className="text-gray-600">Cours présentiel</span>
                </div>
                <div className="flex items-center">
                  <div className="w-4 h-4 bg-purple-500 rounded-full mr-3"></div>
                  <span className="text-gray-600">Cours hybride</span>
                </div>
                <div className="flex items-center">
                  <div className="w-4 h-4 bg-yellow-500 rounded-full mr-3"></div>
                  <span className="text-gray-600">Places limitées</span>
                </div>
                <div className="flex items-center">
                  <div className="w-4 h-4 bg-red-500 rounded-full mr-3"></div>
                  <span className="text-gray-600">Complet</span>
                </div>
              </div>
            </div>

            {/* Contact Info */}
            <div className="bg-gradient-to-br from-blue-700 to-blue-900 rounded-xl p-6 text-white">
              <h3 className="text-xl font-bold mb-4">Besoin d'aide ?</h3>
              <p className="text-blue-100 mb-4">
                Contactez-nous pour toute question concernant les horaires ou les inscriptions.
              </p>
              <button className="bg-white text-blue-700 px-4 py-2 rounded-lg font-medium hover:bg-gray-100 transition-colors duration-200">
                Nous contacter
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Calendrier;