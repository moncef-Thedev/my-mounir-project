const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

class ApiClient {
  private baseURL: string;
  private token: string | null = null;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
    this.token = localStorage.getItem('auth_token');
  }

  setToken(token: string | null) {
    this.token = token;
    if (token) {
      localStorage.setItem('auth_token', token);
    } else {
      localStorage.removeItem('auth_token');
    }
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    
    const config: RequestInit = {
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...(this.token && { Authorization: `Bearer ${this.token}` }),
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('API Request failed:', error);
      throw error;
    }
  }

  // Méthodes d'authentification
  async register(data: {
    email: string;
    password: string;
    fullName: string;
    phone?: string;
  }) {
    return this.request<{
      message: string;
      token: string;
      user: any;
    }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async login(email: string, password: string) {
    return this.request<{
      message: string;
      token: string;
      user: any;
    }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  async getProfile() {
    return this.request<any>('/auth/profile');
  }

  async updateProfile(data: any) {
    return this.request<{
      message: string;
      profile: any;
    }>('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async resetPassword(email: string) {
    return this.request<{ message: string }>('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }

  async verifyToken() {
    return this.request<{
      valid: boolean;
      user: any;
    }>('/auth/verify-token');
  }

  // Méthodes pour les cours
  async getCourses(params?: {
    category?: string;
    level?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, value.toString());
        }
      });
    }
    
    const endpoint = `/courses${searchParams.toString() ? `?${searchParams}` : ''}`;
    return this.request<{
      courses: any[];
      pagination: any;
    }>(endpoint);
  }

  async getCourse(id: string) {
    return this.request<any>(`/courses/${id}`);
  }

  async createCourse(data: any) {
    return this.request<{
      message: string;
      course: any;
    }>('/courses', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateCourse(id: string, data: any) {
    return this.request<{
      message: string;
      course: any;
    }>(`/courses/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteCourse(id: string) {
    return this.request<{ message: string }>(`/courses/${id}`, {
      method: 'DELETE',
    });
  }

  // Méthodes pour les inscriptions
  async enrollInCourse(courseId: string) {
    return this.request<{
      message: string;
      enrollment: any;
    }>('/enrollments', {
      method: 'POST',
      body: JSON.stringify({ courseId }),
    });
  }

  async getEnrollments() {
    return this.request<{
      enrollments: any[];
    }>('/enrollments');
  }

  async updateEnrollmentStatus(enrollmentId: string, status: string) {
    return this.request<{
      message: string;
      enrollment: any;
    }>(`/enrollments/${enrollmentId}`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
  }

  // Méthodes pour les sessions
  async getSessions(courseId?: string) {
    const endpoint = courseId ? `/sessions?courseId=${courseId}` : '/sessions';
    return this.request<{
      sessions: any[];
    }>(endpoint);
  }

  async createSession(data: any) {
    return this.request<{
      message: string;
      session: any;
    }>('/sessions', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateSession(id: string, data: any) {
    return this.request<{
      message: string;
      session: any;
    }>(`/sessions/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteSession(id: string) {
    return this.request<{ message: string }>(`/sessions/${id}`, {
      method: 'DELETE',
    });
  }

  // Méthodes pour les appels vidéo
  async createVideoCall(data: {
    sessionId: string;
    platform: string;
    scheduledFor?: string;
    duration?: number;
    participants?: string[];
  }) {
    return this.request<{
      message: string;
      videoCall: any;
      meetingUrl: string;
      meetingPassword?: string;
    }>('/video-calls', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getSessionVideoCalls(sessionId: string) {
    return this.request<{
      videoCalls: any[];
    }>(`/video-calls/session/${sessionId}`);
  }

  async startVideoCall(callId: string) {
    return this.request<{
      message: string;
      meetingUrl: string;
      meetingPassword?: string;
    }>(`/video-calls/${callId}/start`, {
      method: 'POST',
    });
  }

  async endVideoCall(callId: string) {
    return this.request<{
      message: string;
      actualDuration: number;
    }>(`/video-calls/${callId}/end`, {
      method: 'POST',
    });
  }

  async joinVideoCall(callId: string) {
    return this.request<{
      message: string;
      meetingUrl: string;
      meetingPassword?: string;
      platform: string;
      sessionTitle: string;
      courseTitle: string;
    }>(`/video-calls/${callId}/join`);
  }

  // Méthodes pour le calendrier
  async getCalendar(params?: {
    month?: number;
    year?: number;
    courseId?: string;
  }) {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, value.toString());
        }
      });
    }
    
    const endpoint = `/calendar${searchParams.toString() ? `?${searchParams}` : ''}`;
    return this.request<{
      sessions: any[];
      sessionsByDate: Record<string, any[]>;
      totalSessions: number;
    }>(endpoint);
  }

  async getCalendarDate(date: string) {
    return this.request<{
      date: string;
      sessions: any[];
    }>(`/calendar/date/${date}`);
  }

  async getUpcomingSessions(limit?: number) {
    const endpoint = `/calendar/upcoming${limit ? `?limit=${limit}` : ''}`;
    return this.request<{
      upcomingSessions: any[];
    }>(endpoint);
  }

  async getCalendarStats(params?: {
    month?: number;
    year?: number;
  }) {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, value.toString());
        }
      });
    }
    
    const endpoint = `/calendar/stats${searchParams.toString() ? `?${searchParams}` : ''}`;
    return this.request<any>(endpoint);
  }

  async exportCalendar(courseId?: string) {
    const endpoint = `/calendar/export${courseId ? `?courseId=${courseId}` : ''}`;
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      headers: {
        ...(this.token && { Authorization: `Bearer ${this.token}` }),
      },
    });
    
    if (!response.ok) {
      throw new Error('Erreur lors de l\'export du calendrier');
    }
    
    return response.blob();
  }

  // Méthodes pour les notifications
  async getNotifications() {
    return this.request<{
      notifications: any[];
      unreadCount: number;
    }>('/notifications');
  }

  async markNotificationAsRead(id: string) {
    return this.request<{ message: string }>(`/notifications/${id}/read`, {
      method: 'PUT',
    });
  }

  async markAllNotificationsAsRead() {
    return this.request<{ message: string }>('/notifications/read-all', {
      method: 'PUT',
    });
  }

  async createNotification(data: {
    recipientId: string;
    title: string;
    message: string;
    type: string;
    relatedCourseId?: string;
    relatedSessionId?: string;
  }) {
    return this.request<{
      message: string;
      notification: any;
    }>('/notifications', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Méthodes pour le tableau de bord
  async getDashboardStats() {
    return this.request<any>('/dashboard/stats');
  }

  async getRecentActivity() {
    return this.request<{
      activities: any[];
    }>('/dashboard/activity');
  }
}

export const apiClient = new ApiClient(API_BASE_URL);
export default apiClient;