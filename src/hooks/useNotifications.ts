import { useState, useEffect } from 'react';
import { supabase, Notification } from '../lib/supabase';
import { useAuth } from './useAuth';
import toast from 'react-hot-toast';

export const useNotifications = () => {
  const { user, profile } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchNotifications();
      
      // Écouter les nouvelles notifications en temps réel
      const subscription = supabase
        .channel('notifications')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'notifications',
            filter: `recipient_id=eq.${user.id}`
          },
          (payload) => {
            const newNotification = payload.new as Notification;
            setNotifications(prev => [newNotification, ...prev]);
            setUnreadCount(prev => prev + 1);
            
            // Afficher une notification toast pour les notifications importantes
            if (['course_reminder', 'enrollment'].includes(newNotification.notification_type)) {
              toast(newNotification.title, {
                icon: '🔔',
                duration: 5000,
              });
            }
          }
        )
        .subscribe();

      return () => {
        subscription.unsubscribe();
      };
    }
  }, [user]);

  const fetchNotifications = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('recipient_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        console.error('Erreur lors de la récupération des notifications:', error);
        return;
      }

      setNotifications(data || []);
      setUnreadCount(data?.filter(n => !n.is_read).length || 0);
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId);

      if (error) {
        console.error('Erreur lors du marquage comme lu:', error);
        return;
      }

      setNotifications(prev =>
        prev.map(n =>
          n.id === notificationId ? { ...n, is_read: true } : n
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  const markAllAsRead = async () => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('recipient_id', user.id)
        .eq('is_read', false);

      if (error) {
        console.error('Erreur lors du marquage de toutes les notifications:', error);
        return;
      }

      setNotifications(prev =>
        prev.map(n => ({ ...n, is_read: true }))
      );
      setUnreadCount(0);
      toast.success('Toutes les notifications ont été marquées comme lues');
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  const createNotification = async (
    recipientId: string,
    title: string,
    message: string,
    type: Notification['notification_type'],
    relatedCourseId?: string,
    relatedSessionId?: string,
    scheduledFor?: string
  ) => {
    if (!profile?.role || !['admin', 'teacher'].includes(profile.role)) {
      toast.error('Vous n\'avez pas les permissions pour créer des notifications');
      return { success: false };
    }

    try {
      const { data, error } = await supabase
        .from('notifications')
        .insert({
          recipient_id: recipientId,
          sender_id: user?.id,
          title,
          message,
          notification_type: type,
          related_course_id: relatedCourseId,
          related_session_id: relatedSessionId,
          scheduled_for: scheduledFor
        })
        .select()
        .single();

      if (error) {
        toast.error('Erreur lors de la création de la notification');
        return { success: false, error };
      }

      return { success: true, data };
    } catch (error) {
      toast.error('Erreur lors de la création');
      return { success: false, error };
    }
  };

  const sendBulkNotification = async (
    recipientIds: string[],
    title: string,
    message: string,
    type: Notification['notification_type'],
    relatedCourseId?: string
  ) => {
    if (!profile?.role || !['admin', 'teacher'].includes(profile.role)) {
      toast.error('Vous n\'avez pas les permissions pour envoyer des notifications');
      return { success: false };
    }

    try {
      const notifications = recipientIds.map(recipientId => ({
        recipient_id: recipientId,
        sender_id: user?.id,
        title,
        message,
        notification_type: type,
        related_course_id: relatedCourseId
      }));

      const { data, error } = await supabase
        .from('notifications')
        .insert(notifications)
        .select();

      if (error) {
        toast.error('Erreur lors de l\'envoi des notifications');
        return { success: false, error };
      }

      toast.success(`${recipientIds.length} notifications envoyées avec succès`);
      return { success: true, data };
    } catch (error) {
      toast.error('Erreur lors de l\'envoi');
      return { success: false, error };
    }
  };

  return {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    createNotification,
    sendBulkNotification,
    refreshNotifications: fetchNotifications
  };
};