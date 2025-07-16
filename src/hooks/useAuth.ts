import { useState, useEffect } from 'react';
import { apiClient } from '../lib/api';
import toast from 'react-hot-toast';

interface User {
  id: string;
  email: string;
  fullName: string;
  role: 'student' | 'teacher' | 'admin';
}

interface Profile {
  id: string;
  email: string;
  full_name: string;
  phone?: string;
  role: 'student' | 'teacher' | 'admin';
  avatar_url?: string;
  date_of_birth?: string;
  address?: string;
  emergency_contact?: string;
  emergency_phone?: string;
  preferences?: any;
  created_at: string;
  updated_at: string;
}

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        setLoading(false);
        return;
      }

      apiClient.setToken(token);
      const response = await apiClient.verifyToken();
      
      if (response.valid) {
        setUser(response.user);
        await fetchProfile();
      } else {
        localStorage.removeItem('auth_token');
        apiClient.setToken(null);
      }
    } catch (error) {
      console.error('Erreur de vérification du token:', error);
      localStorage.removeItem('auth_token');
      apiClient.setToken(null);
    } finally {
      setLoading(false);
    }
  };

  const fetchProfile = async () => {
    try {
      const profileData = await apiClient.getProfile();
      setProfile(profileData);
    } catch (error) {
      console.error('Erreur lors de la récupération du profil:', error);
    }
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    try {
      setLoading(true);
      const response = await apiClient.register({
        email,
        password,
        fullName,
      });

      apiClient.setToken(response.token);
      setUser(response.user);
      await fetchProfile();

      toast.success('Inscription réussie !');
      
      // Force a small delay to ensure state is updated before routing
      setTimeout(() => {
        window.location.reload();
      }, 100);
      
      return { success: true, data: response };
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erreur lors de l\'inscription');
      return { success: false, error };
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true);
      const response = await apiClient.login(email, password);

      apiClient.setToken(response.token);
      setUser(response.user);
      await fetchProfile();

      toast.success('Connexion réussie !');
      
      // Force a small delay to ensure state is updated before routing
      setTimeout(() => {
        window.location.reload();
      }, 100);
      
      return { success: true, data: response };
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erreur lors de la connexion');
      return { success: false, error };
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      localStorage.removeItem('auth_token');
      apiClient.setToken(null);
      setUser(null);
      setProfile(null);
      toast.success('Déconnexion réussie');
      
      // Force page reload to reset application state
      window.location.reload();
    } catch (error) {
      toast.error('Erreur lors de la déconnexion');
    }
  };

  const resetPassword = async (email: string) => {
    try {
      await apiClient.resetPassword(email);

      toast.success('Email de réinitialisation envoyé !');
      return { success: true };
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erreur lors de l\'envoi de l\'email');
      return { success: false, error };
    }
  };

  const updateProfile = async (updates: Partial<Profile>) => {
    try {
      const response = await apiClient.updateProfile(updates);

      setProfile(response.profile);
      toast.success('Profil mis à jour avec succès');
      return { success: true, data: response };
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erreur lors de la mise à jour');
      return { success: false, error };
    }
  };

  return {
    user,
    profile,
    loading,
    signUp,
    signIn,
    signOut,
    resetPassword,
    updateProfile,
    isAuthenticated: !!user,
    isAdmin: profile?.role === 'admin',
    isTeacher: profile?.role === 'teacher' || profile?.role === 'admin',
    isStudent: profile?.role === 'student',
  };
};