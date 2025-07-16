import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Check if Supabase is properly configured
const isSupabaseConfigured = supabaseUrl && 
  supabaseAnonKey && 
  supabaseUrl !== 'YOUR_SUPABASE_URL' && 
  supabaseAnonKey !== 'YOUR_SUPABASE_ANON_KEY';

// Create a mock client if Supabase is not configured
const createMockSupabaseClient = () => ({
  from: () => ({
    select: () => ({ data: [], error: null }),
    insert: () => ({ data: null, error: null }),
    update: () => ({ data: null, error: null }),
    delete: () => ({ data: null, error: null }),
    eq: () => ({ data: [], error: null }),
    order: () => ({ data: [], error: null }),
    limit: () => ({ data: [], error: null }),
    single: () => ({ data: null, error: null }),
    in: () => ({ data: [], error: null }),
  }),
  channel: () => ({
    on: () => ({ subscribe: () => ({ unsubscribe: () => {} }) }),
  }),
});

export const supabase = isSupabaseConfigured 
  ? createClient(supabaseUrl!, supabaseAnonKey!)
  : createMockSupabaseClient() as any;

// Log warning if Supabase is not configured
if (!isSupabaseConfigured) {
  console.warn('Supabase is not configured. Using mock client. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY environment variables.');
}

// Types TypeScript pour la base de données
export interface Profile {
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

export interface Course {
  id: string;
  title: string;
  description: string;
  level: 'Débutant' | 'Intermédiaire' | 'Avancé';
  category: string;
  duration_months: number;
  max_students: number;
  price?: number;
  image_url?: string;
  syllabus?: string;
  prerequisites?: string;
  learning_objectives?: string[];
  teacher_id?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CourseSession {
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

export interface Enrollment {
  id: string;
  student_id: string;
  course_id: string;
  enrollment_date: string;
  status: 'pending' | 'active' | 'completed' | 'cancelled' | 'suspended';
  payment_status: 'pending' | 'paid' | 'partial' | 'refunded';
  payment_amount?: number;
  payment_date?: string;
  completion_percentage: number;
  final_grade?: string;
  certificate_issued: boolean;
  notes?: string;
}

export interface CourseMaterial {
  id: string;
  course_id?: string;
  session_id?: string;
  title: string;
  description?: string;
  material_type: 'video' | 'pdf' | 'audio' | 'link' | 'quiz' | 'assignment';
  file_url?: string;
  file_size?: number;
  duration_minutes?: number;
  is_downloadable: boolean;
  access_level: 'public' | 'enrolled' | 'premium';
  order_index: number;
  created_at: string;
  updated_at: string;
}

export interface Notification {
  id: string;
  recipient_id: string;
  sender_id?: string;
  title: string;
  message: string;
  notification_type: 'course_reminder' | 'enrollment' | 'assignment' | 'announcement' | 'system';
  related_course_id?: string;
  related_session_id?: string;
  is_read: boolean;
  is_email_sent: boolean;
  scheduled_for?: string;
  created_at: string;
}

export interface Message {
  id: string;
  sender_id: string;
  recipient_id?: string;
  course_id?: string;
  subject: string;
  content: string;
  message_type: 'direct' | 'course_announcement' | 'group';
  is_read: boolean;
  parent_message_id?: string;
  created_at: string;
}