import React, { useState } from 'react';
import { BookOpen, Calendar, Bell, User, LogOut, Play, Download, Clock, CheckCircle } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useCourses } from '../../hooks/useCourses';
import { useSessions } from '../../hooks/useSessions';
import { useNotifications } from '../../hooks/useNotifications';

const StudentDashboard: React.FC = () => {
  const { profile, signOut } = useAuth();
  const { enrolledCourses, loading: coursesLoading } = useCourses();
  const { getUpcomingSessions, loading: sessionsLoading } = useSessions();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  
  const [activeTab, setActiveTab] = useState<'overview' | 'courses' | 'schedule' | 'notifications' | 'profile'>('overview');

  const upcomingSessions = getUpcomingSessions(5);
  const recentNotifications = notifications.slice(0, 5);

  const renderOverview = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-blue-50 p-6 rounded-xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-600 text-sm font-medium">Cours inscrits</p>
              <p className="text-2xl font-bold text-blue-900">{enrolledCourses.length}</p>
            </div>
            <BookOpen className="h-8 w-8 text-blue-600" />
          </div>
        </div>
        
        <div className="bg-green-50 p-6 rounded-xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-600 text-sm font-medium">Prochaines sessions</p>
              <p className="text-2xl font-bold text-green-900">{upcomingSessions.length}</p>
            </div>
            <Calendar className="h-8 w-8 text-green-600" />
          </div>
        </div>
        
        <div className="bg-yellow-50 p-6 rounded-xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-yellow-600 text-sm font-medium">Notifications</p>
              <p className="text-2xl font-bold text-yellow-900">{unreadCount}</p>
            </div>
            <Bell className="h-8 w-8 text-yellow-600" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4">Prochaines Sessions</h3>
          <div className="space-y-3">
            {upcomingSessions.length > 0 ? (
              upcomingSessions.map((session) => (
                <div key={session.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">{session.title}</p>
                    <p className="text-sm text-gray-600">
                      {new Date(session.session_date).toLocaleDateString('fr-FR')} à {session.start_time}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    {session.session_type === 'online' && (
                      <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">En ligne</span>
                    )}
                    <Clock className="h-4 w-4 text-gray-400" />
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-center py-4">Aucune session programmée</p>
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4">Notifications Récentes</h3>
          <div className="space-y-3">
            {recentNotifications.length > 0 ? (
              recentNotifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-3 rounded-lg cursor-pointer transition-colors ${
                    notification.is_read ? 'bg-gray-50' : 'bg-blue-50 border-l-4 border-blue-500'
                  }`}
                  onClick={() => markAsRead(notification.id)}
                >
                  <p className="font-medium text-gray-900">{notification.title}</p>
                  <p className="text-sm text-gray-600 line-clamp-2">{notification.message}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    {new Date(notification.created_at).toLocaleDateString('fr-FR')}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-center py-4">Aucune notification</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  const renderCourses = () => (
    <div className="space-y-6">
      <h3 className="text-2xl font-bold text-gray-900">Mes Cours</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {enrolledCourses.map((course) => (
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
              
              <div className="flex space-x-3">
                <button className="flex-1 bg-blue-700 text-white py-2 px-4 rounded-lg hover:bg-blue-800 transition-colors font-medium flex items-center justify-center">
                  <Play className="h-4 w-4 mr-2" />
                  Accéder
                </button>
                <button className="flex items-center justify-center w-12 h-10 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                  <Download className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {enrolledCourses.length === 0 && (
        <div className="text-center py-12">
          <BookOpen className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-medium text-gray-900 mb-2">Aucun cours inscrit</h3>
          <p className="text-gray-600">Explorez notre catalogue de cours pour commencer votre apprentissage.</p>
        </div>
      )}
    </div>
  );

  const renderNotifications = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-2xl font-bold text-gray-900">Notifications</h3>
        {unreadCount > 0 && (
          <button
            onClick={markAllAsRead}
            className="text-blue-700 hover:text-blue-800 font-medium"
          >
            Tout marquer comme lu
          </button>
        )}
      </div>
      
      <div className="space-y-3">
        {notifications.map((notification) => (
          <div
            key={notification.id}
            className={`p-4 rounded-lg cursor-pointer transition-colors ${
              notification.is_read ? 'bg-white border border-gray-200' : 'bg-blue-50 border border-blue-200'
            }`}
            onClick={() => markAsRead(notification.id)}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-2">
                  <h4 className="font-medium text-gray-900">{notification.title}</h4>
                  {!notification.is_read && (
                    <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                  )}
                </div>
                <p className="text-gray-600 mb-2">{notification.message}</p>
                <p className="text-sm text-gray-400">
                  {new Date(notification.created_at).toLocaleDateString('fr-FR', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>
              {notification.is_read && (
                <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
              )}
            </div>
          </div>
        ))}
      </div>
      
      {notifications.length === 0 && (
        <div className="text-center py-12">
          <Bell className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-medium text-gray-900 mb-2">Aucune notification</h3>
          <p className="text-gray-600">Vous recevrez ici toutes vos notifications importantes.</p>
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex">
        {/* Sidebar */}
        <div className="w-64 bg-white shadow-lg min-h-screen">
          <div className="p-6 border-b">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <User className="h-6 w-6 text-blue-700" />
              </div>
              <div>
                <p className="font-medium text-gray-900">{profile?.full_name}</p>
                <p className="text-sm text-gray-500">Étudiant</p>
              </div>
            </div>
          </div>
          
          <nav className="p-4 space-y-2">
            <button
              onClick={() => setActiveTab('overview')}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                activeTab === 'overview' ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <BookOpen className="h-5 w-5" />
              <span>Vue d'ensemble</span>
            </button>
            
            <button
              onClick={() => setActiveTab('courses')}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                activeTab === 'courses' ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <BookOpen className="h-5 w-5" />
              <span>Mes Cours</span>
            </button>
            
            <button
              onClick={() => setActiveTab('schedule')}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                activeTab === 'schedule' ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Calendar className="h-5 w-5" />
              <span>Planning</span>
            </button>
            
            <button
              onClick={() => setActiveTab('notifications')}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                activeTab === 'notifications' ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Bell className="h-5 w-5" />
              <span>Notifications</span>
              {unreadCount > 0 && (
                <span className="bg-red-500 text-white text-xs rounded-full px-2 py-1 ml-auto">
                  {unreadCount}
                </span>
              )}
            </button>
            
            <button
              onClick={() => setActiveTab('profile')}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                activeTab === 'profile' ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <User className="h-5 w-5" />
              <span>Profil</span>
            </button>
          </nav>
          
          <div className="absolute bottom-4 left-4 right-4 w-56">
            <button
              onClick={signOut}
              className="w-full flex items-center space-x-3 px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <LogOut className="h-5 w-5" />
              <span>Déconnexion</span>
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-8">
          <div className="max-w-7xl mx-auto">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900">
                Tableau de bord étudiant
              </h1>
              <p className="text-gray-600 mt-2">
                Bienvenue, {profile?.full_name} ! Gérez vos cours et suivez votre progression.
              </p>
            </div>

            {activeTab === 'overview' && renderOverview()}
            {activeTab === 'courses' && renderCourses()}
            {activeTab === 'notifications' && renderNotifications()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;