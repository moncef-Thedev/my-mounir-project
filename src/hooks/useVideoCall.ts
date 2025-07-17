import { useState } from 'react';
import { apiClient } from '../lib/api';
import { useAuth } from './useAuth';
import toast from 'react-hot-toast';
import { useLanguage } from '../contexts/LanguageContext';

type Platform = 'zoom' | 'google_meet' | 'teams' | 'jitsi';
type Status = 'scheduled' | 'in_progress' | 'completed' | 'cancelled';

interface VideoCall {
  id: string;
  session_id: string;
  platform: Platform;
  meeting_url: string;
  meeting_id?: string;
  meeting_password?: string;
  scheduled_for: string;
  duration_minutes: number;
  actual_duration_minutes?: number;
  status: Status;
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
  const { profile } = useAuth();
  const { t } = useLanguage();
  const [videoCalls, setVideoCalls] = useState<VideoCall[]>([]);
  const [loading, setLoading] = useState(false);

  const hasPermission = () => profile?.role && ['admin', 'teacher'].includes(profile.role);

  const createVideoCall = async (
    sessionId: string,
    platform: Platform,
    scheduledFor?: string,
    duration?: number
  ) => {
    if (!hasPermission()) {
      toast.error(t('video.no_permission'));
      return { success: false };
    }

    try {
      setLoading(true);
      const response = await apiClient.createVideoCall({ 
        sessionId, 
        platform, 
        scheduledFor, 
        duration,
        participants: []
      });
      
      toast.success(t('video.call_created'));
      return { success: true, data: response };
    } catch (error) {
      const message = error instanceof Error ? error.message : t('video.call_error');
      toast.error(message);
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
      console.error('Error fetching video calls:', error);
      return [];
    } finally {
      setLoading(false);
    }
  };

  const startVideoCall = async (callId: string) => {
    if (!hasPermission()) {
      toast.error(t('video.no_permission'));
      return { success: false };
    }

    try {
      const response = await apiClient.startVideoCall(callId);
      toast.success(t('video.call_in_progress'));
      
      if (response.meetingUrl) {
        // Open in new window/tab
        const newWindow = window.open(response.meetingUrl, '_blank', 'noopener,noreferrer');
        if (!newWindow) {
          // Fallback if popup blocked
          window.location.href = response.meetingUrl;
        }
      }
      
      return { success: true, data: response };
    } catch (error) {
      const message = error instanceof Error ? error.message : t('video.call_error');
      toast.error(message);
      return { success: false, error };
    }
  };

  const endVideoCall = async (callId: string) => {
    if (!hasPermission()) {
      toast.error(t('video.no_permission'));
      return { success: false };
    }

    try {
      const response = await apiClient.endVideoCall(callId);
      toast.success(t('video.call_ended'));
      return { success: true, data: response };
    } catch (error) {
      const message = error instanceof Error ? error.message : t('video.call_error');
      toast.error(message);
      return { success: false, error };
    }
  };

  const joinVideoCall = async (callId: string) => {
    try {
      const response = await apiClient.joinVideoCall(callId);
      toast.success(t('video.join_call'));
      
      if (response.meetingUrl) {
        // Open in new window/tab
        const newWindow = window.open(response.meetingUrl, '_blank', 'noopener,noreferrer');
        if (!newWindow) {
          // Fallback if popup blocked
          window.location.href = response.meetingUrl;
        }
      }
      
      return { success: true, data: response };
    } catch (error) {
      const message = error instanceof Error ? error.message : t('video.call_error');
      toast.error(message);
      return { success: false, error };
    }
  };

  const getPlatformName = (platform: Platform) => {
    switch (platform) {
      case 'zoom': return 'Zoom';
      case 'google_meet': return 'Google Meet';
      case 'teams': return 'Microsoft Teams';
      case 'jitsi': return 'Jitsi Meet';
      default: return platform;
    }
  };

  const getStatusColor = (status: Status) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-100 text-blue-800';
      case 'in_progress': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-gray-100 text-gray-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: Status) => {
    switch (status) {
      case 'scheduled': return t('video.call_scheduled');
      case 'in_progress': return t('video.call_in_progress');
      case 'completed': return t('video.call_ended');
      case 'cancelled': return 'Cancelled';
      default: return status;
    }
  };

  const canJoinCall = (call: VideoCall) =>
    call.status === 'in_progress' ||
    (call.status === 'scheduled' && new Date(call.scheduled_for) <= new Date());

  const canStartCall = (call: VideoCall) =>
    call.status === 'scheduled' && hasPermission();

  const canEndCall = (call: VideoCall) =>
    call.status === 'in_progress' && hasPermission();

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
    canEndCall,
    hasPermission
  };
};