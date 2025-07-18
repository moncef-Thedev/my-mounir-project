import React, { useState, useEffect } from 'react';
import { 
  BookOpen, 
  Users, 
  Calendar, 
  Bell, 
  User, 
  LogOut, 
  Plus,
  Video,
  Play,
  Settings,
  BarChart3,
  Clock,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useCourses } from '../../hooks/useCourses';
import { useSessions } from '../../hooks/useSessions';
import { useVideoCall } from '../../hooks/useVideoCall';
import { useLanguage } from '../../contexts/LanguageContext';

const AdminDashboard: React.FC = () => {
  const { profile, signOut } = useAuth();
  const { courses, loading: coursesLoading } = useCourses();
  const { sessions, getUpcomingSessions } = useSessions();
  const { createVideoCall, getSessionVideoCalls } = useVideoCall();
  const { t, isRTL } = useLanguage();
  
  const [activeTab, setActiveTab] = useState<'overview' | 'courses' | 'sessions' | 'students' | 'analytics'>('overview');
  const [stats, setStats] = useState({
    totalCourses: 0,
    totalStudents: 0,
    upcomingSessions: 0,
    totalSessions: 0
  });

  const upcomingSessions = getUpcomingSessions(5);

  useEffect(() => {
    // Calculate stats
    setStats({
      totalCourses: courses.length,
      totalStudents: courses.reduce((sum, course) => sum + (course.max_students || 0), 0),
      upcomingSessions: upcomingSessions.length,
      totalSessions: sessions.length
    });
  }, [courses, sessions, upcomingSessions]);

  const handleCreateVideoCall = async (sessionId: string) => {
    try {
      await createVideoCall(sessionId, 'google_meet');
    } catch (error) {
      console.error('Error creating video call:', error);
    }
  };

  const renderOverview = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-blue-50 p-6 rounded-xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-600 text-sm font-medium">{t('dashboard.manage_courses')}</p>
              <p className="text-2xl font-bold text-blue-900">{stats.totalCourses}</p>
            </div>
            <BookOpen className="h-8 w-8 text-blue-600" />
          </div>
        </div>
        
        <div className="bg-green-50 p-6 rounded-xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-600 text-sm font-medium">{t('dashboard.manage_students')}</p>
              <p className="text-2xl font-bold text-green-900">{stats.totalStudents}</p>
            </div>
            <Users className="h-8 w-8 text-green-600" />
          </div>
        </div>
        
        <div className="bg-purple-50 p-6 rounded-xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-600 text-sm font-medium">{t('dashboard.upcoming_sessions')}</p>
              <p className="text-2xl font-bold text-purple-900">{stats.upcomingSessions}</p>
            </div>
            <Calendar className="h-8 w-8 text-purple-600" />
          </div>
        </div>

        <div className="bg-orange-50 p-6 rounded-xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-600 text-sm font-medium">{t('dashboard.manage_sessions')}</p>
              <p className="text-2xl font-bold text-orange-900">{stats.totalSessions}</p>
            </div>
            <Video className="h-8 w-8 text-orange-600" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4">{t('dashboard.upcoming_sessions')}</h3>
          <div className="space-y-3">
            {upcomingSessions.length > 0 ? (
              upcomingSessions.map((session) => (
                <div key={session.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">{session.title}</p>
                    <p className="text-sm text-gray-600">
                      {new Date(session.session_date).toLocaleDateString()} à {session.start_time}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleCreateVideoCall(session.id)}
                      className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 transition-colors"
                    >
                      <Video className="h-4 w-4" />
                    </button>
                    <Clock className="h-4 w-4 text-gray-400" />
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-center py-4">{t('dashboard.no_sessions')}</p>
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4">Cours Récents</h3>
          <div className="space-y-3">
            {courses.slice(0, 5).map((course) => (
              <div key={course.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">{course.title}</p>
                  <p className="text-sm text-gray-600">{course.category} - {course.level}</p>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    course.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {course.is_active ? 'Actif' : 'Inactif'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const renderCourses = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-2xl font-bold text-gray-900">{t('dashboard.manage_courses')}</h3>
        <button className="bg-blue-700 text-white px-4 py-2 rounded-lg hover:bg-blue-800 transition-colors flex items-center">
          <Plus className="h-4 w-4 mr-2" />
          Nouveau Cours
        </button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {courses.map((course) => (
          <div key={course.id} className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                  course.level === 'Débutant' ? 'bg-green-100 text-green-800' :
                  course.level === 'Intermédiaire' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {course.level}
                </span>
                <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                  {course.category}
                </span>
              </div>
              
              <h4 className="text-xl font-bold text-gray-900 mb-3">{course.title}</h4>
              <p className="text-gray-600 mb-4 line-clamp-3">{course.description}</p>
              
              <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                <span>{course.duration_months} mois</span>
                <span>{course.max_students} places</span>
              </div>
              
              <div className="flex space-x-2">
                <button className="flex-1 bg-blue-700 text-white py-2 px-4 rounded-lg hover:bg-blue-800 transition-colors font-medium">
                  Modifier
                </button>
                <button className="flex-1 border border-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-50 transition-colors font-medium">
                  Voir
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderSessions = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-2xl font-bold text-gray-900">{t('dashboard.manage_sessions')}</h3>
        <button className="bg-blue-700 text-white px-4 py-2 rounded-lg hover:bg-blue-800 transition-colors flex items-center">
          <Plus className="h-4 w-4 mr-2" />
          Nouvelle Session
        </button>
      </div>
      
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Session
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date & Heure
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Statut
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sessions.map((session) => (
                <tr key={session.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{session.title}</div>
                      <div className="text-sm text-gray-500">{session.course_title}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {new Date(session.session_date).toLocaleDateString()}
                    </div>
                    <div className="text-sm text-gray-500">
                      {session.start_time} - {session.end_time}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      session.session_type === 'online' ? 'bg-green-100 text-green-800' :
                      session.session_type === 'in_person' ? 'bg-blue-100 text-blue-800' :
                      'bg-purple-100 text-purple-800'
                    }`}>
                      {session.session_type}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      session.status === 'scheduled' ? 'bg-yellow-100 text-yellow-800' :
                      session.status === 'in_progress' ? 'bg-green-100 text-green-800' :
                      session.status === 'completed' ? 'bg-gray-100 text-gray-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {session.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleCreateVideoCall(session.id)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        <Video className="h-4 w-4" />
                      </button>
                      <button className="text-indigo-600 hover:text-indigo-900">
                        Modifier
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  return (
    <div className={`min-h-screen bg-gray-50 ${isRTL ? 'rtl' : 'ltr'}`}>
      <div className="flex">
        {/* Sidebar */}
        <div className="w-64 bg-white shadow-lg min-h-screen">
          <div className="p-6 border-b">
            <div className={`flex items-center space-x-3 ${isRTL ? 'space-x-reverse' : ''}`}>
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <User className="h-6 w-6 text-blue-700" />
              </div>
              <div>
                <p className="font-medium text-gray-900">{profile?.full_name}</p>
                <p className="text-sm text-gray-500">
                  {profile?.role === 'admin' ? 'Administrateur' : 'Enseignant'}
                </p>
              </div>
            </div>
          </div>
          
          <nav className="p-4 space-y-2">
            <button
              onClick={() => setActiveTab('overview')}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                activeTab === 'overview' ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-50'
              } ${isRTL ? 'space-x-reverse' : ''}`}
            >
              <BarChart3 className="h-5 w-5" />
              <span>{t('dashboard.overview')}</span>
            </button>
            
            <button
              onClick={() => setActiveTab('courses')}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                activeTab === 'courses' ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-50'
              } ${isRTL ? 'space-x-reverse' : ''}`}
            >
              <BookOpen className="h-5 w-5" />
              <span>{t('dashboard.manage_courses')}</span>
            </button>
            
            <button
              onClick={() => setActiveTab('sessions')}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                activeTab === 'sessions' ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-50'
              } ${isRTL ? 'space-x-reverse' : ''}`}
            >
              <Calendar className="h-5 w-5" />
              <span>{t('dashboard.manage_sessions')}</span>
            </button>
            
            <button
              onClick={() => setActiveTab('students')}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                activeTab === 'students' ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-50'
              } ${isRTL ? 'space-x-reverse' : ''}`}
            >
              <Users className="h-5 w-5" />
              <span>{t('dashboard.manage_students')}</span>
            </button>

            <button
              onClick={() => setActiveTab('analytics')}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                activeTab === 'analytics' ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-50'
              } ${isRTL ? 'space-x-reverse' : ''}`}
            >
              <BarChart3 className="h-5 w-5" />
              <span>Analytiques</span>
            </button>
          </nav>
          
          <div className="absolute bottom-4 left-4 right-4 w-56">
            <button
              onClick={signOut}
              className={`w-full flex items-center space-x-3 px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg transition-colors ${isRTL ? 'space-x-reverse' : ''}`}
            >
              <LogOut className="h-5 w-5" />
              <span>{t('nav.logout')}</span>
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-8">
          <div className="max-w-7xl mx-auto">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900">
                {t('dashboard.admin_dashboard')}
              </h1>
              <p className="text-gray-600 mt-2">
                {t('dashboard.welcome')}, {profile?.full_name} ! Gérez votre plateforme d'enseignement.
              </p>
            </div>

            {activeTab === 'overview' && renderOverview()}
            {activeTab === 'courses' && renderCourses()}
            {activeTab === 'sessions' && renderSessions()}
            {activeTab === 'students' && (
              <div className="text-center py-12">
                <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-medium text-gray-900 mb-2">Gestion des Étudiants</h3>
                <p className="text-gray-600">Fonctionnalité en cours de développement.</p>
              </div>
            )}
            {activeTab === 'analytics' && (
              <div className="text-center py-12">
                <BarChart3 className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-medium text-gray-900 mb-2">Analytiques</h3>
                <p className="text-gray-600">Rapports et statistiques détaillés bientôt disponibles.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;