import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth API
export const authAPI = {
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),
  
  register: (userData: any) =>
    api.post('/auth/register', userData),
  
  getMe: () =>
    api.get('/auth/me'),
};

// Jobs API
export const jobsAPI = {
  getJobs: (params?: any) =>
    api.get('/jobs', { params }),
  
  getJobMatches: () =>
    api.get('/jobs/matches'),
  
  getJob: (id: string) =>
    api.get(`/jobs/${id}`),
  
  createJob: (jobData: any) =>
    api.post('/jobs', jobData),
  
  updateJob: (id: string, jobData: any) =>
    api.put(`/jobs/${id}`, jobData),
  
  deleteJob: (id: string) =>
    api.delete(`/jobs/${id}`),
  
  getEmployerJobs: () =>
    api.get('/jobs/employer/my-jobs'),
};

// Profile API
export const profileAPI = {
  getProfile: () =>
    api.get('/profile'),
  
  updateProfile: (profileData: any) =>
    api.put('/profile', profileData),
  
  getPublicProfile: (userId: string) =>
    api.get(`/profile/${userId}`),
};

// Resume API
export const resumeAPI = {
  uploadResume: (formData: FormData) =>
    api.post('/resume/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }),
  
  getResumeStatus: (profileId: string) =>
    api.get(`/resume/status/${profileId}`),
};

// Applications API
export const applicationsAPI = {
  applyToJob: (applicationData: any) =>
    api.post('/applications', applicationData),
  
  getMyApplications: () =>
    api.get('/applications/my-applications'),
  
  getEmployerApplications: (params?: any) =>
    api.get('/applications/employer-applications', { params }),
  
  updateApplicationStatus: (id: string, status: string, notes?: string) =>
    api.put(`/applications/${id}/status`, { status, notes }),
  
  getApplication: (id: string) =>
    api.get(`/applications/${id}`),
};

export default api;