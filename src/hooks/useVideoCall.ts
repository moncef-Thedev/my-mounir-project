import { useState, useEffect } from 'react';
import { apiClient } from '../lib/api';
import { useAuth } from './useAuth';
import toast from 'react-hot-toast';

interface VideoCall {
  id: string;
  session_id: string;
  platform: 'zoom' | 'google_meet' | 'teams' | 'jitsi';
  meeting_url: string;
  meeting_id?: string;
  meeting_password?: string;
  scheduled_for: string;
  duration_minutes: number;
  actual_duration_minutes?: number;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  started_at?: string;
  ended_at?: string;
  recording_url?: string;
  max_participants?: number;
  created_at: string;
  updated_at: string;
  session_title?: string;
  course_title?: string;
  created_by_name?: string;
}

export const useVideoCall = () => {
  const { user, profile } = useAuth();
  const [videoCalls, setVideoCalls] = useState<VideoCall[]>([]);
  const [loading, setLoading] = useState(false);

  const createVideoCall = async (sessionId: string, platform: string, scheduledFor?: string, duration?: number) => {
    if (!profile?.role || !['admin', 'teacher'].includes(profile.role)) {
      toast.error('Vous n\'avez pas les permissions pour créer des appels vidéo');
      return { success: false };
    }

    try {
      setLoading(true);
      const response = await apiClient.createVideoCall({
        sessionId,
        platform,
        scheduledFor,
        duration
      });

      toast.success('Appel vidéo créé avec succès !');
      return { success: true, data: response };
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erreur lors de la création');
      return { success: false, error };
    } finally {
      setLoading(false);
    }
  };

  const getSessionVideoCalls = async (sessionId: string) => {
    try {
      setLoading(true);
      const response = await apiClient.getSessionVideoCalls(sessionId);
      setVideoCalls(response.videoCalls || []);
      return response.videoCalls || [];
    } catch (error) {
      console.error('Erreur lors de la récupération des appels vidéo:', error);
      return [];
    } finally {
      setLoading(false);
    }
  };

  const startVideoCall = async (callId: string) => {
    if (!profile?.role || !['admin', 'teacher'].includes(profile.role)) {
      toast.error('Vous n\'avez pas les permissions pour démarrer des appels vidéo');
      return { success: false };
    }

    try {
      const response = await apiClient.startVideoCall(callId);
      
      toast.success('Appel vidéo démarré !');
      
      // Ouvrir l'URL de la réunion dans un nouvel onglet
      if (response.meetingUrl) {
        window.open(response.meetingUrl, '_blank');
      }
      
      return { success: true, data: response };
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erreur lors du démarrage');
      return { success: false, error };
    }
  };

  const endVideoCall = async (callId: string) => {
    if (!profile?.role || !['admin', 'teacher'].includes(profile.role)) {
      toast.error('Vous n\'avez pas les permissions pour terminer des appels vidéo');
      return { success: false };
    }

    try {
      const response = await apiClient.endVideoCall(callId);
      
      toast.success('Appel vidéo terminé !');
      return { success: true, data: response };
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erreur lors de la fin de l\'appel');
      return { success: false, error };
    }
  };

  const joinVideoCall = async (callId: string) => {
    if (!user) {
      toast.error('Vous devez être connecté pour rejoindre un appel');
      return { success: false };
    }

    try {
      const response = await apiClient.joinVideoCall(callId);
      
      toast.success('Accès autorisé à l\'appel vidéo !');
      
      // Ouvrir l'URL de la réunion dans un nouvel onglet
      if (response.meetingUrl) {
        window.open(response.meetingUrl, '_blank');
      }
      
      return { success: true, data: response };
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erreur lors de l\'accès à l\'appel');
      return { success: false, error };
    }
  };

  const getPlatformName = (platform: string) => {
    switch (platform) {
      case 'zoom':
        return 'Zoom';
      case 'google_meet':
        return 'Google Meet';
      case 'teams':
        return 'Microsoft Teams';
      case 'jitsi':
        return 'Jitsi Meet';
      default:
        return platform;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled':
        return 'bg-blue-100 text-blue-800';
      case 'in_progress':
        return 'bg-green-100 text-green-800';
      case 'completed':
        return 'bg-gray-100 text-gray-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'scheduled':
        return 'Programmé';
      case 'in_progress':
        return 'En cours';
      case 'completed':
        return 'Terminé';
      case 'cancelled':
        return 'Annulé';
      default:
        return status;
    }
  };

  const canJoinCall = (call: VideoCall) => {
    return call.status === 'in_progress' || 
           (call.status === 'scheduled' && new Date(call.scheduled_for) <= new Date());
  };

  const canStartCall = (call: VideoCall) => {
    return call.status === 'scheduled' && 
           profile?.role && 
           ['admin', 'teacher'].includes(profile.role);
  };

  const canEndCall = (call: VideoCall) => {
    return call.status === 'in_progress' && 
           profile?.role && 
           ['admin', 'teacher'].includes(profile.role);
  };

  return {
    videoCalls,
    loading,
    createVideoCall,
    getSessionVideoCalls,
    startVideoCall,
    endVideoCall,
    joinVideoCall,
    getPlatformName,
    getStatusColor,
    getStatusText,
    canJoinCall,
    canStartCall,
    canEndCall
  };
};