/**
 * API service for making requests to the backend
 */
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
});

// Add token to requests
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth APIs
export const authAPI = {
  register: (data) => apiClient.post('/auth/register', data),
  login: (data) => apiClient.post('/auth/login', data),
  refresh: () => apiClient.post('/auth/refresh'),
};

// Interview APIs
export const interviewAPI = {
  create: (data) => apiClient.post('/interviews/', data),
  list: () => apiClient.get('/interviews/'),
  get: (id) => apiClient.get(`/interviews/${id}`),
  update: (id, data) => apiClient.put(`/interviews/${id}`, data),
  delete: (id) => apiClient.delete(`/interviews/${id}`),
};

// Test APIs
export const testAPI = {
  create: (data) => apiClient.post('/tests/', data),
  list: () => apiClient.get('/tests/'),
  get: (id) => apiClient.get(`/tests/${id}`),
  submit: (id, answers) => apiClient.post(`/tests/${id}/submit`, answers),
};

// AI APIs
export const aiAPI = {
  parseResume: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return apiClient.post('/ai/parse-resume', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  generateQuestions: (jobTitle, difficulty) =>
    apiClient.post('/ai/generate-questions', { jobTitle, difficulty }),
  evaluateAnswer: (question, answer) =>
    apiClient.post('/ai/evaluate-answer', { question, answer }),
  generateFeedback: (interviewId) =>
    apiClient.post('/ai/generate-feedback', { interview_id: interviewId }),
};

export default apiClient;
