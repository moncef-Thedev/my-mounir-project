import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Users, MapPin, Video, Play, Phone, X } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useLanguage } from '../contexts/LanguageContext';
import { useVideoCall } from '../hooks/useVideoCall';
import { apiClient } from '../lib/api';
import toast from 'react-hot-toast';

interface CalendrierProps {
  onAuthClick?: (mode: 'login' | 'register') => void;
}

interface Session {
  id: string;
  title: string;
  description?: string;
  session_date: string;
  start_time: string;
  end_time: string;
  session_type: 'online' | 'in_person' | 'hybrid';
  location?: string;
  meeting_url?: string;
  meeting_password?: string;
  max_participants?: number;
  course_title: string;
  category: string;
  level: string;
  teacher_name: string;
  enrolled_students: number;
  hasVideoCall: boolean;
  canJoinCall: boolean;
  call_platform?: string;
}

const Calendrier: React.FC<CalendrierProps> = ({ onAuthClick }) => {
  const { isAuthenticated, profile } = useAuth();
  const { t, isRTL } = useLanguage();
  const { 
    createVideoCall, 
    getSessionVideoCalls, 
    startVideoCall, 
    joinVideoCall,
    endVideoCall,
    getPlatformName,
    hasPermission,
    canJoinCall,
    canStartCall,
    canEndCall
  } = useVideoCall();
  
  const [sessions, setSessions] = useState<Session[]>([]);
  const [sessionsByDate, setSessionsByDate] = useState<Record<string, Session[]>>({});
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>({});
  const [showVideoCallModal, setShowVideoCallModal] = useState(false);
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [videoCallPlatform, setVideoCallPlatform] = useState('google_meet');
  const [videoCalls, setVideoCalls] = useState<any[]>([]);

  useEffect(() => {
    fetchCalendarData();
    fetchCalendarStats();
  }, [isAuthenticated]);

  const fetchCalendarData = async () => {
    try {
      setLoading(true);
      const response = await apiClient.getCalendar();
      
      // Enhance sessions with video call data
      const enhancedSessions = await Promise.all(
        (response.sessions || []).map(async (session) => {
          try {
            const videoCalls = await getSessionVideoCalls(session.id);
            const activeCall = videoCalls.find(call => 
              ['scheduled', 'in_progress'].includes(call.status)
            );
            
            return {
              ...session,
              hasVideoCall: !!activeCall,
              canJoinCall: activeCall ? canJoinCall(activeCall) : false,
              call_platform: activeCall?.platform
            };
          } catch (error) {
            return {
              ...session,
              hasVideoCall: false,
              canJoinCall: false
            };
          }
        })
      );
      
      setSessions(enhancedSessions);
      setSessionsByDate(response.sessionsByDate || {});
    } catch (error) {
      console.error('Calendar fetch error:', error);
      toast.error(t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  const fetchCalendarStats = async () => {
    try {
      const response = await apiClient.getCalendarStats();
      setStats(response);
    } catch (error) {
      console.error('Stats fetch error:', error);
    }
  };

  const handleEnrollment = async (sessionId: string) => {
    if (!isAuthenticated) {
      onAuthClick?.('login');
      return;
    }
    
    toast.info(t('courses.enroll'));
  };

  const handleCreateVideoCall = async () => {
    if (!selectedSession) return;

    try {
      const result = await createVideoCall(
        selectedSession.id,
        videoCallPlatform as any,
        `${selectedSession.session_date}T${selectedSession.start_time}`,
        90
      );

      if (result.success) {
        setShowVideoCallModal(false);
        await fetchCalendarData();
        toast.success(t('calendar.video_call_created'));
      }
    } catch (error) {
      toast.error(t('calendar.video_call_error'));
    }
  };

  const handleJoinVideoCall = async (sessionId: string) => {
    try {
      const videoCalls = await getSessionVideoCalls(sessionId);
      const activeCall = videoCalls.find(call => 
        ['in_progress', 'scheduled'].includes(call.status)
      );

      if (activeCall) {
        await joinVideoCall(activeCall.id);
      } else {
        toast.error(t('calendar.video_call_error'));
      }
    } catch (error) {
      toast.error(t('calendar.video_call_error'));
    }
  };

  const handleStartVideoCall = async (sessionId: string) => {
    try {
      const videoCalls = await getSessionVideoCalls(sessionId);
      const scheduledCall = videoCalls.find(call => call.status === 'scheduled');

      if (scheduledCall) {
        await startVideoCall(scheduledCall.id);
        await fetchCalendarData();
      } else {
        toast.error(t('calendar.video_call_error'));
      }
    } catch (error) {
      toast.error(t('calendar.video_call_error'));
    }
  };

  const handleEndVideoCall = async (sessionId: string) => {
    try {
      const videoCalls = await getSessionVideoCalls(sessionId);
      const activeCall = videoCalls.find(call => call.status === 'in_progress');

      if (activeCall) {
        await endVideoCall(activeCall.id);
        await fetchCalendarData();
      } else {
        toast.error(t('calendar.video_call_error'));
      }
    } catch (error) {
      toast.error(t('calendar.video_call_error'));
    }
  };

  const getDayName = (dateString: string) => {
    const date = new Date(dateString);
    const days = {
      fr: ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'],
      en: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
      ar: ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت']
    };
    const lang = t('nav.home') === 'Home' ? 'en' : t('nav.home') === 'الرئيسية' ? 'ar' : 'fr';
    return days[lang][date.getDay()];
  };

  const getFormattedDate = (dateString: string) => {
    const date = new Date(dateString);
    const lang = t('nav.home') === 'Home' ? 'en-US' : 
                 t('nav.home') === 'الرئيسية' ? 'ar-SA' : 'fr-FR';
    
    return date.toLocaleDateString(lang, {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const getSessionType = (type: string) => {
    switch (type) {
      case 'online':
        return t('calendar.online');
      case 'in_person':
        return t('calendar.in_person');
      case 'hybrid':
        return t('calendar.hybrid');
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

  const canCreateVideoCall = (session: Session) => {
    return hasPermission() && !session.hasVideoCall;
  };

  if (loading) {
    return (
      <div className={`min-h-screen bg-gray-50 pt-20 flex items-center justify-center ${isRTL ? 'rtl' : 'ltr'}`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-700 mx-auto mb-4"></div>
          <p className="text-gray-600">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-gray-50 pt-20 ${isRTL ? 'rtl' : 'ltr'}`}>
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
              <h2 className={`text-2xl font-bold text-gray-900 mb-6 flex items-center ${isRTL ? 'flex-row-reverse' : ''}`}>
                <Calendar className={`h-6 w-6 text-blue-700 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                {t('calendar.upcoming_courses')}
              </h2>
              
              <div className="space-y-4">
                {sessions.length > 0 ? sessions.map((session) => (
                  <div key={session.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow duration-200">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">{session.title}</h3>
                        <p className="text-gray-600 mb-3">{session.description || session.course_title}</p>
                        
                        <div className={`flex flex-wrap gap-4 text-sm text-gray-500 ${isRTL ? 'flex-row-reverse' : ''}`}>
                          <div className={`flex items-center ${isRTL ? 'flex-row-reverse' : ''}`}>
                            <Calendar className={`h-4 w-4 ${isRTL ? 'ml-1' : 'mr-1'}`} />
                            {getDayName(session.session_date)} {getFormattedDate(session.session_date)}
                          </div>
                          <div className={`flex items-center ${isRTL ? 'flex-row-reverse' : ''}`}>
                            <Clock className={`h-4 w-4 ${isRTL ? 'ml-1' : 'mr-1'}`} />
                            {session.start_time} - {session.end_time}
                          </div>
                          <div className={`flex items-center ${isRTL ? 'flex-row-reverse' : ''}`}>
                            {session.session_type === 'online' ? (
                              <Video className={`h-4 w-4 ${isRTL ? 'ml-1' : 'mr-1'}`} />
                            ) : (
                              <MapPin className={`h-4 w-4 ${isRTL ? 'ml-1' : 'mr-1'}`} />
                            )}
                            {session.location || t('calendar.online')}
                          </div>
                        </div>
                      </div>
                      
                      <div className={`text-center ${isRTL ? 'mr-4' : 'ml-4'}`}>
                        <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getSessionTypeColor(session.session_type)}`}>
                          {getSessionType(session.session_type)}
                        </span>
                        {session.hasVideoCall && (
                          <div className="mt-2">
                            <span className="inline-block px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                              {session.call_platform ? getPlatformName(session.call_platform as any) : t('calendar.video_call_scheduled')}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className={`flex items-center text-sm text-gray-500 ${isRTL ? 'flex-row-reverse' : ''}`}>
                        <Users className={`h-4 w-4 ${isRTL ? 'ml-1' : 'mr-1'}`} />
                        {session.enrolled_students} / {session.max_participants || 'Illimité'} {t('courses.places')}
                      </div>
                      
                      <div className={`flex gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                        {/* Video Call Actions */}
                        {session.hasVideoCall && session.canJoinCall && (
                          <button 
                            onClick={() => handleJoinVideoCall(session.id)}
                            className={`bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors duration-200 font-medium flex items-center ${isRTL ? 'flex-row-reverse' : ''}`}
                          >
                            <Video className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                            {t('calendar.join_video_call')}
                          </button>
                        )}
                        
                        {hasPermission() && session.hasVideoCall && (
                          <>
                            <button 
                              onClick={() => handleStartVideoCall(session.id)}
                              className={`bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors duration-200 font-medium flex items-center ${isRTL ? 'flex-row-reverse' : ''}`}
                            >
                              <Play className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                              {t('video.start_call')}
                            </button>
                            <button 
                              onClick={() => handleEndVideoCall(session.id)}
                              className={`bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors duration-200 font-medium flex items-center ${isRTL ? 'flex-row-reverse' : ''}`}
                            >
                              <X className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                              {t('video.end_call')}
                            </button>
                          </>
                        )}
                        
                        {canCreateVideoCall(session) && (
                          <button 
                            onClick={() => {
                              setSelectedSession(session);
                              setShowVideoCallModal(true);
                            }}
                            className={`bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors duration-200 font-medium flex items-center ${isRTL ? 'flex-row-reverse' : ''}`}
                          >
                            <Phone className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                            {t('video.create_call')}
                          </button>
                        )}
                        
                        <button 
                          onClick={() => handleEnrollment(session.id)}
                          className="bg-blue-700 text-white px-6 py-2 rounded-lg hover:bg-blue-800 transition-colors duration-200 font-medium"
                        >
                          {isAuthenticated ? t('courses.enroll') : t('nav.login')}
                        </button>
                      </div>
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
              <h3 className="text-xl font-bold text-gray-900 mb-4">{t('calendar.statistics')}</h3>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-gray-600">{t('calendar.courses_this_week')}</span>
                  <span className="font-semibold text-blue-700">{stats.upcoming_sessions || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">{t('calendar.available_places')}</span>
                  <span className="font-semibold text-green-600">
                    {sessions.reduce((total, session) => total + ((session.max_participants || 0) - session.enrolled_students), 0)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">{t('calendar.online_courses')}</span>
                  <span className="font-semibold text-purple-600">
                    {stats.online_sessions || 0}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">{t('calendar.in_person_courses')}</span>
                  <span className="font-semibold text-orange-600">
                    {stats.in_person_sessions || 0}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">{t('video.participants')}</span>
                  <span className="font-semibold text-green-600">
                    {stats.sessions_with_video_calls || 0}
                  </span>
                </div>
              </div>
            </div>

            {/* Legend */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">{t('calendar.legend')}</h3>
              <div className="space-y-3">
                <div className={`flex items-center ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <div className={`w-4 h-4 bg-green-500 rounded-full ${isRTL ? 'ml-3' : 'mr-3'}`}></div>
                  <span className="text-gray-600">{t('calendar.online')}</span>
                </div>
                <div className={`flex items-center ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <div className={`w-4 h-4 bg-blue-500 rounded-full ${isRTL ? 'ml-3' : 'mr-3'}`}></div>
                  <span className="text-gray-600">{t('calendar.in_person')}</span>
                </div>
                <div className={`flex items-center ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <div className={`w-4 h-4 bg-purple-500 rounded-full ${isRTL ? 'ml-3' : 'mr-3'}`}></div>
                  <span className="text-gray-600">{t('calendar.hybrid')}</span>
                </div>
                <div className={`flex items-center ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <div className={`w-4 h-4 bg-yellow-500 rounded-full ${isRTL ? 'ml-3' : 'mr-3'}`}></div>
                  <span className="text-gray-600">{t('calendar.limited_places')}</span>
                </div>
                <div className={`flex items-center ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <div className={`w-4 h-4 bg-red-500 rounded-full ${isRTL ? 'ml-3' : 'mr-3'}`}></div>
                  <span className="text-gray-600">{t('calendar.full')}</span>
                </div>
              </div>
            </div>

            {/* Contact Info */}
            <div className="bg-gradient-to-br from-blue-700 to-blue-900 rounded-xl p-6 text-white">
              <h3 className="text-xl font-bold mb-4">{t('contact.title')}</h3>
              <p className="text-blue-100 mb-4">
                {t('contact.subtitle')}
              </p>
              <button className="bg-white text-blue-700 px-4 py-2 rounded-lg font-medium hover:bg-gray-100 transition-colors duration-200">
                {t('contact.title')}
              </button>
            </div>
          </div>
        </div>

        {/* Video Call Modal */}
        {showVideoCallModal && selectedSession && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className={`bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 ${isRTL ? 'rtl' : 'ltr'}`}>
              <div className="flex justify-between items-center p-6 border-b">
                <h2 className="text-2xl font-bold text-gray-900">{t('video.create_call')}</h2>
                <button
                  onClick={() => setShowVideoCallModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('common.title')}
                  </label>
                  <p className="text-gray-900 font-medium">{selectedSession.title}</p>
                  <p className="text-gray-600 text-sm">
                    {getFormattedDate(selectedSession.session_date)} {t('common.time')} {selectedSession.start_time}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('video.select_platform')}
                  </label>
                  <select
                    value={videoCallPlatform}
                    onChange={(e) => setVideoCallPlatform(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="google_meet">Google Meet</option>
                    <option value="zoom">Zoom</option>
                    <option value="teams">Microsoft Teams</option>
                    <option value="jitsi">Jitsi Meet</option>
                  </select>
                </div>

                <div className={`flex gap-3 pt-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <button
                    onClick={() => setShowVideoCallModal(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    {t('common.cancel')}
                  </button>
                  <button
                    onClick={handleCreateVideoCall}
                    className="flex-1 bg-blue-700 text-white px-4 py-2 rounded-lg hover:bg-blue-800 transition-colors"
                  >
                    {t('video.create_call')}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Calendrier;