import { useState, useEffect } from 'react';
import { apiClient } from '../lib/api';
import { useAuth } from './useAuth';
import toast from 'react-hot-toast';

interface Course {
  id: string;
  title: string;
  description: string;
  level: 'Débutant' | 'Intermédiaire' | 'Avancé';
  category: string;
  duration_months: number;
  max_students: number;
  price?: number;
  image_url?: string;
  teacher_id?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export const useCourses = () => {
  const { user, profile } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [enrolledCourses, setEnrolledCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCourses = async () => {
    try {
      const response = await apiClient.getCourses();
      
      // Add level colors for display
      const coursesWithColors = (response.courses || []).map(course => ({
        ...course,
        levelColor: course.level === 'Débutant' ? 'bg-green-100 text-green-800' :
                   course.level === 'Intermédiaire' ? 'bg-yellow-100 text-yellow-800' :
                   'bg-red-100 text-red-800'
      }));
      
      setCourses(coursesWithColors);
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchEnrolledCourses = async () => {
    if (!user) return;

    try {
      const response = await apiClient.getEnrollments();

      const enrolledCoursesData = response.enrollments?.map(enrollment => enrollment.course || enrollment).filter(Boolean) || [];
      setEnrolledCourses(enrolledCoursesData);
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  const createCourse = async (courseData: Omit<Course, 'id' | 'created_at' | 'updated_at'>) => {
    if (!profile?.role || !['admin', 'teacher'].includes(profile.role)) {
      toast.error('Vous n\'avez pas les permissions pour créer un cours');
      return { success: false };
    }

    try {
      // Transform the data to match the API expectations
      const apiData = {
        title: courseData.title,
        description: courseData.description,
        level: courseData.level,
        category: courseData.category,
        durationMonths: courseData.duration_months,
        maxStudents: courseData.max_students,
        price: courseData.price || 0,
        imageUrl: courseData.image_url
      };

      const response = await apiClient.createCourse({
        ...apiData,
        teacher_id: user?.id
      });

      toast.success(response.message);
      await fetchCourses();
      return { success: true, data: response.course };
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erreur lors de la création');
      return { success: false, error };
    }
  };

  const updateCourse = async (courseId: string, updates: Partial<Course>) => {
    if (!profile?.role || !['admin', 'teacher'].includes(profile.role)) {
      toast.error('Vous n\'avez pas les permissions pour modifier ce cours');
      return { success: false };
    }

    try {
      const response = await apiClient.updateCourse(courseId, updates);

      toast.success(response.message);
      await fetchCourses();
      return { success: true, data: response.course };
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erreur lors de la modification');
      return { success: false, error };
    }
  };

  const deleteCourse = async (courseId: string) => {
    if (!profile?.role || !['admin', 'teacher'].includes(profile.role)) {
      toast.error('Vous n\'avez pas les permissions pour supprimer ce cours');
      return { success: false };
    }

    try {
      const response = await apiClient.deleteCourse(courseId);

      toast.success(response.message);
      await fetchCourses();
      return { success: true };
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erreur lors de la suppression');
      return { success: false, error };
    }
  };

  const enrollInCourse = async (courseId: string) => {
    if (!user) {
      toast.error('Vous devez être connecté pour vous inscrire');
      return { success: false };
    }

    try {
      const response = await apiClient.enrollInCourse(courseId);

      toast.success(response.message);
      await fetchEnrolledCourses();
      return { success: true, data: response.enrollment };
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erreur lors de l\'inscription');
      return { success: false, error };
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  useEffect(() => {
    if (user) {
      fetchEnrolledCourses();
    }
  }, [user]);

  return {
    courses,
    enrolledCourses,
    loading,
    createCourse,
    updateCourse,
    deleteCourse,
    enrollInCourse,
    refetch: fetchCourses
  };
};