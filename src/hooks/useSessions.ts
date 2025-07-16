import { useState, useEffect } from 'react';
import { apiClient } from '../lib/api';
import { useAuth } from './useAuth';
import toast from 'react-hot-toast';

interface CourseSession {
  id: string;
  course_id: string;
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
  is_mandatory: boolean;
  materials_required?: string[];
  homework_assigned?: string;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  created_at: string;
  updated_at: string;
}

export const useSessions = () => {
  const { user, profile } = useAuth();
  const [sessions, setSessions] = useState<CourseSession[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchSessions();
    }
  }, [user]);

  const fetchSessions = async () => {
    if (!user) return;

    try {
      const response = await apiClient.getSessions();
      setSessions(response.sessions || []);
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setLoading(false);
    }
  };

  const createSession = async (sessionData: Omit<CourseSession, 'id' | 'created_at' | 'updated_at'>) => {
    if (!profile?.role || !['admin', 'teacher'].includes(profile.role)) {
      toast.error('Vous n\'avez pas les permissions pour créer une session');
      return { success: false };
    }

    try {
      const response = await apiClient.createSession(sessionData);

      toast.success('Session créée avec succès !');
      await fetchSessions();
      return { success: true, data: response.session };
    } catch (error) {
      toast.error('Erreur lors de la création');
      return { success: false, error };
    }
  };

  const updateSession = async (sessionId: string, updates: Partial<CourseSession>) => {
    if (!profile?.role || !['admin', 'teacher'].includes(profile.role)) {
      toast.error('Vous n\'avez pas les permissions pour modifier cette session');
      return { success: false };
    }

    try {
      const response = await apiClient.updateSession(sessionId, updates);

      toast.success('Session modifiée avec succès !');
      await fetchSessions();
      return { success: true, data: response.session };
    } catch (error) {
      toast.error('Erreur lors de la modification');
      return { success: false, error };
    }
  };

  const deleteSession = async (sessionId: string) => {
    if (!profile?.role || !['admin', 'teacher'].includes(profile.role)) {
      toast.error('Vous n\'avez pas les permissions pour supprimer cette session');
      return { success: false };
    }

    try {
      await apiClient.deleteSession(sessionId);

      toast.success('Session supprimée avec succès !');
      await fetchSessions();
      return { success: true };
    } catch (error) {
      toast.error('Erreur lors de la suppression');
      return { success: false, error };
    }
  };

  const getSessionsForDate = (date: Date) => {
    const dateString = date.toISOString().split('T')[0];
    return sessions.filter(session => session.session_date === dateString);
  };

  const getUpcomingSessions = (limit = 5) => {
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const currentTime = now.toTimeString().split(' ')[0].substring(0, 5);

    return sessions
      .filter(session => {
        if (session.session_date > today) return true;
        if (session.session_date === today && session.start_time > currentTime) return true;
        return false;
      })
      .slice(0, limit);
  };

  return {
    sessions,
    loading,
    createSession,
    updateSession,
    deleteSession,
    getSessionsForDate,
    getUpcomingSessions,
    refreshSessions: fetchSessions
  };
};