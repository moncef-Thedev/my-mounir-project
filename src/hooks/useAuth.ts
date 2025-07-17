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
  is_active?: boolean;
  created_at: string;
  updated_at: string;
}

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (!initialized) {
      checkAuthStatus();
      setInitialized(true);
    }
  }, [initialized]);

  const checkAuthStatus = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('auth_token');
      
      if (!token) {
        setLoading(false);
        return;
      }

      apiClient.setToken(token);
      
      // Verify token and get user data
      const response = await apiClient.verifyToken();
      
      if (response.valid && response.user) {
        setUser(response.user);
        await fetchProfile();
      } else {
        clearAuthData();
      }
    } catch (error) {
      console.error('Auth verification error:', error);
      clearAuthData();
    } finally {
      setLoading(false);
    }
  };

  const clearAuthData = () => {
    localStorage.removeItem('auth_token');
    apiClient.setToken(null);
    setUser(null);
    setProfile(null);
  };

  const fetchProfile = async () => {
    try {
      const profileData = await apiClient.getProfile();
      setProfile(profileData);
    } catch (error) {
      console.error('Profile fetch error:', error);
      // Don't clear auth data if profile fetch fails, user might still be valid
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

      if (response.token && response.user) {
        apiClient.setToken(response.token);
        setUser(response.user);
        await fetchProfile();
        toast.success('Registration successful!');
        return { success: true, data: response };
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Registration failed';
      toast.error(message);
      return { success: false, error };
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true);
      
      // Fix the email format issue
      const cleanEmail = email.trim().toLowerCase();
      const response = await apiClient.login(cleanEmail, password);

      if (response.token && response.user) {
        apiClient.setToken(response.token);
        setUser(response.user);
        await fetchProfile();
        toast.success('Login successful!');
        return { success: true, data: response };
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Login failed';
      toast.error(message);
      return { success: false, error };
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      clearAuthData();
      toast.success('Logout successful');
      
      // Force page reload to reset application state
      setTimeout(() => {
        window.location.href = '/';
      }, 500);
    } catch (error) {
      toast.error('Logout error');
    }
  };

  const resetPassword = async (email: string) => {
    try {
      await apiClient.resetPassword(email);
      toast.success('Password reset email sent!');
      return { success: true };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Password reset failed';
      toast.error(message);
      return { success: false, error };
    }
  };

  const updateProfile = async (updates: Partial<Profile>) => {
    try {
      const response = await apiClient.updateProfile(updates);
      if (response.profile) {
        setProfile(response.profile);
        toast.success('Profile updated successfully');
        return { success: true, data: response };
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Profile update failed';
      toast.error(message);
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
    refreshAuth: checkAuthStatus,
  };
};